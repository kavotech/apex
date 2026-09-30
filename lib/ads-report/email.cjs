'use strict';

const { siteUrl } = require('./config.cjs');
const { reportTotals } = require('./metrics.cjs');
const { validateDate } = require('./schedule.cjs');

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const imageUrl = (name, inline) => inline ? `cid:apex-report-${name}` : `${siteUrl}${name === 'apex' ? '/icon-192.png' : `/assets/img/reports/${name}.png`}`;

function summaryCard([label, value], index) {
  return `<td width="50%" valign="top" style="padding:5px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${index === 0 ? '#e5f5fc' : '#f3f6f9'};border:1px solid ${index === 0 ? '#c6eaf8' : '#e5ebf0'};border-radius:12px">
      <tr><td style="padding:18px 16px"><p style="margin:0 0 8px;height:36px;font-size:12px;line-height:18px;color:#526776">${label}</p>
      <p style="margin:0;font-size:34px;line-height:40px;font-weight:700;letter-spacing:-1px;color:#102c40">${escape(value)}</p></td></tr>
    </table></td>`;
}

function platformCard({ name, logo, logoWidth, channel, rows, badge, inlineImages }) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dce5ed;border-radius:14px;background:#ffffff">
    <tr><td style="padding:22px 20px 18px;border-bottom:1px solid #e9eef3">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
        <td height="40" valign="middle"><img src="${imageUrl(logo, inlineImages)}" width="${logoWidth}" alt="${name} logo" style="display:block;border:0;height:auto"></td>
        <td align="right" valign="middle" style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#728698">${channel}</td>
      </tr></table>
      <h2 style="margin:16px 0 4px;font-size:21px;line-height:28px;color:#102c40">${name}</h2>
      <p style="margin:0;font-size:11px;line-height:18px;color:#7c5f22">${badge}</p>
    </td></tr>
    <tr><td style="padding:20px;background:#f6f9fc">
      <p style="margin:0 0 4px;font-size:12px;line-height:18px;color:#637788">Ad Views</p>
      <p style="margin:0;font-size:38px;line-height:44px;font-weight:700;letter-spacing:-1px;color:#102c40">${escape(rows[0][1])}</p>
    </td></tr>
    <tr><td style="padding:4px 20px 12px"><table width="100%" cellspacing="0" cellpadding="0">
      ${rows.slice(1).map(([label, value]) => `<tr><th scope="row" align="left" style="padding:13px 0;border-bottom:1px solid #edf1f5;font-size:13px;line-height:20px;font-weight:400;color:#526776">${label}</th><td align="right" style="padding:13px 0;border-bottom:1px solid #edf1f5;font-size:17px;line-height:20px;font-weight:700;color:#102c40">${escape(value)}</td></tr>`).join('\n')}
    </table></td></tr>
  </table>`;
}

function generateAdsReportEmail(report, { inlineImages = false } = {}) {
  validateDate(report.date);
  const date = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'Europe/London' }).format(new Date(`${report.date}T12:00:00Z`));
  const totals = reportTotals(report);
  const badge = report.demo ? 'Illustrative figures' : 'Advertising activity';
  const subject = `Apex Auto Care MCR – Daily Advertising Report – ${date}`;
  const cards = [['Total Ad Views', totals.adViews], ['Total Interactions', totals.interactions], ['Website Visits', totals.websiteVisits], ['Contact Actions', totals.contactActions]];
  const googleRows = [['Ad Views', report.google.adViews], ['Ad Clicks', report.google.interactions], ['Website Visits', report.google.websiteVisits], ['Contact Views', report.google.contactActions]];
  const metaRows = [['Ad Views', report.meta.adViews], ['Interactions', report.meta.interactions], ['Profile Visits', report.meta.profileVisits], ['Website Visits', report.meta.websiteVisits], ['Contact Actions', report.meta.contactActions]];
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escape(subject)}</title>
<style>body{margin:0;padding:0}table{border-collapse:separate}img{border:0} @media only screen and (max-width:560px){.outer{padding:12px 6px!important}.content{padding:24px 14px!important}.masthead{padding:24px 20px!important}.brand-name{font-size:18px!important;line-height:24px!important}.brand-logo{width:80px!important;height:80px!important}.platform-column{display:block!important;width:100%!important;padding:0 0 16px!important}.summary-half{display:block!important;width:100%!important}h1{font-size:27px!important;line-height:34px!important}}</style></head>
<body style="margin:0;background:#eaf0f5;font-family:Arial,Helvetica,sans-serif;color:#102c40">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escape(badge)} — your daily advertising summary for ${date}.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#eaf0f5"><tr><td class="outer" align="center" style="padding:32px 12px">
<!--[if mso]><table role="presentation" width="700"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:700px;background:#ffffff;border:1px solid #dbe4ec;border-radius:18px;overflow:hidden">
  <tr><td height="5" bgcolor="#17b5eb" style="font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td class="masthead" bgcolor="#0b2032" style="padding:28px 32px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
      <td width="116" valign="middle"><img class="brand-logo" src="${imageUrl('apex', inlineImages)}" width="96" height="96" alt="Apex Auto Care MCR logo" style="display:block;border:0"></td>
      <td valign="middle" style="padding-left:16px"><p class="brand-name" style="margin:0 0 7px;font-size:23px;line-height:29px;font-weight:700;color:#ffffff">Apex Auto Care MCR</p><p style="margin:0;font-size:11px;line-height:18px;letter-spacing:1.7px;color:#7ecbe8;text-transform:uppercase">Advertising performance</p></td>
    </tr></table>
  </td></tr>
  <tr><td class="content" style="padding:30px 32px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="font-size:11px;line-height:18px;letter-spacing:1.5px;font-weight:700;text-transform:uppercase;color:#578098">Daily overview</td><td align="right" style="font-size:11px;line-height:18px;color:#728698">UK · GMT/BST</td></tr></table>
    <h1 style="margin:10px 0 10px;font-size:31px;line-height:39px;letter-spacing:-.7px;color:#102c40">Daily Advertising Report</h1>
    <p style="margin:0 0 18px;font-size:13px;line-height:20px;font-weight:700;color:#456479">${date}</p>
    <p style="margin:0 0 22px;font-size:14px;line-height:24px;color:#607583">Here is your daily advertising activity summary for Apex Auto Care MCR.</p>
    <h2 style="margin:26px 0 10px;font-size:16px;line-height:24px;color:#102c40">Your advertising at a glance</h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
      <td class="summary-half" width="50%" valign="top"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${cards.slice(0, 2).map(summaryCard).join('')}</tr></table></td>
      <td class="summary-half" width="50%" valign="top"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${cards.slice(2).map((card, index) => summaryCard(card, index + 2)).join('')}</tr></table></td>
    </tr></table>
    <h2 style="margin:26px 0 14px;font-size:16px;line-height:24px;color:#102c40">Performance by platform</h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
      <td class="platform-column" width="50%" valign="top" style="padding-right:7px">${platformCard({ name: 'Google Ads', logo: 'google-ads', logoWidth: 38, channel: 'Google', rows: googleRows, badge, inlineImages })}</td>
      <td class="platform-column" width="50%" valign="top" style="padding-left:7px">${platformCard({ name: 'Meta Ads', logo: 'meta', logoWidth: 102, channel: 'Meta', rows: metaRows, badge, inlineImages })}</td>
    </tr></table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #e6edf2"><tr><td style="padding-top:18px">
      <p style="margin:0 0 6px;font-size:11px;line-height:18px;font-weight:700;color:#597184">ABOUT THIS REPORT</p>
      <p style="margin:0 0 8px;font-size:11px;line-height:18px;color:#718492">${escape(report.coverage)}</p>
      <p style="margin:0;font-size:11px;line-height:18px;color:#718492">Total Interactions combines Google clicks and Meta interactions. Contact Actions combines Google contact views and Meta contact actions. Totals count activities, not unique people.</p>
    </td></tr></table>
  </td></tr>
  <tr><td align="center" bgcolor="#f4f7fa" style="padding:22px 24px;border-top:1px solid #e3eaf1">
    <p style="margin:0 0 6px;font-size:12px;line-height:20px;font-weight:700;color:#385569">Apex Auto Care MCR</p>
    <p style="margin:0;font-size:11px;line-height:19px;color:#728698">Automatically generated · Daily at 9:00 PM Europe/London</p>
    <p style="margin:10px 0 0;font-size:12px"><a href="${siteUrl}" style="color:#147ba5;text-decoration:none">apexautocaremcr.co.uk</a></p>
  </td></tr>
</table><!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
  const lines = rows => rows.map(([label, value]) => `${label}: ${value}`).join('\n');
  const text = `${subject}\n\n${badge}\n\nHere is your daily advertising activity summary for Apex Auto Care MCR.\n\n${lines(cards)}\nContact total = Google contact views + Meta contact actions. Activity counts are not unique people.\n\nGoogle Ads\n${lines(googleRows)}\n\nMeta Ads\n${lines(metaRows)}\n\n${report.coverage}\n\nAutomatically generated. Daily schedule: 9:00 PM Europe/London (GMT/BST).\n${siteUrl}`;
  return { subject, html, text };
}

module.exports = { generateAdsReportEmail };
