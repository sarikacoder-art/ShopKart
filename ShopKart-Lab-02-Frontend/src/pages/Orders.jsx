import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function paymentLabel(order) {
  if (order.paymentStatus === "PAID") return "Payment successful";
  if (order.paymentStatus === "FAILED") return "Payment failed";
  return "Payment pending — checkout not completed";
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchOrders() {
      try {
        const response = await api.get("/orders");
        if (active) setOrders(response.data.orders || []);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message || "Unable to load your orders."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchOrders();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <Navbar />
      <main className="orders-page">
        <h1>My Orders</h1>
        <p>Completed purchases and unfinished checkout attempts are shown here.</p>

        {loading && <p>Loading your orders...</p>}

        {!loading && error && (
          <div className="cart-error-box">
            <p className="error">{error}</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="empty-cart">
            <h2>No orders yet</h2>
            <p>Your purchases will appear here after checkout.</p>
            <Link className="details-link" to="/products">
              Start Shopping
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => {
              const paid = order.paymentStatus === "PAID";
              const pending = order.paymentStatus === "PENDING";

              return (
                <article
                  className={`saved-order ${paid ? "saved-order-paid" : ""}`}
                  key={order._id}
                >
                  <div className="saved-order-heading">
                    <h2>Order #{order._id}</h2>
                    <span
                      className={`order-status-pill ${
                        paid ? "order-status-paid" : pending ? "order-status-pending" : "order-status-failed"
                      }`}
                    >
                      {paymentLabel(order)}
                    </span>
                  </div>

                  <p>
                    <b>Created:</b>{" "}
                    {new Date(order.createdAt).toLocaleString("en-IN")}
                  </p>
                  <p><b>Order status:</b> {order.status}</p>
                  <p><b>Items:</b> {order.items.length}</p>
                  <p>
                    <b>{paid ? "Order total" : "Order amount"}:</b>{" "}
                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                  </p>

                  {pending && (
                    <p className="pending-order-note">
                      No successful payment is recorded for this checkout.
                      Your cart is not considered purchased by this order.
                    </p>
                  )}

                  <Link
                    className="details-link"
                    to={`/order-success/${order._id}`}
                  >
                    View Order Details
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default Orders;
