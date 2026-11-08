# FORMÉ audit — 8 November 2026

## Critical
- Live URL redirects to Vercel login: confirmed in browser, deployment SSO enabled. Left unchanged because access changes were not authorized.
- Previous HTML had no product modal or enquiry fields, while JS accessed them unconditionally. This caused null dereferences and stopped initialization. Replaced with native dialog, functional product selection, validation, review and Telegram draft.
- Google Apps Script URL was a placeholder. Previous no-cors implementation could not verify server acceptance, yet claimed success. Removed that route from the customer flow; no success claim before sending in Telegram.

## Conversion and presentation
- Tiny 6–10px text, predominantly English utility copy, long duplicated collection section and weak purchase CTA. Replaced with legible Russian navigation, editorial hero, direct catalogue and visible price/selection actions.
- 17 products included repeated reference images for different variants. Preserved entries and marked unverified imagery consistently. Exact photos are still needed.
- Missing delivery guidance and uncertain compatibility. Added clear enquiry-only status and cost confirmation before payment; precise model is free text instead of invented model variants.
- No focus management for modal, incomplete mobile-menu state, external font dependency. Native dialog handles keyboard focus/Escape; removed toggle menu, unnecessary animation, and remote font dependency; added focus styles, skip link, alt text and responsive layouts.

## Remaining growth opportunities
1. Resolve public access to the storefront.
2. Supply exact photos for 10 reference-image variants, confirm all SKU/model combinations.
3. Publish verified seller identity, delivery pricing/timelines, and return conditions.
4. Add real material, finish, edge protection and charging specifications per SKU when verified.
5. Replace supplier-hosted imagery with permitted owned assets and responsive image derivatives.
6. Connect a confirmed order backend and analytics only when needed; measure product-open → review → actual received message rather than claiming a Telegram click is a sale.

## Validation
JS syntax check and interactive browser checks cover product selection, review text and URL encoding, filters, required fields, modal closing and keyboard access. No real customer enquiry was sent. Desktop visual QA and 390px/320px iframe viewport visual checks completed. No physical mobile device was tested.
