'use strict';

// Local-only, one-shot test. No production recipient override is accepted.
const fs = require('node:fs');
const path = require('node:path');
const { sendDailyAdsReport } = require('../lib/ads-report/send.cjs');

async function main() {
  if (!process.env.RESEND_API_KEY) throw new Error('Set RESEND_API_KEY in your environment first');
  const directory = path.join(__dirname, '..', '.local');
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, 'ads-report-test-receipt.json');
  // Claim before network I/O; never auto-resend an uncertain/failed test.
  const handle = fs.openSync(file, 'wx');
  fs.writeFileSync(handle, JSON.stringify({ status: 'attempt_started', at: new Date().toISOString(), to: 'info@kavotech.uk' }, null, 2));
  fs.closeSync(handle);
  const receipt = await sendDailyAdsReport({ mode: 'test' });
  fs.writeFileSync(file, JSON.stringify({ ...receipt, to: 'info@kavotech.uk' }, null, 2));
  console.log('One test accepted for info@kavotech.uk only. Confirm its arrival before enabling daily reports.');
}

main().catch(error => { console.error(error.code === 'EEXIST' ? 'Test already attempted. Inspect .local/ads-report-test-receipt.json and Resend; do not resend blindly.' : error.message); process.exitCode = 1; });
