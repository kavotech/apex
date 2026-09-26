const assert = require('node:assert/strict');
const handler = require('../api/contact.js');

// No real credentials or network: exercise the production handler with Resend mocked.
process.env.RESEND_API_KEY = 'test-key';
delete process.env.CONTACT_FROM_EMAIL;
delete process.env.CONTACT_TO_EMAIL;
const valid = { name: 'Test <customer>', phone: '07414505029', email: 'customer@example.com', postcode: 'M1 1AA', service: 'Full Deep Clean', message: 'Hello & thanks\nSecond line' };
let calls = [];
global.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true }; };
async function request(body, method = 'POST') {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(s) { this.code = s; return this; }, json(data) { this.data = data; return this; } };
  await handler({ method, body }, res);
  return res;
}
(async () => {
  let r = await request(valid);
  assert.equal(r.code, 200);
  assert.deepEqual(r.data, { ok: true });
  assert.equal(r.headers['Cache-Control'], 'no-store');
  const sent = JSON.parse(calls[0].options.body);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.equal(sent.from, 'Apex Auto Care MCR <no-reply@apexautocaremcr.co.uk>');
  assert.deepEqual(sent.to, ['apexautocaremcr@gmail.com']);
  assert.equal(sent.reply_to, valid.email);
  assert(sent.html.includes('Test &lt;customer&gt;'));
  assert(sent.html.includes('Hello &amp; thanks<br>Second line'));
  assert(sent.text.includes(valid.message));
  assert(calls[0].options.signal instanceof AbortSignal);
  calls = [];
  for (const body of ['null', '[]', '{bad json', null, {}, { ...valid, email: 'invalid' }, { ...valid, phone: '' }]) {
    assert.equal((await request(body)).code, 400);
  }
  assert.equal((await request({ ...valid, company: 'spam' })).code, 200);
  r = await request(valid, 'GET');
  assert.equal(r.code, 405);
  assert.equal(r.headers.Allow, 'POST');
  delete process.env.RESEND_API_KEY;
  assert.equal((await request(valid)).code, 503);
  assert.equal(calls.length, 0);
  process.env.RESEND_API_KEY = 'test-key';
  global.fetch = async () => ({ ok: false, status: 403 });
  assert.equal((await request(valid)).code, 502);
  global.fetch = async () => { throw new DOMException('Timed out', 'TimeoutError'); };
  assert.equal((await request(valid)).code, 502);
  console.log('PASS: booking sender, admin recipient, reply-to, escaping, validation, honeypot, missing key, provider rejection and timeout.');
})().catch(err => { console.error(err); process.exitCode = 1; });
