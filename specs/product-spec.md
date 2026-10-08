# HealthyBowl Product Specification

## Document Status

- Status: Complete for specification phase
- Product: HealthyBowl
- Tagline: Fresh & Healthy. Delivered to Your Apartment.
- Initial delivery model: frontend-only with mock repositories
- Source of truth: this document and the supporting specifications in `/specs`

## Goal

HealthyBowl enables residents of supported apartment communities to discover, order, and track affordable healthy salads from a responsive web application. It also provides an administrative area for managing salads and orders. The product starts with two salads and mock data, while preserving clear seams for future NestJS REST APIs and PostgreSQL persistence.

## Users and Roles

### Customer

A resident who browses available salads, manages a cart, enters delivery details, places an order, views order history, and manages a basic profile.

### Administrator

An authorized business operator who views operational metrics, manages salads, reviews orders, and updates order status.

Frontend route guards improve navigation and UX but are not a security boundary. The future backend must enforce authentication and role authorization.

## User Stories

- As a resident, I want to see salads available today so that I can quickly choose a meal.
- As a resident, I want to select my apartment and delivery details so that my order reaches the correct flat.
- As a resident, I want to manage quantities and see totals before checkout so that I know exactly what I am ordering.
- As a resident, I want to choose Cash or UPI so that I can use an available payment method.
- As a resident, I want to see current and previous orders so that I can track delivery and review purchases.
- As an administrator, I want to manage salad availability and content so that the storefront remains accurate.
- As an administrator, I want to review and update orders so that customers see current fulfillment status.

## Functional Requirements

### Catalog

- The initial catalog contains:
  - Protein Power Salad at ₹149, with paneer, lettuce, cucumber, carrot, sweet corn, and healthy dressing.
  - Fresh Veggie Bowl at ₹99, with lettuce, cucumber, carrot, sweet corn, and healthy dressing.
- Product values must come from typed repositories/services, never be duplicated in presentation templates.
- Each salad has an image, description, ingredient list, price, and availability state.
- The customer catalog includes all customer-visible salads for the day, including unavailable items with their availability flag.
- Unavailable salads remain identifiable but cannot be added to the cart.

### Home and Product Discovery

- The home screen shows the delivery apartment context, a brand hero, today's salads, availability, and cart count.
- A customer can open a salad detail screen.
- Listing screens expose loading, empty, and error states.

### Cart

- A customer can add an available salad, increase or decrease quantity, and remove an item.
- Adding the same salad increases one existing cart line rather than creating a duplicate line.
- Quantity cannot be lower than one for an existing line.
- The cart calculates subtotal, delivery charge, total, and total item count.
- Cart state persists for the browser session. The initial implementation uses `sessionStorage` through a storage abstraction; it must not contain sensitive information.
- The initial delivery charge is ₹0 but is represented as data, not embedded in UI calculations.

### Checkout

- Checkout collects apartment, a block selected from that apartment's configured blocks, flat number, delivery slot, and payment method.
- Checkout uses a validated reactive form.
- Available payment methods are Cash and UPI. Initial UPI is a selection only; no real payment is processed.
- An order can be placed only with a non-empty cart, valid delivery details, an available delivery slot, and a selected payment method.
- Successful placement creates a mock order, clears the cart, and opens order confirmation.
- The confirmation displays order ID, selected slot, total, and navigation to orders or home.

### Orders

- Customers can see current and previous orders and open order details.
- An order contains an immutable snapshot of ordered items, prices, delivery address, slot, payment method, totals, creation date, and status.
- Supported statuses are `PLACED`, `CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`, and `CANCELLED`.
- A status is communicated with text as well as visual styling.

### Authentication and Profile

- Later customer phases provide signup, login, logout, forgot-password entry, mock auth state, and route guards.
- Before Phase 8, checkout and orders use one browser-session guest identity. In Phase 8, checkout, confirmation, order history, and profile become authentication-protected; successful mock login/signup attaches that session's guest orders to the authenticated mock user.
- The future API uses JWT access and refresh tokens.
- Passwords are never persisted by the frontend.
- Profile initially shows customer identity and saved delivery context supported by the mock service.

### Administration

- The dashboard shows today's orders, today's sales, pending orders, delivered orders, and available salads.
- Salad management supports create, edit, mark available/unavailable, price, ingredients, description, and image updates.
- Order management supports listing, filtering, details, and valid status updates.

## Non-Functional Requirements

- One mobile-first Angular application supports 360px through 1440px+ viewports.
- The application uses strict TypeScript, standalone components, lazy routes, semantic HTML, responsive images, and accessible interaction states.
- Business logic is tested independently from visual components.
- Initial data access uses asynchronous mock repository contracts compatible with later HTTP implementations.
- No secrets or sensitive personal information are stored in source control or browser storage.
- UI remains usable under loading, empty, recoverable error, and unavailable-product conditions.

## UI Requirements

- Visual character: fresh, modern, trustworthy, clean, and premium but affordable.
- Use light surfaces, natural green accents, spacious layouts, rounded cards, soft shadows, and restrained food photography.
- Primary calls to action are obvious and have touch targets of at least 44 by 44 CSS pixels.
- Mobile uses bottom navigation for Home, Orders, Cart, and Profile.
- Desktop uses a top header/navigation and wider content grid.
- Details are defined in `ux-spec.md`.

## Primary User Flow

1. Customer opens Home and selects or confirms an apartment.
2. Customer reviews today's available salads.
3. Customer adds a salad directly or opens its details and selects a quantity.
4. Customer reviews the cart and adjusts quantities.
5. Customer proceeds to checkout and enters valid delivery details.
6. Customer selects an available delivery slot and Cash or UPI.
7. Customer places the order and sees confirmation.
8. Customer opens Orders to review status and details.

## Data Requirements

- Domain objects and constraints are defined in `data-model.md`.
- Currency is represented as integer paise in application and API data; formatting converts 14900 paise to ₹149.
- Dates crossing service boundaries use ISO 8601 strings with timezone offsets or UTC `Z`.
- Identifiers are opaque non-empty strings in the frontend, even when mock values appear numeric.
- Catalog, apartments, slots, orders, and users have stable IDs.

## Validation

- Quantity is a positive integer and cannot exceed the currently documented per-item limit of 20.
- Apartment and delivery slot must be selected from currently available options for the current business date.
- Block must be selected from the selected apartment's configured blocks.
- Flat number is required after trimming, with maximum length defined in `data-model.md`.
- Payment method must be one of the supported enum values.
- Disabled products and unavailable slots cannot be submitted.
- Client validation improves UX; the future API remains authoritative.

## Error States

- Failed reads show a concise message and a Try Again action when retry is meaningful.
- Empty catalog, cart, orders, and search/filter results use purpose-specific empty states.
- Failed order placement preserves the entered form and cart, prevents duplicate submission, and allows retry.
- If order placement reports changed prices, the cart refreshes from current catalog data, clearly identifies the change, and requires the customer to review and submit again with a new idempotency key.
- Missing resources show a not-found screen with safe navigation.
- Validation errors are displayed near fields and summarized when useful.

## Responsive Behavior

- 360–430px: single-column content, compact header, bottom navigation, full-width primary actions where useful.
- 768px+: increased spacing, two-column opportunities, and larger product imagery.
- 1024px+: desktop header, constrained content width, multi-column grids, no mobile bottom navigation.
- 1280–1440px+: additional whitespace and grid capacity without excessively long text lines.
- Detailed responsive behavior is defined in `ux-spec.md`.

## Accessibility

- Target WCAG 2.2 AA practices.
- All functionality is keyboard operable with visible focus.
- Inputs have persistent labels and programmatically associated errors.
- Buttons have accessible names and do not use color alone to communicate state.
- Images use meaningful alternative text, or empty alt text when decorative.
- Dynamic cart/status updates use restrained live-region announcements where needed.
- Motion respects `prefers-reduced-motion`.

## Acceptance Criteria

- Given the home data is loading, when the page renders, then a meaningful loading state is visible.
- Given no salads are available, when loading completes, then the customer sees “No salads available today” and not a blank page.
- Given an available salad, when the customer selects Add, then its cart quantity and global cart count increase.
- Given the salad is already in the cart, when Add is selected again, then the existing quantity increases without a duplicate cart line.
- Given an unavailable salad, when it is displayed, then the unavailable state is clear and add controls are disabled.
- Given the cart has items, when quantities change, then subtotal and total update correctly from integer monetary values.
- Given checkout data is invalid, when Place Order is selected, then no order is created and accessible validation errors appear.
- Given checkout data is valid, when mock order creation succeeds, then the cart clears and confirmation shows the order ID, slot, and total.
- Given an API-driven view fails, when the error is recoverable, then an error message and retry action are available.
- Given the viewport is 360px wide, when any customer flow is used, then there is no unintended horizontal scrolling.
- Given a keyboard-only user, when navigating interactive controls, then focus order is logical and focus is visible.

## Assumptions and Decisions

- Phase 2 initialized the standalone Angular application and responsive customer shell; product features remain phase-gated.
- Phase 3 implemented the responsive customer Home catalog with typed mock salad data and explicit loading, empty, and error states.
- Phase 4 implemented lazy salad details with responsive product content, bounded quantity selection, availability handling, and loading, not-found, and retryable error states; its Add flow was connected in Phase 5.
- Phase 5 implemented a signal-based cart with add/merge/remove/quantity rules, computed pricing, versioned session persistence, current-product rehydration, navigation counts, and responsive empty/recovery/unavailable states; Checkout was connected in Phase 6.
- Phase 6 implemented guarded reactive Checkout, asynchronous apartment and delivery-slot selection, Cash/mock UPI choices, repository-validated guest order snapshots, success-only cart clearing, and refresh-safe order confirmation. Orders history remains deferred to Phase 7.
- Because checkout precedes authentication in the requested phase order, Phases 6–7 use a browser-session guest identity. Phase 8 protects checkout/confirmation/orders and attaches same-session guest orders on successful mock login/signup; cross-device or expired-session merging is out of scope.
- One selected apartment applies to checkout by default, but customers can change it before placing an order. Its ID persists in versioned `sessionStorage`, is revalidated against current apartment data after reload, and is cleared if inactive or unknown.
- Delivery availability, fees, and slots are repository-provided so business rules can change later.
- Initial checkout offers slots for the current calendar date in the configured business timezone; future-date scheduling is out of scope.
- Images initially use local licensed placeholders/assets; remote image hosts are not required.
- UPI collection does not request or store a UPI PIN. Real gateway behavior is out of scope.
- Phase 9 uses the development-only mock admin fixture defined in `architecture.md`; production credentials are never seeded in frontend code.

## Out of Scope for the Specification Phase

- Angular application initialization or application code
- NestJS, PostgreSQL, or deployed infrastructure
- Real authentication, authorization, payment processing, notifications, maps, inventory forecasting, promotions, subscriptions, analytics, and multi-language support
- Production content, photography licensing, legal terms, and privacy policy authoring

## Release Phases

1. Product and technical specifications
2. Application shell
3. Customer home
4. Salad details
5. Cart
6. Checkout and confirmation
7. Orders
8. Authentication and profile
9. Administration
10. Backend integration

Each phase requires its feature specification, tests, review against acceptance criteria, and explicit user request before proceeding to the next phase.
