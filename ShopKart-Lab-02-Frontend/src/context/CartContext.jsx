import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();

  async function refreshCart() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/cart");
      setCartItems(response.data.cart || []);
    } catch (err) {
      if (err.response?.status === 401) {
        setCartItems([]);
        setError("");
      } else {
        setError(err.response?.data?.message || "Unable to load your cart.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshCart();
  }, [location.pathname]);

  async function addToCart(productId) {
    const response = await api.post(`/cart/${productId}`);
    setCartItems(response.data.cart || []);
    return response.data;
  }

  async function updateQuantity(productId, quantity) {
    const response = await api.patch(`/cart/${productId}`, { quantity });
    setCartItems(response.data.cart || []);
    return response.data;
  }

  async function removeFromCart(productId) {
    const response = await api.delete(`/cart/${productId}`);
    setCartItems(response.data.cart || []);
    return response.data;
  }

  function clearCartState() {
    setCartItems([]);
  }

  const totalItems = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0),
    [cartItems]
  );

  const value = {
    cartItems,
    loading,
    error,
    totalItems,
    subtotal,
    refreshCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCartState,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
