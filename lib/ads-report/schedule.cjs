'use strict';

const { timezone } = require('./config.cjs');

function londonDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function validateDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new Error('Invalid report date');
  }
  return date;
}

// Derive the UTC offset from the IANA timezone database, never from fixed BST dates.
function scheduledTime(date) {
  validateDate(date);
  const nominal = new Date(`${date}T21:00:00Z`);
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', hourCycle: 'h23' }).format(nominal));
  return new Date(nominal.getTime() - (hour - 21) * 3600000).toISOString();
}

function dailySchedule(now = new Date()) {
  const date = londonDate(now);
  const scheduledAt = scheduledTime(date);
  // All attempts for one date fit inside three hours, within Resend's 24h
  // idempotency retention. Historical dates and late replay cannot be sent.
  const startsAt = Date.parse(`${date}T18:00:00Z`);
  const allowed = now.getTime() >= startsAt && now.getTime() < Date.parse(scheduledAt) - 60000;
  return { date, scheduledAt, allowed };
}

module.exports = { londonDate, validateDate, scheduledTime, dailySchedule };
