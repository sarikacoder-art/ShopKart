
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchOrder() {
      try {
        const response = await api.get(`/orders/${id}`);

        if (active) {
          setOrder(response.data.order);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load your order details."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchOrder();

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div>
      <Navbar />

      <main className="order-result-page">
        {loading ? (
          <p>Loading your order...</p>
        ) : error ? (
          <div className="order-result-card">
            <h1>Unable to load order</h1>
            <p className="error">{error}</p>
            <Link className="details-link" to="/orders">
              View My Orders
            </Link>
          </div>
        ) : (
          <div className="order-result-card">
            <h1>
              {order.paymentStatus === "PAID"
                ? "Payment Successful!"
                : "Order Details"}
            </h1>

            <p>
              {order.paymentStatus === "PAID"
                ? "Your ShopKart order has been placed successfully."
                : "Your order is saved, but payment is not confirmed."}
            </p>

            <hr />

            <p>
              <b>Order ID:</b> {order._id}
            </p>

            <p>
              <b>Payment Status:</b> {order.paymentStatus}
            </p>

            <p>
              <b>Order Status:</b> {order.status}
            </p>

            <h2>Items</h2>

            {order.items.map((item, index) => (
              <div
                className="summary-row"
                key={`${item.product}-${index}`}
              >
                <span>
                  {item.name} × {item.quantity}
                </span>
                <b>
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </b>
              </div>
            ))}

            <hr />

            <div className="summary-row total-row">
              <span>{order.paymentStatus === "PAID" ? "Total Paid" : "Order Total"}</span>
              <b>
                ₹{Number(order.totalAmount).toLocaleString("en-IN")}
              </b>
            </div>

            {order.razorpayPaymentId && (
              <p>
                <b>Payment ID:</b> {order.razorpayPaymentId}
              </p>
            )}

            <p>
              <b>Delivering to:</b>{" "}
              {order.shippingAddress.addressLine1},{" "}
              {order.shippingAddress.city},{" "}
              {order.shippingAddress.state} -{" "}
              {order.shippingAddress.pincode}
            </p>

            <div className="order-result-actions">
              <Link className="details-link" to="/orders">
                View My Orders
              </Link>

              <Link className="details-link" to="/products">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default OrderSuccess;
