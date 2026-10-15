import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function ProductCard({ product }) {
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");
  const { cartItems, addToCart } = useCart();

  const cartItem = cartItems.find((item) => item.product._id === product._id);

  async function handleAddToWishlist() {
    try {
      setSaving(true);
      setError("");
      await api.post(`/wishlist/${product._id}`);
      setAdded(true);
    } catch (err) {
      if (err.response?.status === 409) {
        setAdded(true);
        setError("Product is already in your wishlist.");
      } else {
        setError(
          err.response?.data?.message || "Unable to save product. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAddToCart() {
    try {
      setCartError("");
      await addToCart(product._id);
    } catch (err) {
      setCartError(err.response?.data?.message || "Unable to add product to cart.");
    }
  }

  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.category}</p>
      <p><b>₹{product.price.toLocaleString("en-IN")}</b></p>
      <p>{product.stock > 0 ? `${product.stock} units left` : "Out of stock"}</p>

      <Link className="details-link" to={`/products/${product._id}`}>
        View Details
      </Link>

      <button
        className="cart-button"
        onClick={handleAddToCart}
        disabled={product.stock === 0}
      >
        {cartItem ? `Add Another (In Cart: ${cartItem.quantity})` : "Add to Cart"}
      </button>

      {cartError && <p className="error">{cartError}</p>}

      <button
        className="wishlist-button"
        onClick={handleAddToWishlist}
        disabled={saving || added}
      >
        {saving ? "⏳ Saving..." : added ? "♥ Added to Wishlist" : "♡ Add to Wishlist"}
      </button>

      {error && <p className="error wishlist-error">{error}</p>}
    </div>
  );
}

export default ProductCard;
