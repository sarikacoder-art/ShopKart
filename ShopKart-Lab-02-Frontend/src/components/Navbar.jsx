import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function Navbar() {
  const navigate = useNavigate();
  const { totalItems } = useCart();

  async function handleLogout() {
    try {
      await api.post("/customers/logout");
    } catch (error) {
      console.error("Logout request failed", error);
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <nav className="navbar">
      <div className="brand">
        <span className="brand-mark">S</span>
        <span>ShopKart</span>
      </div>

      <div className="nav-links">
        <Link to="/home">Home</Link>
        <Link to="/products">Products</Link>
        <Link to="/wishlist">Wishlist</Link>
        <Link to="/cart">Cart ({totalItems})</Link>
        <Link to="/orders">My Orders</Link>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
