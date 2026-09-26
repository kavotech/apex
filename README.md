# Apex Care Manchester

Static website for car washing, valeting and vehicle detailing in Manchester, UK. Phone: +44 7414 505029.

## Project

- site/: Home, About, Services, Gallery, Contact, Privacy and 404 pages.
- site/assets/css/: Original Webflow styles, apex.css, apex-ui.css and Swiper styles.
- site/assets/js/: Webflow, GSAP and Swiper runtimes, before/after slider, apex.js (gallery and form), apex-ui.js (drawer, consent and motion).
- api/contact.js: Vercel booking enquiry endpoint.
- vercel.json: Existing clean URLs, redirects, headers and static output configuration.

There is no framework build, package installation or configured lint command. Vercel serves site directly. Preserve responsive classes and animation hooks when editing.

## Booking email setup

Set RESEND_API_KEY, CONTACT_FROM_EMAIL (an Apex verified sender), and CONTACT_TO_EMAIL (the Apex booking recipient) in Vercel, then redeploy. Replace any inherited deployment email settings with Apex's configuration. No sender or recipient address is assumed.

If any setting is missing, the endpoint returns 503 and the page offers a pre-filled WhatsApp message and direct phone link. An enquiry does not confirm a booking.

## Information still needed

- Apex photos, logo, favicon and social sharing image. All image files and source references are retained temporarily; gallery previews do not claim to show Apex work. The inline wordmark uses text.
- Confirmed production domain: add absolute canonical URLs, Open Graph URLs/images and sitemap entries, then advertise the sitemap in robots.txt. No domain is invented.
- Booking email configuration, business address and any confirmed social profile URLs.
- Approved customer testimonials. The existing review section is retained without inherited endorsements.

Cleaning packages start at £30, £50 and £100 depending on vehicle size. Maintenance is available after a Full Deep Detail (Full Deep Clean): every 2 weeks £60–£80 or every 4 weeks £80–£100.

## Cookie consent

The consent panel retains Accept all, Reject non-essential and Customise controls. The pg_consent cookie and localStorage preference last 180 days. No analytics or marketing scripts are currently loaded. Cookie Settings in the footer reopens the panel. The existing PGConsent interface and CSS class hooks are preserved for compatibility.

## Gallery

Filters, lightbox, carousel and before/after sliders are preserved. Temporary filter groups are preview-1 through preview-6. Replace these labels and assign relevant categories when Apex photos arrive.
