# ShopKart Engineering Lab 06 — Checkout & Orders

This project extends the existing ShopKart Labs 1–5 structure. The backend customer model is named `Customer`; order ownership uses that model.

## Important security note

The source ZIP uploaded for review contained a populated backend `.env` file. This corrected ZIP intentionally excludes `.env` and all `node_modules` directories. Treat the credentials in the uploaded ZIP as exposed:
- Regenerate the Razorpay **Test Mode** key pair and update your local backend `.env`.
- Change `JWT_SECRET` to a new long random value.
- If `MONGO_URI` includes a database username/password, rotate that database password too.
- Never upload or commit `.env`. `.env.example` contains placeholders only.

## Setup

1. In `ShopKart-Lab-01`, install dependencies with `npm install`.
2. Copy `.env.example` to `.env`, then fill in your own MongoDB URI, JWT secret, and Razorpay Test Mode credentials.
3. Start the backend: `npm run dev`.
4. In `ShopKart-Lab-02-Frontend`, install dependencies with `npm install`.
5. Start the frontend: `npm run dev`.
6. Use the Vite URL printed in the terminal. The frontend's `/api` proxy forwards to `http://localhost:5000`.

## Lab 6 API routes

All routes below are protected by the existing HTTP-only JWT cookie, except that login must happen first.

- `POST /orders/create-payment-order` — validates shipping details, checks current cart/product/stock data, calculates the total on the server, saves a purchase-time product snapshot, creates a Razorpay order in INR paise, and returns the public Key ID.
- `POST /orders/verify-payment` — accepts `shopKartOrderId`, `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`; checks that the Razorpay order ID matches the server-stored ID; verifies the HMAC signature; then marks the order paid and removes purchased quantities from the customer's cart.
- `GET /orders` — lists the logged-in customer's orders, newest first.
- `GET /orders/:id` — returns an order only when it belongs to the logged-in customer.

## Postman verification

1. `POST /customers/login` with your own account credentials; retain the `token` cookie.
2. `GET /orders` should return `200`.
3. `GET /orders/<your-order-id>` should return `200` for your own order.
4. `POST /orders/verify-payment` with a fake signature should return `400`; the order must not become `PAID`.
5. For a real successful flow, use Razorpay Test Mode Checkout from the frontend. Do not set payment status manually in MongoDB.
6. Verify the saved order through `GET /orders` and the `/orders` frontend page.

## Pending orders

A pending order means a ShopKart/Razorpay checkout order was created but ShopKart has not recorded a successful verified payment for it. Abandoned pending orders can remain visible in My Orders; they are not paid purchases. Repeating the same checkout details and cart within 30 minutes reuses a matching pending Razorpay order to reduce duplicate records.

## Validation

Run `npm run check` in the backend folder to syntax-check backend JavaScript files. The frontend production build can be checked with `npm run build` after installing dependencies locally.
