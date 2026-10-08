# Customer Home

Status: Implemented in Phase 3 and integrated with Cart in Phase 5.

## Goal

Help residents understand HealthyBowl's offer and review today's customer-visible
salads from a fast, accessible, responsive landing page.

## User Story

As an apartment resident, I want to see today's salads, their prices,
ingredients, and availability so that I can decide what to order.

## Functional Requirements

- Display the HealthyBowl hero and product promise.
- Show a non-interactive delivery-context message until apartment selection is
  implemented with checkout.
- Load the catalog asynchronously through `SaladService` and
  `SaladRepository`.
- Render the Protein Power Salad and Fresh Veggie Bowl from mock repository
  data.
- Show image, name, description, ingredient preview, INR price, availability,
  and an Add control for each salad.
- Include customer-visible unavailable salads but disable their Add control.
- Add one bowl of an available salad to the shared cart when Add is activated.
- Provide explicit loading, empty, and recoverable error states.
- Retry only the catalog read when Try Again is activated.

## Non-Functional Requirements

- Use strict TypeScript and immutable typed fixture data.
- Keep mock data outside components and templates.
- Keep the repository asynchronous and replaceable by a future HTTP
  implementation.
- Lazy-load the Home route and use customer-shell-scoped data providers.
- Use `OnPush` change detection and stable IDs when rendering collections.

## UI Requirements

- Hero copy uses “Fresh & Healthy Salads” and “Delivered to Your Apartment.”
- Product photography is local, responsive, has explicit dimensions/aspect
  ratio, and meaningful alt text.
- Salad cards use light surfaces, rounded corners, subtle borders/shadows, and
  clear price hierarchy.
- Add is enabled for available salads and includes product-specific accessible
  text.

## User Flow

1. Customer navigates to Home.
2. Hero and catalog loading state appear.
3. Catalog resolves to product cards, an empty state, or an error state.
4. Customer reviews product information and availability.
5. Customer adds an available salad or opens its details.

## Data Requirements

- Use the `Salad` and `ProductImage` domain models from `data-model.md`.
- Prices are integer paise and formatted with Angular's INR currency formatter.
- Mock IDs are `protein-power-salad` and `fresh-veggie-bowl`.
- Product values and image paths live in mock repository fixtures.

## Validation

- Repository fixture data must satisfy model constraints.
- UI must not calculate with formatted price strings.
- Missing/failed catalog data must never produce a blank page.

## Error States

- Loading: stable two-card skeleton with accessible status text.
- Empty: “No salads available today. Please check again later.”
- Error: “We couldn't load today's salads.” and a Try Again button.
- Retry preserves the hero and delivery context.

## Responsive Behavior

- 360–430px: compact hero, one-column cards, no horizontal overflow.
- 768px+: two-column hero and two-column salad grid.
- 1024px+: desktop navigation and balanced content width.
- 1280px+: the initial two cards retain a readable maximum width and do not
  stretch across four columns.

## Accessibility

- Use one page `h1` and a logical heading hierarchy.
- Product images have meaningful alt text.
- Loading uses `role="status"`; errors use `role="alert"`.
- Availability is communicated with text, not color alone.
- Buttons have product-specific accessible names and at least 44px touch size.
- Skeletons are hidden from assistive technology.

## Acceptance Criteria

- Given the Home route loads, when the catalog request is pending, then the
  hero and an accessible loading state are visible.
- Given catalog data succeeds, when products render, then both initial salads
  show repository-provided names, prices, images, ingredients, and availability.
- Given an unavailable salad, when its card renders, then unavailable text is
  visible and Add is disabled.
- Given an available salad, when Add is activated, then its cart quantity
  increases without creating a duplicate line.
- Given an empty catalog, when loading finishes, then the documented empty
  message is visible.
- Given catalog loading fails, when the error state appears and Try Again is
  activated, then a new repository read starts.
- Given a 360px viewport, when Home renders, then document width does not exceed
  viewport width.

## Out of Scope

- Apartment selection persistence
- Checkout, orders, authentication, and admin features

## Technical Notes

- `SALAD_REPOSITORY` binds `MockSaladRepository` at the customer-shell route.
- `SaladService` is the component-facing abstraction.
- Salad details and Cart reuse the repository contract without changing mock
  data.
