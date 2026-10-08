# HealthyBowl Frontend Architecture

## Purpose

This specification defines the frontend architecture for a production-quality, responsive Angular application. No backend or application implementation is part of this phase.

## Architecture Principles

- Organize code by product feature, not technical layer alone.
- Keep domain and business rules independent from presentation.
- Depend on repository/service contracts so mock and HTTP implementations are interchangeable.
- Prefer the simplest Angular-native solution that meets a documented requirement.
- Use standalone components, strict TypeScript, lazy routes, Signals for synchronous client state, and RxJS for asynchronous work.
- Do not introduce NgRx unless future complexity is demonstrated and documented.
- Avoid compatibility wrappers, premature abstractions, and broad shared modules.

## Angular Baseline

Phase 2 should initialize a current supported Angular release with:

- Standalone application APIs
- Angular Router
- SCSS
- Strict TypeScript and strict Angular template checks
- Reactive Forms
- HttpClient
- Test runner supported by the selected Angular CLI version
- Angular Material only for controls or accessibility behavior where it adds clear value

Phase 2 selected Angular 22.2, TypeScript 6.0, Node.js 24.15, npm, and the
Angular CLI Karma/Jasmine test setup. Node 24.15 is recorded in `.nvmrc` and
`package.json` engines. Angular Material was not added because the application
shell uses native semantic controls and does not yet need Material behavior.

Phase 2 initialization was completed after confirmation. The equivalent
version-pinned command is:

```bash
npx @angular/cli@22.2.0 new healthy-bowl --directory . --routing --style scss --standalone --strict --skip-git
```

Angular 22.2 requires Node.js 24.15 for this project. The initialization
preserved the existing `.git` directory and all `/specs` files.

## Project Structure

```text
src/
├── app/
│   ├── core/
│   │   ├── auth/
│   │   ├── constants/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── storage/
│   │   └── utils/
│   ├── shared/
│   │   ├── components/
│   │   ├── directives/
│   │   └── pipes/
│   ├── features/
│   │   ├── auth/
│   │   ├── home/
│   │   ├── salads/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── profile/
│   │   └── admin/
│   │       ├── dashboard/
│   │       ├── salads/
│   │       └── orders/
│   ├── layout/
│   │   ├── customer-shell/
│   │   ├── admin-shell/
│   │   ├── app-header/
│   │   └── mobile-bottom-navigation/
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── assets/
└── styles/
    ├── _tokens.scss
    ├── _mixins.scss
    ├── _reset.scss
    └── _utilities.scss
```

Feature folders may contain `pages`, feature-specific `components`, `services`, and route definitions. A type belongs in `core/models` only when used across features; feature-private types stay with their feature.

## Layer Responsibilities

### Core

- Singleton, application-wide services and repository contracts
- Cross-feature domain models and constants
- Authentication state, guards, interceptors, storage abstraction, and general utilities
- No visual components and no dependency on feature code

### Shared

- Reusable, presentation-focused controls such as quantity selector, price summary, status badge, loading state, error state, and empty state
- Generic directives and pure pipes
- No feature orchestration, data fetching, or mutable global state
- Components imported directly; no catch-all `SharedModule`

### Features

- Route-level pages, feature-specific components, use cases, and orchestration
- Features may depend on core and shared, but not on another feature's internal files
- Cross-feature workflows are coordinated through public services/contracts or route state

### Layout

- Customer and admin shells, global header, navigation, responsive content containers
- Shells own page chrome but not catalog, cart, order, or admin business rules

## Component Architecture

- Route components coordinate loading, route parameters, and service calls.
- Presentational components receive typed inputs and emit focused events.
- Use `ChangeDetectionStrategy.OnPush` for components.
- Prefer Angular control flow (`@if`, `@for`, `@switch`) and stable tracking keys.
- Keep templates declarative; calculations and mutations belong in services or component methods/computed signals.
- Use signal inputs/outputs where supported by the selected Angular version; otherwise use typed Angular inputs/outputs consistently.
- Do not create a reusable component until at least two contexts need it or it encapsulates meaningful behavior/accessibility.

## State Management

### Signals

Signals are used for synchronous client-owned state:

- Cart lines
- Cart item count and totals as computed signals
- Selected apartment
- Mock authentication/session state
- Local view state where it improves clarity

State services expose readonly signals and named mutation methods. Components do not mutate service internals.

### RxJS

RxJS is used for:

- Repository and HttpClient results
- Cancellation and switching on route/query changes
- Retry behavior when explicitly initiated
- Combining asynchronous sources

Use the async pipe or signal interop for lifecycle-safe consumption. Avoid manual subscriptions; when needed, use Angular destruction utilities. Do not mirror every observable into a signal without a consumer need.

### Persistence

- Cart and selected apartment ID persist through a typed storage adapter backed by `sessionStorage`.
- Persisted apartment selection is revalidated against the repository and discarded when inactive or unknown.
- Phases 6–7 assign mock orders to a versioned browser-session guest identity. Phase 8 mock login/signup atomically reassigns same-session guest orders to the authenticated mock user; expired or other-device sessions are not merged.
- Auth tokens, when introduced, follow the authentication specification created in Phase 8; passwords are never stored.
- Gracefully handle unavailable storage and malformed/stale values.
- Version serialized state so future schema changes can invalidate or migrate it safely.

## Service and Repository Architecture

Feature-facing services implement business use cases and consume repository contracts:

```text
Component/Page
    → Feature or domain service
        → Repository interface
            → Mock repository (initial)
            → HTTP repository (future)
```

Initial contracts include:

- `SaladRepository`
- `ApartmentRepository`
- `OrderRepository`
- `AuthRepository`
- `AdminDashboardRepository`
- `AdminSaladRepository`
- `AdminOrderRepository`

Angular injection tokens bind contracts to implementations. Mock methods remain asynchronous (Observable-based) to match future HTTP behavior. Components never import mock data directly.

Services include:

- `SaladService`: catalog queries and lookup
- `CartService`: cart mutations, limits, and computed totals
- `CheckoutService`: form-to-command mapping and order placement coordination
- `OrderService`: customer order queries and status presentation
- `ApartmentService`: apartments and delivery slots
- `AuthService`: identity/session state
- Admin-specific services for dashboard summaries, salad commands, and order updates

Mock authentication fixtures are development-only data. Phase 9 provides an admin fixture through `AuthRepository` using email `admin@healthybowl.test`, password `HealthyBowl-Admin-Demo-1!`, and role `ADMIN`. The UI labels it as local mock access; it is never reused as a production credential or shipped when HTTP authentication is enabled.

DTO-to-domain mapping occurs at repository boundaries. Future API DTO changes must not leak into templates.

## Routing Architecture

- Root routes redirect `/` to `/home`.
- Customer and admin areas use separate lazy shells.
- Feature routes are lazy loaded with `loadComponent` or `loadChildren`.
- Route parameters use opaque string IDs.
- Checkout has a non-empty-cart guard.
- Customer auth guards are introduced in Phase 8 for checkout, order confirmation, order history/details, and authenticated profile data.
- Admin routes require authentication and admin role UX guards in Phase 9; the backend remains authoritative.
- Unknown routes resolve to an accessible not-found page.
- Detailed paths, titles, and guard behavior are defined in `routing.md`.

## Responsive and Styling Strategy

- Mobile-first SCSS with natural layout flow, Grid, and Flexbox.
- Design tokens are CSS custom properties for runtime-consumed color, spacing, typography, radius, elevation, focus, and container values.
- SCSS variables/mixins may hold compile-time breakpoint helpers.
- Baseline breakpoints:
  - compact: default, 360px+
  - medium: 768px+
  - large: 1024px+
  - wide: 1280px+
  - extra-wide: 1440px+
- Breakpoints respond to layout pressure, not device names.
- Main content uses a centered maximum-width container; controls avoid fixed widths that cause overflow.
- Account for safe-area insets on fixed mobile navigation.
- Prefer fluid type/spacing with bounded `clamp()` values when useful.

## Design System

Phase 2 establishes semantic tokens rather than scattered values:

- Color: brand, accent, surface, text, border, success, warning, error, disabled
- Typography: display, heading, body, label, caption
- Spacing: a consistent 4px-based scale
- Radius: control, card, pill
- Elevation: low and raised card shadows
- Interaction: focus ring, hover, active, disabled
- Layout: content widths, gutters, navigation heights, breakpoints

Global styles define normalization, typography, page background, focus behavior, and small utilities only. Feature styles remain locally scoped.

## Error, Loading, and Empty-State Architecture

- Route pages model explicit loading, loaded, empty, and error states.
- Shared visual state components remain content-configurable and accessible.
- Repository errors map to typed application errors before reaching components.
- Retry is user-triggered and repeats an idempotent read; order submission is protected from double activation.
- A global error handler may report unexpected faults later but does not replace local recovery UX.

## Accessibility Architecture

- Native semantic controls are preferred over custom ARIA widgets.
- Route changes move focus to the page heading or main region through a centralized strategy.
- Validation uses stable IDs and `aria-describedby`.
- Dialogs, menus, and selectors use Angular Material/CDK only where robust keyboard/focus behavior is otherwise costly.
- Status changes and cart updates use concise live regions.
- Color tokens are tested for contrast in normal, hover, focus, and disabled states.

## Performance Strategy

- Lazy-load feature routes and avoid barrel files that accidentally pull in features.
- Use optimized local images, explicit dimensions/aspect ratios, responsive sources, and lazy loading below the fold.
- Track collections by stable IDs.
- Derive state with computed signals rather than repeated template methods.
- Keep initial dependencies small; measure before adding optimizations.
- Add server-side rendering only if a later SEO/performance requirement justifies its operational complexity.

## Environment Configuration

- Environment configuration may contain public runtime/build values such as API base URL and feature flags.
- No secrets, private keys, passwords, or privileged credentials belong in Angular files.
- API paths are centralized in repositories/configuration and are never spread across components.
- Development defaults point to mock providers until backend integration is explicitly enabled.

## Testing Strategy

### Unit Tests

- Cart add/merge/remove/quantity limits and monetary calculations
- Checkout mapping and validation
- Order creation behavior and status helpers
- Repository mappers and storage recovery
- Guards and auth state

### Component Tests

- Rendering for loaded, empty, error, unavailable, and disabled states
- User interactions, accessible names, focus behavior, and emitted events
- Reactive form validation and error association
- Responsive logic only where behavior changes; CSS layout is covered separately

### Integration Tests

- Router plus mock repositories for home-to-cart, checkout, and order flows
- Guard redirects and return URLs
- Admin list/detail/status workflows

### End-to-End and Quality Gates

- Add focused browser tests when complete user flows exist.
- Verify representative widths: 360, 390, 430, 768, 1024, and 1440 pixels.
- Run type checking, unit tests, production build, linting if configured, and automated accessibility checks.
- Manually inspect keyboard navigation, zoom, reduced motion, and screen-reader announcements for critical flows.

## Dependency Rules

- `core` must not import `features`.
- `shared` must not import `features` or mutable application services.
- One feature must not import another feature's private implementation.
- Data repositories must not depend on UI components.
- Mock data is confined to mock repository implementations/fixtures.
- Any new runtime dependency requires a documented use case and evaluation of bundle, maintenance, accessibility, and security impact.

## Architecture Acceptance Criteria

- Given a mock repository is replaced by an HTTP repository, when its contract is preserved, then feature templates require no meaningful rewrite.
- Given cart state changes, when dependent UI renders, then totals and item count derive from one state source.
- Given a feature route is not visited, when the initial bundle loads, then that feature's route code is not eagerly included unless technically required.
- Given a 360px viewport, when the shell renders, then content remains usable without unintended horizontal overflow.
- Given keyboard navigation, when focus enters every interactive component, then a visible focus indicator and logical order are present.

## Deferred Decisions

- SSR, PWA/offline support, analytics, error monitoring, and NgRx are excluded until requirements justify them.
- Production token transport and refresh strategy require backend security design in Phase 8/10.
