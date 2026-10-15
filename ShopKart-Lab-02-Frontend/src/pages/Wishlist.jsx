import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import WishlistCard from "../components/WishlistCard";
import api from "../services/api";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState("");

  async function loadWishlist() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/wishlist");
      setWishlist(response.data.wishlist || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "We couldn't load your wishlist."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishlist();
  }, []);

  async function handleRemove(productId) {
    try {
      setRemovingId(productId);
      setError("");

      await api.delete(`/wishlist/${productId}`);

      setWishlist((current) =>
        current.filter((product) => product._id !== productId)
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to remove product. Please try again."
      );
    } finally {
      setRemovingId("");
    }
  }

  return (
    <div>
      <Navbar />

      <main className="products-page">
        <h1>My Wishlist</h1>

        {loading && <p>Loading your wishlist...</p>}

        {!loading && error && (
          <div>
            <p className="error">Something went wrong.</p>
            <p>{error}</p>
            <button onClick={loadWishlist}>Try Again</button>
          </div>
        )}

        {!loading && !error && wishlist.length === 0 && (
          <div className="empty-wishlist">
            <div className="empty-heart">❤️</div>
            <h2>Your wishlist is empty</h2>
            <p>Save products you love and find them here later.</p>
            <Link className="details-link" to="/products">
              Browse Products
            </Link>
          </div>
        )}

        {!loading && !error && wishlist.length > 0 && (
          <>
            <p>{wishlist.length} {wishlist.length === 1 ? "product" : "products"} saved</p>

            <div className="product-grid">
              {wishlist.map((product) => (
                <WishlistCard
                  key={product._id}
                  product={product}
                  removing={removingId === product._id}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Wishlist;
