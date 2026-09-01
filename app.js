const C=window.TRJ_CONFIG; let access='LOCKED'; let activated=false; let selectedQ=null;
const tabs=[['home','Home'],['photos','Photo Album'],['videos','Video Album'],['nature','Nature'],['wildlife','Wild Animal Photo'],['assistant','TRJ Help Assistant'],['activation','Activation Promo Code'],['about','About Us'],['buy','Buy Promo Code']];
function init(){restoreAccess();document.getElementById('nav').innerHTML=tabs.map(([id,n])=>`<button onclick="go('${id}')" data-tab="${id}">${n}</button>`).join('');document.getElementById('homeIcons').innerHTML=tabs.slice(1).map(([id,n])=>`<button onclick="go('${id}')">${n} ↗</button>`).join('');document.querySelectorAll('.page').forEach(p=>p.insertAdjacentHTML('beforeend','<div class="copyright">© 2026 TRJ VISUALS MEDIA. TRJ Visual Gallery is owned and maintained by TRJ Visuals Media.</div>')); if(C.intros){document.getElementById('natureSi').textContent=C.intros.natureSi;document.getElementById('natureEn').textContent=C.intros.natureEn;document.getElementById('wildlifeSi').textContent=C.intros.wildlifeSi;document.getElementById('wildlifeEn').textContent=C.intros.wildlifeEn} renderFolders();renderQuestions();updateAccess();document.getElementById('gate').classList.add('hidden');updateActivationUI();refreshFreeCodePreview();updateBanUI();}

function restoreAccess(){
  let code=localStorage.getItem('trjPromoCode')||'';
  let saved=(localStorage.getItem('trjAccess')||'').toUpperCase();
  let until=Number(localStorage.getItem('trjAccessUntil')||0); if(until && Date.now()>=until){clearAccess();return;}
  let flag=localStorage.getItem('trjActivated')==='1';
  if(flag && saved==='FREE' && until>Date.now()){access='FREE';activated=true;return;}
  if(flag && ['DAY24','SILVER','GOLD'].includes(saved) && until>Date.now()){let p=getPromo(code);if(p){access=saved;activated=true;return;}}
  access='LOCKED';activated=false;
}
function updateActivationUI(){
  const n=document.getElementById('activationNotice');
  if(n)n.classList.toggle('hidden',activated);
  document.querySelectorAll('.locked-until-active').forEach(e=>e.classList.toggle('hidden',activated));
}
function requireActivation(target){
  if(activated)return true;
  toast('Please activate your promo code first.');
  if(target!=='home'&&target!=='buy'&&target!=='activation') go('home');
  return false;
}
function choosePlan(plan){
  if(plan==='FREE'){go('activation');setTimeout(()=>{const b=document.getElementById('freeCodeButton');if(b)b.scrollIntoView({behavior:'smooth',block:'center'})},100);return;}
  go('activation');
}
function clearAccess(){['trjAccess','trjPromoCode','trjActivated','trjAccessUntil','trjHelp24Count'].forEach(k=>localStorage.removeItem(k));access='LOCKED';activated=false;}
function durationMs(plan){return plan==='FREE'?86400000:plan==='DAY24'?86400000:plan==='SILVER'?7*86400000:plan==='GOLD'?30*86400000:0}
function currentFreeCode(){const d=new Date(),key=`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;let h=2166136261;for(const ch of key+'TRJVISUALS'){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}const n=String(Math.abs(h)%100000).padStart(5,'0');return `TRJFREE-${n}`;}
function refreshFreeCodePreview(){const e=document.getElementById('freeCodePreview');if(e)e.textContent=currentFreeCode();}
function fillFreeCode(){const code=currentFreeCode();document.getElementById('activationCode').value=code;refreshFreeCodePreview();document.getElementById('activationMsg').textContent="Today's FREE promo code filled. Press ACTIVATE to continue.";}

// ---- Promo activation security (local browser only, no database required) ----
const PROMO_SECURITY_KEY='trjPromoSecurityV1';
const USED_CODES_KEY='trjUsedPromoCodesV1';
const BAN_MS=2*60*60*1000;
function readJson(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch(e){return fallback}}
function promoSecurity(){let o=readJson(PROMO_SECURITY_KEY,{failed:0,banUntil:0});if(!Number.isFinite(Number(o.failed)))o.failed=0;if(!Number.isFinite(Number(o.banUntil)))o.banUntil=0;return o}
function savePromoSecurity(o){localStorage.setItem(PROMO_SECURITY_KEY,JSON.stringify(o))}
function usedCodes(){return readJson(USED_CODES_KEY,{})}
function saveUsedCodes(o){localStorage.setItem(USED_CODES_KEY,JSON.stringify(o))}
function fmtRemaining(ms){ms=Math.max(0,ms);let h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),sec=Math.floor((ms%60000)/1000);return `${h}h ${m}m ${sec}s`}
function setActivationMessage(text,isBad=false){['activationMsg','promoMsg2'].forEach(id=>{let e=document.getElementById(id);if(e){e.textContent=text;e.style.color=isBad?'#ff6b6b':'';}})}
const RECOVERY_FAIL_KEY='trjRecoveryFailV1';
function getRecoveryFails(){return Number(localStorage.getItem(RECOVERY_FAIL_KEY)||0)}
function setRecoveryFails(n){localStorage.setItem(RECOVERY_FAIL_KEY,String(Math.max(0,n)))}
function updateBanUI(){
  let s=promoSecurity(),now=Date.now(),active=s.banUntil>now,text='';
  if(active)text=`SYSTEM BANNED • Wait ${fmtRemaining(s.banUntil-now)} or use an emergency unlock code.`;
  else if(s.banUntil){s.banUntil=0;s.failed=0;savePromoSecurity(s);setRecoveryFails(0)}
  ['banStatusActivation','banStatusBuy'].forEach(id=>{let e=document.getElementById(id);if(e){e.classList.toggle('hidden',!active);e.textContent=text}});
  document.body.classList.toggle('system-banned',active);
  let overlay=document.getElementById('systemBanOverlay');
  if(overlay){overlay.classList.toggle('hidden',!active);let c=document.getElementById('banCountdown');if(c)c.textContent=active?fmtRemaining(s.banUntil-now):''}
  document.querySelectorAll('#nav button,.home-icons button').forEach(b=>b.disabled=active);
  return active
}
function isActivationBanned(msgEl){let s=promoSecurity();if(s.banUntil>Date.now()){let t=`SYSTEM BANNED — Wait ${fmtRemaining(s.banUntil-Date.now())} or request an emergency unlock code.`;if(msgEl){msgEl.textContent=t;msgEl.style.color='#ff6b6b'}setActivationMessage(t,true);updateBanUI();return true}return false}
function resetFailedAttempts(){let s=promoSecurity();s.failed=0;s.banUntil=0;savePromoSecurity(s);setRecoveryFails(0);updateBanUI()}
function registerFailedAttempt(msgEl,reason){
  let s=promoSecurity();if(s.banUntil>Date.now())return isActivationBanned(msgEl);
  s.failed=(Number(s.failed)||0)+1;
  if(s.failed>=3){
    s.failed=0;s.banUntil=Date.now()+BAN_MS;savePromoSecurity(s);
    let t=`SYSTEM BANNED — 3 invalid/reused promo attempts. Wait ${fmtRemaining(BAN_MS)} or request an emergency unlock code.`;
    if(msgEl){msgEl.textContent=t;msgEl.style.color='#ff6b6b'}setActivationMessage(t,true);updateBanUI();
    toast('SYSTEM BANNED • All tabs locked for 2 hours');return false
  }
  savePromoSecurity(s);let left=3-s.failed,t=`${reason} ${left} attempt${left===1?'':'s'} remaining before 2-hour ban.`;
  if(msgEl){msgEl.textContent=t;msgEl.style.color='#ff6b6b'}toast(t);return false
}
function requestEmergencyUnlock(){
  let plan=activated?(access==='DAY24'?'24 HOUR PRO':access):'NOT ACTIVATED';
  let code=localStorage.getItem('trjPromoCode')||'NONE';
  let msg=encodeURIComponent(`Hello TRJ Visuals Media, my TRJ Visual Gallery system is banned. I cannot wait 2 hours. Please send me an emergency unlock code. Current plan: ${plan}. Promo code: ${code}.`);
  window.open(`https://wa.me/${C.whatsapp}?text=${msg}`,'_blank')
}
function recoverWithUnlockCode(){
  let input=document.getElementById('unlockCodeInput'),msg=document.getElementById('unlockRecoveryMsg');
  let code=String(input?.value||'').trim().toUpperCase();
  let valid=(C.recoveryUnlockCodes||[]).map(x=>String(x).trim().toUpperCase()).includes(code);
  if(valid){
    let s=promoSecurity();s.failed=0;s.banUntil=0;savePromoSecurity(s);setRecoveryFails(0);
    if(input)input.value='';if(msg){msg.textContent='ACCOUNT RECOVERED — System unlocked successfully.';msg.style.color='#8ff0a4'}
    updateBanUI();toast('Account recovery successful');return
  }
  let n=getRecoveryFails()+1;setRecoveryFails(n);
  if(n>=3){
    let oldCode=localStorage.getItem('trjPromoCode')||'';
    clearAccess();setRecoveryFails(0);
    if(msg){msg.textContent=`Recovery failed 3 times. Current access / Pro key has been removed from this browser. ${oldCode?'That promo code cannot be reused to reset its old timer.':''}`;msg.style.color='#ff7b7b'}
    toast('Recovery failed • Current access removed');updateAccess();updateActivationUI();return
  }
  if(msg){msg.textContent=`Wrong unlock code. ${3-n} recovery attempt(s) remaining.`;msg.style.color='#ffb36b'}
}
function codeLockRecord(code){let all=usedCodes(),key=String(code||'').trim().toUpperCase(),r=all[key];if(!r)return null;let until=Number(r.lockUntil||0);if(until && until<=Date.now()){delete all[key];saveUsedCodes(all);return null}return r}
function lockActivatedCode(code,plan,until){let all=usedCodes(),key=String(code||'').trim().toUpperCase();all[key]={plan,usedAt:Date.now(),lockUntil:until};saveUsedCodes(all)}
function sameCodeAlreadyUsed(code){let r=codeLockRecord(code);return r&&Number(r.lockUntil)>Date.now()?r:null}

function activateFreeCode(v,msgEl){
  let code=v.trim().toUpperCase();
  if(isActivationBanned(msgEl))return false;
  if(code===currentFreeCode().toUpperCase()){
    let used=sameCodeAlreadyUsed(code);
    if(used)return registerFailedAttempt(msgEl,`This FREE promo code is already active/used. It cannot reset the timer. Code unlocks in ${fmtRemaining(Number(used.lockUntil)-Date.now())}.`);
    let until=Date.now()+durationMs('FREE');
    access='FREE';activated=true;localStorage.setItem('trjAccess','FREE');localStorage.setItem('trjPromoCode',code);localStorage.setItem('trjActivated','1');localStorage.setItem('trjAccessUntil',String(until));lockActivatedCode(code,'FREE',until);resetFailedAttempts();updateAccess();updateActivationUI();
    if(msgEl){msgEl.style.color='';msgEl.textContent='FREE access activated. This FREE code is disabled on this browser for 24 hours.'}toast('FREE access activated • 24-hour code lock');return true;
  }
  return activateCode(v,msgEl);
}
function activateFromPage(){activateFreeCode(document.getElementById('activationCode').value,document.getElementById('activationMsg'))}
function downloadChoice(type,i,j){
  if(access!=='FREE') return downloadMediaNow(type,i,j);
  window._pendingDownload=[type,i,j]; document.getElementById('freeDownloadModal').classList.remove('hidden');
}
function closeFreeDownload(){document.getElementById('freeDownloadModal').classList.add('hidden');window._pendingDownload=null}
function continueFreeDownload(){let x=window._pendingDownload;document.getElementById('freeDownloadModal').classList.add('hidden');if(x)downloadMediaNow(...x);window._pendingDownload=null}
function openBuyFromDownload(){document.getElementById('freeDownloadModal').classList.add('hidden');go('buy');window._pendingDownload=null}

function go(id){if(updateBanUI()){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='home'));document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab==='home'));window.scrollTo(0,0);return}if(!activated && !['home','buy','activation'].includes(id)){toast('Activate FREE, SILVER or GOLD access first.');id='home';}document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));window.scrollTo(0,0);if(id==='activation'||id==='buy')updateBanUI()}
function enterFree(){go('buy');}
function showPromo(){document.getElementById('promoBox').classList.remove('hidden')}
function getPromo(v){let code=v.trim().toUpperCase();let list=C.promoCodes||[];if(typeof list[0]==='string')return list.includes(code)?{code,plan:'GOLD',active:true}:null;let p=list.find(x=>String(x.code).toUpperCase()===code);if(!p||p.active===false)return null;if(p.expires && new Date(p.expires+'T23:59:59')<new Date())return null;return p}
function activateCode(v,msgEl){
  if(isActivationBanned(msgEl))return false;
  let code=String(v||'').trim().toUpperCase();
  if(!code)return registerFailedAttempt(msgEl,'Promo code is empty.');
  let p=getPromo(code);
  if(!p)return registerFailedAttempt(msgEl,'Invalid / inactive / expired promo code.');
  let used=sameCodeAlreadyUsed(code);
  if(used)return registerFailedAttempt(msgEl,`This promo code is already active/used. It cannot reset the timer. Code unlocks in ${fmtRemaining(Number(used.lockUntil)-Date.now())}.`);
  let raw=String(p.plan||'GOLD').toUpperCase();access=raw==='24H'||raw==='DAY24'?'DAY24':raw==='SILVER'?'SILVER':'GOLD';let until=Date.now()+durationMs(access);
  localStorage.setItem('trjAccess',access);localStorage.setItem('trjPromoCode',p.code);localStorage.setItem('trjActivated','1');localStorage.setItem('trjAccessUntil',String(until));if(access==='DAY24')localStorage.setItem('trjHelp24Count','0');lockActivatedCode(code,access,until);resetFailedAttempts();activated=true;document.getElementById('gate').classList.add('hidden');updateAccess();updateActivationUI();if(msgEl){msgEl.style.color='';msgEl.textContent=`${access} access activated successfully. Re-entering this same code will NOT reset the timer.`}toast(`${access} access activated`);return true
}
function activatePromo(){activateCode(document.getElementById('promoInput').value,document.getElementById('promoMsg'))}
function activatePromo2(){activateCode(document.getElementById('promoInput2').value,document.getElementById('promoMsg2'))}
function activateFromBuy(){activateFreeCode(document.getElementById('promoInput2').value,document.getElementById('promoMsg2'))}
function updateAccess(){let label=access==='DAY24'?'24 HOUR PRO':access;document.getElementById('accessLabel').textContent=activated?label:'NOT ACTIVATED';document.getElementById('accessLabel').style.color=access==='GOLD'?'#e6b84a':access==='SILVER'?'#c8d0da':'#00a8ff';updateTimeRemaining()}
function updateTimeRemaining(){let e=document.getElementById('timeRemaining');if(!e)return;if(!activated){e.textContent='Activate a plan to start access.';return}let ms=Number(localStorage.getItem('trjAccessUntil')||0)-Date.now();if(ms<=0){clearAccess();e.textContent='Plan expired — activate again.';updateActivationUI();return}let d=Math.floor(ms/86400000),h=Math.floor(ms%86400000/3600000),m=Math.floor(ms%3600000/60000);e.textContent=`Time remaining: ${d?d+' day(s) ':''}${h} hr ${m} min`}
function renderFolders(){['photos','videos','nature','wildlife'].forEach(type=>{let el=document.getElementById(type+'Grid'),folders=C.folders[type]||[];el.innerHTML=folders.length?folders.map((f,i)=>`<div class="folder" onclick="openFolder('${type}',${i})"><div class="icon">📁</div><h3>${esc(f.name)}</h3><small>${(f.files||[]).length} items ${access==='GOLD'?'• folder download enabled':''}</small></div>`).join(''):`<div class="empty">No folders added yet.<br><small>Admin can create folders and add media from admin.html.</small></div>`})}
function photoPreviewMarkup(src,name,full=false){
  let wm=access==='FREE'?`<img class="free-photo-watermark ${full?'viewer-watermark':''}" src="assets/gallery-logo.png" alt="TRJ Visual Gallery watermark">`:'';
  return `<span class="photo-preview-wrap ${full?'full-preview':''}"><img src="${src}" ${full?'':'loading="lazy"'} alt="${esc(name||'')}">${wm}</span>`;
}
function openFolder(type,i){let f=C.folders[type][i],body=document.getElementById('viewerBody');let items=(f.files||[]).map((x,j)=>{let src=`media/${type}/${encodeURIComponent(f.name)}/${encodeURIComponent(x)}`,isVid=type==='videos'||/\.(mp4|webm|mov)$/i.test(x);return `<button class="media-tile" onclick="viewMedia('${type}',${i},${j})">${isVid?`<video src="${src}" muted preload="metadata"></video><span class="media-play">▶</span>`:photoPreviewMarkup(src,x,false)}<small>${esc(x)}</small></button>`}).join('');body.innerHTML=`<div class="folder-head"><h2>📁 ${esc(f.name)}</h2><span>${(f.files||[]).length} items</span></div><div class="media-thumb-grid">${items||'<div class="empty">No files in this folder.</div>'}</div>${access==='GOLD'?`<div class="media-actions"><button onclick="downloadFolder('${type}',${i})">Download whole folder</button></div>`:''}`;document.getElementById('viewer').classList.remove('hidden')}
function viewMedia(type,i,j){let f=C.folders[type][i],name=f.files[j],src=`media/${type}/${encodeURIComponent(f.name)}/${encodeURIComponent(name)}`,isVid=type==='videos'||/\.(mp4|webm|mov)$/i.test(name);document.getElementById('viewerBody').innerHTML=`${isVid?`<video controls src="${src}"></video>`:photoPreviewMarkup(src,name,true)}<div class="media-actions"><button onclick="downloadChoice('${type}',${i},${j})">Download</button><button onclick="copyMedia('${type}',${i},${j})">Copy</button><button onclick="openFolder('${type}',${i})">Back</button></div>`}
function closeViewer(){document.getElementById('viewer').classList.add('hidden')}
async function downloadMediaNow(type,i,j){let f=C.folders[type][i],name=f.files[j],url=`media/${type}/${encodeURIComponent(f.name)}/${encodeURIComponent(name)}`,isVid=type==='videos'||/\.(mp4|webm|mov)$/i.test(name);if(access==='FREE'){toast('FREE download: watermark + reduced quality. Please wait…');await wait(2800);if(isVid){toast('Video download starting.');return forceDownload(url,name,true)}try{let blob=await watermarked(url);saveBlob(blob,name.replace(/(\.[^.]+)$/,'-TRJ$1'));}catch(e){forceDownload(url,name)}}else if(access==='DAY24'){toast('24 HOUR PRO: high quality, no watermark. Normal download…');await wait(1200);forceDownload(url,name,isVid)}else{toast(`${access} download: original high-quality file, no watermark.`);forceDownload(url,name,isVid)}}
async function watermarked(url){let img=await loadImage(url),logo=await loadImage('assets/gallery-logo.png'),scale=Math.min(1,2200/img.width),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);let x=c.getContext('2d');x.drawImage(img,0,0,c.width,c.height);let w=Math.min(c.width*.24,420),h=w*logo.height/logo.width;x.globalAlpha=.55;x.drawImage(logo,c.width-w-24,c.height-h-24,w,h);return await new Promise(r=>c.toBlob(r,'image/jpeg',.82))}
function loadImage(src){return new Promise((r,j)=>{let i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=src})}
async function forceDownload(url,name,isVideo=false){
  // Chrome often opens file:// media in a new tab instead of honoring download.
  // The included START_WEBSITE.bat serves this folder over localhost so downloads are reliable.
  if(location.protocol==='file:'){
    toast('For real downloads, open the site using START_WEBSITE.bat (no Python needed).');
    setTimeout(()=>alert('DOWNLOAD MODE\n\nPlease close this file:// page and double-click START_WEBSITE.bat.\nIt uses built-in Windows PowerShell only — no Python.\nThen the Download button will save the file instead of opening a new tab.'),150);
    return;
  }
  // On the bundled local server, use its attachment endpoint for original files.
  if(location.hostname==='127.0.0.1'||location.hostname==='localhost'){
    let a=document.createElement('a');
    a.href='/__download?path='+encodeURIComponent(url)+'&name='+encodeURIComponent(name);
    a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),500);return;
  }
  // On normal web hosting (e.g. GitHub Pages), fetch as a blob to force Save As/download.
  try{let r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);let b=await r.blob();saveBlob(b,name);return}catch(e){
    toast('Download could not start automatically. Please try again.');
  }
}
function direct(url,name){forceDownload(url,name,/\.(mp4|webm|mov)$/i.test(name))}
async function copyMedia(type,i,j){let f=C.folders[type][i],name=f.files[j],url=`media/${type}/${encodeURIComponent(f.name)}/${encodeURIComponent(name)}`;try{let b=await fetch(url).then(r=>r.blob());await navigator.clipboard.write([new ClipboardItem({[b.type]:b})]);toast('Copied to clipboard')}catch(e){toast('Copy is not supported by this browser/file type.') }}
async function downloadFolder(type,i){if(access!=='GOLD')return toast('Whole-folder download is GOLD PLAN only.');if(typeof JSZip==='undefined')return toast('Internet connection required once to load ZIP support.');let f=C.folders[type][i],zip=new JSZip();toast('Preparing folder ZIP…');for(const name of f.files){let url=`media/${type}/${encodeURIComponent(f.name)}/${encodeURIComponent(name)}`;let b=await fetch(url).then(r=>r.blob());zip.file(name,b)}let out=await zip.generateAsync({type:'blob'});saveBlob(out,f.name+'.zip')}
function saveBlob(blob,name){let u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function renderQuestions(){document.getElementById('questions').innerHTML=C.helpQuestions.map((q,i)=>`<button onclick="pickQ(${i})">${esc(q[0])}</button>`).join('')}
function pickQ(i){selectedQ=i;document.getElementById('chatInput').value=C.helpQuestions[i][0]}
function freeUsage(){let k='trjHelpUsage',today=new Date().toISOString().slice(0,10),o={date:today,count:0};try{o=JSON.parse(localStorage.getItem(k))||o}catch{} if(o.date!==today)o={date:today,count:0};return {k,o}}
function sendSelected(){if(selectedQ===null)return;if(access==='DAY24'){let c=Number(localStorage.getItem('trjHelp24Count')||0);if(c>=15){toast('24 HOUR PRO: Help Assistant message limit 15 reached.');return}localStorage.setItem('trjHelp24Count',String(c+1));}if(access==='FREE'){let u=freeUsage();if(u.o.count>=5){toast('FREE plan: අද Help Assistant ප්‍රශ්න 5 සීමාව අවසන්.');document.getElementById('messages').insertAdjacentHTML('beforeend','<div class="bubble bot">FREE Plan එකෙන් දවසකට උපරිම ප්‍රශ්න 5යි. හෙට නැවත භාවිතා කරන්න හෝ Silver/Gold Plan එකක් activate කරන්න.</div>');return}u.o.count++;localStorage.setItem(u.k,JSON.stringify(u.o));toast(`FREE Help: අද ${u.o.count}/5 ප්‍රශ්න භාවිතා කර ඇත.`)}let q=C.helpQuestions[selectedQ],m=document.getElementById('messages');m.insertAdjacentHTML('beforeend',`<div class="bubble me">${esc(q[0])}</div>`);document.getElementById('chatInput').value='';let delay=(access==='FREE'||access==='DAY24')?3200:450;if(access==='FREE'||access==='DAY24')toast('This plan uses a slower Help Assistant reply.');setTimeout(()=>{m.insertAdjacentHTML('beforeend',`<div class="bubble bot">${esc(q[1])}</div>`);m.scrollTop=m.scrollHeight},delay);selectedQ=null;m.scrollTop=m.scrollHeight}
function buyPlan(plan){let msg=encodeURIComponent(`Hello TRJ Visuals Media, I want to activate the ${plan} for TRJ Visual Gallery. Please send me the payment/activation details.`);window.open(`https://wa.me/${C.whatsapp}?text=${msg}`,'_blank')}
function toast(t){let e=document.getElementById('toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),3000)}function wait(ms){return new Promise(r=>setTimeout(r,ms))}function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
setInterval(()=>{updateBanUI();if(activated){let until=Number(localStorage.getItem('trjAccessUntil')||0);if(until&&Date.now()>=until){clearAccess();updateAccess();updateActivationUI();go('home')}else updateTimeRemaining()}},1000);
init();
