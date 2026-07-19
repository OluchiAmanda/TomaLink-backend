# TomaLink — Backend

Backend API for TomaLink, a platform connecting Nigerian tomato farmers, traders,
cold storage providers, warehouses, logistics companies, and buyers — reducing
post-harvest losses through cold storage booking, refrigerated logistics scheduling,
a verified-buyer marketplace, and real-time shipment tracking.

This repository contains **only the backend**. The frontend is a separate
repository maintained independently.

## Tech Stack

- **Runtime:** Node.js + Express.js (plain JavaScript)
- **Database:** MongoDB + Mongoose (current phase) → will migrate to PostgreSQL + TypeORM later
- **Auth:** JWT (access + refresh tokens), Google OAuth, RBAC
- **Payments:** Paystack (server-side verification + webhooks)
- **Media storage:** Cloudinary
- **Docs/Testing:** Postman

## Project Structure

```
TomaLink-backend/
├── src/
│   ├── app.js            # Express app: middleware, routes, error handling
│   ├── server.js         # Entry point — connects DB, then starts listening
│   ├── controllers/     # Request handlers — parse input, call services, shape response
│   ├── services/        # Business logic — the "how" of each feature
│   ├── repositories/    # Data access layer — DB queries, isolated from business logic
│   ├── entities/        # Mongoose schemas/models (current phase — MongoDB)
│   ├── middlewares/     # Auth guards, RBAC, error handler, rate limiter, etc.
│   ├── routes/          # Express route definitions, grouped by resource
│   ├── validators/      # Request validation schemas (Joi / express-validator)
│   ├── config/          # Env config, DB connection, third-party client setup
│   ├── utils/           # Small reusable helpers (formatting, response wrappers, etc.)
│   ├── interfaces/      # Shared JSDoc typedefs / shape references (no TS, plain JS)
│   ├── types/           # Shared constants/enums (roles, statuses, etc.)
│   ├── subscribers/     # Event listeners (e.g. post-payment side effects)
│   └── database/
│       ├── migrations/  # Unused for now — reserved for future Postgres/TypeORM migration
│       └── seeders/     # Seed scripts for local/dev sample data
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
│   ├── ERD.mermaid          # Entity relationship diagram
│   └── ENTITY_SCHEMA.md     # Field-level schema reference
├── .env.example
├── .gitignore
├── package.json
└── README.md
```


## Environment Variables

See `.env.example` for the full list. At minimum you'll need:

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on |
| `DATABASE_URL` | MongoDB connection string (Postgres URL once migrated) |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `PAYSTACK_SECRET_KEY` | Paystack server-side secret key |
| `CLOUDINARY_URL` | Cloudinary connection string |
| `EMAIL_HOST` / `EMAIL_USER` / `EMAIL_PASS` / `EMAIL_FROM` | SMTP config for verification/reset emails |
| `APP_URL` | This API's own base URL — used to build the email verification link |

## API Documentation

Postman collection: _link goes here once published_
Live API base URL: _link goes here once deployed_

## Database

- Entity relationship diagram: [`docs/ERD.mermaid`](./docs/ERD.mermaid)
- Full field-level schema reference: [`docs/ENTITY_SCHEMA.md`](./docs/ENTITY_SCHEMA.md)


## Status

🚧 In development — see the project roadmap for phase-by-phase progress.
