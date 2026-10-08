# HealthyBowl Frontend Data Model

## Modeling Conventions

- TypeScript strict mode is required; `any` is prohibited without a documented boundary reason.
- IDs are opaque non-empty strings. UI code must not parse or calculate with them.
- Monetary values are integer paise to avoid floating-point errors. `14900` displays as ₹149.
- Service-boundary timestamps are ISO 8601 strings including UTC `Z` or a timezone offset.
- Domain enums use string literal unions to align with JSON.
- Arrays exposed from state services should be readonly.
- API DTOs are mapped to domain models at repository boundaries rather than consumed directly by templates.
- Validation rules are shared conceptually with the future API, but backend validation remains authoritative.

## Primitive Types

```typescript
export type EntityId = string;
export type IsoDateTime = string;
export type LocalDate = string;
export type MoneyPaise = number;
```

`MoneyPaise` must be a safe, non-negative integer for prices and totals. Refunds or accounting adjustments, if later introduced, require a separate signed model.
`LocalDate` must be a valid calendar date serialized as `YYYY-MM-DD`.

## User

```typescript
export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: EntityId;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  defaultDeliveryAddress: DeliveryAddress | null;
}
```

Constraints:

- `name`: trimmed, 1–100 characters.
- `email`: normalized and syntactically valid, maximum 254 characters.
- `phone`: optional E.164-compatible value; exact regional validation is finalized with authentication.
- Passwords are request-only values and never fields on `User`.

## Authentication Models

```typescript
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationDetails {
  name: string;
  email: string;
  phone: string | null;
  password: string;
}

export interface AuthSession {
  user: User;
  authenticated: boolean;
}

export interface UserProfileUpdate {
  name?: string;
  phone?: string | null;
  defaultDeliveryAddress?: DeliveryAddress | null;
}
```

Token DTOs are transport concerns. Their storage and refresh policy is deferred to the authentication specification and backend security design.

## Apartment

```typescript
export interface Apartment {
  id: EntityId;
  name: string;
  blocks: readonly string[];
  active: boolean;
}
```

Constraints:

- `name`: trimmed, 1–120 characters.
- `blocks`: unique trimmed values, each 1–30 characters.
- Inactive apartments cannot be selected for a new order.

## Salad

```typescript
export interface Salad {
  id: EntityId;
  name: string;
  description: string;
  pricePaise: MoneyPaise;
  image: ProductImage;
  ingredients: readonly string[];
  available: boolean;
}

export interface ProductImage {
  url: string;
  alt: string;
}
```

Constraints:

- `name`: trimmed, 1–120 characters.
- `description`: trimmed, 1–1000 characters.
- `pricePaise`: safe positive integer.
- `ingredients`: one or more unique, trimmed labels; each maximum 80 characters.
- `image.url`: valid local asset path or allowed HTTP(S) URL.
- `image.alt`: concise meaningful text, maximum 180 characters.

Initial mock records use stable IDs such as `protein-power-salad` and `fresh-veggie-bowl`, with prices `14900` and `9900`.

## Cart

```typescript
export interface CartItem {
  salad: Salad;
  quantity: number;
}

export interface Cart {
  items: readonly CartItem[];
  deliveryChargePaise: MoneyPaise;
}
```

Derived values are not duplicated in mutable state:

```typescript
export interface CartTotals {
  itemCount: number;
  subtotalPaise: MoneyPaise;
  deliveryChargePaise: MoneyPaise;
  totalPaise: MoneyPaise;
}
```

Rules:

- At most one `CartItem` exists per salad ID.
- `quantity` is an integer from 1 through 20.
- Only available salads can be newly added.
- Checkout is blocked if a cart line is no longer available.
- Initial delivery charge is `0`, supplied by the cart/pricing service.
- Session persistence stores a versioned minimal snapshot (`saladId`, `quantity`) and rehydrates current product data; it does not persist full stale product records as authority.

## Delivery

```typescript
export interface DeliveryAddress {
  apartmentId: EntityId;
  apartmentName: string;
  block: string;
  flatNumber: string;
}

export interface DeliverySlot {
  id: EntityId;
  startsAt: IsoDateTime;
  endsAt: IsoDateTime;
  available: boolean;
}
```

Rules:

- Address snapshots include `apartmentName` so historical orders remain understandable.
- `block`: selected from the selected apartment's current `blocks` collection.
- `flatNumber`: trimmed, 1–20 characters; accepts common alphanumeric and separator formats.
- A slot end is after its start.
- A slot can be selected only when available and relevant to the selected apartment/date.
- Time-zone display uses the business location configured by the backend; initial mocks use a consistent India time-zone offset.

## Payment

```typescript
export type PaymentMethod = 'CASH' | 'UPI';
export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';
```

For the frontend-only phase:

- Cash orders use `PENDING`.
- Mock UPI selection does not perform payment and also uses `PENDING`.
- The frontend never collects a UPI PIN or stores sensitive payment credentials.

## Order

```typescript
export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  saladId: EntityId;
  name: string;
  image: ProductImage;
  unitPricePaise: MoneyPaise;
  quantity: number;
  lineTotalPaise: MoneyPaise;
}

export interface Order {
  id: EntityId;
  customerId: EntityId | null;
  status: OrderStatus;
  items: readonly OrderItem[];
  deliveryAddress: DeliveryAddress;
  deliverySlot: DeliverySlot;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotalPaise: MoneyPaise;
  deliveryChargePaise: MoneyPaise;
  totalPaise: MoneyPaise;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}
```

Rules:

- Order items are immutable product/price snapshots; later salad edits do not alter old orders.
- `lineTotalPaise` equals unit price multiplied by quantity.
- `subtotalPaise` equals the sum of line totals.
- `totalPaise` equals subtotal plus delivery charge.
- `customerId` is null for the pre-authentication guest mock flow.
- An order has at least one item.
- Status transitions are controlled by business rules, not arbitrary UI assignment.

Allowed forward transitions for the initial admin workflow:

```text
PLACED → CONFIRMED | CANCELLED
CONFIRMED → PREPARING | CANCELLED
PREPARING → OUT_FOR_DELIVERY | CANCELLED
OUT_FOR_DELIVERY → DELIVERED
DELIVERED → no transition
CANCELLED → no transition
```

Backend rules will decide whether cancellation remains allowed at each stage.

## Checkout Models

```typescript
export interface CheckoutDetails {
  apartmentId: EntityId;
  block: string;
  flatNumber: string;
  deliverySlotId: EntityId;
  paymentMethod: PaymentMethod;
}

export interface CreateOrderCommand {
  items: readonly {
    saladId: EntityId;
    quantity: number;
  }[];
  delivery: {
    apartmentId: EntityId;
    block: string;
    flatNumber: string;
    deliverySlotId: EntityId;
  };
  paymentMethod: PaymentMethod;
}
```

The command sends product IDs and quantities, never client-calculated authoritative prices. The repository/backend recalculates availability and totals.

## Admin Models

```typescript
export interface AdminDashboardSummary {
  businessDate: LocalDate;
  todaysOrderCount: number;
  todaysSalesPaise: MoneyPaise;
  pendingOrderCount: number;
  deliveredOrderCount: number;
  availableSaladCount: number;
}

export interface SaladDraft {
  name: string;
  description: string;
  pricePaise: MoneyPaise;
  image: ProductImage;
  ingredients: readonly string[];
  available: boolean;
}

export interface OrderFilters {
  status: OrderStatus | null;
  dateFrom: LocalDate | null;
  dateTo: LocalDate | null;
}

export interface AdminCustomerSummary {
  id: EntityId;
  name: string;
  phone: string | null;
}

export interface AdminOrder extends Order {
  customer: AdminCustomerSummary | null;
}
```

`pendingOrderCount` includes `PLACED`, `CONFIRMED`, `PREPARING`, and `OUT_FOR_DELIVERY`.
`AdminOrder.customer` is null only for retained legacy/guest data; authenticated production orders include the operational customer summary.

## View and Result Models

Repository methods distinguish normal empty results from failures:

```typescript
export interface PageRequest {
  page: number;
  pageSize: number;
}

export interface Page<T> {
  items: readonly T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type AppErrorCode =
  | 'NETWORK'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'UNKNOWN';

export interface AppError {
  code: AppErrorCode;
  conflictCode: string | null;
  message: string;
  fieldErrors: Readonly<Record<string, readonly string[]>>;
  retryable: boolean;
  requestId: string | null;
}
```

Components should not expose raw server stack traces or transport error bodies.
Repository mappers normalize transport codes into `AppErrorCode`; domain-specific `409` codes remain in `conflictCode` so features can handle cases such as price or slot changes.

## Repository Contracts

The following conceptual contracts guide implementation; exact method signatures are finalized with each feature:

```typescript
export interface SaladRepository {
  listCustomerCatalog(): Observable<readonly Salad[]>;
  getById(id: EntityId): Observable<Salad>;
}

export interface ApartmentRepository {
  listActive(): Observable<readonly Apartment[]>;
  listDeliverySlots(
    apartmentId: EntityId,
    date: LocalDate,
  ): Observable<readonly DeliverySlot[]>;
}

export interface OrderRepository {
  create(command: CreateOrderCommand): Observable<Order>;
  listMine(request: PageRequest): Observable<Page<Order>>;
  getMineById(id: EntityId): Observable<Order>;
}

export interface AuthRepository {
  login(credentials: LoginCredentials): Observable<AuthSession>;
  register(details: RegistrationDetails): Observable<AuthSession>;
  requestPasswordReset(email: string): Observable<void>;
  logout(): Observable<void>;
  getCurrentUser(): Observable<User>;
  updateCurrentUser(update: UserProfileUpdate): Observable<User>;
}

export interface AdminDashboardRepository {
  getSummary(date: LocalDate): Observable<AdminDashboardSummary>;
}

export interface AdminSaladRepository {
  list(request: PageRequest, available: boolean | null): Observable<Page<Salad>>;
  create(draft: SaladDraft): Observable<Salad>;
  update(
    id: EntityId,
    update: Readonly<Partial<SaladDraft>>,
  ): Observable<Salad>;
  delete(id: EntityId): Observable<void>;
}

export interface AdminOrderRepository {
  list(
    request: PageRequest,
    filters: OrderFilters,
  ): Observable<Page<AdminOrder>>;
  getById(id: EntityId): Observable<AdminOrder>;
  updateStatus(id: EntityId, status: OrderStatus): Observable<AdminOrder>;
}
```

Admin methods use separate contracts to avoid exposing privileged operations through customer repositories.

`UserProfileUpdate` contains only `name`, `phone`, and `defaultDeliveryAddress` and matches `PATCH /api/auth/me`.

Mock order ownership rules:

- Phases 6–7 create, list, and fetch orders only for the current versioned browser-session guest identity.
- Unknown IDs and IDs owned by another mock identity return not found.
- In Phase 8, successful mock login/signup atomically attaches that session's guest orders to the authenticated mock user.
- From Phase 8 onward, checkout and order access require mock authentication; production APIs require authentication from their introduction.

## Validation Ownership

- Reactive forms provide immediate client feedback.
- Domain services enforce cart and transition invariants.
- Repositories map and validate untrusted transport/storage data.
- The future API revalidates identity, role, product availability, price, apartment, slot, totals, and status transitions.

## Data Model Acceptance Criteria

- Given two cart additions for the same salad ID, when state updates, then one line exists with combined quantity.
- Given an order is created, when a salad price later changes, then the existing order's item snapshot and totals do not change.
- Given malformed persisted cart JSON, when the application starts, then it recovers safely without using invalid values.
- Given a client submits a total, when creating an order, then the total is ignored as authority and recalculated by the repository/backend.
- Given a terminal order status, when an update is requested, then no invalid next status is offered or accepted.
