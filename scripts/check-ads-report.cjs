'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { generateDailyAdMetrics, reportTotals } = require('../lib/ads-report/metrics.cjs');
const { generateAdsReportEmail } = require('../lib/ads-report/email.cjs');
const { scheduledTime, dailySchedule, londonDate } = require('../lib/ads-report/schedule.cjs');
const { sendDailyAdsReport } = require('../lib/ads-report/send.cjs');
const handler = require('../api/ads-report.js');
const logger = { info() {}, warn() {}, error() {} };
const env = { RESEND_API_KEY: 'unit-test-not-a-key', ADS_REPORTS_ENABLED: 'true', VERCEL_ENV: 'production' };
const now = new Date('2026-09-28T18:30:00Z');
const ok = id => ({ ok: true, status: 200, json: async () => ({ id }) });

test('small reproducible mock funnels and accurate combined totals over a full year', () => {
  const variations = new Set();
  for (let day = 0; day < 366; day++) {
    const date = new Date(Date.UTC(2026, 0, day + 1)).toISOString().slice(0, 10);
    const report = generateDailyAdMetrics(date);
    assert.deepEqual(report, generateDailyAdMetrics(date));
    variations.add(JSON.stringify(report.google));
    assert.equal(report.demo, true);
    for (const p of [report.google, report.meta]) {
      assert.ok(p.adViews >= 15 && p.adViews <= 45);
      assert.ok(p.interactions >= 2 && p.interactions <= 10 && p.interactions <= p.adViews);
      assert.ok(p.websiteVisits >= 1 && p.websiteVisits <= 8 && p.websiteVisits <= p.interactions);
      assert.ok(p.contactActions >= 0 && p.contactActions <= 5 && p.contactActions <= p.websiteVisits);
    }
    assert.ok(report.google.calls >= 0 && report.google.calls <= 4 && report.google.calls <= report.google.contactActions);
    assert.ok(report.meta.profileVisits <= report.meta.interactions);
    for (const [key, total] of Object.entries(reportTotals(report))) assert.equal(total, report.google[key] + report.meta[key]);
  }
  assert.ok(variations.size > 100);
  assert.throws(() => generateDailyAdMetrics('2026-02-30'));
});

test('21:00 London target across both daylight-saving transitions and local midnight', () => {
  for (const [date, utcHour] of [['2026-03-28', '21'], ['2026-03-29', '20'], ['2026-10-24', '20'], ['2026-10-25', '21'], ['2027-03-28', '20']]) {
    assert.equal(scheduledTime(date), `${date}T${utcHour}:00:00.000Z`);
    assert.equal(dailySchedule(new Date(`${date}T18:00:00Z`)).allowed, true);
    assert.equal(dailySchedule(new Date(`${date}T17:59:59Z`)).allowed, false);
    assert.equal(dailySchedule(new Date(`${date}T${utcHour}:00:00Z`)).allowed, false);
  }
  assert.equal(londonDate(new Date('2026-09-28T23:30:00Z')), '2026-09-29');
  assert.equal(dailySchedule(new Date('2026-09-28T19:59:00Z')).allowed, false);
});

test('HTML and plain text explicitly disclose demo data and escape adapter text', () => {
  const report = generateDailyAdMetrics('2026-09-28');
  report.coverage = '<script>bad()</script>';
  const email = generateAdsReportEmail(report, { test: true });
  assert.match(email.subject, /\[TEST\].*Demo \/ Mock Data/);
  assert.match(email.text, /not genuine Google or Meta analytics/);
  assert.match(email.html, /@media only screen/);
  assert.match(email.html, /google-ads.png/);
  assert.match(email.html, /meta.png/);
  assert.match(email.html, /&lt;script&gt;/);
  assert.doesNotMatch(email.html, /<script>/);
  assert.ok(Buffer.byteLength(email.html) < 50000);
});

test('test path always targets only info, sends immediately and ignores production recipients', async () => {
  let calls = 0;
  await sendDailyAdsReport({ mode: 'test', now, env, logger, fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.resend.com/emails');
    const body = JSON.parse(options.body);
    assert.deepEqual(body.to, ['info@kavotech.uk']);
    assert.equal(body.from, 'Apex Auto Care MCR <ads@apexautocaremcr.co.uk>');
    assert.equal(body.scheduled_at, undefined);
    assert.equal(body.attachments.length, 3);
    for (const attachment of body.attachments) {
      assert.equal(attachment.content_type, 'image/png');
      assert.match(body.html, new RegExp(`cid:${attachment.content_id}`));
      const bytes = Buffer.from(attachment.content, 'base64');
      assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
      assert.ok(bytes.length < 60000);
    }
    assert.doesNotMatch(body.html, /src="https:/);
    assert.equal(options.headers['Idempotency-Key'], 'apex-ads-report-initial-test');
    return ok('test-id');
  } });
  assert.equal(calls, 1);
});

test('production is gated; previews, missing enable flag and late calls cannot send', async () => {
  const fetchImpl = () => { throw new Error('must not make a network call'); };
  for (const settings of [{}, { ...env, ADS_REPORTS_ENABLED: 'false' }, { ...env, VERCEL_ENV: 'preview' }]) {
    assert.equal((await sendDailyAdsReport({ now, env: settings, logger, fetchImpl })).status, 'disabled');
  }
  assert.equal((await sendDailyAdsReport({ now: new Date('2026-09-28T21:00:00Z'), env, logger, fetchImpl })).status, 'outside_window');
});

test('an explicitly requested review uses its own stable test key and only the test inbox', async () => {
  await sendDailyAdsReport({ mode: 'test', testId: 'redesign-review-2026-09-28', now, env, logger, fetchImpl: async (_, options) => {
    assert.equal(options.headers['Idempotency-Key'], 'apex-ads-report-redesign-review-2026-09-28');
    assert.deepEqual(JSON.parse(options.body).to, ['info@kavotech.uk']);
    return ok('review-id');
  } });
  await assert.rejects(sendDailyAdsReport({ mode: 'test', testId: '../bad', now, env, logger }));
});

test('concurrent daily requests reuse exact payload/key and schedule both recipients at 21 UK', async () => {
  const stored = new Map();
  const fetchImpl = async (_, options) => {
    const key = options.headers['Idempotency-Key'];
    assert.equal(key, 'apex-ads-report-daily-2026-09-28');
    const body = JSON.parse(options.body);
    assert.deepEqual(body.to, ['info@kavotech.uk', 'apexautocaremcr@gmail.com']);
    assert.equal(body.scheduled_at, '2026-09-28T20:00:00.000Z');
    if (stored.has(key)) assert.equal(options.body, stored.get(key));
    stored.set(key, options.body);
    return ok('same-provider-id');
  };
  const results = await Promise.all([now, new Date('2026-09-28T19:00:00Z')].map(time => sendDailyAdsReport({ now: time, env, logger, fetchImpl })));
  assert.equal(stored.size, 1);
  assert.equal(results[0].id, results[1].id);
});

test('provider rejection, malformed response and ambiguous timeout propagate failure without extra sends', async () => {
  for (const fetchImpl of [async () => ({ ok: false, status: 429, json: async () => ({}) }), async () => ok(undefined), async () => { throw new Error('timeout'); }]) {
    await assert.rejects(sendDailyAdsReport({ now, env, logger, fetchImpl }));
  }
  await assert.rejects(sendDailyAdsReport({ now, env: { ...env, RESEND_API_KEY: '' }, logger }));
});

test('cron endpoint rejects missing/wrong auth and POST; ignores test and recipient overrides', async () => {
  const old = { ...process.env };
  process.env.CRON_SECRET = 'unit-test-secret';
  process.env.ADS_REPORTS_ENABLED = 'false';
  const invoke = async (method, authorization) => {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(body) { this.body = body; return this; } };
    await handler({ method, headers: { authorization }, query: { mode: 'test', to: 'somebody@example.com' } }, res);
    return res;
  };
  try {
    assert.equal((await invoke('POST', 'Bearer unit-test-secret')).code, 405);
    assert.equal((await invoke('GET', undefined)).code, 401);
    assert.equal((await invoke('GET', 'Bearer incorrect')).code, 401);
    const valid = await invoke('GET', 'Bearer unit-test-secret');
    assert.equal(valid.code, 200);
    assert.equal(valid.body.status, 'disabled');
    assert.equal(valid.headers['Cache-Control'], 'no-store');
    delete process.env.CRON_SECRET;
    assert.equal((await invoke('GET', '')).code, 503);
  } finally {
    for (const key of ['CRON_SECRET', 'ADS_REPORTS_ENABLED']) {
      if (old[key] === undefined) delete process.env[key]; else process.env[key] = old[key];
    }
  }
});
