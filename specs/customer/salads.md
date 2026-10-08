# Salad Details

Status: Implemented in Phase 4 and integrated with Cart in Phase 5.

## Goal

Give customers complete salad information, a clear quantity choice, and a path
to add that selection to their cart.

## User Story

As a resident, I want to review a salad's image, description, ingredients,
price, availability, and quantity so that I can decide whether it suits my
meal.

## Functional Requirements

- Add the lazy route `/salads/:saladId`.
- Load the salad by opaque route ID through `SaladService`.
- Display image, name, description, unit price, ingredients, and availability.
- Allow available salad quantity selection from 1 through 20.
- Prevent decrement below 1 and increment above 20.
- Keep quantity controls and Add to Cart disabled for unavailable salads.
- Display a product-specific not-found state for an unknown ID.
- Provide loading and retryable error states.
- Update the document title to the loaded salad name.
- Make Home salad cards navigate to their detail route.
- Add the selected quantity to the cart and navigate to `/cart`.

## Non-Functional Requirements

- Reuse the existing model, repository, service, mock fixtures, and local
  photography.
- Keep route data asynchronous and cancel obsolete requests when the route ID
  changes.
- Use `OnPush`, Signals for local quantity/view state, and RxJS for repository
  reads.
- Delegate cart mutations and persistence to `CartService`.

## UI Requirements

- Back to Today's Salads appears before page content.
- Compact layouts stack image and product information.
- Medium and larger layouts use a balanced two-column presentation.
- Ingredients render as readable chips/list items.
- Price and availability are visually prominent.
- The quantity selector has minus and plus controls with a visible value.
- Add to Cart is visually prominent and enabled only for an available salad.

## User Flow

1. Customer activates a salad's View Details link on Home.
2. The details route displays a stable loading state.
3. The salad appears, or the route displays not found/error recovery.
4. For an available salad, the customer adjusts quantity within 1–20.
5. Customer adds the selected quantity and continues to Cart.

## Data Requirements

- Use `Salad` and opaque `EntityId`.
- Display `pricePaise` through INR currency formatting.
- Derive selected total as `pricePaise × quantity`; do not store duplicated
  price state.
- Load current mock data by ID rather than passing complete entities through
  router state.

## Validation

- `saladId` must be a non-empty route parameter.
- Quantity is an integer from 1 through 20.
- Unknown IDs resolve to not found, not a generic error.
- Unavailable products cannot progress toward cart addition.

## Error States

- Loading: image/content skeleton with accessible status text.
- Not found: “Salad not found” with Back to Home.
- Error: “We couldn't load this salad” with Try Again and Back to Home.
- Retry repeats only the current salad read.

## Responsive Behavior

- 360–430px: stacked content, full-width CTA, no horizontal overflow.
- 768px+: image and information use two columns.
- 1024px+: content remains constrained and vertically centered where useful.
- Sticky actions are deferred until real cart activation to avoid conflicts
  with mobile navigation.

## Accessibility

- Use one visible page `h1` in each resolved state.
- Back navigation is a real router link with deterministic Home fallback.
- Images have repository-provided meaningful alt text.
- Quantity controls have product-specific accessible labels.
- Disabled boundaries and availability are conveyed with text and native
  disabled state.
- Loading uses `role="status"` and recoverable failure uses `role="alert"`.

## Acceptance Criteria

- Given a valid salad ID, when loading succeeds, then repository-provided
  details and all ingredients are visible.
- Given quantity 1, when decrement is considered, then Minus is disabled.
- Given quantity below 20, when Plus is activated, then quantity and selected
  total increase once.
- Given quantity 20, when increment is considered, then Plus is disabled.
- Given an unavailable salad, when details render, then quantity and Add to
  Cart are disabled with an explanation.
- Given an available salad and selected quantity, when Add to Cart is
  activated, then the quantity is merged into one cart line and Cart opens.
- Given an unknown ID, when loading resolves, then Salad Not Found and Back to
  Home are visible.
- Given a repository error, when Try Again is activated, then the current ID is
  requested again.
- Given a 360px viewport, when details render, then the document has no
  unintended horizontal overflow.

## Out of Scope

- Checkout, orders, authentication, and admin features
- Nutritional calculations, customization, and reviews

## Technical Notes

- A shared `QuantitySelectorComponent` owns accessible controls; the page owns
  quantity state and limits.
- `provideSaladData()` supplies the mock repository/service at lazy route
  boundaries.
- Phase 5 enabled Add to Cart through the customer-shell-scoped `CartService`
  without changing the salad repository contract.
