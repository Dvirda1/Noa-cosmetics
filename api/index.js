// Noa Cosmetics - כתובת אחת לכל האתר: /api
// GET  ?action=content  → טקסטים ומחירים לאתר
// GET  (בלי action)     → שעות תפוסות וימים סגורים
// POST {…פרטי תור}      → קביעת תור
// POST {action:login|session|pwlogin|admin}  → דף הניהול
import * as K from '../lib/core.js';
const { db, eq, inList, hit, send } = K;

const NAME_RE = /^[֐-׿a-zA-Z][֐-׿a-zA-Z '\-\.׳״"]{1,39}$/;
const EMAIL_RE = /^[^\s@<>()"',;:]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/;

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return await get(req, res);
    if (req.method === 'POST') return await post(req, res);
    res.setHeader('Allow', 'GET, POST');
    return send(res, { ok: false }, 405);
  } catch (e) {
    console.error(e && e.stack || e);
    return send(res, { ok: false, reason: 'error' }, 500);
  }
}

async function get(req, res) {
  if (req.query.action === 'content') {
    const c = await K.cfg();
    K.PRIVATE_KEYS.forEach(k => delete c[k]);
    return send(res, { content: c, gallery: [] }, 200, 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  }
  const today = K.ilNow().date;
  const [bk, b] = await Promise.all([db.sel('bookings', 'select=key&key=gte.' + today), K.blocks()]);
  return send(res, { taken: bk.map(r => r.key).concat(b.hours), closed: b.days });
}

async function post(req, res) {
  const raw = K.body(req);
  if (!raw || typeof raw !== 'object') return send(res, { ok: false, reason: 'invalid' });
  if (raw.action === 'login') return send(res, await adminLogin());
  if (raw.action === 'session') return send(res, await adminSession(raw.t));
  if (raw.action === 'pwlogin') return send(res, await pwLogin(raw.email, raw.pw));
  if (raw.action === 'admin') return send(res, await admin(raw));
  return send(res, await book(raw));
}

// ================= קביעת תור מהאתר =================
async function validate(d, c) {
  if (d.website) return null;                                   // מלכודת לבוטים
  const key = String(d.key || '');
  if (!K.slotKey(key) || !K.realDate(key.slice(0, 10))) return null;
  const name = String(d.name || '').trim().replace(/\s+/g, ' ');
  if (!NAME_RE.test(name)) return null;
  const phone = String(d.phone || '').replace(/\D/g, '').replace(/^972/, '0');
  if (!/^05\d{8}$/.test(phone)) return null;
  const email = String(d.email || '').trim();
  if (email && (email.length > 120 || !EMAIL_RE.test(email))) return null;
  const service = String(d.service || '');
  if (!K.services(c).concat(K.SVC.map(s => s[0])).includes(service)) return null;
  const now = K.ilNow(), w = K.when(key);
  if (key <= now.stamp || w.date > K.addDays(now.date, 45)) return null;      // רק בעתיד, עד 45 יום
  const wd = K.weekday(w.date);
  if (K.OFF_DAYS.includes(wd) || String(c.closed_weekdays || '').split(/[,\s]+/).includes(String(wd))) return null;
  if (String(c.closed_dates || '').split(/[,\s]+/).includes(w.date)) return null;
  if (w.h < +(c.open || 9) || w.h >= +(c.close || 18)) return null;
  const b = await K.blocks();
  if (b.days.includes(w.date) || b.hours.includes(key)) return null;
  return { key, name, phone, email, service };
}

async function book(raw) {
  const c = await K.cfg();
  const d = await validate(raw, c);
  if (!d) return { ok: false, reason: 'invalid' };
  const today = K.ilNow().date;
  const mine = await db.sel('bookings', 'select=key&phone=' + eq(d.phone) + '&key=gte.' + today);
  if (mine.length >= 2) return { ok: false, reason: 'limit' };
  if ((await db.sel('bookings', 'select=key&key=' + eq(d.key))).length) return { ok: false, reason: 'taken' };
  if (!(await hit('book_10m', 8, 600)) || !(await hit('book_day', 25, 86400))) return { ok: false, reason: 'busy' };
  try { await db.ins('bookings', [{ ...d, source: 'site' }], 'return=minimal'); }
  catch (e) { if (e.status === 409) return { ok: false, reason: 'taken' }; throw e; }   // מישהי תפסה את השעה באותה שנייה
  await notify(d, c);
  return { ok: true };
}

async function notify(d, c) {
  const w = K.when(d.key);
  const msg = K.fill(c.thanks_text || K.THANKS, { name: d.name, service: d.service, when: w.label, address: c.address || '', map: K.mapLink(c.address) });
  const link = 'https://wa.me/' + K.wa(d.phone) + '?text=' + encodeURIComponent(msg);
  const jobs = [
    K.calAdd(d).then(id => id && db.upd('bookings', 'key=' + eq(d.key), { event_id: id })),
    K.mail({ to: K.notifyEmail(c), subject: 'תור חדש: ' + d.name + ' · ' + w.label,
      text: 'נקבע תור חדש\n\nשם: ' + d.name + '\nטלפון: ' + d.phone + '\nטיפול: ' + d.service + '\nמועד: ' + w.label + '\n\nלשליחת הודעת תודה בוואטסאפ: ' + link,
      html: '<div dir="rtl" style="font-family:Arial,sans-serif;font-size:16px"><h3>נקבע תור חדש ✨</h3><p><b>שם:</b> ' + K.esc(d.name) + '<br><b>טלפון:</b> ' + K.esc(d.phone) + '<br><b>טיפול:</b> ' + K.esc(d.service) + '<br><b>מועד:</b> ' + w.label + '</p><p><a href="' + K.esc(link) + '" style="background:#25D366;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;display:inline-block">שליחת הודעת תודה בוואטסאפ 💬</a></p></div>' })
  ];
  if (d.email) jobs.push(K.mail({ to: d.email, subject: 'התור שלך נקבע ✨',
    text: 'היי ' + d.name + ',\nהתור שלך ל' + d.service + ' נקבע ל' + w.label + '.\nכתובת: ' + (c.address || '') + '\nניווט: ' + K.mapLink(c.address) + '\nלשינוי או ביטול אפשר לכתוב בוואטסאפ: https://wa.me/' + c.whatsapp + '\n\nנתראה! Noa Cosmetics' }));
  await Promise.allSettled(jobs);
}

// ================= כניסה לדף הניהול =================
async function newSession() {
  const s = K.token();
  await db.ins('sessions', [{ hash: K.sha(s), exp: new Date(Date.now() + 180 * 864e5).toISOString() }], 'return=minimal');
  return s;
}
async function authed(s) {
  if (!/^[0-9a-f]{64}$/.test(String(s || ''))) return false;
  const r = await db.sel('sessions', 'select=exp&hash=' + eq(K.sha(s)));
  if (!r.length || new Date(r[0].exp) <= new Date()) return false;
  // כל שימוש מאריך: נשאר מחובר כל עוד נכנסים לפחות פעם ב-180 יום
  if (new Date(r[0].exp) - Date.now() < 150 * 864e5)
    await db.upd('sessions', 'hash=' + eq(K.sha(s)), { exp: new Date(Date.now() + 180 * 864e5).toISOString() });
  return true;
}
async function locked() {
  const r = await db.sel('counters', 'select=n,reset_at&k=eq.pw_fail');
  return !!r.length && r[0].n >= 5 && new Date(r[0].reset_at) > new Date();
}

// מייל + סיסמה. 5 טעויות = נעילה ל-15 דקות + מייל אזהרה
async function pwLogin(email, pw) {
  if (await locked()) return { ok: false, reason: 'locked' };
  const row = await db.sel('secrets', 'select=value&key=eq.pw');
  const good = !!row.length && !!K.adminEmail() && String(email || '').trim().toLowerCase() === K.adminEmail()
    && typeof pw === 'string' && pw.length <= 200 && K.pwCheck(pw, row[0].value);
  if (!good) {
    await hit('pw_fail', 5, 900);
    if (await locked() && await hit('alert_day', 1, 86400)) await K.mail({ to: K.adminEmail(), subject: '⚠️ ניסיונות כניסה שגויים לדף הניהול',
      text: 'היו 5 ניסיונות כניסה שגויים לדף הניהול, והכניסה ננעלה ל-15 דקות.\nאם זה לא היית אתה, מומלץ להחליף סיסמה מתוך דף הניהול.' });
    return { ok: false, reason: 'wrong' };
  }
  await db.del('counters', 'k=eq.pw_fail');
  return { ok: true, s: await newSession() };
}

// "שכחתי סיסמה": קישור חד-פעמי למייל המנהל, תקף 15 דקות
async function adminLogin() {
  if (!(await hit('login_15m', 3, 900)) || !(await hit('login_day', 6, 86400))) return { ok: true };   // לא מגלים שיש הגבלה
  const t = K.token();
  await db.ins('login_tokens', [{ hash: K.sha(t), exp: new Date(Date.now() + 15 * 60e3).toISOString() }], 'return=minimal');
  const url = K.siteUrl() + '/admin#t=' + t;
  await K.mail({ to: K.adminEmail(), subject: 'קישור כניסה לדף הניהול',
    text: 'לכניסה לדף הניהול (הקישור תקף ל-15 דקות):\n' + url + '\n\nאם לא ביקשת להיכנס, אפשר להתעלם מהמייל.',
    html: '<div dir="rtl" style="font-family:Arial,sans-serif;font-size:16px"><p><a href="' + url + '" style="background:#86695e;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;display:inline-block">כניסה לדף הניהול</a></p><p style="color:#777;font-size:13px">הקישור תקף ל-15 דקות ולשימוש אחד. אם לא ביקשת להיכנס, אפשר להתעלם מהמייל.</p></div>' });
  return { ok: true };
}
async function adminSession(t) {
  if (!/^[0-9a-f]{64}$/.test(String(t || ''))) return { ok: false };
  const r = await db.del('login_tokens', 'hash=' + eq(K.sha(t)));       // נמחק מיד = שימוש אחד
  if (!r.length || new Date(r[0].exp) < new Date()) return { ok: false };
  return { ok: true, s: await newSession() };
}

// ================= פעולות דף הניהול =================
async function admin(d) {
  if (!(await authed(d.s))) return { ok: false, reason: 'auth' };
  const op = d.op, today = K.ilNow().date;

  if (op === 'list') {
    const [c, bk, b, pw] = await Promise.all([K.cfg(), db.sel('bookings', 'select=key,service,name,phone,email&key=gte.' + today + '&order=key'), K.blocks(), db.sel('secrets', 'select=key&key=eq.pw')]);
    return { ok: true, admin: K.adminEmail(), hasPw: !!pw.length, bookings: bk,
      blocks: { days: b.days.filter(k => k >= today), hours: b.hours.filter(k => k >= today) },
      cfg: { open: c.open, close: c.close, closed_weekdays: c.closed_weekdays, closed_dates: c.closed_dates, whatsapp: c.whatsapp },
      thanks: K.fill(c.thanks_text || K.THANKS, { address: c.address || '', map: K.mapLink(c.address) }),
      services: K.services(c) };
  }
  if (op === 'logout') { await db.del('sessions', 'hash=' + eq(K.sha(d.s))); return { ok: true }; }
  if (op === 'setpw') {
    const pw = d.pw;
    if (typeof pw !== 'string' || pw.length < 8 || pw.length > 200) return { ok: false, reason: 'weak' };
    await db.upsert('secrets', [{ key: 'pw', value: K.pwHash(pw) }]);
    await db.del('sessions', 'hash=neq.' + encodeURIComponent(K.sha(d.s)));   // מנתק את שאר המכשירים
    return { ok: true };
  }
  if (op === 'content') {
    const c = await K.cfg();
    return { ok: true, fields: K.FIELDS.map(f => ({ key: f[0], label: f[2], group: f[3], value: c[f[0]] ?? '' })) };
  }
  if (op === 'setcontent') {
    const allowed = new Set(K.FIELDS.map(f => f[0]));
    const rows = Object.entries(d.values || {}).filter(([k, v]) => allowed.has(k) && typeof v === 'string' && v.length <= 2000).map(([key, value]) => ({ key, value }));
    if (rows.length) await db.upsert('content', rows);
    return { ok: true };
  }
  if (op === 'block' || op === 'unblock') {
    const keys = [].concat(d.keys || []).map(String).filter(k => (K.dayKey(k) || K.slotKey(k)) && K.realDate(k.slice(0, 10)) && k >= today).slice(0, 120);
    if (!keys.length) return { ok: true };
    if (op === 'block') await db.upsert('blocks', keys.map(key => ({ key, note: String(d.note || '').slice(0, 80) })));
    else await db.del('blocks', 'key=' + inList(keys));
    return { ok: true };
  }
  if (op === 'cancel') {
    if (!K.slotKey(d.key)) return { ok: false, reason: 'invalid' };
    const r = await db.del('bookings', 'key=' + eq(d.key));
    if (!r.length) return { ok: false, reason: 'notfound' };
    const b = r[0];
    await db.ins('cancelled', [{ key: b.key, service: b.service, name: b.name, phone: b.phone, email: b.email, created: b.created }], 'return=minimal');
    await K.calDel(b.event_id);
    return { ok: true };
  }
  if (op === 'add') {
    if (!K.slotKey(d.key) || !K.realDate(d.key.slice(0, 10)) || d.key.slice(0, 10) < today) return { ok: false, reason: 'invalid' };
    const name = String(d.name || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    const phone = String(d.phone || '').replace(/\D/g, '').replace(/^972/, '0');
    if (name.length < 2 || (phone && !/^0\d{8,9}$/.test(phone))) return { ok: false, reason: 'invalid' };
    const b = { key: d.key, name, phone, service: String(d.service || '').slice(0, 60) || 'טיפול', source: 'admin' };
    try { await db.ins('bookings', [b], 'return=minimal'); }
    catch (e) { if (e.status === 409) return { ok: false, reason: 'taken' }; throw e; }
    const id = await K.calAdd(b);
    if (id) await db.upd('bookings', 'key=' + eq(b.key), { event_id: id });
    return { ok: true };
  }
  return { ok: false, reason: 'invalid' };
}
