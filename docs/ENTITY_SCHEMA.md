# TomaLink — Entity Schema Reference

Companion to `ERD.mermaid`. Written for the **current phase: MongoDB + Mongoose,
plain JavaScript**. Field types below map directly to Mongoose schema types;
"FK" entries become `{ type: mongoose.Schema.Types.ObjectId, ref: 'ModelName' }`
and are resolved with `.populate()` rather than SQL joins. One-to-many and
many-to-many relationships (ListingImage, Favorite) are modeled as **separate
collections**, not embedded subdocuments/arrays. This will be revisited when the
project migrates to PostgreSQL + TypeORM later.

---

## User
Central identity collection for customers, owners, and admins.

| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK (Mongo default) |
| name | String | required |
| email | String | unique, required |
| phone | String | unique, required |
| password_hash | String | nullable (null for Google-only accounts) |
| google_id | String | nullable, unique |
| avatar_url | String | nullable |
| role | String (enum: customer, owner, admin) | required, default `customer` |
| is_verified | Boolean | default false |
| is_active | Boolean | default true (admin can suspend) |
| two_factor_enabled | Boolean | default false |
| created_at / updated_at | Date | via `{ timestamps: true }` |

**Indexes:** unique on `email`, unique on `phone`, index on `role`.
**Relationships:** 1:1 → OwnerProfile (only when role=owner), 1:1 → Wallet (owner side),
1:M → Booking (as customer), 1:M → Review, 1:M → Notification, 1:M → RefreshToken,
1:M → AuditLog (as admin), M:M → Listing (favorites, via a `favorites` array of
Listing ObjectIds on User, or a separate `Favorite` collection — see note at bottom).

---

## OwnerProfile
Extends a User when they operate a warehouse, cold storage, logistics, or transport service.

| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK |
| user_id | ObjectId | ref `User`, unique (1:1) |
| business_name | String | required |
| service_type | String (enum: warehouse, cold_storage, logistics, transport) | required |
| is_verified_owner | Boolean | default false — admin must verify before listings go live |
| created_at | Date | |

**Business rule:** a Listing cannot be published (`is_available = true`) unless the
owning `OwnerProfile.is_verified_owner = true`.

---

## Listing
A bookable unit: a cold storage slot, warehouse space, or a logistics/transport offering.

| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK |
| owner_id | ObjectId | ref `OwnerProfile` |
| type | String (enum: warehouse, cold_storage, logistics, transport) | required |
| brand_name | String | required |
| description | String | |
| address | String | required |
| gps_lat / gps_lng | Number | nullable (bonus: enables "nearest to me") |
| daily_price | Number | required, >= 0 |
| capacity | Number | nullable (relevant for storage types) |
| vehicle_type | String | nullable (relevant for logistics/transport) |
| is_available | Boolean | default true |
| is_paused | Boolean | default false — owner can pause without deleting |
| is_deleted | Boolean | default false — soft delete |
| created_at / updated_at | Date | via `{ timestamps: true }` |

**Indexes:** compound index on `{ type: 1, is_available: 1, is_paused: 1 }` for
search/filter. For geo queries, store `location: { type: 'Point', coordinates:
[lng, lat] }` and add a `2dsphere` index instead of plain lat/lng numbers if you
want `$near` queries.
**Relationships:** 1:M → ListingImage, 1:M → Booking, 1:M → Review, M:M ← User (favorites).

---

## ListingImage
Separate collection (not embedded) — one Listing has many ListingImage documents.

| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK |
| listing_id | ObjectId | ref `Listing` |
| url | String | required (Cloudinary URL) |
| sort_order | Number | default 0 |

**Index:** on `listing_id` for fast lookup of all images belonging to a listing.

---

## Booking
Core transactional entity tying a customer to a listing over a date/quantity range.

| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK |
| customer_id | ObjectId | ref `User` |
| listing_id | ObjectId | ref `Listing` |
| status | String (enum: pending, awaiting_payment, paid, active, completed, cancelled) | required, default `pending` |
| quantity | Number | required |
| start_date / end_date | Date | required |
| total_price | Number | required |
| cancellation_reason | String | nullable |
| created_at / updated_at | Date | via `{ timestamps: true }` |

**Indexes:** compound index on `{ listing_id: 1, start_date: 1, end_date: 1 }` —
this is what you query against to detect overlapping bookings and prevent
double-booking.
**Concurrency rule:** the availability check + booking insert must happen atomically.
MongoDB doesn't have exclusion constraints like Postgres, so use a **Mongo
transaction** (`session.startTransaction()`, requires a replica set) wrapping the
overlap check and the insert, or a `findOneAndUpdate` with an atomic condition
against the listing's availability — checking availability and then inserting as
two separate unguarded steps is a race condition.
**Relationships:** 1:1 → Payment, 1:1 → Shipment, 0:1 → Review.

---

## Payment
| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK |
| booking_id | ObjectId | ref `Booking`, unique |
| provider | String | e.g. `paystack` |
| reference | String | unique — Paystack transaction reference |
| amount | Number | required |
| status | String (enum: initialized, success, failed) | default `initialized` |
| verified_at | Date | nullable — set only after server-side verification |
| created_at | Date | |

**Rule:** `status` only becomes `success` after your server calls Paystack's verify
endpoint (or validates the webhook signature) — never from a client-submitted flag.

---

## Wallet
One per Owner. Holds funds pending settlement and funds available to withdraw.

| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK |
| owner_id | ObjectId | ref `OwnerProfile`, unique (1:1) |
| pending_balance | Number | default 0, >= 0 |
| available_balance | Number | default 0, >= 0 |
| updated_at | Date | |

**Relationships:** 1:M → WalletTransaction, 1:M → Withdrawal (funding source).

---

## WalletTransaction
Immutable ledger — never update or delete a document, always insert a new one.

| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK |
| wallet_id | ObjectId | ref `Wallet` |
| related_booking_id | ObjectId | ref `Booking`, nullable |
| type | String (enum: credit, debit, commission) | required |
| amount | Number | required |
| description | String | |
| created_at | Date | |

---

## BankAccount
| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK |
| owner_id | ObjectId | ref `OwnerProfile` |
| bank_name | String | required |
| account_number | String | required |
| account_name | String | required — should match Paystack resolve-account result |
| is_validated | Boolean | default false |
| created_at | Date | |

---

## Withdrawal
| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK |
| owner_id | ObjectId | ref `OwnerProfile` |
| wallet_id | ObjectId | ref `Wallet` |
| bank_account_id | ObjectId | ref `BankAccount` |
| amount | Number | required, <= wallet.available_balance at request time |
| status | String (enum: pending, approved, rejected, paid) | default `pending` |
| requested_at / processed_at | Date | |

**Concurrency rule:** debiting `available_balance` and creating the Withdrawal
document must happen atomically — use a Mongo transaction, or an atomic
`findOneAndUpdate` on the Wallet with a condition like `available_balance: { $gte:
amount }` so two simultaneous withdrawal requests can't both succeed against a
stale balance.

---

## Review
| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK |
| booking_id | ObjectId | ref `Booking`, unique — only one review per completed booking |
| customer_id | ObjectId | ref `User` |
| listing_id | ObjectId | ref `Listing` |
| rating | Number | required, 1–5 |
| comment | String | nullable |
| created_at / updated_at | Date | via `{ timestamps: true }` |

**Rule:** enforced at the service layer — a review can only be created when the
related Booking.status = `completed`.

---

## Shipment
Tracks a booking's delivery lifecycle (relevant for logistics/transport listings).

| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK |
| booking_id | ObjectId | ref `Booking`, unique |
| status | String (enum: pending, picked_up, in_transit, arriving, delivered) | default `pending` |
| current_lat / current_lng | Number | nullable |
| driver_name / driver_phone | String | nullable |
| updated_at | Date | |

---

## Notification
| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK |
| user_id | ObjectId | ref `User` |
| type | String (enum: booking, payment, withdrawal, system) | required |
| message | String | required |
| is_read | Boolean | default false |
| created_at | Date | |

---

## RefreshToken
| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK |
| user_id | ObjectId | ref `User` |
| token_hash | String | required — store a hash, never the raw token |
| revoked | Boolean | default false |
| expires_at | Date | required — pair with a Mongo TTL index to auto-expire |
| created_at | Date | |

---

## AuditLog
| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK |
| admin_id | ObjectId | ref `User` |
| action | String | e.g. `withdrawal.approved`, `user.suspended` |
| target_type | String | e.g. `User`, `Withdrawal`, `Listing` |
| target_id | ObjectId | |
| metadata | Mixed / Object | nullable — extra context (old/new values) |
| created_at | Date | |

---

## Favorite (Many-to-Many: User ↔ Listing)
Separate collection — the join table for the User↔Listing many-to-many relationship.

| Field | Type | Constraints |
|---|---|---|
| _id | ObjectId | PK |
| user_id | ObjectId | ref `User` |
| listing_id | ObjectId | ref `Listing` |
| created_at | Date | |

**Index:** compound unique index on `{ user_id: 1, listing_id: 1 }` — a user can
favorite a listing only once. Also index `listing_id` alone for "who favorited this
listing" queries.
