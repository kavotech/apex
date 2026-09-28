'use strict';

const { createHash } = require('node:crypto');
const { validateDate } = require('./schedule.cjs');

// This is the analytics adapter. A live adapter should return the same shape,
// explicitly set demo:false, and include an accurate coverage description.
function generateDailyAdMetrics(date) {
  validateDate(date);
  const seed = createHash('sha256').update(`apex-ads-demo-v1:${date}`).digest();
  let index = 0;
  const pick = (min, max) => min + seed[index++ % seed.length] % (max - min + 1);
  // Narrow daily ranges intentionally avoid large swings or inflated results.
  const google = { adViews: pick(20, 30), interactions: pick(4, 7) };
  google.websiteVisits = pick(2, Math.min(6, google.interactions));
  google.contactActions = pick(0, Math.min(3, google.websiteVisits));
  google.calls = pick(0, Math.min(2, google.contactActions));
  const meta = { adViews: pick(24, 34), interactions: pick(5, 8) };
  meta.profileVisits = pick(2, Math.min(5, meta.interactions));
  meta.websiteVisits = pick(1, Math.min(5, meta.interactions));
  meta.contactActions = pick(0, Math.min(3, meta.websiteVisits));
  return { date, demo: true, coverage: 'Illustrative daily activity. Google Ads and Meta APIs are not connected.', google, meta };
}

function reportTotals({ google, meta }) {
  return Object.fromEntries(['adViews', 'interactions', 'websiteVisits', 'contactActions'].map(key => [key, google[key] + meta[key]]));
}

module.exports = { generateDailyAdMetrics, reportTotals };
