# Public cache

Install `wordpress/mu-plugins/khanechin-public-cache.php` in the site's MU plugin directory. No Redis, credentials or public purge API are required.

WordPress caches only anonymous GET product/design responses, for up to 60 seconds. Storage is bounded to 64 collision-safe transient slots, each accepting at most 512 KiB of JSON. Cookies, authorization, cart tokens, nonces, unknown query parameters, errors and Set-Cookie responses bypass caching. WordPress database transients work without a persistent object cache; an existing correctly isolated object cache can also serve them.

Product/variation saves, stock changes, product metadata, taxonomy changes, design/attachment saves/deletes and WooCommerce option changes rotate a public generation. Frontend processes check that generation at most once every three seconds and cache public data for 60 seconds under it. The generation is not a credential and cannot mutate anything. No webhook delivery or replica-local purge is required. Already-open browser pages still need navigation/refresh to display changes.

Without the MU plugin, the frontend retains its original short 10–15 second caches. An unavailable generation endpoint never extends a previous generation. Failed product reads are not cached. Published-design fallback remains available during outages; drafts never enter it.

Cart, checkout, customer accounts, private previews, orders and payments remain uncached. Checkout still checks authoritative price and inventory. Native variation selection remains uncached. This is not full-page caching, and is not a claim of shared frontend cache storage or improved Core Web Vitals.

Custom price, currency, language or membership plugins may introduce additional visitor-dependent product data; do not enable this module for those installations without adding their context to the key or bypassing it. Direct SQL updates bypass WordPress hooks; TTL is a fallback, not a substitute for native CRUD operations. To disable, remove only this MU file; the frontend automatically returns to its legacy cache behavior.
