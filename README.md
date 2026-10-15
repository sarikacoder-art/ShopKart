# ShopKart

ShopKart is a MERN e-commerce project built for Engineering Labs 1–6. It includes customer authentication, product browsing, wishlist, cart, checkout, Razorpay test payments, and order history.

## Project structure

- `ShopKart-Lab-01/` — Express API, MongoDB models, authentication, products, wishlist, cart, and orders.
- `ShopKart-Lab-02-Frontend/` — React and Vite frontend.

## Requirements

- Node.js and npm
- MongoDB (local or Atlas)
- Razorpay test-mode API keys for checkout testing

## Run locally

### 1. Backend

```bash
cd ShopKart-Lab-01
npm install
```

Copy `.env.example` to `.env` and fill in your own values. Do not commit `.env`.

```bash
npm run dev
```

The API uses port `5000` by default.

### 2. Frontend

Open a second terminal:

```bash
cd ShopKart-Lab-02-Frontend
npm install
npm run dev
```

Vite runs on port `5173` and proxies `/api` requests to the local backend on port `5000`.

## Main features

- Customer registration and login with cookie-based JWT authentication
- Product listing, search, filtering, and product details
- User-specific wishlist and cart
- Shipping address validation and server-side price/stock checks
- Razorpay test-mode checkout with server-side signature verification
- Customer order history and order details

## Environment variables

The backend variables are listed in `ShopKart-Lab-01/.env.example`. Use your own MongoDB connection string, JWT secret, and Razorpay test credentials. Never share real secrets or commit `.env` files.

## Before deployment

The frontend currently uses a Vite development proxy for `/api`. For production, configure the frontend API URL and backend CORS/cookie settings for your deployed domains. Keep Razorpay in test mode until production payment configuration is intentionally completed.
