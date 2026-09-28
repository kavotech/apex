# Daily advertising report

The existing backend uses Resend's REST API. Reports reuse that provider without changing the contact form. No PDF, analytics SDK, database, or paid scheduler is needed. All current figures are prominently marked **Demo / Mock Data**, including the subject, summary, platform sections and plain-text alternative.

## Activation

1. Keep `ADS_REPORTS_ENABLED=false` until the initial test has been confirmed. The default is disabled even when the variable is missing. Preview deployments cannot send daily reports.
2. In Vercel → Apex → Settings → Environment Variables, set Production `RESEND_API_KEY` (already used by the contact form), `CRON_SECRET` (32 random bytes), and `ADS_REPORTS_ENABLED=false`. Keep credentials sensitive and out of Git. `.env.example` lists the variables; local scripts read process environment, not `.env` automatically.
3. Deploy this commit to Production. Check Vercel → Settings → Cron Jobs for `/api/ads-report` at `0 18 * * *`. Vercel sends the `CRON_SECRET` as a Bearer authorization header.
4. Run `node scripts/check-ads-report.cjs` and `node scripts/preview-ads-report.cjs`. These never send mail.
5. Set the local `RESEND_API_KEY` environment variable and run `node scripts/send-ads-report-test.cjs` **once**. Its only recipient is `info@kavotech.uk`; it does not invoke the cron endpoint or read the daily recipient list. Sender: `Apex Auto Care MCR <ads@apexautocaremcr.co.uk>`. Resend must permit sending from this verified domain.
6. Check the test inbox and Resend delivery event. A successful API response means accepted, not necessarily delivered. The local ignored `.local/ads-report-test-receipt.json` records the attempt before network I/O and blocks reruns, including after an ambiguous timeout. Do not delete it to retry without checking Resend. The fixed provider idempotency key adds 24-hour protection, but the local receipt must be retained and the initial test script must not be run on another machine.
7. **After test confirmation**, change Production `ADS_REPORTS_ENABLED=true` and redeploy. Both normal recipients are fixed in `lib/ads-report/config.cjs`: `info@kavotech.uk` and `apexautocaremcr@gmail.com`. No public recipient override exists.

## Time and reliability

Vercel queues the day's report at 18:00 UTC (19:00 BST / 18:00 GMT). Hobby cron may run anywhere in that hour; the job therefore prepares the email ahead of time and passes an exact ISO timestamp to Resend's `scheduled_at`. `Intl` and the IANA **Europe/London** timezone resolve 21:00 to 20:00 UTC in BST or 21:00 UTC in GMT, including transition days. Resend schedules dispatch for that instant; actual inbox arrival depends on mail delivery and cannot be guaranteed to the second.

The endpoint allows preparation only from 18:00 UTC until one minute before that day's target. It never accepts a supplied date, recipient list or test mode. After the cutoff it skips, so late retries cannot create an immediate or historical report. If activation happens after the preparation run, the first automatic report is the next day; an authenticated manual run is safe inside the window.

Daily requests use `Idempotency-Key: apex-ads-report-daily-YYYY-MM-DD`. Resend atomically handles duplicate requests for 24 hours, covering the entire allowed preparation window (at most three hours). Repeated invocations use deterministic data and identical content. A payload change under the same key fails closed instead of sending again. Never change the key to bypass a conflict. Do not add historical replay or extend the window beyond 24 hours without adding a durable send ledger. The test's separate key cannot suppress or trigger a daily report.

Errors log `[ads-report]` with date/mode and provider HTTP status, never credentials or email content. The endpoint returns 502 on provider failure, 503 when cron authentication is unconfigured, 401 on bad authentication and 200 with `disabled`, `outside_window` or `scheduled`. Check Vercel function logs and Resend's scheduled/delivered/bounced events. Vercel does not automatically retry failed cron jobs; rerun an authenticated job within the window after resolving the error. No report is guaranteed during a provider/hosting outage. Disabling the environment flag stops new scheduling; an email already queued must also be cancelled in Resend if necessary.

## Connect real advertising data later

`lib/ads-report/metrics.cjs` is the analytics adapter. Replace `generateDailyAdMetrics(date)` with a provider that returns:

```js
{
  date: 'YYYY-MM-DD', demo: false,
  coverage: 'Describe the actual data window and freshness here.',
  google: { adViews, interactions, websiteVisits, contactActions, calls },
  meta: { adViews, interactions, profileVisits, websiteVisits, contactActions }
}
```

Google `interactions` maps to ad clicks; Google `contactActions` currently maps to contact-page views. Calls are a subset in the mock funnel and are not added again to the combined contact total. Meta's contact actions are a separate platform metric. The email explains these definitions and that totals are not unique people. Agree on live conversion definitions before connecting real campaigns. Website/contact page views and calls require corresponding tracked conversions or analytics events; do not invent unavailable metrics.

Call the Google Ads API and Meta Marketing API from this server-only adapter using environment variables for OAuth credentials/account IDs, await it in `send.cjs`, and keep the returned model stable. Use a consistent date range/account timezone, validate results, and fail visibly if data cannot be fetched; never silently present mocks as real data. Fetching at preparation time creates a snapshot before 21:00, not a complete calendar day. For full-day figures use the previous completed UK day and label it correctly. If live reports must include activity up to exactly 21:00, use a timezone-aware scheduler with suitable timing guarantees to fetch then, and add a durable daily send ledger. No template redesign is required.

## File map

- `lib/ads-report/config.cjs` — sender, recipient lists, site URL and timezone.
- `lib/ads-report/schedule.cjs` — UK report date, GMT/BST conversion and bounded queue window.
- `lib/ads-report/metrics.cjs` — deterministic mock analytics adapter and combined totals.
- `lib/ads-report/email.cjs` — responsive table-based HTML and plain text.
- `lib/ads-report/send.cjs` — recipient isolation, enable gate, Resend request, idempotency and logs.
- `api/ads-report.js` — authenticated Vercel cron handler; no test mode exposed.
- `scripts/check-ads-report.cjs` — offline metrics, timezone, recipients, security and duplicate-request tests.
- `scripts/preview-ads-report.cjs` — local HTML preview without sending.
- `scripts/send-ads-report-test.cjs` — one-shot test with a local attempt receipt.
- `site/assets/img/reports/google-ads.png`, `meta.png` — official brand artwork in email-compatible PNG.
- `site/assets/img/reports/SOURCES.md` — artwork provenance.
- `.env.example`, `.gitignore`, `vercel.json` — environment instructions, local exclusions and cron configuration.
- `docs/ads-report.md` — this setup and operations guide.

Official documentation: [Vercel cron timing](https://vercel.com/docs/cron-jobs/usage-and-pricing), [cron authentication and management](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [Resend scheduled emails](https://resend.com/docs/dashboard/emails/schedule-email), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
