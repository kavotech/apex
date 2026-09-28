'use strict';

const { timingSafeEqual } = require('node:crypto');
const { sendDailyAdsReport } = require('../lib/ads-report/send.cjs');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[ads-report] CRON_SECRET is missing');
    return res.status(503).json({ error: 'Scheduler not configured' });
  }
  const received = Buffer.from(String(req.headers.authorization || ''));
  const expected = Buffer.from(`Bearer ${secret}`);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return res.status(401).json({ error: 'Unauthorized' });
  // No query/body overrides of recipients, date, mode or schedule.
  try {
    const result = await sendDailyAdsReport();
    return res.status(200).json(result);
  } catch {
    console.error('[ads-report] scheduled job failed; check provider/configuration');
    return res.status(502).json({ error: 'Report scheduling failed' });
  }
};
