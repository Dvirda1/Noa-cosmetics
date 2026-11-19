const IMG=["images/img01.jpg", "images/img02.jpg", "images/img03.jpg", "images/img04.jpg", "images/img05.jpg", "images/img06.jpg", "images/img07.jpg", "images/img08.jpg", "images/img09.jpg", "images/img10.jpg", "images/img11.jpg", "images/img12.jpg", "images/img13.jpg", "images/img14.jpg", "images/img15.jpg"];
const API='/api';
const SERVICES=[{k:'brows',n:'עיצוב גבות',p:60},{k:'lash',n:'הרמת ריסים',p:200},{k:'lift',n:'הרמת גבות',p:150},{k:'combo',n:'חבילה משולבת',p:320}];
const DN=['ראשון','שני','שלישי','רביעי','חמישי','שישי'];
let st={svc:'brows',date:null,time:null},taken=new Set(),closedDays=new Set(),db=null;
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const dk=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
let CFG={},WA='972506473569';
function hoursFor(d){const w=d.getDay();if(w===5||w===6||closedDays.has(dk(d))||String(CFG.closed_weekdays||'6').split(/[,\s]+/).includes(String(w))||String(CFG.closed_dates||'').split(/[,\s]+/).includes(dk(d)))return[];const o=+(CFG.open||9),end=w===5?+(CFG.fri_close||13):+(CFG.close||18);const h=[];for(let x=o;x<end;x++)h.push(pad(x)+':00');return h}
const gi=u=>{const m=String(u).match(/[-\w]{25,}/);return /drive\.google|^[-\w]{25,}$/.test(u)&&m?'https://drive.google.com/thumbnail?id='+m[0]+'&sz=w1200':u};
const fixText = v => String(v ?? '').replace(/סגנוד/g,'סגנון');
async function loadContent(){try{const r=await fetch(API+'?action=content');const j=await r.json();CFG=j.content||{};
document.querySelectorAll('[data-c]').forEach(e=>{const v=CFG[e.dataset.c];if(v){e.textContent=fixText(v);e.style.whiteSpace='pre-line'}});
SERVICES.forEach((s,i)=>{const n=i+1;if(CFG['svc'+n+'_name'])s.n=fixText(CFG['svc'+n+'_name']);if(CFG['svc'+n+'_price'])s.p=CFG['svc'+n+'_price']});
if(CFG.whatsapp){WA=CFG.whatsapp;$('wal').href='https://wa.me/'+WA}if(CFG.phone)$('tel').href='tel:'+CFG.phone.replace(/[^\d+]/g,'');
document.querySelectorAll('[data-img]').forEach(e=>{const v=CFG[e.dataset.img];if(v)e.style.backgroundImage='url('+gi(v)+')'});
if(j.gallery&&j.gallery.length){$('gal').innerHTML='';j.gallery.forEach(id=>{const s='https://drive.google.com/thumbnail?id='+id+'&sz=w1000',im=document.createElement('img');im.src=s;im.loading='lazy';im.alt='עבודה של נעה';im.onclick=()=>{$('lb').firstChild.src=s;$('lb').classList.add('on')};$('gal').appendChild(im)})}
renderSvc();renderDays();renderSlots()}catch(e){}}
const dates=[];{const t=new Date();for(let i=0;dates.length<14&&i<30;i++){const d=new Date(t.getFullYear(),t.getMonth(),t.getDate()+i);if(d.getDay()<5)dates.push(d)}}
st.date=dk(dates[0]);
function renderSvc(){$('svc').innerHTML='';SERVICES.forEach(s=>{const b=document.createElement('button');b.className='chip'+(st.svc===s.k?' on':'');b.textContent=s.n+' · '+s.p+' ₪';b.onclick=()=>{st.svc=s.k;renderSvc()};$('svc').appendChild(b)})}
function renderDays(){$('days').innerHTML='';dates.forEach(d=>{const b=document.createElement('button');const k=dk(d);b.className='chip day'+(st.date===k?' on':'');b.innerHTML='<small>'+DN[d.getDay()]+'</small><b>'+d.getDate()+'</b><small>'+pad(d.getMonth()+1)+'</small>';b.onclick=()=>{st.date=k;st.time=null;renderDays();renderSlots();upd()};$('days').appendChild(b)})}
function renderSlots(){
  const d=dates.find(x=>dk(x)===st.date);$('slots').innerHTML='';const now=new Date();
  if(!hoursFor(d).length){$('slots').innerHTML='<div class="hint" style="margin:0">ביום הזה אני לא עובדת 🌿 בחרי יום אחר.</div>';return}
  hoursFor(d).forEach(h=>{const b=document.createElement('button');b.className='chip'+(st.time===h?' on':'');b.textContent=h;
    const past=dk(now)===st.date&&parseInt(h)<=now.getHours();
    b.disabled=past||taken.has(st.date+'_'+h);
    b.onclick=()=>{st.time=h;renderSlots();upd()};$('slots').appendChild(b)});
}
const phN=()=>$('ph').value.replace(/\D/g,'').replace(/^972/,'0');
function upd(){$('go').disabled=!(st.date&&st.time&&$('nm').value.trim().length>1&&/^05\d{8}$/.test(phN()))}
function show(t,err){const m=$('msg');m.textContent=t;m.className='msg show'+(err?' err':'')}
['nm','ph'].forEach(i=>$(i).addEventListener('input',upd));
$('go').onclick=async()=>{
  const key=st.date+'_'+st.time,svc=SERVICES.find(s=>s.k===st.svc).n;
  $('go').disabled=true;
  try{
    if(API){const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({key,name:$('nm').value.trim(),phone:phN(),service:svc,date:st.date,time:st.time,email:$('em').value.trim(),website:$('website').value})});const j=await r.json();if(!j.ok){if(j.reason==='invalid'){show('נראה שאחד הפרטים לא תקין. בדקי שהשם בעברית או באנגלית, הטלפון נייד ישראלי והאימייל נכון.',true);upd();return}if(j.reason==='limit'){show('כבר יש שני תורים עתידיים על המספר הזה. לתור נוסף פני אליי בוואטסאפ 💗',true);upd();return}if(j.reason==='busy'){show('יש עומס כרגע. נסי שוב בעוד כמה דקות או פני אליי בוואטסאפ.',true);upd();return}show('מצטערת, השעה הזו כבר נתפסה. בחרי שעה אחרת.',true);taken.add(key);st.time=null;renderSlots();upd();return}}else if(db){
      const t=db.collection('taken').doc(key);
      if((await t.get()).exists){show('מצטערת, השעה הזו כבר נתפסה. בחרי שעה אחרת.',true);taken.add(key);st.time=null;renderSlots();upd();return}
      await t.set({t:1});
      await db.collection('bookings').doc(key).set({name:$('nm').value.trim(),phone:$('ph').value.trim(),service:svc,date:st.date,time:st.time,created:Date.now()});
    }else{taken.add(key)}
    const d=dates.find(x=>dk(x)===st.date);
    const txt='היי נעה, קבעתי תור ל'+svc+' ביום '+DN[d.getDay()]+' '+d.getDate()+'/'+(d.getMonth()+1)+' בשעה '+st.time+'. שם: '+$('nm').value.trim();
    show('התור נקבע! 🎉 נשמח לראות אותך ביום '+DN[d.getDay()]+' '+d.getDate()+'/'+(d.getMonth()+1)+' בשעה '+st.time+'.');
    $('msg').insertAdjacentHTML('beforeend','<br><a href="https://wa.me/'+WA+'?text='+encodeURIComponent(txt)+'" style="color:var(--accent)">שליחת אישור בוואטסאפ</a>');
    st.time=null;renderSlots();
  }catch(e){show('לא הצלחנו לשמור את התור. נסי שוב או פני אלינו בוואטסאפ.',true);upd()}
};
renderSvc();renderDays();renderSlots();
if(API)loadContent();
if(API){const ld=async()=>{try{const r=await fetch(API+'?action=taken');const j=await r.json();taken=new Set(j.taken);closedDays=new Set(j.closed||[]);renderSlots()}catch(e){}};ld();setInterval(ld,30000)}
$('heroimg').style.backgroundImage='url('+IMG[2]+')';
document.querySelectorAll('.sc[data-i]').forEach(e=>e.style.backgroundImage='url('+IMG[e.dataset.i]+')');
document.querySelectorAll('.sc').forEach(c=>{c.tabIndex=0;c.setAttribute('role','button');c.setAttribute('aria-expanded','false');
const t=()=>{const o=c.classList.toggle('open');c.setAttribute('aria-expanded',o)};
c.addEventListener('click',t);c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();t()}})});
document.querySelectorAll('[data-bg]').forEach(e=>e.style.backgroundImage='url('+IMG[e.dataset.bg]+')');
IMG.forEach((s,i)=>{const im=document.createElement('img');im.src=s;im.loading='lazy';im.alt='עבודה של נעה';im.onclick=()=>{$('lb').firstChild.src=s;$('lb').classList.add('on')};$('gal').appendChild(im)});
$('lb').onclick=()=>$('lb').classList.remove('on');
(()=>{const b=$('burger'),m=$('mnav'),links=m.querySelectorAll('a');
const set=o=>{m.classList.toggle('open',o);b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',o?'סגירת תפריט':'פתיחת תפריט');links.forEach(a=>a.tabIndex=o?0:-1)};
set(false);b.onclick=()=>set(b.getAttribute('aria-expanded')!=='true');
links.forEach(a=>a.addEventListener('click',()=>set(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&m.classList.contains('open')){set(false);b.focus()}});
document.addEventListener('click',e=>{if(m.classList.contains('open')&&!m.contains(e.target)&&!b.contains(e.target))set(false)});})();
(()=>{const rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
const els=[...document.querySelectorAll('.title,.trust>.wrap>div,.split>div:first-child,.sc,.about .wrap>*,.book,.gal-wrap,.faq')];
if(!rm&&'IntersectionObserver' in window){els.forEach(e=>{e.classList.add('rv');e.style.transitionDelay=Math.min([...e.parentNode.children].indexOf(e),5)*.12+'s'});
const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){const e=x.target;e.classList.add('in');io.unobserve(e);setTimeout(()=>{e.classList.remove('rv','in');e.style.transitionDelay=''},1600)}}),{threshold:.12});els.forEach(e=>io.observe(e))}
const g=$('gal');document.querySelector('.gb-l').onclick=()=>g.scrollBy({left:-g.clientWidth*.8});document.querySelector('.gb-r').onclick=()=>g.scrollBy({left:g.clientWidth*.8})})();
(async()=>{try{const c=window.claude&&await claude.use('db');if(c){db=c;c.collection('taken').onSnapshot(s=>{taken=new Set(s.docs.map(x=>x.id));renderSlots()},()=>{})}}catch(e){}})();
