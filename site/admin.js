const API='https://script.google.com/macros/s/AKfycbw3nViWy8ztmxbpXAedS_mfhWgNlhUCerEdICTXRTUaEpZhkr_o6R7yzZz2RrQQBs2JjA/exec';
const DN=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const dk=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pd=k=>{const [y,m,d]=k.slice(0,10).split('-').map(Number);return new Date(y,m-1,d)};
const label=k=>{const d=pd(k);return 'יום '+DN[d.getDay()]+' '+d.getDate()+'/'+(d.getMonth()+1)};
const wa=p=>{p=String(p).replace(/\D/g,'');return p.startsWith('0')?'972'+p.slice(1):p};
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
let S=store.get('noa_admin'),D=null,sel=null,tab='day';

async function call(body){const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)});return r.json()}
async function adm(op,extra){const j=await call(Object.assign({action:'admin',s:S,op},extra||{}));if(j.reason==='auth'){store.del('noa_admin');S=null;loginView('הכניסה פגה. צריך להיכנס שוב.');throw new Error('auth')}return j}
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2600)}
function sheet(html){$('sheetIn').innerHTML=html;$('sheet').classList.add('on')}
function closeSheet(){$('sheet').classList.remove('on')}
$('sheet').addEventListener('click',e=>{if(e.target.id==='sheet')closeSheet()});

/* ---------- כניסה ---------- */
function loginView(msg){
  $('top').hidden=true;
  $('app').innerHTML='<div class="card login"><img src="logo-mark.svg" alt=""><h1>דף הניהול</h1><p id="lmsg">'+esc(msg||'כניסה עם המייל והסיסמה של המנהל.')+'</p>'
   +'<form id="lf" autocomplete="on"><label class="field"><span>מייל</span><input id="le" name="username" type="email" autocomplete="username" dir="ltr" required></label>'
   +'<label class="field"><span>סיסמה</span><input id="lp" name="password" type="password" autocomplete="current-password" dir="ltr" required></label>'
   +'<button class="btn" id="lb" type="submit" style="width:100%">כניסה</button></form>'
   +'<p class="muted" id="lerr" style="margin-top:12px;min-height:1.4em"></p>'
   +'<button class="btn ghost sm" id="send" type="button">שכחתי סיסמה</button><p class="muted" id="sent" style="margin-top:10px"></p></div>';
  $('lf').onsubmit=async e=>{e.preventDefault();$('lb').disabled=true;$('lerr').textContent='בודק…';
    try{const j=await call({action:'pwlogin',email:$('le').value,pw:$('lp').value});
      if(j.ok){S=j.s;store.set('noa_admin',S);$('lf').remove();$('top').hidden=false;await load();return}
      $('lerr').textContent=j.reason==='locked'?'יותר מדי ניסיונות. הכניסה נעולה ל-15 דקות.':j.reason==='nopw'?'המייל או הסיסמה לא נכונים.':'המייל או הסיסמה לא נכונים.'}
    catch(err){$('lerr').textContent='אין חיבור. נסה שוב.'}
    $('lb').disabled=false};
  $('send').onclick=async()=>{$('send').disabled=true;try{await call({action:'login'});$('sent').innerHTML='✉️ נשלח קישור כניסה למייל של המנהל.<br>הוא תקף ל-15 דקות, ואחרי הכניסה אפשר לבחור סיסמה.'}catch(e){$('sent').textContent='משהו השתבש. נסה שוב.';$('send').disabled=false}};
}
function pwSheet(first){
  sheet('<h3>'+(first?'🔐 בחירת סיסמה':'🔐 החלפת סיסמה')+'</h3><p>'+(first?'בחר סיסמה לכניסה הבאה. האייפון יציע לשמור אותה, ואז אפשר להיכנס עם Face ID.':'הסיסמה החדשה תחליף את הקודמת, וכל המכשירים האחרים ינותקו.')+'</p>'
   +'<form id="pf"><input type="email" name="username" autocomplete="username" value="'+esc(D.admin)+'" readonly hidden>'
   +'<label class="field"><span>סיסמה חדשה (לפחות 8 תווים)</span><input id="p1" type="password" autocomplete="new-password" dir="ltr" minlength="8" required></label>'
   +'<label class="field"><span>שוב, לאימות</span><input id="p2" type="password" autocomplete="new-password" dir="ltr" minlength="8" required></label>'
   +'<p class="muted" id="perr" style="min-height:1.4em"></p><div class="row"><button class="btn" type="submit" id="pok">שמירה</button><button class="btn ghost" type="button" id="no">'+(first?'אחר כך':'ביטול')+'</button></div></form>');
  $('no').onclick=closeSheet;
  $('pf').onsubmit=async e=>{e.preventDefault();const a=$('p1').value,b=$('p2').value;
    if(a.length<8)return $('perr').textContent='הסיסמה צריכה להיות לפחות 8 תווים';
    if(a!==b)return $('perr').textContent='שתי הסיסמאות לא זהות';
    $('pok').disabled=true;try{const j=await adm('setpw',{pw:a});if(j.ok){closeSheet();D.hasPw=true;toast('הסיסמה נשמרה ✅')}else{$('perr').textContent='לא הצלחנו לשמור. נסה שוב.';$('pok').disabled=false}}catch(err){$('pok').disabled=false}};
}
async function boot(){
  const m=location.hash.match(/t=([0-9a-f]{64})/);
  if(m){history.replaceState(null,'',location.pathname);$('app').innerHTML='<p class="empty">נכנסת…</p>';
    try{const j=await call({action:'session',t:m[1]});if(j.ok){S=j.s;store.set('noa_admin',S)}else{return loginView('הקישור כבר נוצל או שפג תוקפו. שלחי קישור חדש.')}}catch(e){return loginView('משהו השתבש. נסי שוב.')}}
  if(!S)return loginView();
  $('top').hidden=false;await load();
  if(m&&D&&!D.hasPw)pwSheet(true);
}
$('logout').onclick=async()=>{if(!confirm('לצאת מדף הניהול במכשיר הזה?'))return;try{await adm('logout')}catch(e){}store.del('noa_admin');S=null;loginView('יצאת. אפשר להיכנס שוב מתי שתרצי.')};
$('refresh').onclick=()=>load();
$('pwbtn').onclick=()=>{if(D)pwSheet(!D.hasPw)};

/* ---------- נתונים ---------- */
async function load(){
  $('app').classList.add('loading');
  try{const j=await adm('list');if(!j.ok){toast('לא הצלחנו לטעון. נסי לרענן.');return}const KR=/^\d{4}-\d{2}-\d{2}_\d{2}:00$/,DR=/^\d{4}-\d{2}-\d{2}$/;j.bookings=j.bookings.filter(b=>KR.test(b.key));j.blocks.days=j.blocks.days.filter(k=>DR.test(k));j.blocks.hours=j.blocks.hours.filter(k=>KR.test(k));D=j;D.bk={};j.bookings.forEach(b=>D.bk[b.key]=b);D.bd=new Set(j.blocks.days);D.bh=new Set(j.blocks.hours);render()}
  catch(e){if(e.message!=='auth')toast('אין חיבור. נסי שוב.')}
  finally{$('app').classList.remove('loading')}
}
function days(){const a=[],t=new Date();for(let i=0;i<45;i++)a.push(new Date(t.getFullYear(),t.getMonth(),t.getDate()+i));return a}
function weeklyClosed(d){const c=D.cfg;return d.getDay()>=5||String(c.closed_weekdays||'6').split(/[,\s]+/).includes(String(d.getDay()))||String(c.closed_dates||'').split(/[,\s]+/).includes(dk(d))}
function hours(d){const c=D.cfg,o=+(c.open||9),e=d.getDay()===5?+(c.fri_close||13):+(c.close||18),h=[];for(let x=o;x<e;x++)h.push(pad(x)+':00');
  Object.keys(D.bk).forEach(k=>{if(k.startsWith(dk(d))){const t=k.slice(11);if(!h.includes(t))h.push(t)}});return h.sort()}
function countFor(k){return Object.keys(D.bk).filter(x=>x.startsWith(k)).length}

/* ---------- תצוגה ---------- */
function render(){
  const ds=days();if(!sel)sel=dk(ds[0]);
  let h='<div class="tabs"><button data-t="day" class="'+(tab==='day'?'on':'')+'">לוח לפי ימים</button><button data-t="list" class="'+(tab==='list'?'on':'')+'">כל התורים ('+D.bookings.length+')</button></div>';
  if(tab==='list')h+=listHtml();else h+=dayHtml(ds);
  $('app').innerHTML=h;
  $('app').querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;render()});
  $('app').querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{sel=b.dataset.day;render()});
  $('app').querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>act(b.dataset.act,b.dataset.k));
  const on=$('app').querySelector('.day.on');if(on)on.scrollIntoView({inline:'center',block:'nearest'});
}
function dayHtml(ds){
  let h='<div class="days">'+ds.map(d=>{const k=dk(d),n=countFor(k),cl=D.bd.has(k)||weeklyClosed(d);return '<button class="day'+(k===sel?' on':'')+(cl?' closed':'')+'" data-day="'+k+'"><small>'+DN[d.getDay()]+'</small><b>'+d.getDate()+'</b><small>'+pad(d.getMonth()+1)+'</small>'+(n?'<span class="n">'+n+'</span>':'')+'</button>'}).join('')+'</div>';
  const d=pd(sel),vac=D.bd.has(sel),wk=weeklyClosed(d),now=new Date(),isToday=sel===dk(now);
  h+='<div class="dayhead"><h2>'+label(sel)+'</h2>'+(vac||wk?'':'<button class="btn ghost sm" data-act="vacday" data-k="'+sel+'">🌴 יום חופש</button>')+'</div>';
  if(vac)h+='<div class="banner vac"><span>🌴 סימנת את היום כיום חופש. באתר הוא מופיע סגור.</span><button class="btn sm" data-act="unvac" data-k="'+sel+'">פתיחת היום</button></div>';
  else if(wk)h+='<div class="banner"><span>היום הזה סגור קבוע (לפי שעות הפעילות בגיליון).</span></div>';
  const hs=(vac||wk)?Object.keys(D.bk).filter(k=>k.startsWith(sel)).map(k=>k.slice(11)).sort():hours(d);
  if(!hs.length&&(vac||wk))return h+'<p class="empty">אין תורים ביום הזה.</p>'+rangeBtn();
  h+=hs.map(t=>{const k=sel+'_'+t,b=D.bk[k],blk=D.bh.has(k),past=isToday&&parseInt(t)<=now.getHours();
    if(b)return '<div class="slot booked'+(past?' past':'')+'"><div class="h">'+t+'</div><div class="m"><b>'+esc(b.name)+'</b><small>'+esc(b.service)+(b.phone?' · <span dir="ltr">'+esc(b.phone)+'</span>':'')+'</small></div><div class="a">'+(b.phone?thxBtn(b)+'<a class="btn ghost sm" href="https://wa.me/'+wa(b.phone)+'" target="_blank" rel="noopener">וואטסאפ</a>':'')+'<button class="btn ghost sm" data-act="cancel" data-k="'+k+'">ביטול</button></div></div>';
    if(blk)return '<div class="slot blocked'+(past?' past':'')+'"><div class="h">'+t+'</div><div class="m"><span class="tag blk">⛔ חסום</span></div><div class="a"><button class="btn ghost sm" data-act="unblock" data-k="'+k+'">פתיחה</button></div></div>';
    return '<div class="slot'+(past?' past':'')+'"><div class="h">'+t+'</div><div class="m"><span class="tag free">פנוי</span></div><div class="a">'+(past?'':'<button class="btn ghost sm" data-act="add" data-k="'+k+'">+ תור</button><button class="btn ghost sm" data-act="block" data-k="'+k+'">חסימה</button>')+'</div></div>';
  }).join('');
  return h+rangeBtn();
}
const rangeBtn=()=>'<div style="margin-top:18px;text-align:center"><button class="btn ghost" data-act="range" style="width:100%">🗓️ חופשה של כמה ימים</button></div>';
function listHtml(){
  if(!D.bookings.length)return '<p class="empty">אין תורים עתידיים כרגע.</p>';
  let h='<div class="list">',last='';
  D.bookings.forEach(b=>{const d=b.key.slice(0,10);if(d!==last){h+='<div class="date">'+label(d)+'</div>';last=d}
    h+='<div class="slot booked"><div class="h">'+b.key.slice(11)+'</div><div class="m"><b>'+esc(b.name)+'</b><small>'+esc(b.service)+(b.phone?' · <span dir="ltr">'+esc(b.phone)+'</span>':'')+'</small></div><div class="a">'+(b.phone?thxBtn(b)+'<a class="btn ghost sm" href="https://wa.me/'+wa(b.phone)+'" target="_blank" rel="noopener">וואטסאפ</a>':'')+'<button class="btn ghost sm" data-act="cancel" data-k="'+b.key+'">ביטול</button></div></div>'});
  return h+'</div>';
}

/* ---------- הודעת תודה בוואטסאפ ---------- */
const THX_DEF='היי {name} 💗\nתודה רבה על קביעת התור!\nהתור שלך ל{service} נקבע ל{when}.\nמחכה לך ב-Noa Cosmetics ✨ נעה';
function thxMsg(b){return String(D.thanks||THX_DEF).replace(/\{name\}/g,b.name).replace(/\{service\}/g,b.service).replace(/\{when\}/g,label(b.key)+' בשעה '+b.key.slice(11)).replace(/\{address\}|\{map\}/g,'')}
function thxLink(b){return 'https://wa.me/'+wa(b.phone)+'?text='+encodeURIComponent(thxMsg(b))}
const thxSent=k=>!!store.get('noa_thx_'+k);
function thxBtn(b){const s=thxSent(b.key);return '<a class="btn thx sm'+(s?' done':'')+'" data-thx="'+b.key+'" href="'+esc(thxLink(b))+'" target="_blank" rel="noopener">'+(s?'✓ נשלחה תודה':'💗 תודה')+'</a>'}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('[data-thx]');if(!a)return;store.set('noa_thx_'+a.dataset.thx,'1');setTimeout(()=>{a.classList.add('done');a.textContent='✓ נשלחה תודה'},300)});

/* ---------- פעולות ---------- */
async function run(op,extra,ok){try{const j=await adm(op,extra);if(j.ok){toast(ok);await load()}else toast(j.reason==='taken'?'השעה הזו כבר תפוסה':'לא הצלחנו. נסי שוב.')}catch(e){if(e.message!=='auth')toast('אין חיבור. נסי שוב.')}}
function act(a,k){
  if(a==='block')return run('block',{keys:[k]},'השעה '+k.slice(11)+' נחסמה באתר');
  if(a==='unblock')return run('unblock',{keys:[k]},'השעה '+k.slice(11)+' פתוחה שוב באתר');
  if(a==='unvac')return run('unblock',{keys:[k]},'היום פתוח שוב באתר');
  if(a==='vacday'){const n=countFor(k);
    sheet('<h3>🌴 יום חופש: '+label(k)+'</h3><p>'+(n?'שימי לב: יש ביום הזה '+n+' תורים. הם לא יתבטלו לבד, כדאי לעדכן את הלקוחות ולבטל אותם.':'היום יופיע באתר סגור, ואי אפשר יהיה לקבוע בו תור.')+'</p><div class="row"><button class="btn" id="ok">סימון יום חופש</button><button class="btn ghost" id="no">ביטול</button></div>');
    $('no').onclick=closeSheet;$('ok').onclick=()=>{closeSheet();run('block',{keys:[k]},'סומן כיום חופש')};return}
  if(a==='range'){const t=dk(new Date());
    sheet('<h3>🗓️ חופשה של כמה ימים</h3><p>כל הימים בטווח יופיעו באתר סגורים.</p><label class="field"><span>מתאריך</span><input type="date" id="f" min="'+t+'" value="'+sel+'"></label><label class="field"><span>עד תאריך (כולל)</span><input type="date" id="to" min="'+t+'" value="'+sel+'"></label><p class="muted" id="rn"></p><div class="row"><button class="btn" id="ok">סימון חופשה</button><button class="btn ghost" id="no">ביטול</button></div>');
    const chk=()=>{const f=$('f').value,to=$('to').value;if(!f||!to||to<f){$('rn').textContent='';return[]}const ks=[];for(let d=pd(f);dk(d)<=to&&ks.length<60;d.setDate(d.getDate()+1))ks.push(dk(d));const n=Object.keys(D.bk).filter(x=>ks.includes(x.slice(0,10))).length;$('rn').textContent=ks.length+' ימים'+(n?' · שימי לב: יש בהם '+n+' תורים קיימים שלא יתבטלו לבד':'');return ks};
    $('f').oninput=()=>{if($('to').value<$('f').value)$('to').value=$('f').value;chk()};$('to').oninput=chk;chk();
    $('no').onclick=closeSheet;$('ok').onclick=()=>{const ks=chk();if(!ks.length)return toast('בחרי תאריכים');closeSheet();run('block',{keys:ks},'סומנה חופשה של '+ks.length+' ימים')};return}
  if(a==='cancel'){const b=D.bk[k];
    sheet('<h3>ביטול התור</h3><p><b>'+esc(b.name)+'</b> · '+esc(b.service)+'<br>'+label(k)+' בשעה '+k.slice(11)+'<br>אחרי הביטול השעה תחזור להיות פנויה באתר.</p><div class="row"><button class="btn danger" id="ok">כן, לבטל</button><button class="btn ghost" id="no">חזרה</button></div>');
    $('no').onclick=closeSheet;
    $('ok').onclick=async()=>{$('ok').disabled=true;try{const j=await adm('cancel',{key:k});if(!j.ok){closeSheet();toast('לא הצלחנו לבטל. נסי לרענן.');return}
      const msg='היי '+b.name+', התור שלך ל'+b.service+' ב'+label(k)+' בשעה '+k.slice(11)+' בוטל. אם תרצי לקבוע מועד אחר, אני כאן 💗 נעה';
      sheet('<h3>✅ התור בוטל</h3><p>השעה פנויה שוב באתר.'+(b.phone?' רוצה להודיע ל'+esc(b.name)+'?':'')+'</p>'+(b.phone?'<a class="btn" style="display:block;text-align:center;text-decoration:none;margin-bottom:8px" target="_blank" rel="noopener" href="https://wa.me/'+wa(b.phone)+'?text='+encodeURIComponent(msg)+'">שליחת הודעה בוואטסאפ</a>':'')+'<button class="btn ghost" id="no" style="width:100%">סגירה</button>');
      $('no').onclick=closeSheet;await load()}catch(e){closeSheet();if(e.message!=='auth')toast('אין חיבור. נסי שוב.')}};return}
  if(a==='add'){
    sheet('<h3>רישום תור: '+label(k)+' · '+k.slice(11)+'</h3><p>למי שקבעה בטלפון או בוואטסאפ. השעה תיתפס באתר.</p><label class="field"><span>שם</span><input id="an" autocomplete="off"></label><label class="field"><span>טלפון (לא חובה)</span><input id="ap" type="tel" dir="ltr" style="text-align:right"></label><label class="field"><span>טיפול</span><select id="as">'+D.services.map(s=>'<option>'+esc(s)+'</option>').join('')+'</select></label><div class="row"><button class="btn" id="ok">שמירת התור</button><button class="btn ghost" id="no">ביטול</button></div>');
    $('no').onclick=closeSheet;$('an').focus();
    $('ok').onclick=()=>{const n=$('an').value.trim();if(n.length<2)return toast('צריך לכתוב שם');const ph=$('ap').value,sv=$('as').value;closeSheet();run('add',{key:k,name:n,phone:ph,service:sv},'התור נרשם').then(()=>{const b=D&&D.bk[k];if(b&&b.phone)sheet('<h3>✅ התור נרשם</h3><p>רוצה לשלוח ל'+esc(b.name)+' הודעת תודה בוואטסאפ?</p>'+thxBtn(b).replace('btn thx sm','btn thx').replace('💗 תודה','💗 שליחת הודעת תודה').replace('<a ','<a id="tx" style="display:flex;margin-bottom:8px" ')+'<button class="btn ghost" id="no" style="width:100%">לא עכשיו</button>'),$('no')&&($('no').onclick=closeSheet),$('tx')&&$('tx').addEventListener('click',()=>setTimeout(closeSheet,400))})};return}
}
boot();
