/**
 * POST /api/contact — emails an apexautocaremcr booking enquiry.
 *
 * Uses the Resend REST API (https://resend.com). Configure in Vercel → Project → Settings → Environment Variables:
 *   RESEND_API_KEY       (required)  API key from your Resend account
 *   CONTACT_FROM_EMAIL   (optional) override the verified Apex sender
 *   CONTACT_TO_EMAIL     (optional) override the Apex booking recipient
 *
 * If the API key is missing the endpoint answers 503 and the page offers a pre-filled WhatsApp message,
 * so visitors can always reach the business.
 */

const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'invalid_input' });
  }

  // Honeypot: real visitors never fill this in. Pretend success so bots learn nothing.
  if (clean(body.company, 200)) return res.status(200).json({ ok: true });

  const d = {
    name: clean(body.name, 120),
    phone: clean(body.phone, 40),
    email: clean(body.email, 160),
    postcode: clean(body.postcode, 12),
    service: clean(body.service, 120),
    message: clean(body.message, 2000),
  };
  if (!d.name || !d.phone || !d.postcode || !d.service || !EMAIL.test(d.email)) {
    return res.status(400).json({ error: 'invalid_input' });
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL?.trim() || 'Apex Auto Care MCR <no-reply@apexautocaremcr.co.uk>';
  const to = process.env.CONTACT_TO_EMAIL?.trim() || 'apexautocaremcr@gmail.com';
  if (!key || !from || !to) return res.status(503).json({ error: 'not_configured' });

  const rows = [['Name', d.name], ['Phone', d.phone], ['Email', d.email], ['Postcode', d.postcode], ['Service', d.service], ['Message', d.message || '(none)']];
  const html = `<h2>apexautocaremcr booking enquiry</h2><table cellpadding="6" style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: d.email,
        subject: `Apex booking enquiry: ${d.service} (${d.postcode})`,
        html,
        text,
      }),
    });
    if (!r.ok) {
      console.error('Resend rejected booking email', r.status);
      return res.status(502).json({ error: 'send_failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact email request failed', err.name);
    return res.status(502).json({ error: 'send_failed' });
  }
};

function safeParse(s) { try { return JSON.parse(s); } catch { return {}; } }
