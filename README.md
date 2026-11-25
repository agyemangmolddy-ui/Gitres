# DataVault — Ghana mobile data bundle store

DataVault is a mobile data bundle ordering website for Ghana. Customers can browse available MTN, Telecel, AT and other configured network packages, choose a bundle, enter a recipient mobile number and track an order.

## What's included
- Responsive fintech-style landing page and customer dashboard
- Live bundle catalogue read from Neon PostgreSQL — no seeded demo plans or fake prices
- Customer registration and login with bcrypt password hashing and signed HTTP-only session cookies
- Google sign-in using Google Identity Services and server-side ID-token verification
- Admin-only bundle plan creation and activation/deactivation
- Ghana mobile number validation for bundle orders
- Customer order history and admin order queue
- JSON API error responses, security headers, rate limiting and parameterised SQL

## Technology
- HTML5, CSS3, vanilla JavaScript and Font Awesome 6
- Node.js 20+ and Express
- Neon PostgreSQL using the pg driver
- bcryptjs, google-auth-library, jsonwebtoken, cookie-parser, Helmet and express-rate-limit

## Local setup
1. Create a Neon project and copy its pooled PostgreSQL connection string.
2. Create a Google OAuth 2.0 **Web application** client in Google Cloud Console.
3. Add your local origin (for example `http://localhost:3000`) and your deployed website origin to the OAuth client's authorised JavaScript origins.
4. Copy `.env.example` to `.env`; set `DATABASE_URL`, `JWT_SECRET` and `GOOGLE_CLIENT_ID`.
5. Set `ADMIN_EMAILS` to the email address(es) that should have store administrator access.
6. Install packages with `npm install`.
7. Run `npm run db:migrate` to create or upgrade the database tables.
8. Run `npm run dev` and open `http://localhost:3000`.

Google Identity Services renders the Google-branded button. Its theme, shape, size and button text are configured using Google's supported options; the application styles the surrounding container to match DataVault. The browser sends the returned ID token to `POST /api/auth/google`; the server verifies its signature and audience using `google-auth-library`, checks that the email is verified, and then creates or links the user account. Google users receive the same HTTP-only DataVault session cookie as password users.

Never commit `.env`, database credentials, OAuth client secrets, supplier API keys or payment secrets. The Google client ID is a public identifier, but it must still be configured for the correct website origins.

## Environment variables
- `DATABASE_URL`: Neon pooled connection string.
- `JWT_SECRET`: long random secret for signed sessions.
- `GOOGLE_CLIENT_ID`: OAuth 2.0 Web client ID from Google Cloud Console.
- `NODE_ENV`: set to `production` in deployment.
- `ADMIN_EMAILS`: comma-separated store administrator email allow-list.
- `PORT`: optional local port.

## API error response behaviour
API errors are returned as JSON with an HTTP status and an `error` message. The frontend reads the response body as text first and parses JSON safely, so an HTML/plain-text platform error is shown as a useful message rather than a JSON parsing exception. Check the deployment function logs if the platform itself returns an error page.

## Important: live selling requirements
The bundle catalogue starts empty. An administrator must add the actual package names, validity periods and retail prices from the chosen data wholesaler. The site does not invent MTN, Telecel or AT prices.

**The current order flow records orders only. It does not charge customers or automatically deliver mobile data.** Before accepting real customer payments, configure:
1. A legitimate Ghana data wholesaler/aggregator that supports the networks you want to resell and provides a documented API for checking products, pricing and fulfilment.
2. A payment provider that supports your preferred Ghana payment methods, such as Mobile Money and/or cards.
3. Server-side payment verification (never trust a browser success redirect), idempotent order processing, supplier API credentials stored as encrypted environment variables, webhook verification, transaction reconciliation, retries and customer support/refund handling.

The current admin status controls are for order operations and manual testing only. Do not mark orders paid or fulfilled unless payment and delivery have actually been confirmed. The supplier product code field stores the supplier's plan identifier but is not itself an integration.

## Deployment
Connect the repository to Vercel and configure `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `NODE_ENV=production` and `ADMIN_EMAILS` as environment variables. Add the production domain to the Google OAuth client's authorised JavaScript origins. Run `npm run db:migrate` against Neon before launch.

## Network trademarks
MTN, Telecel and AT are referenced only to identify the mobile networks customers may select. DataVault is an independent reseller concept and should only advertise packages it is authorised to resell.
