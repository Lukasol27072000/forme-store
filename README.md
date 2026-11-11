# FORMÉ

Vite storefront with Supabase Auth, Postgres and Storage. Pages are `/`, `/account.html` and `/admin.html`.

Run `npm ci`, then `npm run build`. Vercel builds with `npm run build` and serves `dist`.

## Store behaviour

The public catalogue reads active products from Supabase. Product selection survives the sign-in redirect. Confirmed accounts can place orders, read status history and exchange support messages. Administrator membership is stored in `store_admins`, with RLS on all public tables. Administrator membership is assigned manually to a specific user ID by the project owner. Email values are not used to grant privileges. Administrator access is never based on editable user metadata.

Orders freeze product name, primary photo and price in a database trigger. A price mismatch is rejected so the buyer can review the new amount. Order details are immutable. Customers cannot update statuses or catalogue entries. Support messages and order history are scoped to the order or ticket owner and administrators. Product uploads accept JPEG, PNG or WebP, up to 5 MB per file.

## Backend

Project ref `ubassnbaqsblpmqtzjga`. `supabase/store.sql` records the complete schema and policies for a fresh database. It has already been applied to this project. Do not rerun against an initialized project. The initial 17 catalogue products were imported from `products.json`. The browser uses a publishable key only.

## Launch configuration

Disable Confirm email in Supabase Auth. Client registration uses email/password and creates an authenticated session immediately. Google OAuth and email-based password reset are not part of this version. A forgotten-password enquiry links to support. An administrator must be granted explicitly by user ID after the owner creates their account.

The client checks the live email-confirmation setting before sign-up and shows a temporary-unavailability message while the backend is not configured for immediate registration.

## Verified

Production build passes. Database tests in a rolled-back transaction verified order creation, initial history, owner reads, cross-customer isolation, blocked customer price/status changes, rejected price tampering, administrator status changes, support replies and price snapshot preservation. No QA users or orders were retained. Anonymous REST reads return the public catalogue and no private order or message rows.

Full browser signup and authenticated customer/admin journeys remain pending the Confirm email setting change.
