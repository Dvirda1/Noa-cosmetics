// Noa Cosmetics - השרת: מאגר (Supabase), מיילים (Gmail), יומן גוגל, זמנים בשעון ישראל.
// כל הסודות מגיעים ממשתני סביבה ב-Vercel, אף פעם לא מהקוד.
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

const env = k => (process.env[k] || '').trim();
export const TZ = 'Asia/Jerusalem';
export const OFF_DAYS = [5, 6]; // שישי ושבת סגורים תמיד
export const DN = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export const SVC = [['עיצוב גבות', 'מראה מדויק וטבעי', 60], ['הרמת ריסים', 'ריסים מורמים ומסולסלים', 200], ['הרמת גבות', 'גבות מסודרות ומלאות', 150], ['חבילה משולבת', 'כמה טיפולים בביקור אחד', 320]];
export const THANKS = 'היי {name} 💗\nתודה רבה על קביעת התור!\nהתור שלך ל{service} נקבע ל{when}.\nהכתובת: {address}\nמחכה לך ב-Noa Cosmetics ✨ נעה\nאם צריך לשנות או לבטל, אפשר לכתוב לי כאן.';

// ---- ברירות מחדל לתוכן + הסבר לכל שדה (מוצג בדף הניהול) ----
export const FIELDS = [
  ['hero_title', 'מבט שמדבר בשבילך.\nגבות וריסים שמדגישים את היופי הטבעי שלך', 'כותרת ראשית', 'אתר'],
  ['hero_sub', 'תוצאה מדויקת | מראה מטופח | יחס אישי', 'שורה מתחת לכותרת', 'אתר'],
  ['svc_title', 'הטיפולים שלי', 'כותרת חלק הטיפולים', 'אתר'],
  ['svc_text', 'כל טיפול מותאם למבנה הפנים ולסגנון האישי שלך, כדי שהתוצאה תהיה טבעית ומחמיאה.', 'טקסט חלק הטיפולים', 'אתר'],
  ['about_title', 'נעים להכיר, אני נעה', 'כותרת "אודות"', 'אתר'],
  ['about_text', 'אני נעה דהרי, קוסמטיקאית המתמחה בעיצוב גבות, הרמת גבות והרמת ריסים. אצלי תקבלי יחס אישי, עבודה מדויקת ותוצאה טבעית שמדגישה את היופי שלך.', 'טקסט "אודות"', 'אתר'],
  ...SVC.flatMap((s, i) => [['svc' + (i + 1) + '_name', s[0], 'שם טיפול ' + (i + 1), 'טיפולים'], ['svc' + (i + 1) + '_desc', s[1], 'תיאור טיפול ' + (i + 1), 'טיפולים'], ['svc' + (i + 1) + '_price', String(s[2]), 'מחיר טיפול ' + (i + 1) + ' (₪)', 'טיפולים']]),
  ['address', 'משעול ברל כצנלסון 2, שדרות', 'כתובת', 'פרטים'],
  ['phone', '050-647-3569', 'טלפון', 'פרטים'],
  ['whatsapp', '972506473569', 'וואטסאפ: 972 ואז המספר בלי 0', 'פרטים'],
  ['hours_text', 'ימים א׳–ה׳ 09:00–18:00 · שישי ושבת סגור', 'שעות פעילות (הטקסט שמוצג באתר)', 'שעות'],
  ['open', '9', 'שעת התור הראשון (מספר)', 'שעות'],
  ['close', '18', 'שעת סגירה (התור האחרון שעה לפני)', 'שעות'],
  ['closed_weekdays', '5,6', 'ימים סגורים קבועים: 0=ראשון … 6=שבת', 'שעות'],
  ['thanks_text', THANKS, 'הודעת התודה בוואטסאפ. אפשר: {name} {service} {when} {address} {map}', 'הודעות'],
  ['reminder_text', 'היי {name}, תזכורת לתור שלך מחר ב-{time} ({service}) ב-Noa Cosmetics 💗 מחכה לך! אם צריך לשנות, כתבי לי כאן.', 'נוסח התזכורת. אפשר: {name} {time} {service}', 'הודעות'],
  ['keep_days', '180', 'אחרי כמה ימים למחוק פרטי לקוחות של תורים שעברו', 'הודעות'],
  ['hero_image', '', 'קישור לתמונת ראש הדף (ריק = התמונה הנוכחית)', 'תמונות'],
  ['about_image', '', 'קישור לתמונת "אודות"', 'תמונות'],
  ...SVC.map((s, i) => ['svc' + (i + 1) + '_image', '', 'קישור לתמונה של טיפול ' + (i + 1), 'תמונות'])
];
export const PRIVATE_KEYS = ['thanks_text', 'reminder_text', 'keep_days', 'notify_email', 'site_url', 'gallery_folder'];

// ================= Supabase (REST) =================
function sbHeaders(extra) {
  const k = env('SUPABASE_SERVICE_KEY');
  const h = { apikey: k, 'Content-Type': 'application/json', ...extra };
  if (!k.startsWith('sb_')) h.Authorization = 'Bearer ' + k;   // מפתח ישן (JWT)
  return h;
}
async function sb(path, opt = {}) {
  const r = await fetch(env('SUPABASE_URL').replace(/\/$/, '') + '/rest/v1/' + path, { ...opt, headers: sbHeaders(opt.headers) });
  const txt = await r.text();
  if (!r.ok) { const e = new Error('db ' + r.status + ' ' + txt.slice(0, 200)); e.status = r.status; e.body = txt; throw e; }
  return txt ? JSON.parse(txt) : null;
}
export const db = {
  sel: (t, q = '') => sb(t + (q ? '?' + q : '')),
  ins: (t, rows, prefer = 'return=representation') => sb(t, { method: 'POST', body: JSON.stringify(rows), headers: { Prefer: prefer } }),
  upsert: (t, rows) => sb(t, { method: 'POST', body: JSON.stringify(rows), headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } }),
  upd: (t, q, patch) => sb(t + '?' + q, { method: 'PATCH', body: JSON.stringify(patch), headers: { Prefer: 'return=minimal' } }),
  del: (t, q) => sb(t + '?' + q, { method: 'DELETE', headers: { Prefer: 'return=representation' } }),
  rpc: (fn, args) => sb('rpc/' + fn, { method: 'POST', body: JSON.stringify(args) })
};
export const eq = v => 'eq.' + encodeURIComponent(v);
export const inList = a => 'in.(' + a.map(v => '"' + String(v).replace(/"/g, '') + '"').join(',') + ')';
export const hit = (k, max, secs) => db.rpc('hit', { p_k: k, p_max: max, p_secs: secs });

export async function cfg() {
  const o = {};
  FIELDS.forEach(f => { o[f[0]] = f[1]; });
  (await db.sel('content', 'select=key,value')).forEach(r => { o[r.key] = r.value; });
  return o;
}
export async function blocks() {
  const days = [], hours = [];
  (await db.sel('blocks', 'select=key')).forEach(r => { (r.key.length === 10 ? days : hours).push(r.key); });
  return { days, hours };
}
export const services = c => SVC.map((s, i) => c['svc' + (i + 1) + '_name'] || s[0]);

// ================= זמנים (שעון ישראל) =================
export function ilNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map(x => [x.type, x.value]));
  return { date: p.year + '-' + p.month + '-' + p.day, stamp: p.year + '-' + p.month + '-' + p.day + '_' + p.hour + ':' + p.minute };
}
export function addDays(date, n) { const [y, m, d] = date.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d + n)); return t.toISOString().slice(0, 10); }
export function weekday(date) { const [y, m, d] = date.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
export function when(key) {
  const [date, t] = key.split('_'), [y, m, d] = date.split('-').map(Number);
  return { date, t, h: +t.slice(0, 2), label: 'יום ' + DN[weekday(date)] + ' ' + d + '/' + m + ' בשעה ' + t };
}
export const slotKey = k => /^\d{4}-\d{2}-\d{2}_\d{2}:00$/.test(String(k || ''));
export const dayKey = k => /^\d{4}-\d{2}-\d{2}$/.test(String(k || ''));
export const realDate = date => { const [y, m, d] = date.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCDate() === d && t.getUTCMonth() === m - 1; };
export const wa = p => { p = String(p).replace(/\D/g, ''); return p.startsWith('0') ? '972' + p.slice(1) : p; };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
export const fill = (tpl, o) => String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => (k in o ? o[k] : m));
export const mapLink = a => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a || '');

// ================= אבטחה =================
export const sha = t => crypto.createHash('sha256').update(String(t)).digest('hex');
export const token = () => crypto.randomBytes(32).toString('hex');
export function pwHash(pw) { const salt = crypto.randomBytes(16).toString('hex'); return 'scrypt$' + salt + '$' + crypto.scryptSync(pw, salt, 64).toString('hex'); }
export function pwCheck(pw, stored) {
  const [alg, salt, h] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !salt || !h) return false;
  const a = crypto.scryptSync(pw, salt, 64), b = Buffer.from(h, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export const adminEmail = () => env('ADMIN_EMAIL').toLowerCase();
export const notifyEmail = c => (c && c.notify_email) || env('NOTIFY_EMAIL') || env('ADMIN_EMAIL');
export const siteUrl = () => (env('SITE_URL') || 'https://noa-cosmetics.vercel.app').replace(/\/$/, '');

// ================= מיילים (Gmail) =================
let tx = null;
export async function mail({ to, subject, text, html }) {
  if (!env('GMAIL_USER') || !env('GMAIL_APP_PASSWORD') || !to) return false;
  tx = tx || nodemailer.createTransport({ service: 'gmail', auth: { user: env('GMAIL_USER'), pass: env('GMAIL_APP_PASSWORD').replace(/\s/g, '') } });
  try { await tx.sendMail({ from: { name: 'Noa Cosmetics', address: env('GMAIL_USER') }, to, subject, text, html }); return true; }
  catch (e) { console.error('mail', e.message); return false; }
}

// ================= יומן גוגל (חשבון שירות) =================
let gtok = null;
async function gToken() {
  if (gtok && gtok.exp > Date.now() + 60e3) return gtok.t;
  const email = env('GOOGLE_SA_EMAIL'), key = env('GOOGLE_SA_KEY').replace(/\\n/g, '\n');
  if (!email || !key) return null;
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url'), now = Math.floor(Date.now() / 1000);
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: email, scope: 'https://www.googleapis.com/auth/calendar.events', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const jwt = unsigned + '.' + crypto.sign('RSA-SHA256', Buffer.from(unsigned), key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + jwt });
  const j = await r.json();
  if (!j.access_token) { console.error('gtoken', JSON.stringify(j).slice(0, 200)); return null; }
  gtok = { t: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return gtok.t;
}
const calUrl = () => 'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(env('CALENDAR_ID')) + '/events';
export async function calAdd(b) {
  try {
    const t = await gToken(); if (!t || !env('CALENDAR_ID')) return null;
    const w = when(b.key), end = String(w.h + 1).padStart(2, '0') + ':00';
    const r = await fetch(calUrl(), { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({
      summary: b.service + ' - ' + b.name,
      description: b.phone ? 'טלפון: ' + b.phone + '\nוואטסאפ: https://wa.me/' + wa(b.phone) : 'נרשם ידנית',
      start: { dateTime: w.date + 'T' + w.t + ':00', timeZone: TZ }, end: { dateTime: w.date + 'T' + end + ':00', timeZone: TZ },
      reminders: { useDefault: true } }) });
    const j = await r.json();
    if (!j.id) console.error('cal add', JSON.stringify(j).slice(0, 200));
    return j.id || null;
  } catch (e) { console.error('cal add', e.message); return null; }
}
export async function calDel(id) {
  if (!id) return;
  try { const t = await gToken(); if (t) await fetch(calUrl() + '/' + encodeURIComponent(id), { method: 'DELETE', headers: { Authorization: 'Bearer ' + t } }); }
  catch (e) { console.error('cal del', e.message); }
}

// ================= עזרי HTTP =================
export function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (e) { return null; }
}
export function send(res, obj, status = 200, cache = 'no-store') {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.status(status).send(JSON.stringify(obj));
}
