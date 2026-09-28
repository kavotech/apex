'use strict';

// Local-only, one-shot test. No production recipient override is accepted.
const fs = require('node:fs');
const path = require('node:path');
const { sendDailyAdsReport } = require('../lib/ads-report/send.cjs');

async function main() {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--test-id')) throw new Error('Usage: node scripts/send-ads-report-test.cjs [--test-id explicitly-approved-review-name]');
  const testId = args.length ? args[1] : 'initial-test';
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(testId)) throw new Error('Invalid test ID');
  if (!process.env.RESEND_API_KEY) throw new Error('Set RESEND_API_KEY in your environment first');
  const directory = path.join(__dirname, '..', '.local');
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, testId === 'initial-test' ? 'ads-report-test-receipt.json' : `ads-report-test-${testId}-receipt.json`);
  // Claim before network I/O; never auto-resend an uncertain/failed test.
  const handle = fs.openSync(file, 'wx');
  fs.writeFileSync(handle, JSON.stringify({ status: 'attempt_started', testId, at: new Date().toISOString(), to: 'info@kavotech.uk' }, null, 2));
  fs.closeSync(handle);
  const receipt = await sendDailyAdsReport({ mode: 'test', testId });
  fs.writeFileSync(file, JSON.stringify({ ...receipt, testId, to: 'info@kavotech.uk' }, null, 2));
  console.log('One test accepted for info@kavotech.uk only. Confirm its arrival before enabling daily reports.');
}

main().catch(error => { console.error(error.code === 'EEXIST' ? 'This test was already attempted. Inspect its .local receipt and Resend; do not resend blindly.' : error.message); process.exitCode = 1; });
