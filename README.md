# Smart Campus Lost & Found

A full-stack campus service for reporting lost or found property, searching reports, submitting ownership claims, and communicating privately with the person who reported an item.

## Features

- Student account registration and sign-in with salted password hashes and secure, HTTP-only sessions.
- Administrator account provisioned from environment settings; management actions are checked by the API.
- Create, search, and filter item reports.
- Private, per-report conversations between the reporter and an interested student. Public reports show the reporter's name only; contact details and student IDs are not returned to student browsers.
- Claim requests stay pending until an administrator approves or rejects them. Approval updates the report status to Claimed.
- Relational MySQL storage, audit history, and a local-only temporary fallback for development.
- Production mode serves the built React application and API from the same origin.

## Local setup

1. Install a current Node.js LTS release and MySQL.
2. Copy `.env.example` to `.env` and set your local database connection values.
3. Create and seed the database with `npm run db:init` using a MySQL setup account that can create the database. After setup, use a restricted application account in `.env`.
4. Install packages with `npm install`.
5. Start the React development server and API with `npm start`.
6. Open `http://localhost:5173`.

The local development database fallback is temporary and is not suitable for persistent data. Sign-in, private messaging, and account creation require MySQL.

## Administrator account

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before first startup. If that email does not already exist, the application creates it with the administrator role. Public registration always creates student accounts and cannot assign administrator privileges. Use a unique administrator password of at least 16 characters.

## Production deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for database preparation, required environment values, build/start steps, and operational notes.

## Main files

- `src/` — React user interface
- `server/server.js` — Express API, account access, authorization, and production static hosting
- `server/db.js` — MySQL data access, claim review, and private conversation operations
- `database/schema.sql` — Database schema and initial campus data
- `database/initDb.js` — One-time schema initializer
