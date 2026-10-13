# Deployment guide

## Before deploying

1. Provision a MySQL database and run `database/schema.sql` with a database administrator account. For an existing database, take a backup and run `database/migrate_accounts_and_chat.sql` once. The application account should have access only to this database and the data operations it needs.
2. Configure the hosting provider with `NODE_ENV=production`, `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`.
3. Set `SESSION_SECRET` to a unique random secret of at least 32 characters. Do not reuse the example value.
4. Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 16 characters to provision the first administrator. Store these as host secrets, not in source control.
5. Install dependencies and build the frontend with `npm ci` and `npm run build`.
6. Start the service with `npm run start:prod`. Express serves the compiled client and `/api` from the same host; configure the hosting provider's health check to use `/api/db-status`.
7. Put the service behind HTTPS. The session cookie is marked `Secure` in production.

After installing the schema, grant the application database account only the `SELECT`, `INSERT`, `UPDATE`, and `DELETE` access it needs on `smart_campus_db`. It also needs to update the provisioned administrator account at startup.

## Roles and access

- Students can register, sign in, submit item reports and claim requests, and start private conversations about reports.
- Administrators can manage categories and item statuses, edit/remove reports, review claims, and inspect activity logs.
- A student can read only their own private conversation with a report owner. A report owner can read conversations attached to their report.
- Public item listings omit admission numbers and contact details. The reporter's display name remains visible.

## Data and operations

- Do not enable the in-memory development fallback in production. Production startup fails if MySQL is unavailable.
- Back up the MySQL database regularly and verify that backups can be restored.
- Apply schema changes before deploying code that depends on them. The production server checks connectivity but does not run schema creation or migrations.
- Older reports do not have an owner account linked automatically. Private chat is available on reports created after this update; assign legacy reports to accounts through a reviewed data migration if messaging is needed for them.
- Keep demo seed records out of a real campus rollout, or replace them with campus-approved sample data before the first deployment.
- Configure logging and monitoring through the hosting provider. Avoid logging passwords, session cookies, ownership proof, or private message contents.

## Important limitation

The administrator role is bootstrapped from deployment secrets. For a public campus launch, connect registration to an institution-approved identity provider or verify student email addresses before allowing accounts to participate.
