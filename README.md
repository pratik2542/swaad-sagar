# Swaad Sagar Backend (Express + MongoDB)

This directory contains a minimal Express + Mongoose backend to replace Firebase for the Swaad Sagar app.

Quick start:

1. Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.

2. Install dependencies:

```bash
npm install
```

3. Seed sample products (optional):

```bash
npm run seed
```

4. Run in development:

```bash
npm run dev
```

API endpoints (examples):

- POST /api/auth/register { email, password }
- POST /api/auth/login { email, password }
- GET /api/products
- POST /api/cart { productId, quantity }
- POST /api/orders { shippingAddress }

After this is running, update your frontend to call `http://localhost:4000/api/...` endpoints and store the returned JWT in `localStorage`.
