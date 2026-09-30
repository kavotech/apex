# Search indexing

Canonical sitemap: https://www.apexautocaremcr.co.uk/sitemap.xml

The six public pages are Home (`/`), About (`/about`), Services (`/services`), Our work (`/gallery`), Contact (`/contact`) and Privacy (`/privacy`). The 404 error page and API endpoints are intentionally excluded.

Every Vercel build now generates the sitemap from the site's HTML pages and checks canonical URLs and local links before deployment. A missing or duplicate canonical stops deployment. Pages explicitly marked `noindex` are excluded. `lastmod` is omitted because a new deployment does not necessarily mean page content changed.

Local commands:

```sh
node scripts/build-sitemap.mjs
node scripts/build-sitemap.mjs --check
node scripts/check-site.mjs
node scripts/check-crawl.mjs
```

The final command checks the live sitemap, robots rules, HTTP status, canonical URLs and redirects. A Googlebot user-agent is only a public-access check; it does not simulate Google's network or establish indexing.

## Search Console findings — 30 September 2026

The verified domain property `apexautocaremcr.co.uk` reports the sitemap as **Success**, last read **29 September 2026**, with **6 discovered pages**. No public HTML pages were missing from the submitted sitemap. The overview indexing report was still processing data. URL Inspection for `/about` showed **Discovered – currently not indexed**, with no crawl yet; this is not a sitemap fetch failure.

Use URL Inspection for a page's current crawl/indexing status and Request indexing for eligible pages. A successful request adds it to Google's queue; it does not guarantee publication or timing. Do not include redirect aliases, error pages, or duplicate `.html` URLs to inflate the sitemap count, or repeatedly submit an unchanged sitemap.

References: [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Requesting a crawl](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).
