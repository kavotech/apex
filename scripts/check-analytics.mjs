import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync('site/assets/js/analytics.js', 'utf8');
function run(id, consent, readyState = 'complete') {
  const scripts = [], events = {};
  const window = {
    APEX_CONFIG: { googleAnalyticsId: id },
    PGConsent: { get: () => consent },
    addEventListener: (event, callback) => { events[event] = callback; }
  };
  const document = {
    readyState, createElement: () => ({}),
    head: { appendChild: script => scripts.push(script) },
    addEventListener: (event, callback) => { events[event] = callback; }
  };
  vm.runInNewContext(source, { window, document, location: { origin: 'https://apexautocaremcr.co.uk', pathname: '/contact', search: '?email=private@example.com' } });
  return { window, scripts, events };
}
for (const id of ['', undefined, 'not-a-real-id', 'GTM-EXAMPLE']) {
  const result = run(id, { analytics: true });
  assert.equal(result.scripts.length, 0);
  assert.equal(result.window.dataLayer, undefined);
}
const result = run('G-TEST123', null);
assert.equal(result.scripts.length, 0);
result.events['pg:consent-change']({ detail: { analytics: false, marketing: true } });
assert.equal(result.scripts.length, 0);
result.events['pg:consent-change']({ detail: { analytics: true } });
assert.equal(result.scripts.length, 1);
assert.equal(result.window['ga-disable-G-TEST123'], false);
const commands = result.window.dataLayer.map(args => Array.from(args));
assert.equal(commands[0][0], 'consent');
assert.equal(commands[0][1], 'default');
assert.equal(commands[0][2].analytics_storage, 'denied');
assert.equal(commands.find(c => c[0] === 'config')[2].page_location, 'https://apexautocaremcr.co.uk/contact');
result.events['pg:consent-change']({ detail: { analytics: true } });
assert.equal(result.scripts.length, 1);
result.events['pg:consent-change']({ detail: { analytics: false } });
assert.equal(result.window['ga-disable-G-TEST123'], true);
assert.equal(result.window.dataLayer.at(-1)[2].analytics_storage, 'denied');
assert.equal(run('G-TEST123', { analytics: true }).scripts.length, 1);
const deferred = run('G-TEST123', { analytics: true }, 'loading');
assert.equal(deferred.scripts.length, 0);
deferred.events.DOMContentLoaded();
assert.equal(deferred.scripts.length, 1);
console.log('PASS: Google tracking stays off without an ID/consent; opt-in, opt-out, persisted consent, startup order and duplicate loading checked.');
