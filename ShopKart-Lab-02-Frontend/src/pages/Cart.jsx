import { Link } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";

function Cart() {
  const {
    cartItems,
    loading,
    error,
    subtotal,
    totalItems,
    updateQuantity,
    removeFromCart,
    refreshCart,
  } = useCart();
  const [actionId, setActionId] = useState("");
  const [actionError, setActionError] = useState("");

  async function changeQuantity(productId, quantity) {
    try {
      setActionId(productId);
      setActionError("");
      await updateQuantity(productId, quantity);
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to update cart.");
    } finally {
      setActionId("");
    }
  }

  async function handleRemove(productId) {
    try {
      setActionId(productId);
      setActionError("");
      await removeFromCart(productId);
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to remove product.");
    } finally {
      setActionId("");
    }
  }

  return (
    <div>
      <Navbar />
      <main className="cart-page">
        <h1>My Cart</h1>

        {loading && <p>Loading your cart...</p>}

        {!loading && error && (
          <div className="cart-error-box">
            <p className="error">{error}</p>
            <button onClick={refreshCart}>Try Again</button>
          </div>
        )}

        {!loading && !error && cartItems.length === 0 && (
          <div className="empty-cart">
            <h2>Your cart is empty</h2>
            <p>Add some products to see them here.</p>
            <Link className="details-link" to="/products">Browse Products</Link>
          </div>
        )}

        {!loading && !error && cartItems.length > 0 && (
          <div className="cart-layout">
            <section className="cart-items">
              {actionError && <p className="error">{actionError}</p>}

              {cartItems.map((item) => {
                const product = item.product;
                const busy = actionId === product._id;

                return (
                  <article className="cart-item" key={product._id}>
                    <img src={product.image} alt={product.name} />
                    <div className="cart-item-info">
                      <h2>{product.name}</h2>
                      <p>{product.category}</p>
                      <p><b>₹{product.price.toLocaleString("en-IN")}</b></p>

                      <div className="quantity-controls">
                        <button
                          onClick={() =>
                            item.quantity === 1
                              ? handleRemove(product._id)
                              : changeQuantity(product._id, item.quantity - 1)
                          }
                          disabled={busy}
                        >
                          {item.quantity === 1 ? "Remove" : "−"}
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => changeQuantity(product._id, item.quantity + 1)}
                          disabled={busy || item.quantity >= product.stock}
                        >
                          +
                        </button>
                      </div>

                      <p className="cart-stock">
                        {item.quantity >= product.stock
                          ? `Maximum available (${product.stock})`
                          : `${product.stock - item.quantity} units available`}
                      </p>

                      <button
                        className="remove-cart-button"
                        onClick={() => handleRemove(product._id)}
                        disabled={busy}
                      >
                        {busy ? "Updating..." : "Remove"}
                      </button>
                    </div>
                    <p className="item-total">
                      ₹{(product.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </article>
                );
              })}
            </section>

            <aside className="order-summary">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Subtotal</span>
                <b>₹{subtotal.toLocaleString("en-IN")}</b>
              </div>
              <div className="summary-row">
                <span>Total Items</span>
                <b>{totalItems}</b>
              </div>
              <hr />
              <div className="summary-row total-row">
                <span>Total</span>
                <b>₹{subtotal.toLocaleString("en-IN")}</b>
              </div>
              <Link
                className="details-link checkout-button"
                to="/checkout"
              >
                Proceed to Checkout
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default Cart;
