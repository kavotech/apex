import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../site');
const origin = 'https://www.apexautocaremcr.co.uk';

function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}

const urls = [];
for (const file of htmlFiles(root)) {
  const html = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => match[0]);
  if (meta.some(tag => /\bname=["'](?:robots|googlebot)["']/i.test(tag) && /\bcontent=["'][^"']*\b(?:noindex|none)\b/i.test(tag))) continue;
  assert.notEqual(relative, '404.html', 'The error page must explicitly declare noindex');
  const canonicalTags = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => match[0]).filter(tag => /\brel=["']canonical["']/i.test(tag));
  assert.equal(canonicalTags.length, 1, `${relative}: require exactly one canonical URL`);
  const canonical = canonicalTags[0].match(/\bhref=["']([^"']+)["']/i)?.[1];
  const route = relative === 'index.html' ? '/' : '/' + relative.replace(/\.html$/, '').replace(/\/index$/, '');
  assert.equal(canonical, origin + route, `${relative}: canonical must match its public clean URL`);
  assert(!urls.includes(canonical), `${relative}: duplicate canonical`);
  urls.push(canonical);
}
assert(urls.length > 0, 'Refusing to publish an empty sitemap');
urls.sort();
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
// Omit lastmod rather than fabricate a new content-update date at every build.
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.map(url => `  <url>\n    <loc>${escape(url)}</loc>\n  </url>`).join('\n')
  + '\n</urlset>\n';
const target = path.join(root, 'sitemap.xml');
if (process.argv.includes('--check')) {
  assert.equal(fs.readFileSync(target, 'utf8').replaceAll('\r\n', '\n'), xml, 'Sitemap is stale. Run node scripts/build-sitemap.mjs');
} else {
  fs.writeFileSync(target, xml);
}
console.log(`PASS: sitemap ${process.argv.includes('--check') ? 'matches' : 'generated from'} all ${urls.length} indexable HTML pages.`);
