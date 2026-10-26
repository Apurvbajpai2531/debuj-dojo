// Run from the project root, AFTER patch-v3.js:   node patch-v4.js
// Adds: challenge sections with progress bars, +50 XP section-clear bonus, a live Mission checklist
// with progress in the terminal bar, difficulty stars. Aborts and changes NOTHING if anything is missing.
const fs = require('fs');
const rd = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const D = rd(__filename).split('//---DATA---\n')[1].split('\n').map((l) => l.replace(/^\/\/\|/, '')).join('\n');
const P = {};
D.split(/^=====(\w+)=====\n/m).slice(1).forEach((v, i, a) => { if (i % 2 === 0) P[v] = a[i + 1].replace(/\n+$/, ''); });
if (!fs.existsSync('backend/public/index.html')) throw new Error('Run this from the folder that contains backend/ (cd debug-dojo)');

const HTML = 'backend/public/index.html', SRV = 'backend/server.js';
let s = rd(HTML);
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`Expected 1 match, found ${n}: ${a.slice(0, 70)}`); s = s.replace(a, () => b); };
const between = (a, b, t) => { const i = s.indexOf(a), j = s.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('Block not found: ' + a); s = s.slice(0, i) + t + s.slice(j); };
const line = (p, t) => { const i = s.indexOf('\n' + p); if (i < 0) throw new Error('Line not found: ' + p); const j = s.indexOf('\n', i + 1); s = s.slice(0, i + 1) + t + s.slice(j); };
if (!s.includes('hadolint(a)')) throw new Error('Run patch-v3.js first.');
if (s.includes('function mission(')) throw new Error('patch-v4 was already applied.');

// ---- frontend ----
rep('</style>', P.CSS + '\n</style>');
rep("['Black',850,'#6b7c8c']];", "['Black',850,'#6b7c8c']];\nconst BONUS=50;");
rep('return a+(c?Math.max(10,c.xp-d.h*10):0)},0)};', 'return a+(c?Math.max(10,c.xp-d.h*10):0)},0)+[...new Set(CH.map(c=>c.cat))].filter(k=>CH.filter(c=>c.cat===k).every(c=>SV.done[c.id])).length*BONUS};');
rep('S.onWin=()=>{clearT();', 'S.onWin=()=>{clearT();let bonusNow=0;');
rep('SV.done[id]={t,h:hn};SV.xp+=gain;', 'SV.done[id]={t,h:hn};SV.xp+=gain;if(CH.filter(c=>c.cat===ch.cat).every(c=>SV.done[c.id])){bonusNow=BONUS;SV.xp+=BONUS}');
rep('<div class="big">+${gain} XP</div>', '<div class="big">+${gain+bonusNow} XP</div>${bonusNow?`<p style="color:var(--y)">🏆 Section cleared: ${ch.cat} (+${BONUS} bonus XP)</p>`:\'\'}');
rep('<span style="margin-left:8px">bash - dojo@dojo</span>', '<span style="margin-left:8px" id="tt">bash - dojo@dojo</span>');
rep('<p style="margin:0">${ch.story}</p></div><div id="hs"></div>', '<p style="margin:0">${ch.story}</p></div><div class="card" id="ms"></div><div id="hs"></div>');
rep('boot(ch);chat(ch,', 'boot(ch);mission(ch);chat(ch,');
rep('S.edit=openEd;', 'S.edit=openEd;S.put=put;');
rep('if(S.ch&&S.ch.check&&!S.won&&S.ch.check())win();return o};', 'if(S.ch&&S.ch.check&&!S.won&&S.ch.check())win();if(S.tick)setTimeout(S.tick,0);return o};');
rep("put('Saved '+cur,'o');if(S.ch&&S.ch.check&&!S.won&&S.ch.check())win()};", "put('Saved '+cur,'o');if(S.ch&&S.ch.check&&!S.won&&S.ch.check())win();if(S.tick)setTimeout(S.tick,0)};");
between('<h2>Challenges</h2><div class="cards">${CH.map(', '<a class="cc" href="#lab"', '<h2>Challenges</h2>${sections()}<h2 style="margin-top:30px">Practice</h2><div class="cards">');
rep('function chal(id){', P.UI + '\nfunction chal(id){');
const htmlOut = s;

// ---- server: section bonus must match the frontend, so XP stays cheat-proof ----
s = rd(SRV);
line('const xpOf =', P.XPOF);
const srvOut = s;

// ---- tests ----
// Old runs can leave a temp database behind (process ids repeat), so tests start from a clean file.
const fresh = (t) => t.replace(/^process\.env\.DATA_FILE = .*;$/m, (m) => m + "\ntry { require('fs').unlinkSync(process.env.DATA_FILE); } catch { /* no old data */ }");
let v3 = null, api = null;
if (fs.existsSync('backend/test/v3.test.js')) { s = rd('backend/test/v3.test.js'); rep('assert.equal(c.xp, 1050);', 'assert.equal(c.xp, 1300); // 1050 + 5 sections x 50 bonus'); v3 = fresh(s); }
if (fs.existsSync('backend/test/api.test.js')) { s = rd('backend/test/api.test.js'); api = fresh(s.replace(/\n*$/, '\n') + '\n' + P.TESTAPI + '\n'); }
const files = [[HTML, htmlOut], [SRV, srvOut]];
if (v3) files.push(['backend/test/v3.test.js', v3]);
if (api) files.push(['backend/test/api.test.js', api]);
for (const [f, t] of files) { fs.copyFileSync(f, f + '.bak4'); fs.writeFileSync(f, t); }
console.log('Done. Now run: cd backend && npm test && npm start');

//---DATA---
//|=====CSS=====
//|.sec{margin:28px 0}.sh{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:6px}.sh h3{margin:0}.sh small{color:var(--m)}
//|.sec.cleared .bar i{background:linear-gradient(90deg,var(--y),var(--g))}.sec.cleared .sh h3{color:var(--y)}
//|.stars{color:var(--y);letter-spacing:2px;font-size:13px}
//|#ms ul{list-style:none;padding:0;margin:10px 0 0}#ms li{padding:3px 0;color:var(--m);transition:.3s}#ms li.ok{color:var(--g)}
//|=====UI=====
//|const SEC={Permissions:['🔐','Who can read, write and run'],Hardening:['🛡️','Lock the server down'],Secrets:['🗝️','Keep secrets out of code'],Incident:['🚨','Respond to an attack'],DevSecOps:['⚙️','Secure the pipeline']};
//|const stars=c=>{const n=c.xp>=100?3:c.xp>=80?2:1;return '★'.repeat(n)+'☆'.repeat(3-n)};
//|const card=c=>{const d=SV.done[c.id];return `<a class="cc ${d?'done':''}" href="#ch-${c.id}"><span class="stars" title="Difficulty">${stars(c)}</span><h3 style="margin:8px 0 4px">${c.title}</h3><span style="color:var(--m)">${c.xp} XP ${d?'· ✔ '+fmt(d.t)+(d.h===0?' · no hints':''):'· not started'}</span></a>`};
//|function sections(){return [...new Set(CH.map(c=>c.cat))].map(cat=>{const L=CH.filter(c=>c.cat===cat),n=L.filter(c=>SV.done[c.id]).length,full=n===L.length,i=SEC[cat]||['📁',''],xp=L.reduce((a,c)=>a+c.xp,0);
//|return `<section class="sec ${full?'cleared':''}"><div class="sh"><h3>${i[0]} ${cat}</h3><span class="mono">${n}/${L.length} done${full?' · 🏆 cleared +'+BONUS+' XP':' · clear all for +'+BONUS+' bonus XP'}</span></div><small style="color:var(--m)">${i[1]} · ${xp} XP</small><div class="bar" style="margin-top:6px"><i style="width:${Math.round(n/L.length*100)}%"></i></div><div class="cards" style="margin-top:12px">${L.map(card).join('')}</div></section>`}).join('')}
//|const GOALS=(()=>{const ran=re=>S.hist.some(h=>re.test(h)),F=p=>fs[HOME+'/'+p]||{c:'',m:'---------'},df=()=>F('Dockerfile').c,pol=()=>F('policy.json').c,lj=()=>F('login.js').c,
//|cfg=k=>{const l=(fs['/etc/ssh/sshd_config']||{c:''}).c.split('\n').map(x=>x.trim()).find(x=>x[0]!=='#'&&x.toLowerCase().startsWith(k));return l?l.split(/\s+/)[1].toLowerCase():''},
//|ver=n=>{try{return String(JSON.parse(F('package.json').c).dependencies[n]).replace(/^[^\d]*/,'').split('.').map(Number)}catch(e){return [0]}},
//|ge=(a,b)=>{for(let i=0;i<3;i++)if((a[i]||0)!==b[i])return (a[i]||0)>b[i];return true};
//|return {
//|perm:[['Run the script and read the error',()=>ran(/deploy\.sh/)],['Fix the file permission',()=>/x/.test(F('deploy.sh').m)],['Deploy successfully',()=>S.won]],
//|sshkey:[['Try to connect and read the warning',()=>ran(/^ssh\b/)],['Lock down the private key',()=>F('.ssh/id_rsa').m.slice(3)==='------'],['Connect to prod',()=>S.won]],
//|secret:[['Run the audit',()=>ran(/audit\.sh/)],['Protect db_password.txt',()=>F('db_password.txt').m==='rw-------'],['Protect backup.sql',()=>F('backup.sql').m.slice(6)==='---'],['Pass the audit',()=>S.won]],
//|sshd:[['Run the SSH audit',()=>ran(/ssh-audit/)],['Disable root login',()=>cfg('permitrootlogin')==='no'],['Disable password logins',()=>cfg('passwordauthentication')==='no'],['Reject empty passwords',()=>cfg('permitemptypasswords')==='no'],['Pass the audit',()=>S.won]],
//|leak:[['Search the repo for secrets',()=>ran(/grep\s+-\w*r/)],['Remove the key from the code',()=>!/AKIA[0-9A-Z]{16}/.test(F('app/config.js').c)],['Keep .env out of git',()=>/^\.env$/m.test(F('app/.gitignore').c)],['Pass the secret scan',()=>S.won]],
//|brute:[['Read the auth log',()=>ran(/auth\.log/)],['Count the attempts per IP',()=>ran(/uniq/)],['Block the attacker',()=>(S.fw||[]).includes('203.0.113.9')],['Do it without locking out your admin',()=>S.won]],
//|miner:[['Find the busy process',()=>ran(/\bps\b/)],['Stop it',()=>!S.procs.some(p=>p.pid===666)],['Delete the file it runs from',()=>!fs['/tmp/.kswapd0']]],
//|dockerfile:[['Run the linter',()=>ran(/hadolint/)],['Remove the baked-in secret',()=>!/^\s*(ENV|ARG)\s+\w*(PASS|SECRET|TOKEN|KEY)/mi.test(df())],['Run as a non-root user',()=>/^USER\s+(?!root\b|0\b)\S+/m.test(df())],['Pin the base image and close port 22',()=>!/^FROM\s+\S+:latest\b/m.test(df())&&!/^EXPOSE\b.*\b22\b/m.test(df())],['Pass the lint',()=>S.won]],
//|trivy:[['Run the scan',()=>ran(/trivy/)],['Upgrade the base image',()=>{const m=df().match(/^FROM\s+\S*node:(\d+)/m);return !!m&&+m[1]>=18}],['Pass the scan',()=>S.won]],
//|deps:[['Run the audit',()=>ran(/npm audit/)],['Fix lodash',()=>ge(ver('lodash'),[4,17,21])],['Fix minimist',()=>ge(ver('minimist'),[1,2,6])],['Pass the audit',()=>S.won]],
//|iam:[['Run the IAM audit',()=>ran(/audit-iam/)],['Remove the wildcards',()=>!/"\*"/.test(pol())&&!/:\*"/.test(pol())],['Allow only what the service needs',()=>/s3:GetObject/.test(pol())],['Pass the audit',()=>S.won]],
//|sqli:[['Run the injection test',()=>ran(/sqltest/)],['Stop gluing input into the SQL',()=>!/['"]\s*\+\s*(name|pass)\b|\b(name|pass)\s*\+\s*['"]/.test(lj())],['Use placeholders',()=>/SELECT[^;\n]*(\?|\$1)/.test(lj())],['Pass the test',()=>S.won]],
//|ports:[['List the listening ports',()=>ran(/\bss\b/)],['Block the MySQL port 3306',()=>(S.fwp||[]).includes('3306')],['Block the Redis port 6379',()=>(S.fwp||[]).includes('6379')],['Keep SSH and web open',()=>S.won]]}})();
//|function mission(ch){const G=GOALS[ch.id],box=$('#ms');if(!G){if(box)box.hidden=true;return}
//|S.gd=[];let ready=false;
//|const draw=()=>{const n=S.gd.filter(Boolean).length;box.innerHTML=`<b>Mission</b> <span class="mono" style="float:right">${n}/${G.length}</span><div class="bar" style="margin-top:6px"><i style="width:${Math.round(n/G.length*100)}%"></i></div><ul>${G.map(([t],i)=>`<li class="${S.gd[i]?'ok':''}">${S.gd[i]?'✔':'○'} ${t}</li>`).join('')}</ul>`;const tt=$('#tt');if(tt)tt.textContent='bash - dojo@dojo · objectives '+n+'/'+G.length};
//|S.tick=()=>{G.forEach(([t,f],i)=>{if(S.gd[i])return;let ok=false;try{ok=!!f()}catch(e){}if(ok){S.gd[i]=1;if(ready)S.put('✔ Objective complete: '+t,'o')}});ready=true;draw()};
//|S.tick()}
//|=====XPOF=====
//|const SECTIONS = { Permissions: ['perm', 'sshkey', 'secret'], Hardening: ['sshd'], Secrets: ['leak'], Incident: ['brute', 'miner'], DevSecOps: ['dockerfile', 'trivy', 'deps', 'iam', 'sqli', 'ports'] };
//|const BONUS = 50; // extra XP for clearing a whole section (the frontend uses the same rule)
//|const xpOf = (done) => Object.entries(done).reduce((a, [id, d]) => a + (CH_XP[id] ? Math.max(10, CH_XP[id] - d.h * 10) : 0), 0) + Object.values(SECTIONS).filter((ids) => ids.every((id) => done[id])).length * BONUS;
//|=====TESTAPI=====
//|test('clearing a whole section gives a bonus', async () => {
//|  const ck = cookieOf(await post('/api/auth/register', { username: 'bonus', password: 'password123' }));
//|  const r = await post('/api/progress', { done: { perm: { t: 5, h: 0 }, sshkey: { t: 5, h: 0 }, secret: { t: 5, h: 0 } } }, ck);
//|  assert.equal((await r.json()).xp, 50 + 60 + 60 + 50);
//|});
