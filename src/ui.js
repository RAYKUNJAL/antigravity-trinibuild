// src/ui.js — IslandProcure design system (Glassmorphism 2.0, Sea & Sand)
'use strict';
const IMG = {
  hero: '/public/images/hero.png',
  choc: '/public/images/choc.png',
  coffee: '/public/images/coffee.png',
  nutmeg: '/public/images/nutmeg.png',
  seamos: '/public/images/seamos.png',
};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function stateBadge(s){const m={TRADE_VERIFIED:['Verified','verified'],TRANSACTION_VERIFIED:['Transaction Verified','verified'],IDENTITY_VERIFIED:['Identity Verified','verified'],CLAIMED:['Claimed','claimed'],CLAIM_PENDING:['Claim Pending','claimed'],UNCLAIMED_PUBLIC_PROFILE:['Public - Unclaimed','unclaimed']};const l=m[s]||[s,'unclaimed'];return `<span class="state-badge ${l[1]}">${esc(l[0])}</span>`;}

function shell(title, bodyHtml, active, nav) {
  const dashLink = !nav ? '' : (nav.isAdmin ? '/admin' : nav.role === 'buyer' ? '/buyer' : nav.role === 'supplier' ? '/supplier' : null);
  const dash = !dashLink ? '' : '<a href="' + dashLink + '" class="' + (active === dashLink ? 'active' : '') + '">Dashboard</a>';
  const cta = nav ? (nav.name ? '<span style="color:var(--on-surface-variant);font-weight:600;font-size:14px">' + esc(nav.name) + '</span>' : '') + '<a class="btn btn-glass" href="/logout">Logout</a>' : '<a class="btn btn-glass" href="/login">Sign in</a><a class="btn btn-primary" href="/signup">Get Started</a>';
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<link rel="icon" type="image/svg+xml" href="/public/favicon.svg"/>
<meta name="theme-color" content="#006D77"/>
<title>${esc(title)} · Caribbean Trade Network</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<style>
:root{--surface:#f2fbfe;--surface-dim:#d2dcde;--surface-container-lowest:#fff;--surface-container-low:#ecf5f8;--surface-container:#e6eff2;--surface-container-high:#e1eaed;--surface-container-highest:#dbe4e7;--on-surface:#141d1f;--on-surface-variant:#3e494a;--outline:#6f797a;--outline-variant:#bec8ca;--primary:#00535b;--on-primary:#fff;--primary-container:#006d77;--on-primary-container:#9becf7;--secondary:#236863;--on-secondary:#fff;--secondary-container:#a9ece5;--on-secondary-container:#286d67;--tertiary:#5d453e;--gold-1:#FF8C42;--gold-2:#F9C22E;--shadow-soft:0 4px 20px rgba(0,0,0,0.05);--shadow-float:0 20px 40px rgba(0,109,119,0.1)}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{font-family:Geist,system-ui,sans-serif;color:var(--on-surface);background:var(--surface-bright);min-height:100vh;overflow-x:hidden;line-height:1.5}
.mesh{position:fixed;inset:0;z-index:-1;opacity:.55;background-image:radial-gradient(at 0% 0%,hsla(184,87%,81%,1) 0px,transparent 50%),radial-gradient(at 100% 0%,hsla(15,80%,75%,1) 0px,transparent 50%),radial-gradient(at 100% 100%,hsla(180,48%,62%,1) 0px,transparent 50%),radial-gradient(at 0% 100%,hsla(20,70%,85%,1) 0px,transparent 50%)}
.glass{backdrop-filter:blur(20px);background:rgba(255,255,255,0.4);border:1px solid rgba(255,255,255,0.5);box-shadow:inset 0 0 20px rgba(255,255,255,0.2);border-radius:1rem}
.glass-float{backdrop-filter:blur(20px);background:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.6);border-radius:1rem;box-shadow:var(--shadow-float)}
.shimmer{position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent);background-size:200% 100%;animation:shimmer 2.4s infinite}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,0.55);backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,0.6);box-shadow:var(--shadow-soft)}.nav-inner{max-width:1200px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
.brand{font-weight:700;font-size:22px;letter-spacing:-0.02em;color:var(--primary);display:flex;align-items:center;gap:8px;text-decoration:none}
.nav-links{display:flex;gap:28px;align-items:center}.nav-links a{color:var(--on-surface-variant);text-decoration:none;font-size:14px;font-weight:600;padding:6px 2px;border-bottom:2px solid transparent}.nav-links a:hover{color:var(--primary)}.nav-links a.active{color:var(--primary);border-bottom-color:var(--primary)}.nav-cta{display:flex;gap:12px;align-items:center}
.btn{border:none;border-radius:999px;padding:12px 22px;font-weight:600;font-size:14px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:all .2s;line-height:1}.btn-primary{background:var(--primary);color:var(--on-primary);box-shadow:var(--shadow-soft)}.btn-primary:hover{background:var(--primary-container);color:var(--on-primary-container);transform:translateY(-1px)}.btn-glass{background:rgba(255,255,255,0.5);color:var(--primary);border:1px solid rgba(255,255,255,0.6);backdrop-filter:blur(8px)}.btn-glass:hover{background:rgba(255,255,255,0.85)}.btn-gold{background:linear-gradient(90deg,var(--gold-1),var(--gold-2));color:#fff}.btn-block{width:100%;justify-content:center}
.wrap{max-width:1200px;margin:0 auto;padding:0 24px}main{flex:1}
.hero{position:relative;min-height:76vh;display:flex;align-items:center;justify-content:center;padding:110px 24px 60px;overflow:hidden}.hero-bg{position:absolute;inset:0;z-index:-1}.hero-img{position:absolute;inset:0;background-size:cover;background-position:center;mix-blend-mode:overlay;opacity:.45}.hero-grad{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(242,251,254,0.2),rgba(242,251,254,0.92))}.hero-card{max-width:860px;margin:0 auto;text-align:center;padding:48px 40px;position:relative}
.hero-eyebrow{display:inline-flex;align-items:center;gap:8px;color:var(--secondary);font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;margin-bottom:16px}h1{font-size:clamp(34px,6vw,52px);font-weight:700;letter-spacing:-0.03em;color:var(--primary);line-height:1.05;margin-bottom:16px}.hero-sub{font-size:18px;color:var(--on-surface-variant);max-width:640px;margin:0 auto 28px;line-height:1.5}.hero-actions{display:flex;flex-direction:column;gap:14px;align-items:center}@media(min-width:640px){.hero-actions{flex-direction:row;justify-content:center}}
.section{max-width:1200px;margin:0 auto;padding:56px 24px}.section-head{text-align:center;max-width:720px;margin:0 auto 40px}.section-head h2{font-size:32px;font-weight:600;letter-spacing:-0.02em;color:var(--primary);margin-bottom:10px}.section-head p{color:var(--on-surface-variant);font-size:16px}
.bento{display:grid;grid-template-columns:1fr;gap:16px}@media(min-width:768px){.bento{grid-template-columns:repeat(12,1fr)}}.bento .glass{padding:24px;position:relative;overflow:hidden}.bento-8{grid-column:span 12}@media(min-width:768px){.bento-8{grid-column:span 8}}.bento-4{grid-column:span 12}@media(min-width:768px){.bento-4{grid-column:span 4}}.bento-kicker{display:flex;align-items:center;gap:8px;color:var(--secondary);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px}.bento-kicker .ms{font-size:20px}.bento h3{font-size:22px;font-weight:600;color:var(--on-surface);margin-bottom:8px}.bento h3 .hl{color:var(--primary)}.bento p{color:var(--on-surface-variant);font-size:15px}.big-num{font-size:52px;font-weight:700;color:var(--primary);letter-spacing:-0.04em;line-height:1}.mono{font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--outline)}.bento-icon{position:absolute;right:-10px;bottom:-10px;opacity:.1;pointer-events:none}.bento-icon .ms{font-size:140px;color:var(--primary)}
.pgrid{display:grid;grid-template-columns:1fr;gap:16px}@media(min-width:640px){.pgrid{grid-template-columns:repeat(2,1fr)}}@media(min-width:1024px){.pgrid{grid-template-columns:repeat(4,1fr)}}.pcard{overflow:hidden;transition:transform .25s;display:flex;flex-direction:column}.pcard:hover{transform:translateY(-4px)}.pimg{height:160px;background-size:cover;background-position:center;position:relative;background-color:var(--surface-container-high)}.pbadge{position:absolute;top:12px;left:12px;background:linear-gradient(90deg,var(--gold-1),var(--gold-2));color:#fff;padding:5px 12px;border-radius:999px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;display:flex;align-items:center;gap:5px;box-shadow:var(--shadow-soft);overflow:hidden}.pbody{padding:20px;display:flex;flex-direction:column;flex:1}.pbody h4{font-size:20px;font-weight:600;color:var(--on-surface);margin-bottom:4px}.pbody .pcat{color:var(--on-surface-variant);font-size:14px;margin-bottom:12px}.pbody .pmeta{color:var(--outline);font-size:13px;margin-bottom:12px}.passport{display:inline-flex;align-items:center;gap:6px;color:var(--primary);font-size:13px;font-weight:600;text-decoration:none;margin-top:auto;padding-top:12px}.passport:hover{color:var(--primary-container)}
.dir{display:grid;grid-template-columns:1fr;gap:16px}@media(min-width:700px){.dir{grid-template-columns:repeat(2,1fr)}}@media(min-width:1024px){.dir{grid-template-columns:repeat(3,1fr)}}.bcard{padding:22px;display:flex;flex-direction:column;gap:8px}.bcard h3{font-size:18px;font-weight:600;color:var(--on-surface)}.bcard .bloc{color:var(--on-surface-variant);font-size:14px;display:flex;align-items:center;gap:6px}.bcard .bdisclaimer{font-size:13px;font-style:italic;color:var(--on-surface-variant);opacity:.85;margin-top:6px}.state-badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;width:fit-content}.state-badge.verified{background:rgba(35,104,99,.15);color:var(--secondary)}.state-badge.claimed{background:rgba(117,93,84,.15);color:var(--tertiary)}.state-badge.unclaimed{background:rgba(0,83,91,.12);color:var(--primary)}
.form{max-width:560px;margin:0 auto;padding:28px;display:grid;gap:14px}label{font-size:13px;font-weight:600;color:var(--on-surface-variant)}input,select,textarea{width:100%;padding:12px 14px;border-radius:8px;border:1px solid var(--outline-variant);background:rgba(255,255,255,0.6);color:var(--on-surface);font:inherit;transition:all .2s}input:focus,select:focus,textarea:focus{outline:none;border-color:var(--primary-container);box-shadow:0 0 0 3px rgba(0,109,119,.15);background:rgba(255,255,255,0.9)}
table{width:100%;border-collapse:collapse;margin-top:12px}th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--outline-variant);font-size:14px}th{color:var(--on-surface-variant);font-size:12px;text-transform:uppercase;letter-spacing:.06em}
footer{margin-top:48px;background:var(--surface-container-lowest);border-top:1px solid rgba(190,200,202,0.3)}.foot{max-width:1200px;margin:0 auto;padding:48px 24px;display:flex;flex-direction:column;gap:24px;justify-content:space-between}@media(min-width:768px){.foot{flex-direction:row;align-items:center}}.foot .brand{font-size:20px;margin-bottom:4px}.foot .copy{color:var(--on-surface-variant);font-size:14px}.foot-links{display:flex;gap:24px;flex-wrap:wrap}.foot-links a{color:var(--on-surface-variant);text-decoration:none;font-size:14px;font-weight:600}.foot-links a:hover{color:var(--primary)}
.ms{font-family:'Material Symbols Outlined';font-weight:normal;font-style:normal;display:inline-block;line-height:1;letter-spacing:normal;text-transform:none;vertical-align:middle;-webkit-font-smoothing:antialiased}
.brand{display:inline-flex;align-items:center;gap:9px;font-weight:700;color:var(--primary);text-decoration:none}.brand-mark{display:block;border-radius:7px;box-shadow:0 2px 8px rgba(0,83,91,.25)}.brand-word{letter-spacing:-0.01em}.bimg{height:130px;border-radius:12px;background-size:cover;background-position:center;margin-bottom:12px;position:relative}.bimg .btag{position:absolute;left:10px;bottom:10px;background:rgba(0,20,24,.72);color:#fff;font-size:11px;font-weight:600;padding:4px 10px;border-radius:999px;backdrop-filter:blur(4px)}.cookie-banner{position:fixed;left:0;right:0;bottom:0;z-index:200;background:rgba(11,23,27,.96);backdrop-filter:blur(8px);color:#e8f6f8;padding:14px 20px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;border-top:1px solid rgba(0,109,119,.4);box-shadow:0 -4px 24px rgba(0,0,0,.3)}.cookie-banner p{margin:0;font-size:13px;max-width:640px}.cookie-banner .cookie-btns{display:flex;gap:8px}.ac-wrap{position:relative}.ac-list{position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:120;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.14);display:none;overflow:hidden}.ac-item{display:flex;align-items:center;gap:9px;padding:11px 14px;cursor:pointer;font-size:14px;border-bottom:1px solid #f1f5f9}.ac-item:hover{background:#ecf5f8}.ac-item:last-child{border-bottom:none}.skip-link{position:absolute;left:-9999px;top:8px;z-index:500;background:#00535B;color:#fff;padding:10px 14px;border-radius:8px;font-weight:600}.skip-link:focus{left:8px}.kai-btn{position:fixed;right:20px;bottom:20px;z-index:300;width:58px;height:58px;border-radius:50%;border:none;background:linear-gradient(135deg,#0b8a94,#00535B);color:#fff;font-size:26px;cursor:pointer;box-shadow:0 8px 24px rgba(0,83,91,.4);display:flex;align-items:center;justify-content:center}.kai-panel{position:fixed;right:20px;bottom:90px;width:360px;max-width:calc(100vw - 32px);height:480px;max-height:calc(100vh - 140px);z-index:300;background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden}.kai-panel.open{display:flex}.kai-head{background:linear-gradient(135deg,#0b8a94,#00535B);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}.kai-head .kai-dot{width:8px;height:8px;border-radius:50%;background:#7CFF9B;box-shadow:0 0 0 3px rgba(124,255,155,.3)}.kai-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f6fafb}.kai-msg{max-width:82%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.5}.kai-msg.user{align-self:flex-end;background:var(--primary,#00535B);color:#fff;border-bottom-right-radius:4px}.kai-msg.bot{align-self:flex-start;background:#fff;border:1px solid #e6eef1;border-bottom-left-radius:4px;color:#123b3f}.kai-input{display:flex;gap:8px;padding:10px;border-top:1px solid #e2e8f0;background:#fff}.kai-input input{flex:1;border:1px solid #d7e2e6;border-radius:10px;padding:10px 12px;font-size:14px;outline:none}.kai-input button{border:none;border-radius:10px;padding:0 14px;background:var(--primary,#00535B);color:#fff;font-weight:700;cursor:pointer}
</style></head><body>
  <a class="skip-link" href="#main">Skip to main content</a>
<div class="mesh"></div>
<nav class="nav"><div class="nav-inner">
<a class="brand" href="/"><svg class="brand-mark" viewBox="0 0 64 64" width="28" height="28" role="img" aria-label="Caribbean Trade"><rect width="64" height="64" rx="15" fill="#006D77"/><circle cx="46" cy="17" r="6" fill="#f4b942"/><path d="M13 30 Q20 24 28 30 T43 30" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".95"/><path d="M15 40 Q23 34 31 40 T47 40" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".72"/><path d="M17 50 Q25 44 33 50 T49 50" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".45"/></svg><span class="brand-word">Caribbean Trade</span></a>
<div class="nav-links">
<a href="/" class="${active==='/'?'active':''}">Marketplace</a><a href="/browse" class="${active==='/browse'?'active':''}">Directory</a><a href="/sourcing" class="${active==='/sourcing'?'active':''}">Sourcing</a><a href="/landed-cost" class="${active==='/landed-cost'?'active':''}">Landed Cost</a><a href="/trade-info" class="${active==='/trade-info'?'active':''}">Trade Info</a><a href="/plans" class="${active==='/plans'?'active':''}">Plans</a><a href="/advertise" class="${active==='/advertise'?'active':''}">Advertise</a>${dash}
</div>
<div class="nav-cta">${cta}</div>
</div></nav>
<main id="main">${bodyHtml}</main>
<footer><div class="foot">
<div><div class="brand"><svg class="brand-mark" viewBox="0 0 64 64" width="28" height="28" role="img" aria-label="Caribbean Trade"><rect width="64" height="64" rx="15" fill="#006D77"/><circle cx="46" cy="17" r="6" fill="#f4b942"/><path d="M13 30 Q20 24 28 30 T43 30" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".95"/><path d="M15 40 Q23 34 31 40 T47 40" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".72"/><path d="M17 50 Q25 44 33 50 T49 50" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".45"/></svg><span class="brand-word">Caribbean Trade</span></div><p class="copy">© ${new Date().getFullYear()} trade.juvay.app · Caribbean AI Trade Network. All rights reserved.</p><p class="copy" style="margin-top:4px">Powered by <strong>R&amp;R Digital Platform Solutions Ltd.</strong></p></div>
<div class="foot-links"><a href="/browse">Logistics Network</a><a href="/trade-info">Trade Hub Stats</a><a href="/plans">Digital Passports</a><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/cookies">Cookie Policy</a><a href="/dpa">Data Processing</a><a href="/acceptable-use">Acceptable Use</a><a href="/advertise">Advertise</a></div>
</div></footer>
<div id="cookieBanner" class="cookie-banner"><p>We use cookies to operate this platform and, with your consent, to improve your experience, measure usage, and show relevant advertising. <a href="/cookies" style="color:#22d3ee">Cookie Policy</a> · <a href="/privacy" style="color:#22d3ee">Privacy Policy</a></p><div class="cookie-btns"><button class="btn btn-glass" onclick="ctPref('essential')">Essential only</button><button class="btn btn-primary" onclick="ctPref('all')">Accept all</button></div></div>
<script>(function(){ if(localStorage.getItem('ct_consent')){ var b=document.getElementById('cookieBanner'); if(b) b.style.display='none'; } })(); function ctPref(p){ localStorage.setItem('ct_consent', p); var b=document.getElementById('cookieBanner'); if(b) b.style.display='none'; }</script>
<script>function adEscH(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function loadAds(){document.querySelectorAll('[data-ad-slot]').forEach(function(slot){var placement=slot.getAttribute('data-ad-slot');fetch('/api/v1/ads?placement='+encodeURIComponent(placement)).then(function(r){return r.json();}).then(function(j){if(!j.data||!j.data.length){slot.style.display='none';return;}
var ads=j.data.slice(0,3);slot.style.display='block';
slot.innerHTML='<div style="font-size:11px;font-weight:700;color:var(--primary);letter-spacing:.05em;margin-bottom:8px">SPONSORED</div>'+ads.map(function(a){var img=a.image_url||'/public/images/coffee.png';return '<div class="glass" style="padding:14px;display:flex;gap:12px;align-items:center;margin-bottom:10px"><img src="'+adEscH(img)+'" width="64" height="64" style="border-radius:8px;object-fit:cover"/><div style="flex:1"><div style="font-weight:600">'+adEscH(a.title)+'</div>'+(a.body?'<div class="muted" style="font-size:13px">'+adEscH(a.body)+'</div>':'')+'</div>'+(a.target_url?'<a class="btn btn-primary" style="padding:8px 14px" href="'+adEscH(a.target_url)+'" target="_blank" rel="noopener" onclick="fetch('/api/v1/ads/'+a.id+'/click',{method:'POST'})">Visit</a>':'')+'</div>';}).join('');
ads.forEach(function(a){fetch('/api/v1/ads/'+a.id+'/impression',{method:'POST'}).catch(function(){});});}).catch(function(){});});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadAds);else loadAds();</script>
<script>(function(){function escH(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function init(input){var box=document.createElement('div');box.className='ac-wrap';input.parentNode.insertBefore(box,input.nextSibling);var list=document.createElement('div');list.className='ac-list';box.appendChild(list);var cur='',t;
input.addEventListener('input',function(){var v=input.value.trim();clearTimeout(t);if(!v){list.style.display='none';return;}t=setTimeout(function(){load(v);},140);});
function load(v){if(v===cur)return;cur=v;fetch('/api/suggest?q='+encodeURIComponent(v)).then(function(r){return r.json();}).then(function(j){if(input.value.trim()!==v)return;var items=[];
(j.names||[]).forEach(function(n){items.push({t:n,i:'business'});});(j.categories||[]).forEach(function(c){items.push({t:'Category: '+c,i:'category'});});(j.countries||[]).forEach(function(c){items.push({t:'Country: '+c,i:'place'});});(j.cities||[]).forEach(function(c){items.push({t:'City: '+c,i:'location_on'});});
if(!items.length){list.style.display='none';return;}list.innerHTML=items.slice(0,10).map(function(it){return '<div class="ac-item" data-v="'+escH(it.t)+'"><span class="ms" style="font-size:16px;color:var(--primary)">'+escH(it.i)+'</span><span>'+escH(it.t)+'</span></div>';}).join('');list.style.display='block';
list.querySelectorAll('.ac-item').forEach(function(el){el.addEventListener('click',function(){input.value=el.getAttribute('data-v');list.style.display='none';if(input.form)input.form.submit();});});}).catch(function(){});
}
document.addEventListener('click',function(e){if(!box.contains(e.target)&&e.target!==input)list.style.display='none';});}
function boot(){document.querySelectorAll('input[data-autocomplete]').forEach(function(i){if(!i.dataset.bound){i.dataset.bound='1';init(i);}});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();})();</script>
<button class="kai-btn" id="kai_btn" aria-label="Chat with Kai">💬</button>
<div class="kai-panel" id="kai_panel">
  <div class="kai-head"><span class="kai-dot"></span><div><div style="font-weight:700">Kai · Caribbean Trade Assistant</div><div style="font-size:11px;opacity:.85">Grok-powered · grounded in platform data</div></div></div>
  <div class="kai-body" id="kai_body"><div class="kai-msg bot">Blessings! I'm Kai, your Caribbean Trade assistant. Ask me about onboarding, claiming a business, logistics &amp; shipping, landed cost, or finding suppliers. 😊</div></div>
  <div class="kai-input"><input id="kai_in" placeholder="Ask Kai something…" autocomplete="off"/><button onclick="kaiSend()">➤</button></div>
</div>
<script>
var KAI_HIST=[];
document.getElementById('kai_btn').addEventListener('click',function(){document.getElementById('kai_panel').classList.toggle('open');});
document.getElementById('kai_in').addEventListener('keydown',function(e){if(e.key==='Enter')kaiSend();});
function KAI_ESC(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function kaiSend(){
  var inp=document.getElementById('kai_in'),body=document.getElementById('kai_body'),m=inp.value.trim();if(!m)return;inp.value='';
  body.insertAdjacentHTML('beforeend','<div class="kai-msg user">'+KAI_ESC(m)+'</div>');body.scrollTop=body.scrollHeight;
  body.insertAdjacentHTML('beforeend','<div class="kai-msg bot" style="color:#888" id="kai_think"><em>Kai thinking…</em></div>');body.scrollTop=body.scrollHeight;
  fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:m,history:KAI_HIST})}).then(function(r){return r.json();}).then(function(j){
    var th=document.getElementById('kai_think');if(th)th.remove();
    var reply=(j.reply||'No worries, ent sure on that one — support@kunjaldigital.com can sort you out.');
    var safe=reply.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')..split(String.fromCharCode(10)).join('<br/>');
    body.insertAdjacentHTML('beforeend','<div class="kai-msg bot">'+safe+'</div>');body.scrollTop=body.scrollHeight;
    KAI_HIST.push({role:'user',content:m},{role:'assistant',content:j.reply||''});
  }).catch(function(){var th=document.getElementById('kai_think');if(th)th.remove();body.insertAdjacentHTML('beforeend','<div class="kai-msg bot">Network issue — try again in a moment, ent?</div>');});
}
</script>
</body></html>`;
}

function marketplace(biz, products, nav) {
  const body = `
  <section class="hero"><div class="hero-bg"><div class="hero-img" style="background-image:url('${IMG.hero}')"></div><div class="hero-grad"></div></div>
    <div class="glass-float hero-card">
      <div class="hero-eyebrow"><span class="ms" style="font-variation-settings:'FILL' 1">public</span> The New Caribbean Value Chain</div>
      <h1>Beyond commodities.<br/>A $6.5B digital trade ecosystem.</h1>
      <p class="hero-sub">Find, verify, and trade across the Caribbean — and sell to global buyers. Powered by value-added sovereignty.</p>
      <form method="get" action="/browse" style="display:flex;gap:10px;max-width:560px;margin:0 auto 20px;flex-wrap:wrap">
        <input name="q" placeholder="Find eco-certified cocoa suppliers in Grenada…" aria-label="Search suppliers" data-autocomplete="1" style="flex:1;min-width:220px"/>
        <button class="btn btn-primary" type="submit"><span class="ms" style="font-variation-settings:'FILL' 1">search</span> Explore</button>
      </form>
      <div class="hero-actions">
        <a class="btn btn-primary" href="/sourcing"><span class="ms" style="font-variation-settings:'FILL' 1">explore</span> Post a Sourcing Request</a>
        <a class="btn btn-glass" href="/browse"><span class="ms">analytics</span> View the Directory</a>
        <a class="btn btn-glass" href="/signup?role=buyer_external"><span class="ms" style="font-variation-settings:'FILL' 1">public</span> Global Buyers</a>
      </div>
    </div>
  </section>
  <section class="section"><div data-ad-slot="home" style="margin:0 0 8px"></div></section>
  <section class="section"><div class="section-head"><h2>Economic Evolution</h2><p>Pivoting from raw materials to high-margin, specialized exports via the CARICOM Digital Single Market.</p></div>
    <div class="bento">
      <div class="glass bento-8"><div class="bento-icon"><span class="ms" style="font-variation-settings:'FILL' 1">account_tree</span></div>
        <div class="bento-kicker"><span class="ms" style="font-variation-settings:'FILL' 1">trending_up</span> Value-Chain Integration</div>
        <h3>Craft chocolate margins have increased by <span class="hl">400%</span> vs bulk beans.</h3>
        <p>Producers in Trinidad &amp; Tobago and Grenada are leading the transition from raw export to premium finished goods.</p></div>
      <div class="glass bento-4"><div class="bento-icon"><span class="ms" style="font-variation-settings:'FILL' 1">shopping_cart</span></div>
        <div class="bento-kicker" style="color:var(--tertiary)"><span class="ms" style="font-variation-settings:'FILL' 1">public</span> Digital Market</div>
        <div class="big-num">$6.5B</div><p>E-commerce revenue reached by end of 2025 via DTC exports.</p></div>
      <div class="glass bento-4"><div class="bento-kicker"><span class="ms" style="font-variation-settings:'FILL' 1">liquor</span> Premium Spirits</div>
        <h3>Caribbean rum exports hit a record <span class="hl">$1.8B</span> valuation.</h3>
        <p class="mono" style="border-top:1px solid var(--outline-variant);padding-top:12px;margin-top:10px">Rivaling single malt scotch in global auctions.</p></div>
      <div class="glass bento-8"><div class="bento-kicker"><span class="ms" style="font-variation-settings:'FILL' 1">local_shipping</span> Logistics Efficiency</div>
        <h3><span class="hl">30% improvement</span> in last-mile delivery.</h3>
        <p>Powered by localized hub-and-spoke models, reducing cross-border friction.</p></div>
    </div>
  </section>
  <section class="section"><div class="section-head"><h2>High-Value Niche Exports</h2><p>Explore authenticated premium products driving the region's digital economy.</p></div>
    <div class="pgrid">${products.length ? products.map(p => `<div class="glass pcard"><div class="pimg" style="background-image:url('${p.img||IMG[p.key]||IMG.choc}')"><div class="pbadge"><span class="ms" style="font-variation-settings:'FILL' 1">verified</span> Verified Origin</div></div><div class="pbody"><h4>${esc(p.name)}</h4><p class="pcat">${esc(p.category||'')}</p><p class="pmeta">${esc(p.country||'Caribbean')}${p.price?` · US$${p.price}`:''}</p><a class="passport" href="/browse"><span class="ms">qr_code_scanner</span> Digital Passport</a></div></div>`).join('') : `
      <div class="glass pcard"><div class="pimg" style="background-image:url('${IMG.choc}')"><div class="pbadge"><span class="ms" style="font-variation-settings:'FILL' 1">verified</span> Verified Origin</div></div><div class="pbody"><h4>Grenada Craft Chocolate</h4><p class="pcat">Food &amp; Beverage</p><p class="pmeta">Grenada</p><a class="passport" href="/browse?country=Grenada&amp;category=Food%20%26%20Beverage&amp;q=chocolate"><span class="ms">qr_code_scanner</span> Digital Passport</a></div></div>
      <div class="glass pcard"><div class="pimg" style="background-image:url('${IMG.coffee}')"><div class="pbadge"><span class="ms" style="font-variation-settings:'FILL' 1">verified</span> Verified Origin</div></div><div class="pbody"><h4>Jamaican Blue Mountain</h4><p class="pcat">Coffee</p><p class="pmeta">Jamaica</p><a class="passport" href="/browse?country=Jamaica&amp;category=Food%20%26%20Beverage&amp;q=coffee"><span class="ms">qr_code_scanner</span> Digital Passport</a></div></div>
      <div class="glass pcard"><div class="pimg" style="background-image:url('${IMG.nutmeg}')"><div class="pbadge"><span class="ms" style="font-variation-settings:'FILL' 1">verified</span> Verified Origin</div></div><div class="pbody"><h4>Trinidadian Nutmeg Oils</h4><p class="pcat">Beauty &amp; Wellness</p><p class="pmeta">Trinidad &amp; Tobago</p><a class="passport" href="/browse?country=Trinidad%20%26%20Tobago&amp;category=Beauty%20%26%20Wellness&amp;q=nutmeg"><span class="ms">qr_code_scanner</span> Digital Passport</a></div></div>`}
    </div>
  </section>
  <section class="section" style="text-align:center"><h2 style="color:var(--primary);font-size:32px;font-weight:600;letter-spacing:-0.02em">${biz.length} businesses across the Caribbean</h2><p style="color:var(--on-surface-variant);max-width:560px;margin:12px auto 24px">Source-backed supplier profiles with explicit verification — unclaimed, claimed, and trade-verified.</p><a class="btn btn-primary" href="/browse">Browse the Directory</a></section>`;
  return shell('Marketplace', body, '/', nav);
}
function directory(list, filters = {}, nav) {
  const { q='', category='', country='', countries=[], categories=[], total=0, page=1, per=60 } = filters;
  const catLabel = s => (categories.find(c=>c.slug===s)||{}).label || s || 'uncategorized';
  const CAT_IMG = { food_beverage:'/public/images/coffee.png', food_tourism:'/public/images/tourism.png', agriculture:'/public/images/farm.png',
    beauty_wellness:'/public/images/nutmeg.png', crafts_artisanal:'/public/images/crafts.png', construction:'/public/images/construction.png',
    packaging_supplies:'/public/images/packaging.png', transport_logistics:'/public/images/hero.png', textile_apparel:'/public/images/textile.png' };
  const catImg = s => CAT_IMG[s] || '/public/images/hero.png';
const avatar = name => {
  const words = String(name||'?').split(/\s+/).filter(Boolean);
  const initials = (words.slice(0,2).map(w=>w[0].toUpperCase()).join('')) || '?';
  let h = 0; for (const ch of String(name||'')) h = (h*31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  const c1 = 'hsl('+hue+',48%,36%)', c2 = 'hsl('+((hue+30)%360)+',55%,26%)';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+c1+'"/><stop offset="1" stop-color="'+c2+'"/></linearGradient></defs><rect width="120" height="120" fill="url(#g)"/><text x="50%" y="54%" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="42" font-weight="700" fill="#fff">'+initials+'</text></svg>';
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
};

  const enc = v => encodeURIComponent(v||'');
  const qs = (extra) => { const p=new URLSearchParams({q, category, country, per}); for (const k in extra) p.set(k, extra[k]); return p.toString(); };
  const pages = Math.max(1, Math.ceil(total/per));
  const catOptions = categories.map(c=>`<option value="${esc(c.slug)}"${c.slug===category?' selected':''}>${esc(c.label)}</option>`).join('');
  const countryOptions = countries.map(c=>`<option value="${esc(c)}"${c===country?' selected':''}>${esc(c)}</option>`).join('');
  const filtered = !!(q||category||country);
  const body = `<section class="section">
    <div class="section-head"><h1>Business Directory</h1><p>Search &amp; filter source-backed profiles across the Caribbean. Unclaimed profiles are clearly labeled and never presented as verified.</p></div>
    <form class="glass" method="get" action="/browse" style="padding:18px;display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
      <div style="flex:2;min-width:220px"><label>Search</label><input name="q" value="${esc(q)}" placeholder="Business name, city, keyword…" data-autocomplete="1"/></div>
      <div style="flex:1;min-width:180px"><label>Category</label><select name="category"><option value="">All categories</option>${catOptions}</select></div>
      <div style="flex:1;min-width:160px"><label>Country</label><select name="country"><option value="">All countries</option>${countryOptions}</select></div>
      <button class="btn btn-primary" type="submit"><span class="ms" style="font-variation-settings:'FILL' 1">search</span> Filter</button>
      ${filtered?`<a class="btn btn-glass" href="/browse">Clear</a>`:''}
    </form>
    <div data-ad-slot="directory" style="margin:14px 0"></div>
    <p class="on-surface-variant" style="margin:14px 0;color:var(--on-surface-variant)">${total.toLocaleString()} business${total===1?'':'es'} found</p>
    <div class="dir">${list.map(b=>`
      <div class="glass bcard">
        <div class="bimg" style="background-image:url('${avatar(b.name)}')"><span class="btag">${esc(catLabel(b.category))}</span></div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><a href="/business/${encodeURIComponent(b.id)}" style="text-decoration:none;color:inherit"><h3>${esc(b.name)}</h3></a>${stateBadge(b.state)}</div>
        <div class="bloc"><span class="ms" style="font-size:16px">place</span>${esc(b.country)}${b.city?' · '+esc(b.city):''}</div>
        <div class="bloc"><span class="ms" style="font-size:16px">category</span>${esc(catLabel(b.category))}</div>
        ${b.phone?`<div class="bloc"><span class="ms" style="font-size:16px">call</span>${esc(b.phone)}</div>`:''}
        ${b.address?`<div class="bloc"><span class="ms" style="font-size:16px">location_on</span>${esc(b.address)}</div>`:''}
        ${b.website?`<div class="bloc"><span class="ms" style="font-size:16px">link</span><a href="${esc(b.website)}" target="_blank" rel="noopener">${esc(b.website)}</a></div>`:''}
        ${b.disclaimer?`<div class="bdisclaimer">${esc(b.disclaimer)}</div>`:''}
      </div>`).join('')||'<p>No businesses match those filters.</p>'}</div>
    ${pages>1?`<div style="display:flex;gap:10px;align-items:center;justify-content:center;margin-top:24px">
      ${page>1?`<a class="btn btn-glass" href="/browse?${esc(qs({page:page-1}))}">← Prev</a>`:'<span class="btn btn-glass" style="opacity:.4">← Prev</span>'}
      <span class="on-surface-variant" style="color:var(--on-surface-variant)">Page ${page} of ${pages}</span>
      ${page<pages?`<a class="btn btn-glass" href="/browse?${esc(qs({page:page+1}))}">Next →</a>`:'<span class="btn btn-glass" style="opacity:.4">Next →</span>'}
    </div>`:''}
  </section>`;
  return shell('Business Directory', body, '/browse', nav);
}
function sourcing(rfqs, nav) {
  const body = `<section class="section"><div class="section-head"><h1>Post a Sourcing Request</h1><p>Tell us what you need, where it's going, and by when. Verified suppliers respond with quotes.</p></div>
  <form class="glass form" method="post" action="/api/rfqs"><div><label>Your name</label><input name="buyer_name" required/></div><div><label>Email</label><input name="buyer_email" required/></div><div><label>Product / what you need</label><input name="product" required placeholder="e.g. craft chocolate, blue mountain coffee, nutmeg oil…"/></div><div><label>Quantity</label><input name="quantity" type="number" min="1"/></div><div><label>Destination country</label><input name="destination_country" placeholder="e.g. US, Canada, UK, Barbados"/></div><div><label>Deadline</label><input name="deadline" type="date"/></div><div><label>Notes</label><textarea name="notes" rows="3"></textarea></div><button class="btn btn-primary" type="submit"><span class="ms" style="font-variation-settings:'FILL' 1">send</span> Submit Sourcing Request</button></form>
  <div class="section-head" style="margin-top:56px"><h2>Open Requests</h2></div><div class="glass" style="padding:24px;overflow-x:auto"><table><tr><th>Product</th><th>Qty</th><th>Destination</th><th>Status</th></tr>${rfqs.map(r=>`<tr><td>${esc(r.product)}</td><td>${r.quantity}</td><td>${esc(r.destination_country||'-')}</td><td>${esc(r.status)}</td></tr>`).join('')||'<tr><td colspan="4">No open requests yet.</td></tr>'}</table></div></section>`;
  return shell('Sourcing / RFQ', body, '/sourcing', nav);
}
function landedCostPage(nav) {
  const ctry = [['TT','Trinidad & Tobago'],['BB','Barbados'],['GY','Guyana'],['JM','Jamaica'],['BS','The Bahamas'],['HT','Haiti'],['DO','Dominican Republic'],['LC','Saint Lucia'],['VC','St Vincent & Grenadines'],['GD','Grenada'],['DM','Dominica'],['KN','St Kitts & Nevis'],['AG','Antigua & Barbuda'],['SR','Suriname'],['CW','Curaçao'],['SX','Sint Maarten'],['GP','Guadeloupe'],['MQ','Martinique'],['KY','Cayman Islands'],['BM','Bermuda'],['PR','Puerto Rico'],['VG','Virgin Islands (UK)'],['VI','Virgin Islands (US)'],['US','United States'],['CA','Canada'],['GB','United Kingdom']].map(c=>`<option value="${c[0]}">${esc(c[1])}</option>`).join('');
  const body = `<section class="section"><div class="section-head"><h1>Landed Cost Engine</h1><p>Deterministic, sourced from CARICOM CET schedules &amp; live freight routes. Every component shown.</p></div>
  <form class="glass" style="padding:24px" onsubmit="event.preventDefault();lcCalc()">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px">
      <div><label>Origin</label><select id="lc_origin" style="width:100%">${ctry}</select></div>
      <div><label>Destination</label><select id="lc_dest" style="width:100%">${ctry}</select></div>
      <div><label>Incoterm</label><select id="lc_inc" style="width:100%"><option value="CIF">CIF</option><option value="FOB">FOB</option><option value="EXW">EXW</option><option value="DDP">DDP</option></select></div>
      <div><label><input type="checkbox" id="lc_coo" checked style="vertical-align:middle"/> CARICOM COO</label></div>
      <div><label>HS Code</label><input id="lc_hs" value="1806.32.00" style="width:100%"/></div>
      <div><label>Unit price (USD)</label><input id="lc_up" type="number" value="4.50" step="0.01" style="width:100%"/></div>
      <div><label>Quantity</label><input id="lc_qty" type="number" value="1000" style="width:100%"/></div>
      <div><label>Weight (kg)</label><input id="lc_w" type="number" value="500" style="width:100%"/></div>
      <div><label>Volume (cbm)</label><input id="lc_v" type="number" value="1.2" step="0.1" style="width:100%"/></div>
    </div>
    <div style="margin-top:16px"><button class="btn btn-primary" type="submit"><span class="ms" style="font-variation-settings:'FILL' 1">calculate</span> Calculate Landed Cost</button></div>
    <div id="lc_res" style="margin-top:20px"></div>
  </form>
  <script>
  function escH(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  async function lcCalc(){
    const body = { origin_country:document.getElementById('lc_origin').value, destination_country:document.getElementById('lc_dest').value,
      incoterm:document.getElementById('lc_inc').value, has_caricom_coo:document.getElementById('lc_coo').checked,
      line_items:[{ hs_code:document.getElementById('lc_hs').value, unit_price_usd:parseFloat(document.getElementById('lc_up').value)||0,
        quantity:parseFloat(document.getElementById('lc_qty').value)||1, weight_kg:parseFloat(document.getElementById('lc_w').value)||0,
        volume_cbm:parseFloat(document.getElementById('lc_v').value)||0 }] };
    const res=document.getElementById('lc_res'); res.innerHTML='<p class="muted">Calculating…</p>';
    try {
      const r=await fetch('/api/v1/landed-cost/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const j=await r.json();
      if(!j.ok){ res.innerHTML='<p>Error: '+escH(j.error)+'</p>'; return; }
      const d=j.data; const f=n=>'US$ '+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2});
      res.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px"><div style="grid-column:1/-1"><h3 style="margin:0 0 4px">Landed Cost — '+escH(d.origin_country)+' → '+escH(d.destination_country)+'</h3><p class="muted" style="margin:0">'+(d.carrier?escH(d.carrier)+' · '+escH(d.transit_mode)+' · ~'+d.est_transit_days+' days':'No freight route on file')+'</p></div>'+
      '<div class="glass" style="padding:14px"><div class="bloc"><b>Goods value</b></div><div class="muted">'+f(d.base_goods_total_usd)+'</div></div>'+
      '<div class="glass" style="padding:14px"><div class="bloc"><b>Freight</b></div><div class="muted">'+f(d.freight_charge_usd)+'</div></div>'+
      '<div class="glass" style="padding:14px"><div class="bloc"><b>Insurance (1%)</b></div><div class="muted">'+f(d.insurance_charge_usd)+'</div></div>'+
      '<div class="glass" style="padding:14px"><div class="bloc"><b>CIF value</b></div><div class="muted">'+f(d.cif_value_usd)+'</div></div>'+
      '<div class="glass" style="padding:14px"><div class="bloc"><b>Import duty @ '+((d.duty_rate_applied*100).toFixed(1))+'%</b></div><div class="muted">'+f(d.import_duty_usd)+'</div></div>'+
      '<div class="glass" style="padding:14px"><div class="bloc"><b>Customs charge</b></div><div class="muted">'+f(d.customs_service_charge_usd)+'</div></div>'+
      '<div class="glass" style="padding:14px"><div class="bloc"><b>Environmental levy</b></div><div class="muted">'+f(d.environmental_levy_usd)+'</div></div>'+
      '<div class="glass" style="padding:14px"><div class="bloc"><b>VAT / GCT @ '+((d.vat_rate_applied*100).toFixed(1))+'%</b></div><div class="muted">'+f(d.vat_gct_usd)+'</div></div>'+
      '<div class="glass" style="padding:14px"><div class="bloc"><b>Port handling</b></div><div class="muted">'+f(d.port_handling_usd)+'</div></div>'+
      '<div class="glass" style="padding:16px;grid-column:1/-1;border:2px solid var(--primary)"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><b>Final landed total</b><span style="font-size:26px;font-weight:700;color:var(--primary)">'+f(d.final_landed_total_usd)+'</span></div>'+(d.notes?'<p class="muted" style="margin:8px 0 0">'+escH(d.notes)+'</p>':'')+'</div></div>';
    } catch(e){ res.innerHTML='<p>Error: '+escH(e.message)+'</p>'; }
  }
  </script></section>`;
  return shell('Landed Cost Engine', body, '/landed-cost', nav);
}
function tradeInfoPage(nav) {
  const body = `<section class="section"><div class="section-head"><h1>Trade Requirements &amp; Knowledge</h1><p>Decision-support only. Confirm with the relevant authority before relying on any rule.</p></div>
  <form class="glass form" method="get" action="/api/trade/requirements"><div><label>Origin (Caribbean island)</label><input name="origin" placeholder="e.g. Jamaica"/></div><div><label>Destination country</label><input name="destination" placeholder="e.g. US"/></div><div><label>Category</label><input name="category" placeholder="e.g. food_beverage"/></div><div><label>HS code (optional)</label><input name="hs" placeholder="e.g. 1806"/></div><button class="btn btn-primary" type="submit"><span class="ms" style="font-variation-settings:'FILL' 1">verified</span> Check Requirements</button></form></section>`;
  return shell('Trade Information', body, '/trade-info', nav);
}
function plansPage(nav) {
  const plans = [
    {slug:'free',name:'Free',price:'$0',cycle:'forever',features:['Public directory presence','Claim one business','10 product listings','Buyer RFQ access'],cta:'Start Free'},
    {slug:'pro',name:'Pro',price:'$44',cycle:'/month',features:['Up to 3 businesses','100 products','Quote & sell to RFQs','Order management','AI quote assistant','Remove platform branding'],cta:'Choose Pro'},
    {slug:'trade',name:'Trade',price:'$149',cycle:'/month',features:['Unlimited businesses','Unlimited products','Multi-currency & FX','Dedicated account manager','API access','Verified trade badge priority'],cta:'Choose Trade'},
  ];
  const body = `<section class="section"><div class="section-head"><h1>Simple Plans. Free to Start.</h1><p>Free directory + RFQ access for everyone. Paid upgrades unlock selling, quoting and advanced trade tools.</p></div>
  <div class="pgrid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">${plans.map(p=>`<div class="glass pcard" style="padding:28px"><h3 style="font-size:20px;font-weight:600;color:var(--primary)">${p.name}</h3><div style="font-size:42px;font-weight:700;color:var(--on-surface);letter-spacing:-0.03em;margin:8px 0 2px">${p.price}<span style="font-size:14px;color:var(--on-surface-variant)">${p.cycle==='forever'?' forever':p.cycle}</span></div><ul style="list-style:none;padding:16px 0 0;display:grid;gap:10px">${p.features.map(f=>`<li style="display:flex;gap:8px;align-items:flex-start"><span class="ms" style="color:var(--secondary);font-variation-settings:'FILL' 1">check_circle</span><span style="color:var(--on-surface-variant);font-size:14px">${esc(f)}</span></li>`).join('')}</ul><a class="btn ${p.slug==='free'?'btn-primary':'btn-gold'} btn-block" style="margin-top:20px" href="/signup?plan=${p.slug}">${p.cta}</a></div>`).join('')}</div></section>`;
  return shell('Plans', body, '/plans', nav);
}
function loginPage(nav) {
  const body = `<section class="section"><div class="glass form" style="max-width:440px"><div class="section-head" style="margin:0 0 20px"><h1>Sign in</h1><p>Access your trade workspace.</p></div><form method="post" action="/api/login" style="display:grid;gap:14px"><div><label>Email</label><input name="email" required/></div><div><label>Password</label><input name="password" type="password" required/></div><button class="btn btn-primary btn-block" type="submit">Sign in</button></form></div></section>`;
  return shell('Sign in', body, null, nav);
}
function signupPage(nav, role) {
  const body = `<section class="section"><div class="glass form" style="max-width:460px"><div class="section-head" style="margin:0 0 20px"><h1>Start Free</h1><p>${role==='buyer_external'?'For global &amp; diaspora buyers sourcing Caribbean-origin goods.':'Free directory + RFQ access. Upgrade anytime.'}</p></div><form method="post" action="/api/register" style="display:grid;gap:14px"><input type="hidden" name="buyer_external" value="${role==='buyer_external'?'true':''}"/><div><label>Name</label><input name="name" required/></div><div><label>Email</label><input name="email" required/></div><div><label>Company (optional)</label><input name="org_name"/></div><div><label>Password (8+ chars)</label><input name="password" type="password" required/></div><div><label>Island / currency</label><select name="island"><option value="tt">Trinidad &amp; Tobago (TTD)</option><option value="jm">Jamaica (JMD)</option><option value="bb">Barbados (BBD)</option><option value="gy">Guyana (GYD)</option><option value="us">United States (USD)</option><option value="ca">Canada (CAD)</option><option value="gb">United Kingdom (GBP)</option></select></div><div><label>Role</label><select name="role"><option value="buyer">Buyer</option><option value="supplier">Supplier</option></select></div><div style="font-size:13px;display:grid;gap:8px;padding:6px 0"><label><input type="checkbox" name="consent_processing" value="yes" required style="vertical-align:middle"/> I consent to my personal data being processed as described in the <a href="/privacy" target="_blank">Privacy Policy</a> (GDPR / UK GDPR compliant).</label><label><input type="checkbox" name="consent_tos" value="yes" required style="vertical-align:middle"/> I accept the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/acceptable-use" target="_blank">Acceptable Use Policy</a>.</label><label><input type="checkbox" name="consent_marketing" value="yes" style="vertical-align:middle"/> I consent to receive occasional marketing communications (optional; withdrawable anytime).</label></div><button class="btn btn-primary btn-block" type="submit">Create Free Account</button></form></div></section>`;
  return shell('Start Free', body, null, nav);
}

function advertisePage(nav) {
  const body = `<section class="section">
    <div class="section-head"><h1>Advertise on Caribbean Trade</h1><p>Reach verified suppliers and buyers across the Caribbean with targeted placements on our marketplace and directory.</p></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:24px">
      <div class="glass" style="padding:18px"><h3 style="margin:0 0 6px">Directory</h3><p class="muted" style="margin:0">Featured cards beside organic listings. Best for broad supplier visibility.</p></div>
      <div class="glass" style="padding:18px"><h3 style="margin:0 0 6px">Homepage</h3><p class="muted" style="margin:0">High-traffic sponsored strip on the marketplace landing page.</p></div>
      <div class="glass" style="padding:18px"><h3 style="margin:0 0 6px">Both</h3><p class="muted" style="margin:0">Maximum reach across the highest-traffic pages.</p></div>
    </div>
    <div class="glass" style="padding:24px;max-width:620px">
      <h3 style="margin:0 0 16px">Create a campaign</h3>
      <form method="post" action="/api/v1/ads" style="display:grid;gap:14px">
        <div><label>Business / advertiser name</label><input name="advertiser" required placeholder="e.g. Blue Mountain Coffee Traders"/></div>
        <div><label>Headline</label><input name="title" required placeholder="Premium single-origin coffee, shipped island-wide"/></div>
        <div><label>Body (optional)</label><textarea name="body" rows="2" placeholder="Short description shown on the card."></textarea></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><label>Placement</label><select name="placement"><option value="directory">Directory</option><option value="home">Homepage</option><option value="both">Both</option></select></div>
          <div><label>Budget (USD)</label><input name="budget_usd" type="number" value="100" step="1"/></div>
        </div>
        <div><label>Image URL (optional — leave blank to use your category image)</label><input name="image_url" placeholder="https://… or /public/images/coffee.png"/></div>
        <div><label>Destination link</label><input name="target_url" placeholder="https://your-site.com"/></div>
        <div><label>Image (choose one)</label><div style="display:flex;flex-wrap:wrap;gap:8px" id="adimgpicker">
          ${['coffee','choc','tourism','farm','nutmeg','textile','hero'].map(k=>`<label style="cursor:pointer;position:relative"><input type="radio" name="image_url" value="/public/images/${k}.png" style="position:absolute;opacity:0"/><img src="/public/images/${k}.png" width="64" height="64" style="border-radius:8px;object-fit:cover;border:2px solid transparent" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='transparent'"/></label>`).join('')}
        </div>
        <button class="btn btn-primary" type="submit"><span class="ms" style="font-variation-settings:'FILL' 1">campaign</span> Create &amp; Activate Campaign</button>
      </form>
    </div>
    <div class="section-head" style="margin-top:40px"><h2>Your campaigns</h2></div>
    <div id="ads_list" class="glass" style="padding:20px"><p class="muted">Loading…</p></div>
  </section>
  <script>
  (function(){ fetch('/api/v1/ads/manage').then(r=>r.json()).then(j=>{
    const d=document.getElementById('ads_list'); if(!d) return;
    if(!j.data||!j.data.length){ d.innerHTML='<p class="muted">No campaigns yet. Create your first above.</p>'; return; }
    d.innerHTML=j.data.map(a=>'<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #eef2f5;flex-wrap:wrap"><div><b>'+a.title+'</b> · <span class="muted">'+a.placement+'</span><div class="muted">'+(a.impressions||0)+' impressions · '+(a.clicks||0)+' clicks · US$'+(a.budget_usd||0)+'</div></div><span class="badge '+(a.status==='active'?'trade':'unclaimed')+'">'+a.status+'</span></div>').join('');
  }).catch(()=>{}); })();
  </script>`;
  return shell('Advertise', body, '/advertise', nav);
}

function aiTeamPage(nav) {
  const body = String.raw`<section class="section">
    <div class="section-head"><h1>AI Operations Team</h1><p>Agentic agents that run day-to-day platform operations — supplier acquisition, demand matching, data quality, verification, moderation, ads, and daily reporting. Agents act on live platform data. Goose AI powers the generative layer when a provider has credits.</p></div>
    <div class="glass" style="padding:16px;margin-bottom:20px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <button class="btn btn-primary" onclick="aiRun('all')"><span class="ms" style="font-variation-settings:'FILL' 1">smart_toy</span> Run all agents</button>
      <span class="muted" id="ai_status" style="font-size:13px">Team idle.</span>
    </div>
    <div id="ai_team_grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px"><p class="muted">Loading team…</p></div>
    <div class="section-head" style="margin-top:36px"><h2>Recent runs</h2></div>
    <div id="ai_runs" class="glass" style="padding:16px;overflow-x:auto"><p class="muted">Loading…</p></div>
  </section>
  <script>
  var AI_AGENTS=[];
  function aiEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function aiKey(o){return Object.keys(o||{}).filter(function(k){return !['sample_outreach','matches','flagged','staged','best_ads','escrow_states','markets'].includes(k);}).slice(0,6).map(function(k){return k+': '+aiEsc(JSON.stringify(o[k]).slice(0,60));}).join(' · ');}
  function aiLoad(){
    fetch('/api/admin/ai-team').then(function(r){return r.json();}).then(function(j){
      AI_AGENTS=j.agents||[];
      var grid=document.getElementById('ai_team_grid');
      grid.innerHTML=AI_AGENTS.map(function(a){return '<div class="glass" style="padding:18px;display:flex;flex-direction:column;gap:8px"><div style="display:flex;align-items:center;gap:10px"><span class="ms" style="font-size:26px;color:var(--primary)">'+aiEsc(a.icon)+'</span><div><div style="font-weight:700">'+aiEsc(a.role)+'</div><div class="muted" style="font-size:12px">'+aiEsc(a.name)+'</div></div></div><p style="font-size:13px;margin:0;color:var(--on-surface-variant)">'+aiEsc(a.description)+'</p><div style="font-size:12px" class="muted">Last: '+(a.last?aiEsc(a.last.status)+' · '+aiEsc(aiKey(a.last.output)):'never run')+'</div><button class="btn btn-glass" onclick="aiRun(\''+aiEsc(a.name)+'\')">Run now</button></div>';}).join('');
      document.getElementById('ai_status').textContent=AI_AGENTS.length+' agents ready.';
      aiLoadRuns();
    }).catch(function(){});
  }
  function aiLoadRuns(){
    fetch('/api/admin/ai-team/runs').then(function(r){return r.json();}).then(function(j){
      var d=document.getElementById('ai_runs');
      if(!j.runs||!j.runs.length){d.innerHTML='<p class="muted">No agent runs yet. Run an agent to begin.</p>';return;}
      d.innerHTML='<table><tr><th>Agent</th><th>Status</th><th>Started</th><th>Summary</th></tr>'+j.runs.slice(0,20).map(function(r){return '<tr><td>'+aiEsc(r.agent)+'</td><td>'+aiEsc(r.status)+'</td><td>'+aiEsc((r.started_at||'').slice(5,16))+'</td><td style="font-size:12px">'+aiEsc(aiKey(r.output))+'</td></tr>';}).join('')+'</table>';
    }).catch(function(){});
  }
  function aiRun(name){
    document.getElementById('ai_status').textContent='Running '+(name==='all'?'all agents':name)+'…';
    var url=name==='all'?'/api/admin/ai-team/run-all':'/api/admin/ai-team/'+encodeURIComponent(name)+'/run';
    fetch(url,{method:'POST'}).then(function(r){return r.json();}).then(function(){ document.getElementById('ai_status').textContent='Run complete.'; aiLoad(); }).catch(function(){ document.getElementById('ai_status').textContent='Run failed.'; });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aiLoad);else aiLoad();
  </script>`;
  return shell('AI Operations Team', body, '/admin', nav);
}

function sourcesPage(nav) {
  const body = `<section class="section"><div class="legal" style="max-width:780px;margin:0 auto;line-height:1.7">
    <h1 style="font-size:30px;margin:0 0 6px;color:var(--primary)">Sources &amp; Methodology</h1>
    <p style="color:var(--on-surface-variant)">How directory data and market figures on this platform are produced and what you can rely on.</p>
    <h2>Directory data</h2>
    <p>Business listings are sourced from <strong>OpenStreetMap</strong> via the Overpass API (Open Database License) and curated export directories. Each listing carries a source attribution and may be <em>Unclaimed</em>, <em>Claimed</em>, or <em>Trade Verified</em>. As of the latest import, the directory holds <strong>8,777 businesses across 28 Caribbean markets</strong>. Public/unclaimed records are not presented as verified suppliers.</p>
    <h2>Market figures</h2>
    <p>Figures such as the craft-chocolate margin uplift, premium-spirit valuation, and delivery-improvement figures shown on the homepage are <strong>directional market estimates</strong> intended for orientation, not audited statistics. Before making decisions on the strength of any figure, request a verified source from the relevant trade body or our team at support@kunjaldigital.com.</p>
    <h2>Landed cost</h2>
    <p>Landed-cost results are <strong>estimates</strong> produced from published duty/tax schedules, freight assumptions, and incoterms. They are not customs advice. Confirm every line (HS code, origin treatment, current duty) with a licensed customs broker before transacting.</p>
    <h2>Last updated</h2>
    <p>Directory import and rate tables are refreshed on an ongoing basis. Contact support@kunjaldigital.com for the exact last-updated timestamp of any specific figure.</p>
  </div></section>`;
  return shell('Sources & Methodology', body, '/sources', nav);
}
function aiDisclosurePage(nav) {
  const body = `<section class="section"><div class="legal" style="max-width:780px;margin:0 auto;line-height:1.7">
    <h1 style="font-size:30px;margin:0 0 6px;color:var(--primary)">AI Disclosure</h1>
    <p style="color:var(--on-surface-variant)">How artificial intelligence is used on Caribbean Trade Network, and what that does and does not mean.</p>
    <h2>Where AI is used</h2>
    <ul><li><strong>Kai, our assistant</strong> — an AI chatbot (powered by Grok/xAI) that answers questions about onboarding, sourcing, logistics and shipping. It is grounded in platform data and clearly speaks as an AI assistant.</li>
    <li><strong>AI operations team</strong> — internal agents that help with supplier outreach, demand matching, data quality, moderation and operational reporting. These are behind the admin area, not used to make decisions about your listing without review.</li></ul>
    <h2>What AI output is NOT</h2>
    <p>AI-generated text and recommendations are <strong>not verified facts</strong>. Business details, prices, certifications and trade rules shown by AI must be confirmed against the listing and official sources. We never claim an unverified record is a vetted supplier.</p>
    <h2>Human oversight</h2>
    <p>Claims, verification, moderation flags and payment-related actions are subject to human review. If you believe AI output is incorrect, contact support@kunjaldigital.com.</p>
  </div></section>`;
  return shell('AI Disclosure', body, '/ai-disclosure', nav);
}


function businessPage(b, nav){
  const vd = Array.isArray(b.verified_dimensions) ? b.verified_dimensions : (b.verified_dimensions && typeof b.verified_dimensions === 'object' ? Object.keys(b.verified_dimensions) : []);
  const dims = vd.map(d => '<span class="state-badge verified">' + esc(d) + '</span>').join(' ');
  const body = '<section class="section">'
    + '<div style="margin-bottom:16px"><a class="btn btn-glass" href="/browse"><span class="ms" style="font-size:16px">arrow_back</span> Back to Directory</a></div>'
    + '<div class="glass" style="padding:28px;max-width:860px">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap"><h1 style="margin:0">' + esc(b.name) + '</h1>' + stateBadge(b.state) + '</div>'
    + '<p style="color:var(--on-surface-variant);margin:8px 0 16px">' + esc(b.country) + (b.city ? ' · ' + esc(b.city) : '') + ' · ' + esc(b.category || 'uncategorized') + '</p>'
    + (typeof b.completeness_score === 'number' ? '<p style="margin:4px 0"><span class="state-badge claimed">Storefront ' + b.completeness_score + '/100</span></p>' : '')
    + (b.website ? '<p style="margin:6px 0"><span class="ms" style="font-size:16px;vertical-align:middle">link</span> <a href="' + esc(b.website) + '" target="_blank" rel="noopener">' + esc(b.website) + '</a></p>' : '')
    + (b.phone ? '<p class="bloc"><span class="ms" style="font-size:16px">call</span>' + esc(b.phone) + '</p>' : '')
    + (b.address ? '<p class="bloc"><span class="ms" style="font-size:16px">location_on</span>' + esc(b.address) + '</p>' : '')
    + (dims ? '<div style="margin:14px 0;display:flex;gap:8px;flex-wrap:wrap"><span style="font-size:13px;color:var(--on-surface-variant);align-self:center;margin-right:4px">Verified:</span>' + dims + '</div>' : '')
    + (b.disclaimer ? '<p style="font-style:italic;color:var(--on-surface-variant);font-size:13px;margin:14px 0">' + esc(b.disclaimer) + '</p>' : '')
    + (b.provenance ? '<p style="font-size:12px;color:var(--outline);margin:14px 0">Source: ' + esc(b.provenance.source_id || 'public data') + (b.provenance.source_url ? ' · ' + esc(b.provenance.source_url) : '') + (b.provenance.last_confirmed_at ? ' · confirmed ' + esc(b.provenance.last_confirmed_at) : '') + '</p>' : '')
    + '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:20px">'
    + '<a class="btn btn-primary" href="/signup?role=supplier"><span class="ms" style="font-size:16px">verified_user</span> Claim this business</a>'
    + (b.can_receive_rfq ? '<a class="btn btn-gold" href="/sourcing"><span class="ms" style="font-size:16px">request_quote</span> Request a quote</a>' : '')
    + '</div></div></section>';
  return shell('Business · ' + b.name, body, '/browse', nav);
}
function notFoundPage(){
  return shell('Not found', '<section class="section"><div class="glass" style="padding:40px;max-width:520px;margin:0 auto;text-align:center"><h1 style="margin:0 0 8px">Not found</h1><p style="color:var(--on-surface-variant);margin:0 0 20px">This business profile does not exist or was removed.</p><a class="btn btn-primary" href="/browse">Browse the directory</a></div></section>', null);
}

module.exports = { shell, stateBadge, esc, IMG, marketplace, directory, sourcing, landedCostPage, tradeInfoPage, plansPage, loginPage, signupPage, advertisePage, aiTeamPage, sourcesPage, aiDisclosurePage, businessPage, notFoundPage };
