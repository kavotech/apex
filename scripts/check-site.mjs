import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = path.resolve('site');
const origin = 'https://apexautocaremcr.co.uk';
const pages = fs.readdirSync(root).filter(file => file.endsWith('.html'));
const descriptions = new Set();
const canonicals = [];
let references = 0;
for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${file}: one H1`);
  assert.equal((html.match(/<link rel="icon"/g) || []).length, 1, `${file}: one favicon`);
  const description = html.match(/<meta name="description" content="([^"]+)"/)[1];
  assert(!descriptions.has(description), `${file}: unique description`);
  descriptions.add(description);
  if (file === '404.html') assert(html.includes('content="noindex, nofollow"'));
  else {
    const url = origin + (file === 'index.html' ? '/' : '/' + file.replace('.html', ''));
    assert(html.includes(`<link rel="canonical" href="${url}">`), `${file}: canonical`);
    assert(html.includes(`<meta property="og:url" content="${url}">`), `${file}: social URL`);
    canonicals.push(url);
  }
  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (match[1].includes('application/ld+json')) JSON.parse(match[2]);
    else if (!match[1].includes('src=')) new vm.Script(match[2], { filename: file });
  }
  for (const match of html.matchAll(/<(?:a|img|script|link)\b[^>]*?\b(?:href|src)="([^"]+)"/g)) {
    const ref = match[1];
    if (!ref.startsWith('/') || ref.startsWith('//')) continue;
    let target = path.join(root, ref.split(/[?#]/)[0]);
    if (ref === '/') target = path.join(root, 'index.html');
    if (!fs.existsSync(target) && !path.extname(target)) target += '.html';
    assert(fs.existsSync(target), `${file}: missing ${ref}`);
    references++;
  }
  for (const img of html.matchAll(/<img\b[^>]*>/g)) assert(/\balt="[^"]*"/.test(img[0]), `${file}: image alt`);
  assert(!/class="recentwork_content"|class="recentwork_number"|data-caption=/.test(html), `${file}: no photo captions`);
  if (file === 'services.html') assert(!html.includes('class="process_link-text-small"'));
}
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]).sort(), canonicals.sort());
assert(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8').includes(`Sitemap: ${origin}/sitemap.xml`));
for (const file of fs.readdirSync(path.join(root, 'assets/js')).filter(f => f.endsWith('.js'))) {
  new vm.Script(fs.readFileSync(path.join(root, 'assets/js', file), 'utf8'), { filename: file });
}
console.log(`PASS: ${pages.length} pages, ${references} local references, metadata, sitemap, captions and JavaScript syntax.`);
