# Swaad Sagar — Next.js frontend

This is a minimal Next.js scaffold for the Swaad Sagar storefront. It replaces the single-file `indian_snack_shop.html` with a React + Next app.

Quick start

1. cd web
2. npm install
3. create a `.env.local` file with:

NEXT_PUBLIC_API_BASE=http://localhost:4000/api

4. npm run dev

What's included
- pages/index.js — public product listing
- pages/_app.js — global app wrapper
- components/ProductCard.js — product card
- lib/api.js — tiny API client using fetch
- styles/globals.css — basic Tailwind-like styles (small)
 - pages/login.js, pages/register.js — auth
 - pages/cart.js, pages/checkout.js — cart & checkout
 - pages/orders.js, pages/profile.js — user orders & profile
 - pages/admin/orders.js, pages/admin/products.js — admin pages

Notes
- This is a small migration starting point. We'll add auth, cart, orders, and admin pages next.
