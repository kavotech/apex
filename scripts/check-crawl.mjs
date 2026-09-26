import assert from 'node:assert/strict';
import fs from 'node:fs';

// Read-only production checks. A Googlebot user-agent does not simulate Google's IPs.
const origin = 'https://www.apexautocaremcr.co.uk';
const sitemapURL = `${origin}/sitemap.xml`;
const expected = [...fs.readFileSync('site/sitemap.xml', 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]).sort();
for (const agent of ['Mozilla/5.0', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)']) {
  async function read(url, type) {
    const response = await fetch(url, { headers: { 'User-Agent': agent }, redirect: 'manual', signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200, `${url}: HTTP ${response.status}, location ${response.headers.get('location')}`);
    assert(type.test(response.headers.get('content-type') || ''), `${url}: wrong content type`);
    assert(!/noindex|none/i.test(response.headers.get('x-robots-tag') || ''), `${url}: blocked by HTTP robots header`);
    return response.text();
  }
  const robots = await read(`${origin}/robots.txt`, /text\/plain/);
  assert(robots.includes(`Sitemap: ${sitemapURL}`), 'Robots must advertise the production sitemap');
  assert(!/^Disallow:\s*\/\s*$/mi.test(robots), 'Robots blocks the entire site');
  const xml = await read(sitemapURL, /(?:application|text)\/xml/);
  assert(xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), 'Missing sitemap namespace');
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  assert.deepEqual([...urls].sort(), expected, 'Live sitemap differs from repository');
  for (const url of urls) {
    assert.equal(new URL(url).origin, origin, 'Sitemap URL must use the canonical host');
    const html = await read(url, /text\/html/);
    assert(html.includes(`<link rel="canonical" href="${url}">`), `${url}: canonical mismatch`);
    assert(!/<meta\b(?=[^>]*name=["'](?:robots|googlebot)["'])(?=[^>]*content=["'][^"']*\b(?:noindex|none)\b)[^>]*>/i.test(html), `${url}: blocked by robots meta`);
    assert(/<h1\b/i.test(html), `${url}: page content missing`);
  }
  console.log(`PASS: ${urls.length} pages, sitemap and robots for ${agent.includes('Googlebot') ? 'Googlebot user-agent' : 'regular browser user-agent'}`);
}
for (const host of ['apexautocaremcr.co.uk', 'apexmcr.vercel.app']) {
  for (const path of ['/', '/sitemap.xml', '/about']) {
    const response = await fetch(`https://${host}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    assert([301, 308].includes(response.status), `${host}${path}: expected permanent redirect, got ${response.status}`);
    assert.equal(response.headers.get('location'), origin + path, `${host}${path}: incorrect redirect`);
  }
}
console.log('PASS: old Vercel and non-www URLs redirect to the canonical domain.');
console.log('These checks verify public access, not Search Console status or Google indexing.');
