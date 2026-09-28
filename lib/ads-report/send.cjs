'use strict';

const config = require('./config.cjs');
const { generateDailyAdMetrics } = require('./metrics.cjs');
const { generateAdsReportEmail } = require('./email.cjs');
const { reportImageAttachments } = require('./assets.cjs');
const { dailySchedule, londonDate } = require('./schedule.cjs');

async function sendDailyAdsReport({ mode = 'daily', testId = 'initial-test', now = new Date(), env = process.env, fetchImpl = fetch, logger = console } = {}) {
  if (!['daily', 'test'].includes(mode)) throw new Error('Invalid report mode');
  if (mode === 'test' && !/^[a-z0-9][a-z0-9-]{0,63}$/.test(testId)) throw new Error('Invalid test ID');
  if (mode === 'daily' && (env.ADS_REPORTS_ENABLED !== 'true' || env.VERCEL_ENV !== 'production')) {
    logger.info('[ads-report] disabled');
    return { status: 'disabled' };
  }
  const schedule = dailySchedule(now);
  if (mode === 'daily' && !schedule.allowed) {
    logger.warn('[ads-report] outside preparation window', { date: schedule.date });
    return { status: 'outside_window' };
  }
  if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is missing');
  const date = mode === 'daily' ? schedule.date : londonDate(now);
  const report = generateDailyAdMetrics(date);
  const email = generateAdsReportEmail(report, { test: mode === 'test', inlineImages: true });
  const payload = {
    from: config.from,
    to: mode === 'test' ? [config.testRecipient] : [...config.recipients],
    ...email,
    attachments: reportImageAttachments(),
    ...(mode === 'daily' ? { scheduled_at: schedule.scheduledAt } : {}),
  };
  // Never include a deployment/version/random suffix: every daily retry must
  // share the same key even across deployments. A changed payload fails closed.
  const key = mode === 'test' ? `apex-ads-report-${testId}` : `apex-ads-report-daily-${date}`;
  let response;
  try {
    response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
      body: JSON.stringify(payload),
    });
  } catch {
    logger.error('[ads-report] provider request failed or timed out', { date, mode });
    throw new Error('Resend request failed; delivery state may be unknown');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.id !== 'string') {
    logger.error('[ads-report] provider rejected report', { date, mode, httpStatus: response.status });
    throw new Error(`Resend report request failed (HTTP ${response.status})`);
  }
  const receipt = { status: mode === 'daily' ? 'scheduled' : 'accepted', date, id: result.id, ...(mode === 'daily' ? { scheduledAt: schedule.scheduledAt } : {}) };
  logger.info('[ads-report] provider accepted report', receipt);
  return receipt;
}

module.exports = { sendDailyAdsReport };
