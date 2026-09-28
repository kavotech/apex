'use strict';

const { readFileSync } = require('node:fs');
const path = require('node:path');

function reportImageAttachments() {
  // Small existing brand assets, embedded as CID images rather than remote
  // image requests. The HTML remains the report; no document/PDF is attached.
  const assets = [
    ['apex', 'site/icon-192.png'],
    ['google-ads', 'site/assets/img/reports/google-ads.png'],
    ['meta', 'site/assets/img/reports/meta.png'],
  ];
  return assets.map(([name, file]) => ({
    filename: `${name}.png`,
    content_id: `apex-report-${name}`,
    content_type: 'image/png',
    content: readFileSync(path.join(__dirname, '../..', file)).toString('base64'),
  }));
}

module.exports = { reportImageAttachments };
