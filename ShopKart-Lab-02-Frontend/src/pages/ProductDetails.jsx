import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cartError, setCartError] = useState("");
  const [adding, setAdding] = useState(false);
  const { cartItems, addToCart } = useCart();

  const cartItem = cartItems.find((item) => item.product._id === id);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((response) => setProduct(response.data.product))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAddToCart() {
    try {
      setAdding(true);
      setCartError("");
      await addToCart(id);
    } catch (err) {
      setCartError(err.response?.data?.message || "Unable to add product to cart.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <Navbar />
      <main className="details-page">
        {loading && <p>Loading product...</p>}
        {error && <p className="error">Something went wrong while loading product.</p>}
        {product && (
          <div className="product-details">
            <img src={product.image} alt={product.name} />
            <div>
              <Link to="/products">← Back to Products</Link>
              <h1>{product.name}</h1>
              <p>{product.description}</p>
              <p><b>Price:</b> ₹{product.price.toLocaleString("en-IN")}</p>
              <p><b>Category:</b> {product.category}</p>
              <p><b>Stock:</b> {product.stock > 0 ? `${product.stock} available` : "Out of stock"}</p>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || adding || cartItem?.quantity >= product.stock}
              >
                {adding
                  ? "Adding..."
                  : cartItem
                    ? `Add Another (In Cart: ${cartItem.quantity})`
                    : "Add to Cart"}
              </button>
              {cartError && <p className="error">{cartError}</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProductDetails;
