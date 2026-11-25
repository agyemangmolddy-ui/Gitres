# DataVault — Responsible Fintech Data Marketplace

DataVault is a responsive data marketplace built with HTML, CSS, JavaScript, Node.js, Express and Neon PostgreSQL.

## What's included
- Public landing page with responsive design and Font Awesome icons
- Live catalogue backed by Neon PostgreSQL (no seeded or mock dataset records)
- Email/password registration and login with bcrypt password hashing
- Signed, HTTP-only authentication cookie
- Buyer and seller account roles
- Seller dataset submission workflow with source, rights and privacy declarations
- New submissions remain pending until an administrator approves them
- Buyer purchase-request records (no payment is charged)
- API rate limiting, security headers and parameterised SQL queries

## Technology
- HTML5, CSS3, vanilla JavaScript
- Node.js 20+, Express
- Neon PostgreSQL using the pg driver
- bcryptjs, jsonwebtoken, cookie-parser, Helmet and express-rate-limit
- Font Awesome 6

## Setup
1. Create a Neon project and copy its pooled connection string.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`.
3. Install dependencies: `npm install`.
4. Create the tables: `npm run db:migrate`.
5. Start the app: `npm run dev`.
6. Open `http://localhost:3000`.

Never commit `.env` or publish your Neon connection string.

## Environment variables
- `DATABASE_URL`: Neon pooled PostgreSQL connection string (required).
- `JWT_SECRET`: long random secret (required).
- `NODE_ENV`: set to `production` in deployment.
- `ADMIN_EMAILS`: comma-separated email addresses allowed to review listings.
- `PORT`: local server port (optional).

## First admin
Register using the email address you intend to administer, then set that exact address in `ADMIN_EMAILS` in the deployment environment. The API resolves the admin role from this server-side allow-list. Never expose this list in frontend code.

## Data and payments
The catalogue starts empty by design. No fictional listings, prices, traffic counts or marketplace statistics are seeded. Sellers submit listing metadata and attest to their right to share the dataset; an administrator must review each listing before publication.

Purchase requests are recorded as pending enquiries only. No card, mobile-money or bank payment is taken, and no file is delivered. A production payment provider, signed download/storage service, seller verification, dispute process, legal review and stronger operational controls must be configured before real transactions. Do not upload or sell identifiable personal or financial records. Use only lawfully sourced, appropriately anonymised or aggregated data with clear permitted-use terms.

## Deployment
Connect this repository to Vercel and add `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production` and `ADMIN_EMAILS` as encrypted environment variables. Run the database migration against Neon before first use. The Vercel API entry point is `api/index.js`.
