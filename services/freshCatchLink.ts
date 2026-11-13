/**
 * Juvay Fresh Catch — the seafood vertical lives on a separate host.
 *
 * Domain choice (2026-11-12):
 *   juvay.app nginx/Caddy only serve juvay.app and www.juvay.app.
 *   There is no freshcatch.juvay.app vhost in deploy configs.
 *   Fresh Catch Traefik is wired to freshcatch.trinibuild.com
 *   (and fresh-catch.trinibuild.com). Use that host. Do not invent a
 *   juvay.app subdomain.
 *
 * Honesty: this module never carries depot, listing, or seller counts.
 * The market shows only what is actually listed on the Fresh Catch app.
 */
export const FRESH_CATCH_APP_URL = 'https://freshcatch.trinibuild.com';
export const FRESH_CATCH_PATH = '/fresh-catch';
export const FRESH_CATCH_TITLE = 'Juvay Fresh Catch';
export const FRESH_CATCH_TAGLINE =
  'Seafood from local fishermen and depots. Only what is actually listed — we do not invent catch, prices, or depot counts.';
export const FRESH_CATCH_DESCRIPTION =
  'Juvay Fresh Catch is a Juvay seafood market. Browse what fishermen and depots have listed today. If nothing is listed, the market is empty. Pay with cash at pickup or cash on delivery. Online Wam checkout is offered when it is set up. We do not take PayPal.';
