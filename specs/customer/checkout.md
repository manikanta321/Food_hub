# Checkout and Order Confirmation

Status: Implemented and verified in Phase 6.

## Goal

Collect valid delivery and payment choices, create exactly one mock guest order,
clear the cart only after success, and provide a refresh-safe confirmation.

## User Story

As a resident with salads in my cart, I want to choose where and when they are
delivered and place my order so that I receive a reliable confirmation.

## Functional Requirements

- Add guarded `/checkout` and `/checkout/confirmation/:orderId` routes.
- Redirect an empty, unready, or uncheckoutable cart from Checkout to Cart.
- Load active apartments and current-business-date delivery slots
  asynchronously through repository contracts.
- Collect apartment, block, flat number, delivery slot, and Cash or UPI.
- Clear block and delivery slot when changing apartments.
- Persist the last valid apartment ID in `sessionStorage`.
- Create an immutable order snapshot through `OrderRepository`.
- Scope mock orders to a versioned browser-session guest identity.
- Disable repeated submission while order creation is pending.
- Clear the cart only after order creation succeeds.
- Navigate to confirmation using only the order ID.
- Reload confirmation data by ID so refresh and direct navigation work.

## Non-Functional Requirements

- Use standalone, lazy-loaded, `OnPush` route components.
- Use Angular Reactive Forms with strict typed controls.
- Keep command mapping and order coordination in `CheckoutService`.
- Keep product, apartment, slot, total, and ownership validation in the mock
  repository boundary to mirror the future backend.
- Use Signals for local view state and RxJS for asynchronous repository calls.
- Do not implement real payment, authentication, or the Orders list.

## UI Requirements

- Checkout shows a “Delivery Details” heading, persistent labels, apartment and
  block selects, flat number input, large delivery-slot radios, payment radios,
  item summary, totals, and Place Order.
- Cash explains payment occurs on delivery.
- UPI explicitly states that no real payment is taken in this mock phase.
- A submission error retains all form values and cart items with Try Again.
- Confirmation shows success text, formatted slot, order ID, total, View
  Orders placeholder action, and Back to Home.
- Because Orders is Phase 7, View Orders is present but disabled with an
  explanation until that route exists.

## User Flow

1. Customer selects Proceed to Checkout from a valid cart.
2. Apartments load; the last valid apartment or first active apartment is
   selected.
3. Customer selects block, flat number, slot, and payment method.
4. Invalid submission reveals associated errors and focuses the error summary.
5. Valid submission disables Place Order and sends one command.
6. Success clears Cart and navigates to the order-ID confirmation route.
7. Confirmation reloads the owned guest order and presents delivery details.

## Data Requirements

- Use `Apartment`, `DeliverySlot`, `CheckoutDetails`, `CreateOrderCommand`,
  `Order`, and related typed models from `data-model.md`.
- Initial mock apartments include Sunshine Apartments with blocks A, B, and C.
- Initial current-date slots are 12:30–1:00 PM, 1:00–1:30 PM, and
  1:30–2:00 PM in `+05:30`.
- Commands contain only salad IDs, quantities, delivery IDs/fields, and payment
  method; client-calculated totals are not submitted as authority.
- Order items and totals are recalculated from current repository data.
- Cash and mock UPI orders use payment status `PENDING`.

## Validation

- Apartment must exist and be active.
- Block must belong to the selected apartment.
- Flat number is trimmed, required, 1–20 characters, and accepts common
  alphanumeric, space, slash, hyphen, and underscore formats.
- Delivery slot must belong to the selected apartment/current date and be
  available.
- Payment method must be `CASH` or `UPI`.
- Cart must contain at least one available line; quantities remain 1–20.
- Unknown or differently owned order IDs resolve to not found.

## Error States

- Apartments: loading, retryable load error, or no active apartments.
- Slots: loading, retryable load error, or no available slots.
- Submission: inline alert with retry while preserving form and Cart.
- Confirmation: loading, not found, or retryable read error.
- Malformed order/session storage resets safely and does not expose stale data.

## Responsive Behavior

- 360–430px: one-column fields and summaries, full-width submit, no horizontal
  scrolling, and sufficient bottom-navigation clearance.
- 768px+: block and flat fields share a row; radio cards remain touch-friendly.
- 1024px+: form and sticky order summary use two columns.
- Confirmation remains centered and readable at all target widths.

## Accessibility

- Every control has a persistent programmatic label.
- Required state and errors use `aria-invalid` and stable `aria-describedby`.
- Radio groups use `fieldset` and `legend`.
- Validation summary receives programmatic focus on invalid submission.
- Loading uses `role="status"`; submission/read failures use `role="alert"`.
- Busy submission uses native disabled state and `aria-busy`.
- Success is announced once through the confirmation heading/status region.

## Acceptance Criteria

- Given Cart is empty, when `/checkout` is requested, then routing redirects to
  `/cart` without imperative navigation.
- Given apartments load, when a valid saved apartment exists, then it is
  selected; otherwise the first active apartment is selected.
- Given apartment changes, when block or slot belongs to the prior apartment,
  then both selections are cleared and new slots load.
- Given required values are missing, when Place Order is selected, then no
  order is created and accessible errors appear.
- Given submission is pending, when Place Order is selected again, then a
  duplicate order is not created.
- Given valid form and cart data, when creation succeeds, then one `PLACED`
  order is stored, Cart clears, and confirmation opens.
- Given creation fails, when the alert appears, then Cart and form values remain
  unchanged and retry is available.
- Given confirmation reloads with an owned ID, when the repository resolves,
  then order ID, slot, and total are displayed.
- Given confirmation uses an unknown or unowned ID, when lookup completes, then
  an order-not-found state is displayed.

## Out of Scope

- Real payment gateway, UPI intent, PIN, authorization, or capture
- Customer Orders list/details, status progression, cancellation, and admin
- Authentication and cross-device order ownership
- Future-date scheduling, coupons, tax, notifications, and non-zero delivery
  pricing

## Technical Notes

- `provideCustomerData()` binds apartment and order repositories plus
  `ApartmentService`, `CheckoutService`, and `OrderService`.
- `nonEmptyCartGuard` waits for Cart hydration before deciding.
- Mock order persistence stores immutable order snapshots with a random
  versioned guest-session ID.
- Phase 7 enables View Orders using the same repository and ownership scope.
