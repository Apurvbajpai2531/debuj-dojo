// Run from the project root, AFTER patch-v6.js:   node patch-v7.js
// Visual polish: sticky glass header, animated background, staggered card entrances, spotlight hover,
// count-up numbers, button ripple, scroll progress bar, smoother terminal. Only index.html changes.
// Respects "reduce motion". Aborts and changes NOTHING if anything is missing.
const fs = require('fs');
const rd = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const D = rd(__filename).split('//---DATA---\n')[1].split('\n').map((l) => l.replace(/^\/\/\|/, '')).join('\n');
const P = {};
D.split(/^=====(\w+)=====\n/m).slice(1).forEach((v, i, a) => { if (i % 2 === 0) P[v] = a[i + 1].replace(/\n+$/, ''); });
if (!fs.existsSync('backend/public/index.html')) throw new Error('Run this from the folder that contains backend/ (cd debug-dojo)');

const HTML = 'backend/public/index.html';
let s = rd(HTML);
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`Expected 1 match, found ${n}: ${a.slice(0, 70)}`); s = s.replace(a, () => b); };
if (!s.includes('function cmds(')) throw new Error('Run patch-v6.js first.');
if (s.includes('function polish(')) throw new Error('patch-v7 was already applied.');

rep('<title>Debug Dojo</title>', '<meta name="theme-color" content="#070b10"><title>Debug Dojo</title>');
rep('</style>', P.CSS + '\n</style>');
rep('<div><h1>Break it.<br>', '<div><span class="eyebrow"><i></i>Hands-on Linux &amp; security training</span><h1>Break it.<br>');
rep('else home();scrollTo(0,0)}', 'else home();scrollTo(0,0);polish()}');
rep('function chal(id){', P.JS + '\nfunction chal(id){');
rep("addEventListener('hashchange',route);setAu();init().then(route);", P.TAIL + "\naddEventListener('hashchange',route);setAu();init().then(route);");

fs.copyFileSync(HTML, HTML + '.bak7');
fs.writeFileSync(HTML, s);
console.log('Done. Refresh the page (Ctrl+Shift+R) and enjoy.');

//---DATA---
//|=====CSS=====
//|/* ---- v7 polish: professional surfaces + motion ---- */
//|:root{--r2:18px;--sh1:0 1px 0 #ffffff08 inset,0 10px 28px -16px #000c;--sh2:0 24px 60px -24px #000d;--ease:cubic-bezier(.2,.8,.2,1)}
//|body{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
//|body::before{content:"";position:fixed;inset:-20%;z-index:-1;pointer-events:none;background:radial-gradient(40% 35% at 18% 12%,#27e0ff14,transparent 70%),radial-gradient(35% 40% at 85% 20%,#39ff8812,transparent 70%),radial-gradient(45% 40% at 60% 95%,#7c5cff10,transparent 70%);animation:drift 28s ease-in-out infinite alternate}
//|@keyframes drift{to{transform:translate3d(-3%,2%,0) scale(1.06)}}
//|@keyframes rise{from{opacity:0;transform:translateY(16px)}}
//|@keyframes pageIn{from{opacity:0}}
//|@keyframes grow{from{transform:scaleX(0)}}
//|@keyframes barIn{from{width:0}}
//|@keyframes lineIn{from{opacity:0;transform:translateX(-6px)}}
//|@keyframes sheen{to{background-position:-200% 0}}
//|@keyframes textflow{to{background-position:-220% 0}}
//|@keyframes floaty{to{transform:translate(-40px,60px) scale(1.15)}}
//|@keyframes ping{50%{opacity:.35;transform:scale(.75)}}
//|@keyframes rip{to{transform:scale(4);opacity:0}}
//|@keyframes fade{from{opacity:0}}
//|header.top{position:sticky;top:0;z-index:30;max-width:none;padding:12px max(20px,calc((100vw - 1120px)/2));background:#070b10cc;background:color-mix(in srgb,var(--bg) 72%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);border-bottom:1px solid transparent;transition:border-color .3s,box-shadow .3s}
//|header.top.scrolled{border-color:var(--l);box-shadow:0 12px 30px -22px #000}
//|header nav{align-items:center}
//|header nav a{position:relative;padding:6px 2px;color:var(--m);font-weight:600;transition:color .2s}
//|header nav a:hover,header nav a.on{color:var(--t)}
//|header nav a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--g),var(--c));transform:scaleX(0);transform-origin:left;transition:transform .35s var(--ease)}
//|header nav a:hover::after,header nav a.on::after{transform:scaleX(1)}
//|#sp{position:fixed;top:0;left:0;height:3px;width:0;z-index:60;background:linear-gradient(90deg,var(--g),var(--c));box-shadow:0 0 12px var(--g);transition:width .12s linear;pointer-events:none}
//|#app.enter{animation:pageIn .45s var(--ease)}
//|#app.enter .cards>*,#app.enter .top2>*,#app.enter .stats>*,#app.enter .sec{animation:rise .6s var(--ease) both;animation-delay:calc(var(--i,0)*55ms)}
//|.card,.cc{border-radius:var(--r2);box-shadow:var(--sh1)}
//|.cc{position:relative;overflow:hidden;transition:transform .35s var(--ease),border-color .3s,box-shadow .35s}
//|.cc::before{content:"";position:absolute;inset:0;background:radial-gradient(260px 130px at var(--mx,50%) var(--my,0%),#39ff8822,transparent 70%);opacity:0;transition:opacity .3s;pointer-events:none}
//|.cc:hover::before{opacity:1}
//|.cc:hover{transform:translateY(-5px);box-shadow:var(--sh2),0 0 0 1px #39ff8855}
//|.cc.done::after{content:"✓";position:absolute;top:12px;right:14px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:var(--g);color:#04120a;font-weight:800;font-size:13px;animation:pop .5s var(--ease) both}
//|.chip{background:#27e0ff10;letter-spacing:.02em}
//|.btn{position:relative;overflow:hidden;border-radius:12px;font-weight:600;transition:transform .2s var(--ease),border-color .2s,box-shadow .2s,background .2s}
//|.btn:active{transform:translateY(0) scale(.98)}
//|.btn.glow{background:linear-gradient(110deg,var(--g),var(--c) 45%,var(--g));background-size:200% 100%;animation:pl 2.6s infinite,sheen 6s linear infinite}
//|.btn .rp{position:absolute;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;background:#ffffff55;transform:scale(0);animation:rip .6s ease-out forwards;pointer-events:none}
//|h2{font-weight:800;letter-spacing:-.025em}
//|.wrap>h2::after{content:"";display:block;width:46px;height:3px;border-radius:3px;margin-top:10px;background:linear-gradient(90deg,var(--g),var(--c));transform-origin:left;animation:grow .7s .15s var(--ease) both}
//|.eyebrow{display:inline-flex;gap:8px;align-items:center;padding:6px 13px;margin-bottom:18px;border:1px solid var(--l);border-radius:99px;background:#ffffff06;color:var(--m);font-size:13px;font-weight:600;animation:rise .7s var(--ease) both}
//|.eyebrow i{width:8px;height:8px;border-radius:50%;background:var(--g);box-shadow:0 0 10px var(--g);animation:ping 2s infinite}
//|h1{background:linear-gradient(110deg,#fff 0%,var(--g) 35%,var(--c) 65%,#fff 100%);background-size:220% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:rise .8s .05s var(--ease) both,textflow 9s linear infinite}
//|.hero .lead{animation:rise .8s .2s var(--ease) both}
//|.hero .hg>div:first-child>.btn{animation:rise .8s .35s var(--ease) both}
//|.hero .btn.glow{animation:rise .8s .35s var(--ease) both,pl 2.6s 1s infinite,sheen 6s linear infinite}
//|.hero::after{content:"";position:absolute;width:520px;height:520px;right:-120px;top:-160px;border-radius:50%;background:radial-gradient(circle,#27e0ff22,transparent 65%);filter:blur(10px);animation:floaty 14s ease-in-out infinite alternate;pointer-events:none}
//|.demo{animation:rise .9s .25s var(--ease) both}
//|.stats b{font-variant-numeric:tabular-nums;background:linear-gradient(120deg,var(--c),var(--g));-webkit-background-clip:text;background-clip:text;color:transparent}
//|.top2 .card{position:relative;overflow:hidden}
//|.top2 .card::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,var(--g),var(--c));opacity:.85}
//|.top2 .card b{font-variant-numeric:tabular-nums}
//|.bar{height:8px;border-radius:99px}
//|.bar i{border-radius:99px;box-shadow:0 0 12px #39ff8866;transition:width .8s var(--ease);animation:barIn 1s var(--ease) both}
//|#ms .bar i{animation:none}
//|.term{border-radius:var(--r2);box-shadow:var(--sh2);transition:box-shadow .3s,border-color .3s}
//|.term:focus-within{border-color:#27e0ff99;box-shadow:0 0 0 1px #27e0ff55,0 24px 64px -24px #27e0ff55}
//|.term .tb{background:linear-gradient(180deg,#0e1620,#0a1119)}
//|.out div{animation:lineIn .22s var(--ease) both}
//|.in span{text-shadow:0 0 12px #39ff8866}
//|.in input{caret-color:var(--g)}
//|.out::-webkit-scrollbar{width:8px}.out::-webkit-scrollbar-thumb{background:#1c2a37;border-radius:8px}
//|.cmsg{animation:rise .3s var(--ease) both;padding:8px 10px;margin:6px 0;border:0;border-radius:10px;background:#ffffff06}
//|.cmsg.me{background:#27e0ff12}
//|.hint{animation:rise .35s var(--ease) both;border-radius:0 10px 10px 0}
//|.auth{animation:rise .6s var(--ease) both}
//|#cv{box-shadow:var(--sh2)}
//|.f{transition:border-color .2s,box-shadow .2s}
//|.modal{-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);animation:fade .25s both}
//|.big{background:linear-gradient(120deg,var(--g),var(--c));-webkit-background-clip:text;background-clip:text;color:transparent;font-variant-numeric:tabular-nums}
//|[data-theme=light] body::before{opacity:.45}
//|[data-theme=light] header.top{background:#f3f6f9cc;background:color-mix(in srgb,var(--bg) 78%,transparent)}
//|[data-theme=light] .card,[data-theme=light] .cc{--sh1:0 1px 2px #0001,0 10px 26px -18px #0004}
//|[data-theme=light] .stats b{background:linear-gradient(120deg,#0a7f9f,#0a9d57);-webkit-background-clip:text;background-clip:text}
//|@media(max-width:640px){header.top{flex-wrap:wrap;gap:6px}header nav{gap:12px;flex-wrap:wrap}.hero::after{display:none}}
//|=====JS=====
//|const RM=()=>{try{return matchMedia('(prefers-reduced-motion:reduce)').matches}catch(e){return false}};
//|const countUp=el=>{const m=el.textContent.trim().match(/^(\d+)(\+?)$/);if(!m||RM())return;const n=+m[1],suf=m[2],t0=performance.now(),f=now=>{const k=Math.min(1,(now-t0)/900);el.textContent=Math.round(n*(1-Math.pow(1-k,3)))+suf;if(k<1)requestAnimationFrame(f)};el.textContent='0'+suf;requestAnimationFrame(f)};
//|let CIO=null;
//|function polish(){try{const a=$('#app');if(!a)return;a.classList.remove('enter');void a.offsetWidth;a.classList.add('enter');
//|a.querySelectorAll('.cards,.top2,.stats').forEach(g=>[...g.children].forEach((c,i)=>c.style.setProperty('--i',i)));
//|a.querySelectorAll('.sec').forEach((c,i)=>c.style.setProperty('--i',i));
//|if(!CIO&&typeof IntersectionObserver!=='undefined')CIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.querySelectorAll('b').forEach(countUp);CIO.unobserve(e.target)}}),{threshold:.4});
//|if(CIO)a.querySelectorAll('.stats,.top2').forEach(g=>CIO.observe(g));
//|const h=(location.hash.slice(1)||'home').split('-')[0];document.querySelectorAll('header nav a').forEach(l=>{const t=(l.getAttribute('href')||'').slice(1);l.classList.toggle('on',t===h||(h==='ch'&&t==='dojo'))})}catch(e){}}
//|=====TAIL=====
//|try{const sp=document.createElement('div');sp.id='sp';document.body.appendChild(sp);const hd=$('header.top');
//|addEventListener('scroll',()=>{const d=document.documentElement,m=d.scrollHeight-innerHeight;sp.style.width=(m>0?Math.min(100,scrollY/m*100):0)+'%';if(hd)hd.classList.toggle('scrolled',scrollY>8)},{passive:true});
//|document.addEventListener('pointermove',e=>{const c=e.target.closest&&e.target.closest('.cc');if(c){const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')}});
//|document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.btn');if(!b||RM())return;const r=b.getBoundingClientRect(),s=document.createElement('span');s.className='rp';s.style.left=(e.clientX-r.left)+'px';s.style.top=(e.clientY-r.top)+'px';b.appendChild(s);setTimeout(()=>s.remove(),650)});
//|new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(!n.classList||!n.classList.contains('modal')||RM())return;const b=n.querySelector('.big'),x=b&&b.textContent.match(/^\+(\d+) XP$/);if(!x)return;const N=+x[1],t0=performance.now(),f=now=>{const k=Math.min(1,(now-t0)/900);b.textContent='+'+Math.round(N*(1-Math.pow(1-k,3)))+' XP';if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)}))).observe(document.body,{childList:true})}catch(e){}
