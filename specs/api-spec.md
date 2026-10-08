# HealthyBowl Future REST API Specification

## Status and Scope

This document defines the planned frontend/backend contract. It does not authorize backend implementation in the current phase. Mock repositories must model these outcomes closely enough that Angular feature code can later switch to HTTP repositories without UI rewrites.

The contract is provisional until Phase 10 backend design, but field names, monetary representation, status values, and error semantics are the current source of truth.

## General Conventions

- Base path: `/api`
- Transport: HTTPS in production
- Media type: `application/json`
- JSON property names: `camelCase`
- IDs: opaque non-empty strings
- Money: non-negative integer paise fields suffixed with `Paise`
- Timestamps: ISO 8601 with UTC `Z` or explicit offset
- Dates without time: `YYYY-MM-DD`
- Authentication: bearer access JWT for protected calls
- Admin authorization: enforced by the API for every `/api/admin/*` endpoint
- Empty collection: `200` with `[]` for documented bare-array endpoints or an empty `items` array for paginated endpoints, never `404`
- Delete success: `204 No Content`
- Validation, authorization, and business rules are always rechecked server-side

## Standard Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields need attention.",
    "fieldErrors": {
      "flatNumber": ["Flat number is required."]
    },
    "requestId": "req_01H..."
  }
}
```

Expected status usage:

- `400 Bad Request`: malformed syntax or parameters
- `401 Unauthorized`: missing, invalid, or expired authentication
- `403 Forbidden`: authenticated but not permitted
- `404 Not Found`: entity does not exist or is not visible to the caller
- `409 Conflict`: stale state, invalid transition, duplicate operation, or unavailable product/slot
- `422 Unprocessable Entity`: valid JSON that fails field/domain validation
- `429 Too Many Requests`: rate limit
- `500 Internal Server Error`: unexpected server fault with no internal details exposed

Error codes are stable machine-readable strings, while messages are safe user-facing defaults. The frontend may map codes to clearer contextual copy.

Repository error mapping:

- Network/transport failure → `AppError.code = NETWORK`
- `401` → `UNAUTHORIZED`
- `403` → `FORBIDDEN`
- `404` → `NOT_FOUND`
- `400` or `422` with `VALIDATION_ERROR` → `VALIDATION`
- `409` → `CONFLICT`, preserving API `error.code` as `AppError.conflictCode`
- Other failures → `UNKNOWN`

`fieldErrors` maps directly when present, `requestId` is retained when present, and `retryable` is set by operation context rather than status code alone. Domain conflict codes include `PRODUCT_UNAVAILABLE`, `PRICE_CHANGED`, `DELIVERY_SLOT_UNAVAILABLE`, `QUANTITY_LIMIT_EXCEEDED`, and `INVALID_STATUS_TRANSITION`.

## Pagination

Collection query defaults:

- `page=1`
- `pageSize=20`
- Maximum `pageSize=100`

Response:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "totalItems": 0,
  "totalPages": 0
}
```

Catalog and apartment endpoints may return a bare array while the expected dataset remains small. Orders use pagination.

## Authentication and Session Security

### Proposed Token Model

- A short-lived access JWT is returned in the response and held in application memory.
- A rotated refresh token is sent as a `Secure`, `HttpOnly`, appropriately scoped cookie and is never readable by Angular.
- `POST /api/auth/refresh` obtains a new access token.
- State-changing cookie-authenticated endpoints require an appropriate CSRF strategy if deployment topology makes them vulnerable.
- Passwords and tokens are never logged or included in URLs.
- Final cookie, CORS, expiry, revocation, and CSRF details require backend threat modeling in Phase 10.

### Register

`POST /api/auth/register`

Request:

```json
{
  "name": "Asha Rao",
  "email": "asha@example.com",
  "phone": "+919876543210",
  "password": "user-provided-password"
}
```

Success: `201 Created`

```json
{
  "user": {
    "id": "usr_123",
    "name": "Asha Rao",
    "email": "asha@example.com",
    "phone": "+919876543210",
    "role": "CUSTOMER",
    "defaultDeliveryAddress": null
  },
  "accessToken": "jwt",
  "expiresInSeconds": 900
}
```

Conflicting email returns `409`. Password policy is finalized in the authentication feature specification and enforced by the API.

### Login

`POST /api/auth/login`

Request:

```json
{
  "email": "asha@example.com",
  "password": "user-provided-password"
}
```

Success: `200 OK` with the same session body as registration. Invalid credentials return a generic `401` without revealing which field was incorrect.

### Refresh

`POST /api/auth/refresh`

Uses the refresh cookie. Success returns a new access token and expiry. Invalid or revoked refresh state returns `401` and clears the cookie where possible.

### Logout

`POST /api/auth/logout`

Revokes the refresh session and clears its cookie. Success: `204 No Content`.

### Forgot Password

`POST /api/auth/forgot-password`

```json
{
  "email": "asha@example.com"
}
```

Always returns `202 Accepted` with generic wording to avoid account enumeration. Reset-token completion is defined when backend authentication is implemented.

### Current User

- `GET /api/auth/me` → `200` with `User`
- `PATCH /api/auth/me` → updates allowed profile/default-address fields and returns `200` with `User`

`PATCH /api/auth/me` accepts any subset of `name`, `phone`, and `defaultDeliveryAddress`. No role, ID, email, password, or token field is patchable through this endpoint. `defaultDeliveryAddress`, when non-null, uses the `DeliveryAddress` shape and is revalidated against active apartment/block data.

## Catalog

### List Salads

`GET /api/salads`

Success: `200 OK`

```json
[
  {
    "id": "protein-power-salad",
    "name": "Protein Power Salad",
    "description": "A satisfying fresh salad with paneer.",
    "pricePaise": 14900,
    "image": {
      "url": "/assets/images/protein-power-salad.webp",
      "alt": "Protein Power Salad with paneer and fresh vegetables"
    },
    "ingredients": [
      "Paneer",
      "Lettuce",
      "Cucumber",
      "Carrot",
      "Sweet corn",
      "Healthy dressing"
    ],
    "available": true
  }
]
```

The default customer catalog includes all of today's customer-visible products with availability flags, allowing unavailable cards to remain identifiable. Optional `available=true` filters to addable products; `available=false` filters to currently unavailable visible products. Unknown filters return `400`.

### Get Salad

`GET /api/salads/{saladId}`

- `200` with `Salad`
- `404` if absent or not customer-visible

## Apartments and Delivery Slots

### List Apartments

`GET /api/apartments`

Returns `200` with active apartments:

```json
[
  {
    "id": "apt_sunshine",
    "name": "Sunshine Apartments",
    "blocks": ["A", "B", "C"],
    "active": true
  }
]
```

### List Delivery Slots

`GET /api/apartments/{apartmentId}/delivery-slots?date=2026-09-29`

Returns `200`:

```json
[
  {
    "id": "slot_1230",
    "startsAt": "2026-09-29T12:30:00+05:30",
    "endsAt": "2026-09-29T13:00:00+05:30",
    "available": true
  }
]
```

- `404` for unknown/inactive apartment
- `400` for missing, malformed, or unsupported `date`

`date` is required and is a `YYYY-MM-DD` date in the configured business timezone. The initial UI requests only the current business date. Slot availability is advisory until order creation succeeds.

## Orders

Future production order endpoints require customer authentication. The guest behavior in frontend Phases 6–7 is mock-session-only and does not imply anonymous production ordering.

### Create Order

`POST /api/orders`

Required header:

```text
Idempotency-Key: client-generated-unique-value
```

Request:

```json
{
  "items": [
    {
      "saladId": "protein-power-salad",
      "quantity": 1
    }
  ],
  "delivery": {
    "apartmentId": "apt_sunshine",
    "block": "B",
    "flatNumber": "504",
    "deliverySlotId": "slot_1230"
  },
  "paymentMethod": "CASH"
}
```

The client does not submit authoritative prices or totals. The server validates products, current prices, availability, quantity limits, apartment membership of the selected block, address, slot, payment method, and customer identity in one transaction.

Success: `201 Created`, with `Location: /api/orders/{orderId}` and an `Order` body:

```json
{
  "id": "SAL1024",
  "customerId": "usr_123",
  "status": "PLACED",
  "items": [
    {
      "saladId": "protein-power-salad",
      "name": "Protein Power Salad",
      "image": {
        "url": "/assets/images/protein-power-salad.webp",
        "alt": "Protein Power Salad with paneer and fresh vegetables"
      },
      "unitPricePaise": 14900,
      "quantity": 1,
      "lineTotalPaise": 14900
    }
  ],
  "deliveryAddress": {
    "apartmentId": "apt_sunshine",
    "apartmentName": "Sunshine Apartments",
    "block": "B",
    "flatNumber": "504"
  },
  "deliverySlot": {
    "id": "slot_1230",
    "startsAt": "2026-09-29T12:30:00+05:30",
    "endsAt": "2026-09-29T13:00:00+05:30",
    "available": true
  },
  "paymentMethod": "CASH",
  "paymentStatus": "PENDING",
  "subtotalPaise": 14900,
  "deliveryChargePaise": 0,
  "totalPaise": 14900,
  "createdAt": "2026-09-29T06:40:00Z",
  "updatedAt": "2026-09-29T06:40:00Z"
}
```

The order snapshot may return the selected slot with `available: true` because it was valid at booking time; historical display must not treat this field as current capacity.

Conflicts return `409` with specific codes such as:

- `PRODUCT_UNAVAILABLE`
- `PRICE_CHANGED`
- `DELIVERY_SLOT_UNAVAILABLE`
- `QUANTITY_LIMIT_EXCEEDED`

For `PRICE_CHANGED`, the frontend refetches the customer catalog, refreshes affected cart lines, identifies the change, and requires review before a new submission with a new idempotency key. Reuse of an idempotency key with the same payload returns the original result; reuse with a different payload returns `409`.

### List My Orders

`GET /api/orders?page=1&pageSize=20&status=PREPARING`

Returns a paginated `Order` collection. Status is optional and validated against `OrderStatus`. Results sort newest first unless a future explicit sort parameter is added.

### Get My Order

`GET /api/orders/{orderId}`

- `200` with the caller's order
- `404` when absent or owned by another user, preventing ownership disclosure

## Admin Dashboard

`GET /api/admin/dashboard?date=2026-09-29`

Returns:

```json
{
  "businessDate": "2026-09-29",
  "todaysOrderCount": 24,
  "todaysSalesPaise": 312600,
  "pendingOrderCount": 7,
  "deliveredOrderCount": 17,
  "availableSaladCount": 2
}
```

The backend defines the business timezone and status aggregation consistently with `data-model.md`.

## Admin Salads

### List

`GET /api/admin/salads?page=1&pageSize=20`

With no availability filter, returns a paginated collection including available and unavailable products. Optional `available=true|false` filters the result.

### Create

`POST /api/admin/salads`

Request uses `SaladDraft` fields. Success: `201` with created `Salad` and a `Location` header.

### Update

`PATCH /api/admin/salads/{saladId}`

Accepts a partial `SaladDraft`. Omitted properties remain unchanged; explicit `null` is rejected unless a field is documented nullable. Success: `200` with updated `Salad`.

Concurrency control should use an entity version or ETag finalized in backend design; stale updates return `409`.

### Delete

`DELETE /api/admin/salads/{saladId}`

- `204` only when hard deletion is allowed
- `409` when order history references the salad or business rules require retention

Normal removal from sale should use `PATCH` with `available: false`, preserving order history.

## Admin Orders

### List

`GET /api/admin/orders?page=1&pageSize=20&status=PREPARING&dateFrom=2026-09-29&dateTo=2026-09-29`

Returns paginated orders. Date filtering uses the configured business timezone.

### Get

`GET /api/admin/orders/{orderId}`

Admin list and detail responses use `AdminOrder`: all `Order` fields plus an operational customer summary:

```json
{
  "customer": {
    "id": "usr_123",
    "name": "Asha Rao",
    "phone": "+919876543210"
  }
}
```

The snippet above shows the additional property, not the full response. `customer` may be `null` only for retained legacy/guest records. Returns `200` with complete operational data allowed for the admin role.

### Update Status

`PATCH /api/admin/orders/{orderId}/status`

```json
{
  "status": "PREPARING"
}
```

- `200` with updated `AdminOrder`, preserving the operational customer summary
- `409 INVALID_STATUS_TRANSITION` for transitions not allowed by `data-model.md`
- `404` for unknown order

The API records actor and timestamp in an audit log even though audit-log UI is not in the MVP.

## HTTP Repository Behavior

- Angular repositories map DTOs into the domain models in `data-model.md`.
- `401` triggers one coordinated refresh attempt when appropriate, never an infinite retry loop.
- Reads are not retried automatically without a deliberate policy; UI exposes explicit retry.
- Order creation is never blindly retried unless the same idempotency key is reused.
- Cancellation through component destruction prevents stale UI updates but does not assume the server aborted a request.
- Request IDs from errors may be shown in support-oriented details without exposing internals.

## API Acceptance Criteria

- Given a client-created order total, when an order is submitted, then the server ignores it and calculates totals from current catalog data.
- Given an unavailable product or slot, when order creation is attempted, then no partial order is created and a machine-readable `409` is returned.
- Given a user requests another user's order, when authorization is evaluated, then no order data or ownership existence is disclosed.
- Given a non-admin calls an admin endpoint, when authorization is evaluated, then the API returns `403`.
- Given an invalid admin status transition, when the update is requested, then the order remains unchanged and `409 INVALID_STATUS_TRANSITION` is returned.
- Given a repeated create request with the same idempotency key and payload, when the first request succeeded, then the original result is returned without a duplicate order.

## Deferred Backend Decisions

- Framework modules, database schema, migrations, hosting, observability, rate limits, and backup policy
- Exact JWT signing, expiry, key rotation, refresh revocation, cookie, CORS, and CSRF settings
- Image upload/storage contract; initial admin drafts use an image URL/metadata
- Real UPI/payment-provider endpoints, callbacks, signatures, reconciliation, and refunds
- Notification and password-reset completion endpoints
- API versioning policy before first production release
