const crypto = require("crypto");
const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const razorpay = require("../config/razorpay");

const SHIPPING_FIELDS = [
  "fullName",
  "phone",
  "addressLine1",
  "city",
  "state",
  "pincode",
];

function validateShippingAddress(address) {
  if (
    !address ||
    SHIPPING_FIELDS.some(
      (field) =>
        typeof address[field] !== "string" || !address[field].trim()
    )
  ) {
    return "All shipping address fields are required";
  }

  if (!/^[6-9]\d{9}$/.test(address.phone.trim())) {
    return "Enter a valid 10-digit Indian phone number";
  }

  if (!/^\d{6}$/.test(address.pincode.trim())) {
    return "Pincode must contain exactly 6 digits";
  }

  return null;
}

function normalizedAddress(address) {
  return SHIPPING_FIELDS.map((field) => address[field].trim()).join("|");
}

function sameItems(left, right) {
  if (left.length !== right.length) return false;

  const signature = (items) =>
    items
      .map((item) => ({
        product: String(item.product?._id || item.product),
        quantity: item.quantity,
        price: Number(item.price),
      }))
      .sort((a, b) => a.product.localeCompare(b.product));

  return JSON.stringify(signature(left)) === JSON.stringify(signature(right));
}

// Avoid creating multiple pending orders if the customer double-clicks
// checkout or retries the same checkout details shortly afterward.
function matchesPendingOrder(order, items, address) {
  return (
    order.razorpayOrderId &&
    normalizedAddress(order.shippingAddress) === normalizedAddress(address) &&
    sameItems(order.items, items)
  );
}

async function createPaymentOrder(req, res) {
  let shopKartOrder;

  try {
    const { shippingAddress } = req.body;
    const addressError = validateShippingAddress(shippingAddress);

    if (addressError) {
      return res.status(400).json({ success: false, message: addressError });
    }

    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!customer.cart?.length) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const cartItem of customer.cart) {
      const productId = cartItem.product?._id || cartItem.product;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: "Your cart contains an invalid product",
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart no longer exists",
        });
      }

      if (
        !Number.isInteger(cartItem.quantity) ||
        cartItem.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}`,
        });
      }

      if (
        !Number.isFinite(product.price) ||
        product.price < 0 ||
        !Number.isInteger(product.stock) ||
        product.stock < cartItem.quantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            product.stock < cartItem.quantity
              ? `Only ${product.stock} unit(s) of ${product.name} are available`
              : `Price or stock data is invalid for ${product.name}`,
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image || "",
      });

      totalAmount += product.price * cartItem.quantity;
    }

    totalAmount = Number(totalAmount.toFixed(2));

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount",
      });
    }

    const cleanAddress = Object.fromEntries(
      SHIPPING_FIELDS.map((field) => [field, shippingAddress[field].trim()])
    );

    // Reuse a recent matching pending order rather than creating a new one
    // when the customer retries the same checkout.
    const recentPendingOrders = await Order.find({
      customer: customer._id,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
    }).sort({ createdAt: -1 });

    const existingPendingOrder = recentPendingOrders.find((order) =>
      matchesPendingOrder(order, orderItems, cleanAddress)
    );

    if (existingPendingOrder) {
      const razorpayOrder = await razorpay.orders.fetch(
        existingPendingOrder.razorpayOrderId
      );

      return res.status(200).json({
        success: true,
        message: "Existing pending payment order reused",
        shopKartOrderId: existingPendingOrder._id,
        razorpayOrderId: existingPendingOrder.razorpayOrderId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        reused: true,
      });
    }

    shopKartOrder = await Order.create({
      customer: customer._id,
      items: orderItems,
      shippingAddress: cleanAddress,
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
      cartCleared: false,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: shopKartOrder._id.toString(),
    });

    shopKartOrder.razorpayOrderId = razorpayOrder.id;
    await shopKartOrder.save();

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      shopKartOrderId: shopKartOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      reused: false,
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    if (shopKartOrder) {
      try {
        await Order.findByIdAndDelete(shopKartOrder._id);
      } catch (cleanupError) {
        console.error("Pending order cleanup failed:", cleanupError.message);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order. Please try again.",
    });
  }
}

// Remove only the quantities included in the paid order. This clears the
// original cart on a normal checkout while preserving unrelated items added
// after checkout began.
function removePurchasedItemsFromCart(customer, orderItems) {
  for (const purchasedItem of orderItems) {
    const productId = String(purchasedItem.product?._id || purchasedItem.product);
    const cartItem = customer.cart.find(
      (item) => String(item.product?._id || item.product) === productId
    );

    if (!cartItem) continue;

    if (cartItem.quantity <= purchasedItem.quantity) {
      customer.cart = customer.cart.filter(
        (item) => String(item.product?._id || item.product) !== productId
      );
    } else {
      cartItem.quantity -= purchasedItem.quantity;
    }
  }
}

async function verifyPayment(req, res) {
  try {
    const {
      shopKartOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      typeof shopKartOrderId !== "string" ||
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string" ||
      !shopKartOrderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ShopKart order ID",
      });
    }

    const order = await Order.findOne({
      _id: shopKartOrderId,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID is missing",
      });
    }

    if (razorpay_order_id !== order.razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID does not match this ShopKart order",
      });
    }

    if (!/^[a-fA-F0-9]{64}$/.test(razorpay_signature)) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // Use the Razorpay order ID saved on our server, not a browser-supplied
    // order ID, as the first part of the signature payload.
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpay_signature, "hex");

    const signatureIsValid =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!signatureIsValid) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    if (order.paymentStatus === "PAID") {
      if (order.razorpayPaymentId !== razorpay_payment_id) {
        return res.status(409).json({
          success: false,
          message: "This order was already verified with a different payment",
        });
      }
    } else {
      order.paymentStatus = "PAID";
      order.status = "PLACED";
      order.razorpayPaymentId = razorpay_payment_id;
      await order.save();
    }

    // If a prior request saved PAID but failed while clearing the cart,
    // a retry completes the cart update. Never clear a cart again once the
    // order records that its purchased quantities have been removed.
    if (order.cartCleared === false) {
      const customer = await Customer.findById(req.user._id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      removePurchasedItemsFromCart(customer, order.items);
      await customer.save();

      order.cartCleared = true;
      await order.save();
    }

    return res.status(200).json({
      success: true,
      message:
        order.paymentStatus === "PAID"
          ? "Payment verified and order placed successfully"
          : "Payment is not confirmed",
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      status: order.status,
    });
  } catch (error) {
    console.error("Payment verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment. Check My Orders before retrying.",
    });
  }
}

async function getMyOrders(req, res) {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders",
    });
  }
}

async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get order details error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch order details",
    });
  }
}

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
};
