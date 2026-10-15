
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import api from "../services/api";

function Checkout() {
  const { cartItems, subtotal, loading, clearCartState } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function validateForm() {
    const fields = Object.values(form);

    if (fields.some((value) => !value.trim())) {
      return "Please fill in all shipping address fields.";
    }

    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      return "Enter a valid 10-digit Indian mobile number.";
    }

    if (!/^\d{6}$/.test(form.pincode.trim())) {
      return "Pincode must contain exactly 6 digits.";
    }

    return "";
  }

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }

  async function handleCheckout(event) {
    event.preventDefault();
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setProcessing(true);

    try {
      // Ask our backend to calculate the real total and create
      // both the ShopKart order and the Razorpay order.
      const response = await api.post("/orders/create-payment-order", {
        shippingAddress: form,
      });

      const order = response.data;

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        setError("Unable to load Razorpay Checkout. Please try again.");
        setProcessing(false);
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ShopKart",
        description: "ShopKart purchase",
        order_id: order.razorpayOrderId,

        prefill: {
          name: form.fullName,
          contact: form.phone,
        },

        theme: {
          color: "#2874f0",
        },

        handler: async function (paymentResponse) {
          try {
            // Never clear the cart until the backend verifies
            // the Razorpay signature successfully.
            
const verificationResponse = await api.post(
  "/orders/verify-payment",
  {
    shopKartOrderId: order.shopKartOrderId,

    // Missing field: your backend requires this!
    razorpay_order_id:
      paymentResponse.razorpay_order_id,

    razorpay_payment_id:
      paymentResponse.razorpay_payment_id,

    razorpay_signature:
      paymentResponse.razorpay_signature,
  }
);

console.log("Payment verification:", verificationResponse.data);

clearCartState();
navigate(`/order-success/${order.shopKartOrderId}`);


            clearCartState();
            navigate(`/order-success/${order.shopKartOrderId}`);
          } catch (verificationError) {
            setError(
              verificationError.response?.data?.message ||
                "Payment verification failed. Please contact support before retrying."
            );
          } finally {
            setProcessing(false);
          }
        },

        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", function () {
        setError(
          "Payment failed. Your cart has been preserved. Please try again."
        );
        setProcessing(false);
      });

      checkout.open();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to start checkout. Your cart has not been cleared."
      );
      setProcessing(false);
    }
  }

  return (
    <div>
      <Navbar />

      <main className="checkout-page">
        <h1>Checkout</h1>

        {loading ? (
          <p>Loading your cart...</p>
        ) : cartItems.length === 0 ? (
          <div className="empty-cart">
            <h2>Your cart is empty</h2>
            <p>Add products before proceeding to checkout.</p>
            <Link className="details-link" to="/products">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="checkout-layout">
            <form className="checkout-form" onSubmit={handleCheckout}>
              <h2>Shipping Address</h2>

              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                autoComplete="name"
                required
              />

              <label htmlFor="phone">Mobile Number</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel"
                required
              />

              <label htmlFor="addressLine1">Address</label>
              <input
                id="addressLine1"
                name="addressLine1"
                value={form.addressLine1}
                onChange={handleChange}
                autoComplete="street-address"
                required
              />

              <label htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                value={form.city}
                onChange={handleChange}
                autoComplete="address-level2"
                required
              />

              <label htmlFor="state">State</label>
              <input
                id="state"
                name="state"
                value={form.state}
                onChange={handleChange}
                autoComplete="address-level1"
                required
              />

              <label htmlFor="pincode">PIN Code</label>
              <input
                id="pincode"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
                required
              />

              {error && <p className="error">{error}</p>}

              <button type="submit" disabled={processing || loading}>
                {processing
                  ? "Processing..."
                  : "Proceed to Secure Payment"}
              </button>

              <p>
                <Link to="/cart">Back to Cart</Link>
              </p>
            </form>

            <aside className="order-summary">
              <h2>Order Summary</h2>

              {cartItems.map((item) => (
                <div className="summary-row" key={item.product._id}>
                  <span>
                    {item.product.name} × {item.quantity}
                  </span>
                  <b>
                    ₹
                    {(
                      item.product.price * item.quantity
                    ).toLocaleString("en-IN")}
                  </b>
                </div>
              ))}

              <hr />

              <div className="summary-row total-row">
                <span>Total</span>
                <b>₹{subtotal.toLocaleString("en-IN")}</b>
              </div>

              <p className="cart-stock">
                Final price and stock are checked by the server.
              </p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default Checkout;
