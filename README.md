# FORMÉ

Static Russian storefront: `index.html`, `styles.css`, `script.js`, `products.json`.
Serve the repository root with a static HTTP server. No installation or build is required.

## Ordering
The native product dialog collects a precise phone model, name, city and address. It validates required fields, shows a review, and prepares a Telegram direct-message draft for @FORME_CASE. The customer must send it in Telegram. There is no automatic order storage, payment processing, analytics, localStorage, or submission to the old Google Apps Script endpoint. The copy button provides a fallback.

## Catalogue
17 entries are retained. Reference-only images are labelled on cards, inside dialogs, and in the enquiry. Phone compatibility and stock require confirmation. Images are still served by the original supplier CDN; image rights and replacement with exact supplier-approved photos remain the owner's responsibility.

## Launch gaps
The existing Vercel deployment has SSO protection enabled. This change does not alter access controls. Public customer access needs the owner's decision. Exact product photographs, verified availability, material/specification information, delivery prices/timelines, seller details and return terms still need verified business input. No unsupported claims or invented reviews are used.
