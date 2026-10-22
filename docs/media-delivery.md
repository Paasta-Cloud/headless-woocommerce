# Responsive media delivery

Connector 1.2.4 precomputes WebP derivatives on the WordPress host. Originals and native attachment metadata are retained. Only local JPEG, PNG and WebP attachment files inside that site's uploads directory are accepted; images above 25 megapixels are skipped. No public image-conversion endpoint, remote fetcher or new dependency is added.

Widths are 160, 320, 480, 640, 960 and 1280 pixels, plus the source width capped at 1920. Images are never enlarged. Quality is 82, aspect ratio and transparency are retained. Content-versioned paths under `uploads/paasta-optimized/` allow static caching without confusing a replacement image with its predecessor. Do not delete originals or existing derivatives while published pages still reference them.

Public design and Store API product/category responses prefer derivatives only after successful generation. Product image objects receive the matching responsive `srcset`. The storefront also recognizes these generated paths for logos, campaigns, galleries and other configured image URLs. Existing third-party URLs retain their original delivery; missing optimizations never invent filenames. Cart, customer, checkout and management responses are excluded from the rewrite.

New attachment metadata schedules generation through native WP-Cron. A working WP-Cron runner is required; generation is not performed during public image reads. For an existing catalogue, an operator should call `phm_generate($attachment_id)` in small sequential batches as the site's actual runtime user, after checking quota and native WebP support. There is intentionally no unauthenticated bulk-generation API. Failed images retain the original URL and can be retried. Large imports should be processed off-peak; image conversion consumes CPU temporarily, not on every visit.

This reduces image transfer and decoding cost, not all sources of page latency. Re-run PageSpeed after publication. A direct byte comparison is not a new Lighthouse score or field Core Web Vitals measurement.
