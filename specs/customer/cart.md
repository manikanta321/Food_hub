# Cart

Status: Implemented in Phase 5 and integrated with Checkout in Phase 6.

## Goal

Let customers collect available salads, adjust quantities, review pricing, and
retain the cart for the current browser session before checkout is introduced.

## User Story

As a resident, I want to add salads to a cart and review or change them so that
I can prepare an accurate order.

## Functional Requirements

- Add the lazy route `/cart`.
- Allow available salads to be added from Home and Salad Details.
- Merge additions for the same salad ID into one line, up to 20 bowls.
- Let customers increase, decrease, or remove each cart line.
- Derive item count, line totals, subtotal, delivery charge, and total.
- Use a zero delivery charge for the initial mock pricing policy.
- Persist a versioned minimal snapshot in `sessionStorage`.
- Rehydrate snapshots with current salad data rather than persisted product
  records.
- Retain a rehydrated unavailable line, label it, and disable its quantity
  controls.
- Display the cart item count in customer navigation.
- Enable Proceed to Checkout only when the hydrated cart is non-empty and all
  lines are available.

## Non-Functional Requirements

- Use a customer-shell-scoped `CartService` with private writable Signals,
  public readonly state, and computed totals.
- Keep all quantity, merge, persistence, and pricing logic out of components.
- Reuse `QuantitySelectorComponent` and the existing `Salad` model.
- Treat storage as fallible and recover without leaving the page unusable.
- Do not add a state-management or persistence library.

## UI Requirements

- Show a single “Your Cart” page heading.
- Each line shows its image, name, unit price, quantity selector, line total,
  availability when relevant, and Remove action.
- The price summary shows subtotal, delivery, and total.
- The empty state explains that no salads have been added and links to Home.
- The checkout action is prominent; invalid carts explain what must be fixed.
- Add actions provide concise live-region feedback without moving focus.

## User Flow

1. Customer selects Add on Home or chooses a quantity on Salad Details.
2. The cart count updates and the Add action confirms the resulting quantity.
3. Customer opens Cart from desktop or mobile navigation.
4. Customer adjusts line quantities or removes a line.
5. Totals and persisted session state update immediately.
6. A valid cart continues to the guarded Checkout route.

## Data Requirements

- Store `CartItem` as a current `Salad` reference and integer quantity.
- Store only `{ saladId, quantity }` entries with schema version `1`.
- Enforce one line per salad ID.
- Derive totals in paise and format currency only in the UI.
- The item count is the sum of quantities, not the number of distinct lines.

## Validation

- New salads must be available.
- Added and updated quantities must be integers from 1 through 20.
- Merged quantities are capped at 20.
- Unknown persisted salad IDs are discarded.
- Duplicate, malformed, unsupported-version, or out-of-range persisted data is
  rejected and removed.

## Error States

- Cart hydration exposes a stable loading state.
- Invalid or inaccessible session storage resets safely and displays a
  dismissible-in-effect, non-blocking recovery explanation for the session.
- A salad-catalog hydration error resets persisted data and leaves a usable
  empty cart with the same recovery explanation.
- An item that becomes unavailable remains visible until removed.

## Responsive Behavior

- 360–430px: lines stack without horizontal overflow; controls wrap; summary
  follows the lines; actions use comfortable touch targets.
- 768px+: line content aligns in a compact grid.
- 1024px+: cart lines and a sticky price summary use two columns.
- The page leaves room for the fixed mobile bottom navigation.

## Accessibility

- Use semantic lists, headings, buttons, and descriptive image alternatives.
- Quantity and remove controls include the salad name in accessible labels.
- Disabled and unavailable states are conveyed in text as well as styling.
- Cart additions and removals are announced through a polite live region.
- Currency labels and summary relationships remain understandable without
  visual position.

## Acceptance Criteria

- Given an available salad, when Add is selected, then one cart line is created
  and the navigation count increases.
- Given a salad already exists in the cart, when it is added again, then its
  existing quantity increases without creating a duplicate line.
- Given a details quantity greater than one, when Add to Cart is selected, then
  that quantity is merged and the customer is taken to Cart.
- Given a quantity of one, when Minus is considered, then it is disabled and
  Remove remains available.
- Given a quantity of 20, when Plus is considered, then it is disabled.
- Given a quantity changes, when state updates, then line total, item count,
  subtotal, and total update consistently.
- Given a line is removed, when it was the final line, then the empty state is
  displayed and checkout is unavailable.
- Given the page reloads in the same browser session, when valid persisted
  state exists, then current salad data rehydrates the cart.
- Given persisted state is invalid, when hydration runs, then it is cleared and
  the cart remains usable with a recovery explanation.
- Given a salad is unavailable during rehydration, when Cart renders, then its
  line is retained, labelled unavailable, and cannot be increased or checked
  out.

## Out of Scope

- Cross-tab synchronization or persistence beyond the browser session
- Server-authoritative cart, inventory reservation, promotions, taxes, and
  non-zero delivery pricing
- Authentication, orders, and admin functionality

## Technical Notes

- `provideCustomerData()` supplies one `SaladService` and `CartService` scope
  shared by the customer shell and all customer feature routes.
- `CartService` owns hydration and writes after every successful mutation.
- Phase 6 enabled checkout and introduced `nonEmptyCartGuard` without changing
  cart component APIs.
