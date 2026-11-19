// Noa Cosmetics - ניהול האתר, תורים, התראות ותזכורות
const THANKS = 'היי {name} 💗\nתודה רבה על קביעת התור!\nהתור שלך ל{service} נקבע ל{when}.\nהכתובת: {address}\nניווט: {map}\nמחכה לך ב-Noa Cosmetics ✨ נעה\nאם צריך לשנות או לבטל, אפשר לכתוב לי כאן.';
const OFF_DAYS = [5,6]; // שישי ושבת סגורים תמיד
const esc_ = s => String(s||'').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const SVC = [['עיצוב גבות','מראה מדויק וטבעי',60],['הרמת ריסים','ריסים מורמים ומסולסלים',200],['הרמת גבות','גבות מסודרות ומלאות',150],['חבילה משולבת','כמה טיפולים בביקור אחד',320]];

function defaults_() {
  const r = [
    ['hero_title','מבט שמדבר בשבילך.\nגבות וריסים שמדגישים את היופי הטבעי שלך','כותרת ראשית'],
    ['hero_sub','תוצאה מדויקת | מראה מטופח | יחס אישי','שורה מתחת לכותרת'],
    ['svc_title','הטיפולים שלי','כותרת חלק הטיפולים'],
    ['svc_text','כל טיפול מותאם למבנה הפנים ולסגנון האישי שלך, כדי שהתוצאה תהיה טבעית ומחמיאה.','טקסט חלק הטיפולים'],
    ['about_title','נעים להכיר, אני נעה','כותרת "אודות"'],
    ['about_text','אני נעה דהרי, קוסמטיקאית המתמחה בעיצוב גבות, הרמת גבות והרמת ריסים. אצלי תקבלי יחס אישי, עבודה מדויקת ותוצאה טבעית שמדגישה את היופי שלך.','טקסט "אודות"'],
    ['address','משעול ברל כצנלסון 2, שדרות','כתובת'],
    ['phone','050-647-3569','טלפון'],
    ['whatsapp','972506473569','וואטסאפ בפורמט בינלאומי: 972 ואז המספר בלי 0'],
    ['hours_text','ימים א׳–ה׳ 09:00–18:00 · שישי ושבת סגור','הטקסט שמוצג ללקוחות על שעות הפעילות'],
    ['open','9','שעת פתיחה (מספר)'],
    ['close','18','שעת סגירה בימים א׳–ה׳'],
    ['fri_close','13','שעת סגירה ביום שישי'],
    ['closed_weekdays','5,6','ימים סגורים: 0=ראשון ... 6=שבת, מופרדים בפסיק (שישי ושבת סגורים תמיד)'],
    ['closed_dates','','תאריכי חופשה בפורמט 2026-12-25, מופרדים בפסיק'],
    ['notify_email','','אימייל לקבלת התראות (ריק = האימייל של בעל הגיליון)'],
    ['thanks_text',THANKS,'הודעת התודה בוואטסאפ אחרי קביעת תור. אפשר להשתמש ב- {name} {service} {when} {address} {map}'],
    ['reminder_text','היי {name}, תזכורת לתור שלך מחר ב-{time} ({service}) ב-Noa Cosmetics 💗 מחכה לך! אם צריך לשנות, כתבי לי כאן.','נוסח התזכורת. אפשר להשתמש ב- {name} {time} {service}'],
    ['site_url','https://noa-cosmetics.vercel.app','כתובת האתר (לקישור הכניסה לדף הניהול)'],
    ['keep_days','180','כמה ימים לשמור פרטי לקוחות של תורים שעברו (ריק = לשמור תמיד)'],
    ['hero_image','','קישור לתמונה מ-Google Drive להחלפת תמונת ראש הדף (ריק = התמונה הנוכחית)'],
    ['about_image','','קישור לתמונה מ-Drive עבור חלק "אודות"']
  ];
  SVC.forEach((s,i)=>{const n=i+1;
    r.push(['svc'+n+'_name',s[0],'שם טיפול '+n],['svc'+n+'_desc',s[1],'תיאור קצר לטיפול '+n],['svc'+n+'_price',String(s[2]),'מחיר טיפול '+n],['svc'+n+'_image','','קישור לתמונה מ-Drive לטיפול '+n+' (אופציונלי)']);});
  r.push(['gallery_folder','','נוצר אוטומטית. אל תשני']);
  return r;
}

// מריצים פעם אחת ידנית: יוצר לשוניות, תיקיית גלריה ב-Drive ותזכורת יומית
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let c = ss.getSheetByName('Content');
  if (!c) {
    c = ss.insertSheet('Content');
    c.getRange('A1:C1').setValues([['key','value','הסבר']]).setFontWeight('bold');
    const d = defaults_();
    c.getRange(2,1,d.length,3).setNumberFormat('@').setValues(d);
    c.setColumnWidth(1,140); c.setColumnWidth(2,420); c.setColumnWidth(3,380);
    c.getRange(2,2,d.length,1).setWrap(true);
  }
  const have = c.getRange(1,1,c.getLastRow(),1).getValues().map(r => r[0]);
  defaults_().forEach(r => { if (have.indexOf(r[0]) < 0) c.appendRow(r); });
  if (!cfg_().gallery_folder) {
    const f = DriveApp.createFolder('Noa Cosmetics - גלריה');
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    setCfg_('gallery_folder', f.getId());
  }
  getBookings_();
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='dailyReminders').forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyReminders').timeBased().everyDays(1).atHour(18).create();
  Logger.log('הכול מוכן. תיקיית הגלריה: ' + DriveApp.getFolderById(cfg_().gallery_folder).getUrl());
}

function cfg_() {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Content'), o = {};
  if (s) s.getDataRange().getValues().slice(1).forEach(r => { if (r[0]) o[r[0]] = String(r[1]); });
  return o;
}
function setCfg_(k, v) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Content');
  const keys = s.getRange(1,1,s.getLastRow(),1).getValues().map(r=>r[0]);
  const i = keys.indexOf(k);
  if (i > -1) s.getRange(i+1,2).setValue(v); else s.appendRow([k, v, '']);
}
function getBookings_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName('Bookings');
  if (!s) { s = ss.insertSheet('Bookings'); s.appendRow(['key','date','time','service','name','phone','email','created','reminded']); s.setFrozenRows(1); }
  return s;
}
const clean_ = v => { v = String(v||'').slice(0,80); return /^[=+\-@]/.test(v) ? "'"+v : v; };
const json_ = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const wa_ = p => { p = String(p).replace(/\D/g,''); return p.startsWith('0') ? '972'+p.slice(1) : p; };
const DN = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
function when_(key) { const [d,t] = key.split('_'), [y,m,da] = d.split('-').map(Number); return {y,m,da,t,h:+t.split(':')[0],label:'יום '+DN[new Date(y,m-1,da).getDay()]+' '+da+'/'+m+' בשעה '+t}; }

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'content') {
    const cache = CacheService.getScriptCache(), hit = cache.get('content');
    if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
    const c = cfg_(); let g = [];
    try {
      const it = DriveApp.getFolderById(c.gallery_folder).getFiles(), a = [];
      while (it.hasNext()) { const f = it.next(); if (/^image\//.test(f.getMimeType())) a.push([f.getId(), f.getDateCreated().getTime()]); }
      g = a.sort((x,y)=>y[1]-x[1]).map(x=>x[0]);
    } catch (err) {}
    delete c.notify_email; delete c.gallery_folder; delete c.keep_days; delete c.site_url; delete c.thanks_text; delete c.reminder_text;
    const out = JSON.stringify({content:c, gallery:g}); cache.put('content', out, 60);
    return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
  }
  const b = blocks_();
  return json_({ taken: getBookings_().getDataRange().getValues().slice(1).map(r => String(r[0])).concat(b.hours), closed: b.days });
}

// ---- אבטחה: בדיקת כל פרט שמגיע מהאתר לפני שנשמר ----
const NAME_RE = /^[\u0590-\u05FFa-zA-Z][\u0590-\u05FFa-zA-Z '\-\.\u05F3\u05F4"]{1,39}$/;
const EMAIL_RE = /^[^\s@<>()"',;:]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/;
function validate_(d) {
  if (!d || typeof d !== 'object' || d.website) return null;               // website = מלכודת לבוטים
  const key = String(d.key||'');
  if (!/^\d{4}-\d{2}-\d{2}_\d{2}:00$/.test(key)) return null;
  const name = String(d.name||'').trim().replace(/\s+/g,' ');
  if (!NAME_RE.test(name)) return null;
  const phone = String(d.phone||'').replace(/\D/g,'').replace(/^972/,'0');
  if (!/^05\d{8}$/.test(phone)) return null;
  const email = String(d.email||'').trim();
  if (email && (email.length > 120 || !EMAIL_RE.test(email))) return null;
  const c = cfg_(), names = SVC.map((s,i) => c['svc'+(i+1)+'_name'] || s[0]).concat(SVC.map(s => s[0]));
  const service = String(d.service||'');
  if (names.indexOf(service) < 0) return null;
  // המועד חייב להיות בעתיד, עד 45 יום קדימה, ובשעות הפעילות
  const w = when_(key), at = new Date(w.y, w.m-1, w.da, w.h, 0), now = Date.now();
  if (isNaN(at) || at.getDate() !== w.da || at <= now || at - now > 45*864e5) return null;
  const wd = at.getDay(), open = +(c.open||9), close = wd === 5 ? +(c.fri_close||13) : +(c.close||18);
  if (OFF_DAYS.indexOf(wd) > -1 || String(c.closed_weekdays||'6').split(/[,\s]+/).indexOf(String(wd)) > -1) return null;
  if (String(c.closed_dates||'').split(/[,\s]+/).indexOf(key.split('_')[0]) > -1) return null;
  if (w.h < open || w.h >= close) return null;
  const b = blocks_();
  if (b.days.indexOf(key.split('_')[0]) > -1 || b.hours.indexOf(key) > -1) return null;
  return { key, name, phone, email, service, date: key.split('_')[0], time: w.t };
}

// מונה יומי (נשמר עד סוף היום), להגנה על מכסת המיילים של Google
function dailyOk_(name, max) {
  const p = PropertiesService.getScriptProperties(), day = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const k = 'day_' + name, v = String(p.getProperty(k) || ''), n = v.indexOf(day + ':') === 0 ? +v.split(':')[1] : 0;
  if (n >= max) return false;
  p.setProperty(k, day + ':' + (n + 1));
  return true;
}
// הגבלת קצב: מונע הצפה של תורים מזויפים
function rateOk_() {
  const cache = CacheService.getScriptCache(), n = +(cache.get('rate') || 0);
  if (n >= 8) return false;               // עד 8 תורים חדשים בכל 10 דקות לכל האתר
  if (!dailyOk_('bookings', 25)) return false;   // ועד 25 ביום
  cache.put('rate', String(n+1), 600);
  return true;
}

function doPost(e) {
  let raw = null;
  try { raw = JSON.parse(e.postData.contents); } catch (err) {}
  if (raw && raw.action === 'login') return json_(adminLogin_());
  if (raw && raw.action === 'session') return json_(adminSession_(raw.t));
  if (raw && raw.action === 'pwlogin') return json_(pwLogin_(raw.email, raw.pw));
  if (raw && raw.action === 'admin') { try { return json_(admin_(raw)); } catch (err) { console.error(String(err)); return json_({ok:false, reason:'error'}); } }
  let d;
  try { d = validate_(raw); } catch (err) { d = null; }
  if (!d) return json_({ok:false, reason:'invalid'});
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json_({ok:false, reason:'busy'});
  let ok = false, reason = 'taken';
  try {
    const s = getBookings_(), rows = s.getDataRange().getValues().slice(1);
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (rows.some(r => String(r[0]) === d.key)) reason = 'taken';
    else if (rows.filter(r => String(r[5]).replace(/\D/g,'') === d.phone && String(r[0]) >= today).length >= 2) reason = 'limit';
    else if (!rateOk_()) reason = 'busy';
    else {
      s.appendRow([d.key, d.date, d.time, clean_(d.service), clean_(d.name), "'"+d.phone, clean_(d.email), new Date(), '']);
      ok = true;
    }
  } finally { lock.releaseLock(); }
  if (ok) notify_(d);
  return json_(ok ? {ok:true} : {ok:false, reason});
}

// פרטיות: מוחק שם, טלפון ואימייל של תורים ישנים (ברירת מחדל: אחרי 180 יום).
// אפשר לשנות בגיליון Content בשורה keep_days. ריק = לא למחוק אף פעם.
function purgeOld_() {
  const v = cfg_().keep_days, days = v === undefined ? 180 : parseInt(v, 10);
  if (!days || days < 1) return;
  const s = getBookings_(), rows = s.getDataRange().getValues();
  const cut = Utilities.formatDate(new Date(Date.now() - days*864e5), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  for (let i = rows.length - 1; i >= 1; i--) if (String(rows[i][0]) && String(rows[i][0]) < cut) s.deleteRow(i+1);
  const x = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cancelled');
  if (x) { const xr = x.getDataRange().getValues(); for (let i = xr.length - 1; i >= 1; i--) if (String(xr[i][0]) < cut) x.deleteRow(i+1); }
}
function purgeAdmin_() {
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const s = getBlocks_(), rows = s.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) if (String(rows[i][0]).slice(0,10) < today) s.deleteRow(i+1);
  const p = PropertiesService.getScriptProperties(), all = p.getProperties(), now = Date.now();
  Object.keys(all).forEach(k => { if (k.indexOf('sess_') === 0 && +all[k] < now) p.deleteProperty(k); });
}

function notify_(d) {
  const c = cfg_(), w = when_(d.key), to = c.notify_email || Session.getEffectiveUser().getEmail();
  const msg = (c.thanks_text || THANKS).replace(/\{name\}/g,d.name).replace(/\{service\}/g,d.service).replace(/\{when\}/g,w.label).replace(/\{address\}/g,c.address||'').replace(/\{map\}/g,'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(c.address||''));
  const link = 'https://wa.me/'+wa_(d.phone)+'?text='+encodeURIComponent(msg);
  try { MailApp.sendEmail({to, name:'Noa Cosmetics', subject:'תור חדש: '+d.name+' · '+w.label,
    body:'נקבע תור חדש\n\nשם: '+d.name+'\nטלפון: '+d.phone+'\nטיפול: '+d.service+'\nמועד: '+w.label+'\n\nלשליחת הודעת תודה בוואטסאפ: '+link,
    htmlBody:'<div dir="rtl" style="font-family:Arial,sans-serif;font-size:16px"><h3>נקבע תור חדש ✨</h3><p><b>שם:</b> '+esc_(d.name)+'<br><b>טלפון:</b> '+esc_(d.phone)+'<br><b>טיפול:</b> '+esc_(d.service)+'<br><b>מועד:</b> '+w.label+'</p><p><a href="'+link+'" style="background:#25D366;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;display:inline-block">שליחת הודעת תודה בוואטסאפ 💬</a></p></div>'}); } catch(err) { console.error(String(err)); }
  try { CalendarApp.getDefaultCalendar().createEvent(d.service+' - '+d.name, new Date(w.y,w.m-1,w.da,w.h,0), new Date(w.y,w.m-1,w.da,w.h+1,0), {description:'טלפון: '+d.phone}); } catch(err) { console.error(String(err)); }
  if (d.email) try { MailApp.sendEmail({to:d.email, name:'Noa Cosmetics', subject:'התור שלך נקבע ✨',
    body:'היי '+d.name+',\nהתור שלך ל'+d.service+' נקבע ל'+w.label+'.\nכתובת: '+c.address+'\nלשינוי או ביטול אפשר לכתוב בוואטסאפ: https://wa.me/'+c.whatsapp+'\n\nנתראה! Noa Cosmetics'}); } catch(err) { console.error(String(err)); }
}

// רץ אוטומטית כל יום ב-18:00: תזכורת ללקוחות עם אימייל + סיכום למחר עם קישורי וואטסאפ אלייך
function dailyReminders() {
  const c = cfg_(), s = getBookings_(), rows = s.getDataRange().getValues();
  const tom = Utilities.formatDate(new Date(Date.now()+864e5), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const lines = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i], key = String(r[0]);
    if (!key.startsWith(tom) || r[8]) continue;
    const time = key.split('_')[1], txt = (c.reminder_text||'').replace('{name}',r[4]).replace('{time}',time).replace('{service}',r[3]);
    if (r[6]) try { MailApp.sendEmail({to:r[6], name:'Noa Cosmetics', subject:'תזכורת לתור מחר ב-'+time, body:txt}); } catch(err) { console.error(String(err)); }
    lines.push(time+' · '+r[4]+' · '+r[3]+'\nלשליחת תזכורת בוואטסאפ: https://wa.me/'+wa_(r[5])+'?text='+encodeURIComponent(txt));
    s.getRange(i+1,9).setValue(new Date());
  }
  try { purgeOld_(); } catch(err) { console.error(String(err)); }
  try { purgeAdmin_(); } catch(err) { console.error(String(err)); }
  if (lines.length) MailApp.sendEmail({to:c.notify_email||Session.getEffectiveUser().getEmail(), name:'Noa Cosmetics', subject:'התורים של מחר ('+lines.length+')', body:lines.join('\n\n')});
}

// בדיקה ידנית: מריצים מהעורך ובודקים שהגיעו מייל ואירוע ביומן. אחר כך אפשר למחוק את האירוע
function testNotify() {
  notify_({key: Utilities.formatDate(new Date(Date.now()+864e5), Session.getScriptTimeZone(), 'yyyy-MM-dd')+'_10:00', name:'בדיקה', phone:'0500000000', service:'עיצוב גבות', email:Session.getEffectiveUser().getEmail()});
}

// =====================================================================
// דף הניהול של נעה (admin.html): כניסה בקישור למייל, תורים, ביטולים וחסימות
// =====================================================================
function getBlocks_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName('Blocks');
  if (!s) { s = ss.insertSheet('Blocks'); s.appendRow(['key','note','created']); s.setFrozenRows(1); s.getRange('A:A').setNumberFormat('@'); }
  return s;
}
// key = 2026-12-25 (יום שלם) או 2026-12-25_14:00 (שעה אחת)
function blocks_() {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Blocks'), days = [], hours = [];
  if (s) s.getDataRange().getValues().slice(1).forEach(r => { const k = r[0] instanceof Date ? Utilities.formatDate(r[0], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[0]).trim(); if (/^\d{4}-\d{2}-\d{2}$/.test(k)) days.push(k); else if (/^\d{4}-\d{2}-\d{2}_\d{2}:00$/.test(k)) hours.push(k); });
  return { days, hours };
}
const sha_ = t => Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(t)).map(b => ('0'+(b&255).toString(16)).slice(-2)).join('');
const token_ = () => (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
// רק המנהל (החשבון שפרסם את הסקריפט) יכול להיכנס לדף הניהול
const adminEmail_ = () => Session.getEffectiveUser().getEmail();
const PW_ITER = 1500;
function pwHash_(pw, salt) { let h = salt + '|' + pw; for (let i = 0; i < PW_ITER; i++) h = sha_(salt + h); return h; }
function newSession_() {
  const s = token_();
  PropertiesService.getScriptProperties().setProperty('sess_' + sha_(s), String(Date.now() + 60*864e5));
  return s;
}
// כניסה עם מייל + סיסמה. 5 טעויות = נעילה ל-15 דקות + מייל אזהרה
function pwLogin_(email, pw) {
  const cache = CacheService.getScriptCache(), fails = +(cache.get('pw_fail') || 0);
  if (fails >= 5) return {ok:false, reason:'locked'};
  const p = PropertiesService.getScriptProperties(), hash = p.getProperty('pw_hash'), salt = p.getProperty('pw_salt');
  const good = !!hash && String(email||'').trim().toLowerCase() === adminEmail_().toLowerCase()
    && typeof pw === 'string' && pw.length <= 200 && pwHash_(pw, salt) === hash;
  if (!good) {
    cache.put('pw_fail', String(fails+1), 900);
    if (fails + 1 === 5 && dailyOk_('alert', 1)) try { MailApp.sendEmail({to: adminEmail_(), name:'Noa Cosmetics', subject:'⚠️ ניסיונות כניסה שגויים לדף הניהול',
      body:'היו 5 ניסיונות כניסה שגויים לדף הניהול, והכניסה ננעלה ל-15 דקות.\nאם זה לא היית אתה, מומלץ להחליף סיסמה מתוך דף הניהול.'}); } catch (err) {}
    return {ok:false, reason:'wrong'};
  }
  cache.remove('pw_fail');
  return {ok:true, s:newSession_()};
}

// שלב 1: שולח קישור כניסה רק למייל של נעה (עד 3 פעמים ב-15 דקות)
function adminLogin_() {
  const cache = CacheService.getScriptCache(), n = +(cache.get('login_rate') || 0);
  if (n >= 3) return {ok:true};                       // לא מגלים שיש הגבלה
  cache.put('login_rate', String(n+1), 900);
  if (!dailyOk_('login', 6)) return {ok:true};       // עד 6 קישורים ביום
  const t = token_();
  cache.put('login_' + sha_(t), '1', 900);            // הקישור תקף 15 דקות, פעם אחת
  const url = (cfg_().site_url || 'https://noa-cosmetics.vercel.app').replace(/\/$/, '') + '/admin#t=' + t;
  MailApp.sendEmail({to: adminEmail_(), name:'Noa Cosmetics', subject:'קישור כניסה לדף הניהול',
    body:'היי נעה,\nלכניסה לדף הניהול לחצי על הקישור (תקף ל-15 דקות):\n'+url+'\n\nאם לא ביקשת להיכנס, אפשר להתעלם מהמייל.',
    htmlBody:'<div dir="rtl" style="font-family:Arial,sans-serif;font-size:16px"><p>היי נעה,</p><p><a href="'+url+'" style="background:#86695e;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;display:inline-block">כניסה לדף הניהול</a></p><p style="color:#777;font-size:13px">הקישור תקף ל-15 דקות ולשימוש אחד. אם לא ביקשת להיכנס, אפשר להתעלם מהמייל.</p></div>'});
  return {ok:true};
}
// שלב 2: מחליף את הקישור החד-פעמי בכניסה קבועה ל-60 יום
function adminSession_(t) {
  if (!/^[0-9a-f]{64}$/.test(String(t||''))) return {ok:false};
  const cache = CacheService.getScriptCache(), k = 'login_' + sha_(t);
  if (!cache.get(k)) return {ok:false};
  cache.remove(k);
  return {ok:true, s:newSession_()};
}
function authed_(s) {
  if (!/^[0-9a-f]{64}$/.test(String(s||''))) return false;
  const exp = PropertiesService.getScriptProperties().getProperty('sess_' + sha_(s));
  return !!exp && +exp > Date.now();
}
const dayKey_ = k => /^\d{4}-\d{2}-\d{2}$/.test(String(k||''));
const slotKey_ = k => /^\d{4}-\d{2}-\d{2}_\d{2}:00$/.test(String(k||''));

function admin_(d) {
  if (!authed_(d.s)) return {ok:false, reason:'auth'};
  const ss = SpreadsheetApp.getActiveSpreadsheet(), tz = Session.getScriptTimeZone();
  const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const op = d.op;

  if (op === 'list') {
    const c = cfg_();
    const bookings = getBookings_().getDataRange().getValues().slice(1).filter(r => slotKey_(r[0]) && String(r[0]) >= today)
      .map(r => ({key:String(r[0]), service:String(r[3]), name:String(r[4]), phone:String(r[5]).replace(/^'/,''), email:String(r[6])}))
      .sort((a,b) => a.key < b.key ? -1 : 1);
    const b = blocks_();
    const pp = PropertiesService.getScriptProperties();
    return {ok:true, admin: adminEmail_(), hasPw: !!pp.getProperty('pw_hash'), bookings, blocks:{days:b.days.filter(k => k >= today), hours:b.hours.filter(k => k >= today)},
      cfg:{open:c.open, close:c.close, fri_close:c.fri_close, closed_weekdays:c.closed_weekdays, closed_dates:c.closed_dates, whatsapp:c.whatsapp},
      thanks: (c.thanks_text || THANKS).replace(/\{address\}/g,c.address||'').replace(/\{map\}/g,'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(c.address||'')),
      services: SVC.map((x,i) => c['svc'+(i+1)+'_name'] || x[0])};
  }
  if (op === 'setpw') {
    const pw = d.pw;
    if (typeof pw !== 'string' || pw.length < 8 || pw.length > 200) return {ok:false, reason:'weak'};
    const salt = token_(), pp = PropertiesService.getScriptProperties();
    pp.setProperties({pw_salt: salt, pw_hash: pwHash_(pw, salt)});
    // מנתק את כל שאר המכשירים, משאיר את המכשיר הנוכחי מחובר
    const all = pp.getProperties(), keep = 'sess_' + sha_(d.s);
    Object.keys(all).forEach(k => { if (k.indexOf('sess_') === 0 && k !== keep) pp.deleteProperty(k); });
    return {ok:true};
  }
  if (op === 'logout') { PropertiesService.getScriptProperties().deleteProperty('sess_' + sha_(d.s)); return {ok:true}; }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return {ok:false, reason:'busy'};
  try {
    if (op === 'block' || op === 'unblock') {
      const keys = [].concat(d.keys || []).map(String).filter(k => (dayKey_(k) || slotKey_(k)) && k >= today).slice(0, 120);
      const s = getBlocks_(), have = s.getDataRange().getValues().slice(1).map(r => String(r[0]));
      if (op === 'block') {
        const add = keys.filter(k => have.indexOf(k) < 0).map(k => [k, clean_(d.note||''), new Date()]);
        if (add.length) s.getRange(s.getLastRow()+1, 1, add.length, 3).setValues(add);
      } else {
        const rows = s.getDataRange().getValues();
        for (let i = rows.length - 1; i >= 1; i--) if (keys.indexOf(String(rows[i][0])) > -1) s.deleteRow(i+1);
      }
      return {ok:true};
    }
    if (op === 'cancel') {
      if (!slotKey_(d.key)) return {ok:false, reason:'invalid'};
      const s = getBookings_(), rows = s.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) {
        if (String(rows[i][0]) !== d.key) continue;
        const r = rows[i];
        let x = ss.getSheetByName('Cancelled');
        if (!x) { x = ss.insertSheet('Cancelled'); x.appendRow(['key','date','time','service','name','phone','email','created','reminded','cancelled']); x.setFrozenRows(1); }
        x.appendRow(r.slice(0, 9).map(v => (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'"+v : v).concat([new Date()]));
        s.deleteRow(i+1);
        try { const w = when_(d.key), st = new Date(w.y,w.m-1,w.da,w.h,0);
          CalendarApp.getDefaultCalendar().getEvents(st, new Date(st.getTime()+36e5))
            .filter(ev => ev.getTitle() === r[3]+' - '+r[4]).forEach(ev => ev.deleteEvent()); } catch (err) { console.error(String(err)); }
        return {ok:true};
      }
      return {ok:false, reason:'notfound'};
    }
    if (op === 'add') {
      if (!slotKey_(d.key) || d.key.slice(0,10) < today) return {ok:false, reason:'invalid'};
      const name = String(d.name||'').trim().replace(/\s+/g,' ').slice(0, 40);
      const phone = String(d.phone||'').replace(/\D/g,'').replace(/^972/,'0');
      if (name.length < 2 || (phone && !/^0\d{8,9}$/.test(phone))) return {ok:false, reason:'invalid'};
      const s = getBookings_();
      if (s.getDataRange().getValues().slice(1).some(r => String(r[0]) === d.key)) return {ok:false, reason:'taken'};
      const w = when_(d.key);
      s.appendRow([d.key, d.key.slice(0,10), w.t, clean_(d.service), clean_(name), phone ? "'"+phone : '', '', new Date(), '']);
      try { CalendarApp.getDefaultCalendar().createEvent(clean_(d.service)+' - '+clean_(name), new Date(w.y,w.m-1,w.da,w.h,0), new Date(w.y,w.m-1,w.da,w.h+1,0), {description: phone ? 'טלפון: '+phone : 'נרשם ידנית'}); } catch (err) { console.error(String(err)); }
      return {ok:true};
    }
  } finally { lock.releaseLock(); }
  return {ok:false, reason:'invalid'};
}
