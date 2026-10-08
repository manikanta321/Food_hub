# HealthyBowl Routing Specification

## Goals

- Provide stable, readable URLs for all customer and admin features.
- Lazy-load feature areas and their route-level components.
- Preserve browser history, deep links, page titles, and accessible route transitions.
- Use guards for workflow guidance while treating backend authorization as the security boundary.

## Complete Route Tree

```text
/
├── home
├── auth
│   ├── login
│   ├── signup
│   └── forgot-password
├── salads
│   └── :saladId
├── cart
├── checkout
│   └── confirmation
│       └── :orderId
├── orders
│   └── :orderId
├── profile
├── forbidden
├── admin
│   ├── dashboard
│   ├── salads
│   │   ├── new
│   │   └── :saladId
│   │       └── edit
│   └── orders
│       └── :orderId
└── ** (not found)
```

`/` redirects to `/home` with `pathMatch: 'full'`.

## Route Configuration Shape

```text
Root
├── CustomerShell
│   ├── /home
│   ├── /salads/:saladId
│   ├── /cart
│   ├── /checkout
│   ├── /checkout/confirmation/:orderId
│   ├── /orders
│   ├── /orders/:orderId
│   └── /profile
├── AuthShell
│   ├── /auth/login
│   ├── /auth/signup
│   └── /auth/forgot-password
├── AdminShell
│   └── /admin/...
├── /forbidden
└── NotFound
```

Customer, auth, and admin route groups load lazily. The customer shell contains the shared customer header and responsive navigation. The auth shell uses minimal brand chrome without customer bottom navigation. The admin shell owns clearly separate admin navigation.

## Route Definitions

### Customer

| Path | Page | Initial Guard/Rule | Title |
|---|---|---|---|
| `/home` | Home | None | HealthyBowl |
| `/salads/:saladId` | Salad details | Valid non-empty parameter; page handles not found | Salad name when loaded |
| `/cart` | Cart | None | Your Cart · HealthyBowl |
| `/checkout` | Checkout | `nonEmptyCartGuard`; add `authGuard` in Phase 8 | Checkout · HealthyBowl |
| `/checkout/confirmation/:orderId` | Order confirmation | Guest ownership initially; add `authGuard` in Phase 8 | Order Confirmed · HealthyBowl |
| `/orders` | Orders list | Guest session initially; add `authGuard` in Phase 8 | Orders · HealthyBowl |
| `/orders/:orderId` | Order details | Guest ownership initially; add `authGuard` in Phase 8 | Order {display ID} · HealthyBowl |
| `/profile` | Profile or pre-Phase-8 guest prompt | Add `authGuard` in Phase 8 | Profile · HealthyBowl |
| `/forbidden` | Forbidden | Authenticated non-admin destination | Access Denied · HealthyBowl |

### Authentication

| Path | Page | Guard/Rule | Title |
|---|---|---|---|
| `/auth/login` | Login | Redirect authenticated users to validated `returnUrl` or Home | Log In · HealthyBowl |
| `/auth/signup` | Signup | Redirect authenticated users to validated `returnUrl` or Home | Sign Up · HealthyBowl |
| `/auth/forgot-password` | Forgot password | Redirect authenticated users to Home when appropriate | Reset Password · HealthyBowl |

### Administration

All `/admin` routes are lazy loaded and use both authentication and admin-role UX guards when implemented. The future API must independently authorize every admin request.

| Path | Page | Additional Rule | Title |
|---|---|---|---|
| `/admin` | Redirect | Redirect to `/admin/dashboard` | — |
| `/admin/dashboard` | Dashboard | Admin role | Admin Dashboard · HealthyBowl |
| `/admin/salads` | Salad management list | Admin role | Manage Salads · HealthyBowl |
| `/admin/salads/new` | Create salad | Admin role; declared before `:saladId` | Add Salad · HealthyBowl |
| `/admin/salads/:saladId/edit` | Edit salad | Admin role; page handles not found | Edit Salad · HealthyBowl |
| `/admin/orders` | Order management list | Admin role | Manage Orders · HealthyBowl |
| `/admin/orders/:orderId` | Admin order details | Admin role; page handles not found | Admin Order Details · HealthyBowl |

## Guard Behavior

### Non-Empty Cart Guard

- Protects `/checkout`.
- If the cart is empty, returns a redirect tree to `/cart`.
- Does not imperatively navigate.
- The cart page explains the empty state and links to Home.

### Authentication Guard

- Introduced in Phase 8 after mock authentication exists.
- Redirects unauthenticated protected-route requests to `/auth/login`.
- Adds only a validated internal `returnUrl`; external or protocol-relative values are rejected.
- Before Phase 8, mock guest orders are scoped to the current browser session so Phase 6/7 can be completed in the specified order.
- From Phase 8 onward, `/checkout`, `/checkout/confirmation/:orderId`, `/orders`, `/orders/:orderId`, and `/profile` require authentication. Home, salad details, and Cart remain public.
- Successful mock Login or Signup attaches current-session guest orders to that user before resolving the safe return URL.

### Admin Role Guard

- Requires an authenticated user with role `ADMIN`.
- Unauthenticated users go to Login with a safe return URL.
- Authenticated non-admin users go to `/forbidden`, which explains the restriction and links to Home.
- It is navigation UX only, not an authorization control.

### Authenticated-User Guard

- Prevents redundant Login/Signup navigation for an existing session.
- Uses a safe return URL or Home.

## Route Data and Parameters

- Parameter names are descriptive: `saladId`, `orderId`.
- IDs are treated as opaque strings and URL-decoded by the router.
- Filter state that should be shareable uses query parameters, for example:
  - `/admin/orders?status=PREPARING&dateFrom=2026-09-29&dateTo=2026-09-29`
- Temporary form values, complete order objects, auth tokens, addresses, and payment details must not appear in URLs.
- Navigation state is optional enhancement only; pages must work after refresh by loading from the repository using the route ID.

## Data Loading

- Route-level components read parameters and call feature services.
- Default strategy is component-owned loading so skeleton, retry, and not-found states are explicit.
- Resolvers are used only when a route truly cannot render useful shell content before data arrives.
- Parameter changes cancel obsolete reads through RxJS switching.
- A failed entity lookup distinguishes not found from retryable transport errors.

## Titles and Accessibility

- Every route has a unique title.
- Entity pages update the title after data loads, with a stable fallback while loading.
- After successful navigation, focus moves to the route page heading or main content region.
- Router links expose current-page state in primary navigation.
- Back controls use browser history when valid and include a deterministic fallback route for direct entries.
- Loading announcements are concise; title/focus changes are not duplicated by noisy live regions.

## Scroll Behavior

- Standard forward navigation restores the top of the primary content.
- Browser back/forward restores prior scroll position where Angular supports it.
- Fragment scrolling is enabled only for valid page landmarks.
- Validation navigation scrolls/focuses the first invalid field without hiding it under sticky UI.

## Error and Unknown Routes

- `**` lazy-loads an accessible Not Found page with Home and Back actions.
- Unknown salad/order IDs render a resource-specific not-found state and do not silently redirect.
- Unauthorized (`401`), forbidden (`403`), and not found (`404`) remain distinguishable.
- Unexpected route errors show a safe recovery path and do not expose stack traces.

## Lazy-Loading Boundaries

- Home, salads, cart, checkout, orders, profile, auth, and admin are independent feature boundaries.
- Admin children may be split further when their implementation size justifies it.
- Shared shell code and truly global utilities remain in the initial application bundle.
- Feature route files do not import components from unrelated feature internals.

## Phase Activation

- Phase 2: root redirect, Home placeholder route if necessary for shell verification, lazy route structure, not-found page, and customer shell. Only Home appears in primary navigation until later destination routes are implemented.
- Phases 3–7: activate customer feature routes as implemented.
- Phase 8: activate auth routes and customer auth guard policy.
- Phase 9: activate admin routes and guards.
- Unimplemented destinations must not present dead navigation; navigation items appear when their phase exists.

## Routing Acceptance Criteria

- Given the root URL, when navigation completes, then the canonical destination is `/home`.
- Given an empty cart, when `/checkout` is requested, then navigation resolves to `/cart`.
- Given a direct valid order URL, when the page reloads, then the order is looked up by `orderId` rather than depending on transient navigation state.
- Given an unknown path, when navigation completes, then an accessible not-found page is displayed.
- Given an unauthenticated user requests an admin route after guards exist, when redirected to Login, then only a safe internal return URL is retained.
- Given a customer is authenticated but not an admin, when requesting an admin route, then admin content is not rendered.
- Given a route changes, when the new page appears, then its document title and focus target are updated.

## Out of Scope

- Server routing and deployment rewrite configuration
- Backend authorization
- Deep-link association with native applications
- Localization prefixes and multi-tenant apartment subdomains
