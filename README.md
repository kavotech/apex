# apexautocaremcr

Static website for car washing, valeting and vehicle detailing in Manchester, UK. Phone: +44 7414 505029. Email: apexautocaremcr@gmail.com. Production domain: https://www.apexautocaremcr.co.uk.

## Project

- site/: Home, About, Services, Gallery, Contact, Privacy and 404 pages.
- site/assets/css/: Original Webflow styles, apex.css, apex-ui.css and Swiper styles.
- site/assets/js/: Webflow, GSAP and Swiper runtimes, before/after slider, apex.js (gallery and form), apex-ui.js (drawer, consent and motion).
- site/assets/js/site-config.js and analytics.js: optional GA4 configuration and consent integration.
- api/contact.js: Vercel booking enquiry endpoint.
- vercel.json: Existing clean URLs, redirects, headers and static output configuration.

There is no framework build or package installation. Vercel serves site directly. Preserve responsive classes and animation hooks when editing. Run `node scripts/check-site.mjs` and `node scripts/check-analytics.mjs` to check metadata, local references, JavaScript syntax and analytics consent behavior.

## Booking email setup

Set RESEND_API_KEY in Vercel's production environment, then redeploy. The default sender is `Apex Auto Care MCR <no-reply@apexautocaremcr.co.uk>` and the admin recipient is `apexautocaremcr@gmail.com`. Verify `apexautocaremcr.co.uk` in Resend with its required DNS records. Optional CONTACT_FROM_EMAIL and CONTACT_TO_EMAIL variables override these defaults; remove any inherited settings for a different business. Customer email is used as Reply-To, so replying to an enquiry reaches the customer. The key stays server-side and must never be committed.

If the key is missing, the endpoint returns 503; if Resend rejects or times out, it returns 502. In either case the page offers a pre-filled WhatsApp message and direct phone link. An enquiry does not confirm a booking. Run `node scripts/check-contact.cjs` for mocked email, validation and failure-path checks without sending mail. A successful API response means Resend accepted the email; delivery is checked separately in Resend's dashboard or the recipient inbox.

## Information still needed

- Both production hostnames are connected; non-www redirects to www.
- A Google Analytics measurement ID and Google Search Console domain verification, if analytics and search reporting are wanted.
- Business address and any confirmed social profile URLs.
- Approved customer testimonials. The existing review section is retained without inherited endorsements.

Cleaning packages start at £30, £50 and £100 depending on vehicle size. Maintenance is available after a Full Deep Detail (Full Deep Clean): bi-weekly maintenance £60–£80 or monthly maintenance £80–£100.

## Cookie consent

The consent panel retains Accept all, Reject non-essential and Customise controls. The pg_consent cookie and localStorage preference last 180 days. No analytics or marketing scripts are currently loaded. Cookie Settings in the footer reopens the panel. The existing PGConsent interface and CSS class hooks are preserved for compatibility.

## Gallery

The gallery uses supplied vehicle photos, Exterior/Interior filters, a keyboard-accessible lightbox and before/after sliders. Visible photo captions and numbers are removed; descriptive image alt text is retained. The homepage carousel links to the gallery. Social sharing tags use `site/assets/img/apex-whatsapp-glass-v1.jpg`, a 1200 × 628 glass-effect Apex card. The image has an absolute HTTPS URL and explicit Open Graph dimensions and MIME type. Its generation prompt is recorded in `docs/share-image-prompt.md`.

## Domain and search launch

Canonical URLs, Open Graph URLs, unique page descriptions, business/website/page JSON-LD, `robots.txt` and a six-page XML sitemap are set up for `https://www.apexautocaremcr.co.uk`. The 404 page is excluded from the sitemap and marked noindex. No business address, opening hours, reviews or ratings have been invented.

1. Add `apexautocaremcr.co.uk` and `www.apexautocaremcr.co.uk` to the existing Vercel project. Apply the DNS records Vercel provides at the domain registrar and set the non-www domain to redirect to www once both are connected.
2. Confirm the domain serves the site over HTTPS. Check the canonical pages and `/sitemap.xml` on that domain.
3. Add a domain property in Google Search Console and publish its provided DNS verification record. Submit `https://www.apexautocaremcr.co.uk/sitemap.xml` and inspect the homepage. Account verification and submission are separate from publishing the website files.

Reference: [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

### Checking sitemap fetch errors

Run `node scripts/check-crawl.mjs` after deploying. It requests the live sitemap, robots file and every listed page with regular and Googlebot user-agents, checks status codes, content types, canonicals and indexing directives, and verifies the old Vercel/non-www redirects. This does not impersonate Google's network or confirm indexing.

Submit `https://www.apexautocaremcr.co.uk/sitemap.xml` under the Search Console domain property `apexautocaremcr.co.uk` or URL-prefix property `https://www.apexautocaremcr.co.uk/`. An old `apexmcr.vercel.app` property is not the production domain's property. The old Vercel host now permanently redirects to the corresponding production URL. If a fetch error remains, inspect the exact reported URL, error and last attempt time, run URL Inspection's live test on an affected page, and inspect Vercel firewall logs for the failed Google request. Passing public HTTP checks alone does not establish that Google's fetch succeeded.

## Google Analytics activation

Tracking is disabled because `googleAnalyticsId` in `site/assets/js/site-config.js` is empty. To activate it, create a GA4 web data stream for the production domain and enter its real `G-...` measurement ID. Update the privacy policy and cookie panel's current-tool disclosure to describe the enabled service before publishing, and bump the configuration script's query version across the HTML pages.

The integration uses basic consent mode. Google scripts load only when analytics consent is allowed. Rejecting optional cookies loads no Google analytics script; revoking consent updates Google's consent state and disables further Analytics collection for that property. Advertising storage, advertising user data, advertising personalization and Google signals remain disabled. Test both Accept and Reject choices and confirm the result in Google Tag Assistant before considering setup complete. Do not install a second GA4 tag through Tag Manager for the same property.

Reference: [Google consent setup](https://developers.google.com/tag-platform/security/guides/consent).
