// רץ אוטומטית כל יום (Vercel Cron): תזכורות למחר, סיכום לנעה, ניקוי פרטים ישנים.
// הפנייה היומית למאגר גם שומרת אותו "ער" במסלול החינמי של Supabase.
import * as K from '../lib/core.js';
const { db, eq, send } = K;

export default async function handler(req, res) {
  // אם הוגדר CRON_SECRET ב-Vercel, רק Vercel יכול להפעיל. בלי זה: עד 3 הפעלות בשעה (הפעולה ממילא לא שולחת פעמיים).
  const secret = (process.env.CRON_SECRET || '').trim();
  if (secret && req.headers.authorization !== 'Bearer ' + secret) return send(res, { ok: false }, 401);
  try {
    if (!secret && !(await K.hit('cron_1h', 3, 3600))) return send(res, { ok: false }, 429);
    const c = await K.cfg(), now = K.ilNow(), tom = K.addDays(now.date, 1);
    const rows = await db.sel('bookings', 'select=key,service,name,phone,email&reminded=is.null&key=like.' + tom + '*&order=key');
    const lines = [];
    for (const r of rows) {
      const time = r.key.slice(11), txt = K.fill(c.reminder_text, { name: r.name, time, service: r.service });
      if (r.email) await K.mail({ to: r.email, subject: 'תזכורת לתור מחר ב-' + time, text: txt });
      lines.push(time + ' · ' + r.name + ' · ' + r.service + (r.phone ? '\nלשליחת תזכורת בוואטסאפ: https://wa.me/' + K.wa(r.phone) + '?text=' + encodeURIComponent(txt) : ''));
      await db.upd('bookings', 'key=' + eq(r.key), { reminded: new Date().toISOString() });
    }
    if (lines.length) await K.mail({ to: K.notifyEmail(c), subject: 'התורים של מחר (' + lines.length + ')', text: lines.join('\n\n') });

    // פרטיות: מוחק תורים שעברו לפני keep_days ימים (ברירת מחדל 180)
    const days = parseInt(c.keep_days, 10);
    if (days > 0) {
      const cut = K.addDays(now.date, -days);
      await db.del('bookings', 'key=lt.' + cut);
      await db.del('cancelled', 'key=lt.' + cut);
    }
    await db.del('blocks', 'key=lt.' + now.date);
    const iso = new Date().toISOString();
    await db.del('sessions', 'exp=lt.' + iso);
    await db.del('login_tokens', 'exp=lt.' + iso);
    return send(res, { ok: true, reminders: lines.length });
  } catch (e) {
    console.error(e && e.stack || e);
    return send(res, { ok: false }, 500);
  }
}
