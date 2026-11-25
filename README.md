# DataVault — Ghana mobile data bundle store

DataVault is a mobile data bundle ordering website for Ghana. Customers can browse available MTN, Telecel, AT and other configured network packages, choose a bundle, enter a recipient mobile number and track an order.

## What's included
- Responsive fintech-style landing page and customer dashboard
- Live bundle catalogue read from Neon PostgreSQL — no seeded demo plans or fake prices
- Customer registration and login with bcrypt password hashing and signed HTTP-only session cookies
- Admin-only bundle plan creation and activation/deactivation
- Ghana mobile number validation for bundle orders
- Customer order history
- Admin order queue and fulfilment status management
- Express API security headers, rate limiting and parameterised SQL

## Technology
- HTML5, CSS3, vanilla JavaScript and Font Awesome 6
- Node.js 20+ and Express
- Neon PostgreSQL using the pg driver
- bcryptjs, jsonwebtoken, cookie-parser, Helmet and express-rate-limit

## Local setup
1. Create a Neon project and copy its pooled PostgreSQL connection string.
2. Copy `.env.example` to `.env`; set `DATABASE_URL` and a strong `JWT_SECRET`.
3. Set `ADMIN_EMAILS` to the email address(es) that should have store administrator access.
4. Install packages with `npm install`.
5. Run `npm run db:migrate` to create the mobile bundle tables.
6. Run `npm run dev` and open `http://localhost:3000`.

Never commit `.env`, database credentials, supplier API keys or payment secrets.

## Environment variables
- `DATABASE_URL`: Neon pooled connection string.
- `JWT_SECRET`: long random secret for signed sessions.
- `NODE_ENV`: set to `production` in deployment.
- `ADMIN_EMAILS`: comma-separated store administrator email allow-list.
- `PORT`: optional local port.

## Important: live selling requirements
The bundle catalogue starts empty. An administrator must add the actual package names, validity periods and retail prices from the chosen data wholesaler. The site does not invent MTN, Telecel or AT prices.

**The current order flow records orders only. It does not charge customers or automatically deliver mobile data.** Before accepting real customer payments, configure:
1. A legitimate Ghana data wholesaler/aggregator that supports the networks you want to resell and provides a documented API for checking products, pricing and fulfilment.
2. A payment provider that supports your preferred Ghana payment methods, such as Mobile Money and/or cards.
3. Server-side payment verification (never trust a browser success redirect), idempotent order processing, supplier API credentials stored as encrypted environment variables, webhook verification, transaction reconciliation, retries and customer support/refund handling.

The current admin status controls are for order operations and manual testing only. Do not mark orders paid or fulfilled unless payment and delivery have actually been confirmed. The supplier product code field stores the supplier's plan identifier but is not itself an integration.

## Deployment
Connect the repository to Vercel and configure `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production` and `ADMIN_EMAILS` as encrypted environment variables. Run `npm run db:migrate` against Neon before launch. API routes are served from `api/index.js`.

## Network trademarks
MTN, Telecel and AT are referenced only to identify the mobile networks customers may select. DataVault is an independent reseller concept and should only advertise packages it is authorised to resell.
