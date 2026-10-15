const mongoose = require("mongoose");
const Product = require("../models/product.model");

async function createProduct(req, res) {
  try {
    const { name, description, price, category, image, stock } = req.body;

    if (!name || !description || price === undefined || !category || !image || stock === undefined) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({ success: false, message: "Price must be greater than 0" });
    }

    if (Number(stock) < 0) {
      return res.status(400).json({ success: false, message: "Stock cannot be negative" });
    }

    const product = await Product.create({ name, description, price, category, image, stock });
    return res.status(201).json({ success: true, product });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid product data" });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getProducts(req, res) {
  try {
    const { search, category, sort } = req.query;
    const query = {};

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.name = { $regex: safeSearch, $options: "i" };
    }

    if (category) {
      query.category = category;
    }

    let productQuery = Product.find(query).select("name price category image stock");

    if (sort === "price_asc") productQuery = productQuery.sort({ price: 1 });
    if (sort === "price_desc") productQuery = productQuery.sort({ price: -1 });

    const products = await productQuery;
    return res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getProductById(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { createProduct, getProducts, getProductById };
