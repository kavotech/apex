'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { generateDailyAdMetrics } = require('../lib/ads-report/metrics.cjs');
const { generateAdsReportEmail } = require('../lib/ads-report/email.cjs');
const { londonDate } = require('../lib/ads-report/schedule.cjs');

const folder = path.join(__dirname, '..', '.local');
fs.mkdirSync(folder, { recursive: true });
const output = path.join(folder, 'ads-report-preview.html');
const email = generateAdsReportEmail(generateDailyAdMetrics(londonDate()), { test: true });
fs.writeFileSync(output, email.html);
console.log(output);
