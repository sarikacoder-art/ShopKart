const express = require("express");
const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
} = require("../controllers/cart.controller");
const protect = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/:productId", protect, addToCart);
router.get("/", protect, getCart);
router.patch("/:productId", protect, updateCartQuantity);
router.delete("/:productId", protect, removeFromCart);

module.exports = router;
