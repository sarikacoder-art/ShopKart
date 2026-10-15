const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

async function getCustomerCart(customerId) {
  const customer = await Customer.findById(customerId).populate({
    path: "cart.product",
    select: "name description price category image stock",
  });

  return customer;
}

async function addToCart(req, res) {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.stock < 1) {
      return res.status(400).json({ success: false, message: "Product is out of stock" });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({ success: false, message: "Unauthorized: customer not found" });
    }

    const cartIndex = customer.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (cartIndex === -1) {
      customer.cart.push({ product: product._id, quantity: 1 });
    } else {
      const newQuantity = customer.cart[cartIndex].quantity + 1;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available`,
        });
      }

      customer.cart[cartIndex].quantity = newQuantity;
    }

    await customer.save();
    const updatedCustomer = await getCustomerCart(customer._id);

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart: updatedCustomer.cart,
    });
  } catch (error) {
    console.error("Add cart error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getCart(req, res) {
  try {
    const customer = await getCustomerCart(req.user._id);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      cart: customer.cart,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateCartQuantity(req, res) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a whole number",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available`,
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({ success: false, message: "Unauthorized: customer not found" });
    }

    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
      });
    }

    cartItem.quantity = quantity;
    await customer.save();

    const updatedCustomer = await getCustomerCart(customer._id);

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      cart: updatedCustomer.cart,
    });
  } catch (error) {
    console.error("Update cart error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function removeFromCart(req, res) {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({ success: false, message: "Unauthorized: customer not found" });
    }

    const cartIndex = customer.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (cartIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
      });
    }

    customer.cart.splice(cartIndex, 1);
    await customer.save();

    const updatedCustomer = await getCustomerCart(customer._id);

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart: updatedCustomer.cart,
    });
  } catch (error) {
    console.error("Remove cart error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
};
