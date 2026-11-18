// Noa Cosmetics - ניהול האתר, תורים, התראות ותזכורות
const THANKS = 'היי {name} 💗\nתודה רבה על קביעת התור!\nהתור שלך ל{service} נקבע ל{when}.\nהכתובת: {address}\nמחכה לך ב-Noa Cosmetics ✨';
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
    ['hours_text','ימים א׳–ה׳ 09:00–18:00 · שישי 09:00–13:00 · שבת סגור','הטקסט שמוצג ללקוחות על שעות הפעילות'],
    ['open','9','שעת פתיחה (מספר)'],
    ['close','18','שעת סגירה בימים א׳–ה׳'],
    ['fri_close','13','שעת סגירה ביום שישי'],
    ['closed_weekdays','6','ימים סגורים: 0=ראשון ... 6=שבת, מופרדים בפסיק'],
    ['closed_dates','','תאריכי חופשה בפורמט 2026-12-25, מופרדים בפסיק'],
    ['notify_email','','אימייל לקבלת התראות (ריק = האימייל של בעל הגיליון)'],
    ['thanks_text',THANKS,'הודעת התודה בוואטסאפ אחרי קביעת תור. אפשר להשתמש ב- {name} {service} {when} {address}'],
    ['reminder_text','היי {name}, תזכורת לתור שלך מחר ב-{time} ({service}) ב-Noa Cosmetics 💗 מחכה לך! אם צריך לשנות, כתבי לי כאן.','נוסח התזכורת. אפשר להשתמש ב- {name} {time} {service}'],
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
    delete c.notify_email; delete c.gallery_folder; delete c.keep_days;
    const out = JSON.stringify({content:c, gallery:g}); cache.put('content', out, 60);
    return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
  }
  return json_({ taken: getBookings_().getDataRange().getValues().slice(1).map(r => String(r[0])) });
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
  if (String(c.closed_weekdays||'6').split(/[,\s]+/).indexOf(String(wd)) > -1) return null;
  if (String(c.closed_dates||'').split(/[,\s]+/).indexOf(key.split('_')[0]) > -1) return null;
  if (w.h < open || w.h >= close) return null;
  return { key, name, phone, email, service, date: key.split('_')[0], time: w.t };
}

// הגבלת קצב: מונע הצפה של תורים מזויפים
function rateOk_() {
  const cache = CacheService.getScriptCache(), n = +(cache.get('rate') || 0);
  if (n >= 8) return false;               // עד 8 תורים חדשים בכל 10 דקות לכל האתר
  cache.put('rate', String(n+1), 600);
  return true;
}

function doPost(e) {
  let d;
  try { d = validate_(JSON.parse(e.postData.contents)); } catch (err) { d = null; }
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
  if (lines.length) MailApp.sendEmail({to:c.notify_email||Session.getEffectiveUser().getEmail(), name:'Noa Cosmetics', subject:'התורים של מחר ('+lines.length+')', body:lines.join('\n\n')});
}

// בדיקה ידנית: מריצים מהעורך ובודקים שהגיעו מייל ואירוע ביומן. אחר כך אפשר למחוק את האירוע
function testNotify() {
  notify_({key: Utilities.formatDate(new Date(Date.now()+864e5), Session.getScriptTimeZone(), 'yyyy-MM-dd')+'_10:00', name:'בדיקה', phone:'0500000000', service:'עיצוב גבות', email:Session.getEffectiveUser().getEmail()});
}
