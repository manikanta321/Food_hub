# HealthyBowl UX and Responsive UI Specification

## Experience Goals

- Help apartment residents order a healthy meal in a few clear steps.
- Make availability, price, quantity, delivery destination, slot, and order status immediately understandable.
- Treat mobile as a complete primary experience and progressively enhance larger layouts.
- Use calm, fresh visual styling without decorative complexity that competes with ordering.

## Information Architecture

### Customer Navigation

- Primary destinations: Home, Orders, Cart, Profile
- Mobile: fixed bottom navigation with icon, text label, active state, cart count, and safe-area padding
- Desktop: top navigation in the application header; cart remains prominent
- Contextual back navigation appears on details and checkout pages but browser back remains functional

### Admin Navigation

- Dashboard, Salads, Orders
- Mobile: compact top bar and an accessible menu/drawer
- Desktop: persistent side navigation or clearly separated top navigation
- Admin and customer contexts must be visually labeled and must not be confused

## Global Layout

- Minimum supported viewport width: 360px.
- Content uses 16px compact gutters, approximately 24px medium gutters, and 32px large gutters.
- Main content is centered and constrained to a design-token maximum width on large displays.
- Bottom spacing on compact layouts accounts for fixed navigation.
- Pages contain one visible `h1`; headings follow a logical hierarchy.
- Primary controls have a minimum 44px touch target and adequate separation.
- Text is resizable to 200% without loss of content or function.

## Visual System

- Background: white or very light neutral.
- Brand: natural, contrast-safe green; lighter green is supporting, not body text on white.
- Text: dark neutral with a muted secondary neutral.
- Status: semantic success, warning, error, and informational styles with icon/text labels.
- Cards: rounded corners, subtle border or low shadow, never shadow alone for critical boundaries.
- Type: clean system or locally supplied sans-serif with restrained display sizing.
- Food imagery: bright, natural, responsive, consistent aspect ratio, and meaningful alt text.
- Focus: high-contrast, visible ring with sufficient offset.
- Motion: short and functional; disabled or reduced when the user requests reduced motion.

## Shared UI Patterns

### Header

- Shows brand link, current delivery context, desktop navigation, and cart count.
- Compact mobile header avoids duplicating bottom-navigation destinations.
- Apartment selector has a visible label such as “Delivering to” and indicates that it opens a selection control.

### Salad Card

- Contains image, name, concise description or ingredients preview, formatted price, availability, and Add action.
- Entire card may expose a details link, but Add remains a distinct button.
- Disabled/unavailable state includes text and a disabled action; it is not conveyed by opacity alone.
- After add, feedback updates cart count and may announce the new quantity without stealing focus.

### Quantity Selector

- Minus button, visible numeric quantity, and plus button.
- Each button has a product-specific accessible label.
- Minus is disabled at the applicable lower bound; cart behavior may offer a separate Remove action.
- Quantity limits and changes are announced when needed.

### Loading, Empty, and Error

- Loading uses stable skeletons or progress indicators with accessible status text.
- Empty states explain why the page is empty and provide the most useful next action.
- Error states use plain language, preserve user input, and provide Try Again for recoverable reads/actions.
- Content does not jump excessively when states resolve.

## Home

### Goal

Let customers confirm the delivery context and add today's salads quickly.

### Content Order

1. Header
2. Delivery apartment selector/context
3. Hero with “Fresh & Healthy Salads” and the product tagline “Fresh & Healthy. Delivered to Your Apartment.”
4. “Today's Salads” heading and product collection
5. Mobile bottom navigation

### Responsive Behavior

- 360–430px: compact hero, one card per row, card content optimized for thumb reach, full-width or clearly sized Add actions.
- 768px+: hero may use two columns with supporting food imagery; salad grid uses two columns when cards retain useful width.
- 1024px+: top navigation replaces bottom navigation; two to three cards per row based on content width.
- 1280px+: up to four cards only when future catalog size and minimum card width permit; the initial two products should not be stretched awkwardly.

### States

- Loading: hero can remain visible while product skeletons load.
- Empty: “No salads available today. Please check again later.”
- Error: catalog error with Try Again; retained apartment context.

### Acceptance Criteria

- Given an available salad, when Home loads, then its name, price, image, availability, and Add control are visible.
- Given the user adds a salad, when the operation completes, then cart count updates and focus remains predictable.
- Given a 360px viewport, when Home renders, then no content is clipped horizontally.

## Salad Details

### Goal

Provide enough product information to make a confident quantity selection.

### Content Order

1. Back navigation
2. Large responsive image
3. Name, price, availability
4. Description
5. Ingredients as readable chips/list
6. Quantity selector
7. Add to Cart

### Responsive Behavior

- Compact: stacked layout with a prominent full-width action near the end; a sticky bottom action area is permitted if it does not hide content or conflict with bottom navigation.
- Medium+: image and information may form two columns.
- Large: content remains constrained; image does not dominate the viewport.

### States and Rules

- Invalid ID: accessible not-found view and Back to Home.
- Unavailable: information remains visible, but quantity/add controls are disabled with explanation.
- Adding multiple units merges into the existing cart line.

## Cart

### Goal

Let customers verify items, quantities, and price before checkout.

### Content

- “Your Cart” heading
- Cart lines with thumbnail, name, unit price, quantity selector, line total, and Remove
- Price summary: subtotal, delivery, total
- Proceed to Checkout

### Responsive Behavior

- Compact: lines stack; controls and prices wrap without overlap; price summary follows items; checkout action is prominent and may be sticky above bottom navigation.
- Medium+: line content aligns in columns.
- Large: items and a sticky summary may form a two-column layout.

### States

- Empty: message, brief guidance, and Browse Salads action.
- Storage recovery failure: reset invalid cart safely and show a non-blocking explanation.
- Product becomes unavailable: retain line for clarity, mark it unavailable, and prevent checkout until removed or availability recovers.

### Acceptance Criteria

- Given a quantity of one, when minus would cross the lower bound, then the user is directed to Remove or the control is disabled.
- Given any quantity changes, when the cart updates, then line total, subtotal, total, and item count are consistent.
- Given an empty cart, when Cart opens, then checkout is unavailable and a route back to salads is provided.

## Checkout

### Goal

Collect valid delivery and payment choices with minimal effort and submit exactly one order.

### Content

1. “Delivery Details” heading
2. Apartment selector
3. Block selector populated from the selected apartment
4. Flat number
5. Delivery-slot radio group
6. Payment-method radio group
7. Order total summary
8. Place Order

### Form Behavior

- Persistent labels are used; placeholders do not replace labels.
- Fields validate on blur and on submission without showing errors before meaningful interaction.
- On invalid submission, focus moves to the error summary or first invalid field.
- Submit enters a busy/disabled state and cannot create duplicate orders.
- On recoverable submission failure, all values and cart items remain.
- Apartment and slots load asynchronously with explicit loading/error states.
- Changing apartment clears any now-invalid block and delivery-slot selections.
- A price-change conflict refreshes cart prices, identifies what changed, and requires explicit review before a new submission.

### Responsive Behavior

- Compact: one-column form and full-width submit action.
- Medium+: block and flat number may share a row; slot choices remain large touch targets.
- Large: form and order summary may form two columns, with summary remaining visible while scrolling.

### Payment Copy

- Cash: “Pay when your order is delivered.”
- UPI: initial mock selection must state that no real payment is taken in the frontend-only phase.

## Order Confirmation

### Goal

Reassure the customer that the order was accepted and explain what happens next.

### Content

- Success icon with accompanying text
- “Order Placed Successfully!”
- Delivery slot
- Order ID
- Total
- View Orders primary action
- Back to Home secondary action

### Behavior

- Reopening a confirmation URL uses the order ID to load the order; sensitive or complete order data is not passed in a query string.
- Direct access to a missing/unknown order displays a not-found or recoverable error state.
- Success is announced once without repetitive live-region output.

## Orders

### Goal

Show active fulfillment clearly and make previous purchases easy to review.

### List

- Current orders appear before previous orders.
- Each card shows order ID, date, total, delivery slot, item summary, and text status badge.
- Status groups:
  - Current: placed through out for delivery
  - Previous: delivered or cancelled
- Filters may be introduced when enough orders exist; they are not mandatory for the first customer implementation.
- The first page loads initially; a visible Load More action appears when additional pages exist.

### Details

- Status, date, slot, delivery address, item snapshots, price breakdown, payment method, and order ID
- A simple ordered status progression may be shown, but cancelled orders must not imply continued progress

### Responsive Behavior

- Compact: stacked cards and detail sections.
- Medium+: denser card metadata with clean wrapping.
- Large: list/detail patterns may use wider columns, but each route remains independently navigable.

### States

- Loading, no orders, failed load with retry, and order not found.
- Empty action routes to Home.

## Profile

### Goal

Provide identity, delivery preferences, and session actions without storing sensitive data unnecessarily.

### Content

- Name and contact details supported by auth
- Default apartment/block/flat when available
- Edit controls in a validated form
- Logout
- Before Phase 8, a guest-state explanation and Login/Signup actions replace authenticated details.
- From Phase 8 onward, checkout and order routes require login; successful mock login/signup retains same-session guest orders by attaching them to the user.

### Responsive Behavior

- Compact: stacked sections and full-width primary controls.
- Medium/large: constrained form width; avoid stretching fields across the screen.

## Admin Dashboard

### Goal

Give operators a rapid view of today's fulfillment and direct access to work.

### Content

- Clearly labeled Admin header/navigation
- Metric cards: today's orders, today's sales, pending, delivered, available salads
- Recent or actionable orders
- Links to Manage Salads and Manage Orders

### Responsive Behavior

- Compact: metric cards in one or two columns depending on available width; tables transform into cards or horizontally contained data views with explicit affordances.
- Medium: two-to-three-column metric grid.
- Large: persistent admin navigation and four/five-column metric grid where readable.

### Authentication and Forbidden Screens

- The authentication shell uses minimal brand chrome, no customer bottom navigation, and a clear Back to Home link.
- Login and Signup preserve a validated internal return destination.
- Authenticated non-admin users who request admin routes see a dedicated Forbidden page with an explanation and Back to Home action.

### Admin Salad Management

- List/card view exposes availability, price, and edit action.
- Create/edit form supports name, description, price, ingredients, image metadata, and availability state.
- Destructive actions require clear confirmation. Marking unavailable is preferred over delete for existing ordered products.

### Admin Order Management

- Filter by status and relevant date.
- Rows/cards expose ID, customer name/phone when available, destination summary, slot, total, and status.
- Detail view supports only valid status transitions and confirms consequential cancellation.
- Loading, empty filters, errors, and update-in-progress states are explicit.

## Accessibility Requirements

- Landmarks include header, navigation, main, and footer where present.
- Mobile and desktop navigation expose the same destination names and active-page semantics.
- Icon-only controls have accessible labels; decorative icons are hidden from assistive technology.
- Radio groups use fieldsets and legends.
- Form errors are text, linked to controls, and not communicated by color alone.
- Price is readable in context; screen-reader text clarifies totals where visual grouping is insufficient.
- Cards do not contain invalid nested interactive elements.
- Fixed navigation and sticky actions do not obscure focused elements.

## Content Guidelines

- Use short, direct language: “Add to cart”, “Place order”, “Try again”.
- Use sentence case in UI.
- Avoid blame in errors.
- Format currency using the Indian locale and INR.
- Format dates/times consistently and clarify day when a slot could be ambiguous.
- Product and ingredient content comes from data sources, not templates.

## UX Out of Scope

- Loyalty, subscriptions, reviews, promotions, nutritional calculations, live maps, chat, social sharing, and multi-language UI
- Real payment-gateway screens
- Final production imagery and brand identity package
