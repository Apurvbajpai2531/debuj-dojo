// Run from the project root:  node patch-linux.js
// Turns Debug Dojo into a Linux + security trainer and puts login in front of the lab.
// It aborts with a clear message and changes NOTHING if any target text is not found.
const fs = require('fs');
const rd = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const D = rd(__filename).split('//---DATA---\n')[1].split('\n').map((l) => l.replace(/^\/\/\|/, '')).join('\n');
const P = {};
D.split(/^=====(\w+)=====\n/m).slice(1).forEach((v, i, a) => { if (i % 2 === 0) P[v] = a[i + 1].replace(/\n+$/, ''); });

const HTML = 'backend/public/index.html', SRV = 'backend/server.js';
let s = rd(HTML);
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`Expected 1 match, found ${n}: ${a.slice(0, 70)}`); s = s.replace(a, () => b); };
const between = (a, b, t) => { const i = s.indexOf(a), j = s.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('Block not found: ' + a); s = s.slice(0, i) + t + s.slice(j); };
const line = (p, t) => { const i = s.indexOf('\n' + p); if (i < 0) throw new Error('Line not found: ' + p); const j = s.indexOf('\n', i + 1); s = s.slice(0, i + 1) + t + s.slice(j); };

// 1) challenges + commands
between('const CH=[', '/* ---------- virtual filesystem', P.CH + '\n');
between('docker(a){', '\nC.vi=C.vim', P.CMDS);
rep("C['docker-compose']=a=>C.docker(['compose',...a]);", '');
line('ps:()=>', P.PS); line('kill:a=>', P.KILL); line('grep(a,inp){', P.GREP); line('help:()=>', P.HELP);
rep("flags:{},won:0,O:$('#O')}", "flags:{},procs:[{pid:1,u:'root',c:'0.0',cmd:'/sbin/init'},{pid:42,u:'root',c:'0.1',cmd:'sshd: /usr/sbin/sshd -D'},{pid:88,u:'dojo',c:'0.0',cmd:'-bash'},...((ch&&ch.procs)||[]).map(p=>({...p}))],won:0,O:$('#O')}");
rep('const run=line=>{let o=null;for(const sg of line.split(/\\s\\|\\s/))o=one(sg,o);return o};', 'const run=line=>{let o=null;for(const sg of line.split(/\\s\\|\\s/))o=one(sg,o);if(S.ch&&S.ch.check&&!S.won&&S.ch.check())win();return o};');
// editor bug fix: relative edit paths must map to real filesystem paths
rep('if(ch&&ch.edit.length)ch.edit.forEach(openEd),cur=ch.edit[0],draw()', "if(ch&&ch.edit.length){const E=ch.edit.map(p=>p[0]==='/'?p:HOME+'/'+p);E.forEach(openEd);cur=E[0];draw()}");

// 2) welcome page text
rep('Fix broken Docker, Nginx, Kubernetes, CI and Linux setups in a safe in-browser terminal. Earn XP, climb belts.', 'Fix broken Linux systems and close real security holes in a safe in-browser terminal. Earn XP, climb belts.');
rep('<div><b>5</b><span>categories</span></div>', '<div><b>${new Set(CH.map(c=>c.cat)).size}</b><span>categories</span></div>');
rep("'docker run -d -p 80:300 api'", "'ssh -i ~/.ssh/id_rsa prod'");
rep("'Error: api does not listen on port 300 (exposes 3000)'", "'WARNING: UNPROTECTED PRIVATE KEY FILE! (mode 0644)'");
rep("'docker run -d -p 80:3000 api'", "'chmod 600 ~/.ssh/id_rsa'");
rep("'✔ api is up on :80'", "'✔ Connected to prod. Key is safe.'");

// 3) login first: welcome -> login -> lab
rep('<a class="btn glow" href="#dojo">Start Training</a>', '<a class="btn glow" id="go" href="#login">Start Training</a>');
rep("bg($('canvas'));demo($('#dm'));", "bg($('canvas'));demo($('#dm'));if(USER)$('#go').href='#lab';");
rep("await pull();location.hash='dojo'}catch(x)", "await pull();location.hash='lab'}catch(x)");
line('async function init(){', "let SERVER=true;\nasync function init(){for(const k in SV.done)if(!CH.some(c=>c.id===k))delete SV.done[k];recalc();save();try{const r=await fetch('/api/auth/me');if(r.ok){USER=await r.json();setAu();await pull()}else if(r.status!==401)SERVER=false}catch(e){SERVER=false}}");
rep("const h=location.hash.slice(1)||'home';if(h==='dojo')", "const h=location.hash.slice(1)||'home';if(SERVER&&!USER&&/^(dojo|lab|ch-.+)$/.test(h)){location.hash='login';return}if(h==='dojo')");
rep("addEventListener('hashchange',route);setAu();route();init();", "addEventListener('hashchange',route);setAu();init().then(route);");
rep('body:JSON.stringify({done:SV.done})', 'body:JSON.stringify({done:Object.fromEntries(Object.entries(SV.done).filter(([k])=>CH.some(c=>c.id===k)))})');
const htmlOut = s;

// 4) server: new challenge ids
s = rd(SRV);
line('const CH_XP =', "const CH_XP = { perm: 50, sshkey: 60, secret: 60, sshd: 80, leak: 80, brute: 100, miner: 80 };");
between('const LOCAL = {', 'const SYSTEM', P.LOCAL + '\n');
rep('a + Math.max(10, CH_XP[id] - d.h * 10), 0)', 'a + (CH_XP[id] ? Math.max(10, CH_XP[id] - d.h * 10) : 0), 0)');
for (const [f, t] of [[HTML, htmlOut], [SRV, s]]) { fs.copyFileSync(f, f + '.bak'); fs.writeFileSync(f, t); } // written only if every step above succeeded
console.log('Done. Backups: index.html.bak, server.js.bak. Now run: cd backend && npm test && npm start');

//---DATA---
//|=====CH=====
//|const AUTHLOG=(()=>{const L=[],t=n=>'Oct 23 10:'+String(n).padStart(2,'0')+':00';let n=0;for(let i=0;i<14;i++)L.push(`${t(n++)} dojo sshd[812]: Failed password for root from 203.0.113.9 port ${4000+i} ssh2`);for(let i=0;i<3;i++)L.push(`${t(n++)} dojo sshd[815]: Failed password for admin from 198.51.100.7 port ${5000+i} ssh2`);L.push(`${t(n++)} dojo sshd[820]: Accepted publickey for dojo from 10.0.0.5 port 6001 ssh2`);L.push(`${t(n++)} dojo sshd[821]: Failed password for dojo from 10.0.0.5 port 6002 ssh2`);return L.join('\n')+'\n'})();
//|const CH=[
//|{id:'perm',cat:'Permissions',title:'Permission denied',xp:50,edit:[],story:'Your deploy script refuses to run. Run it, read the error, then fix it the Linux way.',files:{'deploy.sh':{c:'#!/bin/bash\necho "Deploying build 42"\n',m:'rw-r--r--',run:()=>{win();return 'Deploying build 42...\n✔ Deployed to production!'}}},hints:['Try ./deploy.sh first. Then ls -l deploy.sh and look at the x bits.','The file has no execute permission.','chmod +x deploy.sh'],why:'Linux only runs a file if its execute bit is set. ls -l showed -rw-r--r-- (no x). chmod +x adds execute permission so the shell may launch it.'},
//|{id:'sshkey',cat:'Permissions',title:'Unprotected private key',xp:60,edit:[],story:'You cannot log in to the prod server. SSH keeps rejecting your key. Try: ssh prod',files:{'.ssh/id_rsa':{c:'-----BEGIN DEMO KEY-----\nnot-a-real-key\n',m:'rw-r--r--'}},hints:['Read the SSH warning carefully. Who is able to read the key right now?','A private key must be readable by its owner only.','chmod 600 ~/.ssh/id_rsa then ssh prod'],why:'SSH refuses a private key that other users can read, because anyone on the machine could copy it and impersonate you. Mode 600 (rw-------) leaves access to the owner only.'},
//|{id:'secret',cat:'Permissions',title:'Secrets open to everyone',xp:60,edit:[],story:'A security audit flagged your home folder. Run ./audit.sh, see what is exposed, and lock it down.',files:{'db_password.txt':{c:'S3cr3t!\n',m:'rw-rw-rw-'},'backup.sql':{c:'-- full database dump\n',m:'rwxrwxrwx'},'audit.sh':{c:'#!/bin/sh\n',m:'rwxr-xr-x',run:()=>{const a=fs[HOME+'/db_password.txt'],b=fs[HOME+'/backup.sql'],o1=!!a&&a.m==='rw-------',o2=!!b&&b.m.slice(6)==='---',o=[o1?'✔ db_password.txt is private (600)':'✘ db_password.txt is accessible to others: '+(a?a.m:'missing'),o2?'✔ backup.sql is not world-accessible':'✘ backup.sql is world-accessible: '+(b?b.m:'missing')];if(o1&&o2){win();o.push('✔ audit passed')}return o.join('\n')}}},hints:['ls -l shows who can read and write each file: owner, group, others.','Passwords: owner only. Backups: nothing for others.','chmod 600 db_password.txt and chmod 640 backup.sql, then ./audit.sh'],why:'The last three permission characters are "others", meaning every user on the system. Passwords should be 600 (owner only), and backups must never be readable by others (640 or 600).'},
//|{id:'sshd',cat:'Hardening',title:'Harden the SSH server',xp:80,edit:['/etc/ssh/sshd_config'],story:'Auditors call your SSH server a soft target. Run ./ssh-audit.sh, fix /etc/ssh/sshd_config in the editor, save, and audit again.',files:{'/etc/ssh/sshd_config':{c:'Port 22\nPermitRootLogin yes\nPasswordAuthentication yes\nPermitEmptyPasswords yes\nX11Forwarding yes\n'},'ssh-audit.sh':{c:'#!/bin/sh\n',m:'rwxr-xr-x',run:()=>{const f=fs['/etc/ssh/sshd_config'],v={};(f?f.c:'').split('\n').forEach(l=>{const t=l.trim(),m=t.match(/^(\w+)\s+(\S+)/);if(m&&t[0]!=='#')v[m[1].toLowerCase()]=m[2].toLowerCase()});let ok=true;const o=[['permitrootlogin','Root login disabled'],['passwordauthentication','Password logins disabled (keys only)'],['permitemptypasswords','Empty passwords rejected']].map(([k,t])=>{const g=v[k]==='no';if(!g)ok=false;return (g?'✔ ':'✘ ')+t+(g?'':' (now: '+(v[k]||'unset')+')')});if(ok){win();o.push('✔ sshd hardened')}return o.join('\n')}}},hints:['Run ./ssh-audit.sh and compare each failing line with the config.','Three directives need the value no.','PermitRootLogin no, PasswordAuthentication no, PermitEmptyPasswords no (then Save)'],why:'Root login and password logins are what brute-force bots attack. Setting them to no forces key-based login for normal users, and rejecting empty passwords closes the easiest hole.'},
//|{id:'leak',cat:'Secrets',title:'Leaked cloud key',xp:80,edit:['app/config.js'],story:'Your repo in ~/app contains secrets. Find them with grep -r, remove the key from the code, and make sure .env is never committed. Verify with ./scan.sh inside app.',files:{'app/config.js':{c:'// app config\nconst AWS_KEY = "AKIAIOSFODNN7EXAMPLE";\nmodule.exports = { region: "ap-south-1", key: AWS_KEY };\n'},'app/.env':{c:'DB_PASS=hunter2\n'},'app/scan.sh':{c:'#!/bin/sh\n',m:'rwxr-xr-x',run:()=>{const A=HOME+'/app',o1=!Object.keys(fs).some(k=>k.startsWith(A+'/')&&!fs[k].d&&/AKIA[0-9A-Z]{16}/.test(fs[k].c)),g=fs[A+'/.gitignore'],o2=!!g&&/^\.env$/m.test(g.c),o=[(o1?'✔':'✘')+' no cloud keys in source files',(o2?'✔':'✘')+' .env is listed in .gitignore'];if(o1&&o2){win();o.push('✔ repo is clean')}else o.push('✘ secret scan failed');return o.join('\n')}}},hints:['cd app, then grep -r KEY . and grep -ri pass .','Replace the literal key in config.js with process.env.AWS_KEY, and Save.','echo .env > .gitignore then ./scan.sh'],why:'Anything committed to git stays in history, so keys must live in environment variables, never in source. .gitignore keeps local secret files like .env out of the repo. (A leaked real key must also be rotated.)'},
//|{id:'brute',cat:'Incident',title:'Brute-force attack',xp:100,edit:[],story:'Someone is hammering SSH. Read /var/log/auth.log, find the IP with the most failed logins, and block it with the firewall. Do not block your admin (10.0.0.5).',files:{'/var/log/auth.log':{c:AUTHLOG}},check:()=>(S.fw||[]).includes('203.0.113.9')&&!(S.fw||[]).includes('10.0.0.5'),hints:['grep Failed /var/log/auth.log shows the failed attempts.',"Count per IP: grep Failed /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn",'sudo ufw deny from <the top IP>'],why:'Counting failed logins per source IP exposes the attacker (203.0.113.9 had 14 attempts). A firewall deny rule drops its traffic before SSH sees it. Always double check you are not blocking your own admin address.'},
//|{id:'miner',cat:'Incident',title:'Rogue process',xp:80,edit:[],story:'The server is crawling and the fans scream. Find the process eating the CPU, stop it, and delete the file it runs from so it cannot return.',files:{'/tmp/.kswapd0':{c:'#!/bin/sh\n# not a real kernel thread\n',m:'rwxr-xr-x'}},procs:[{pid:666,u:'www-data',c:'98.7',cmd:'/tmp/.kswapd0 --pool xmr.evil.example'},{pid:731,u:'dojo',c:'0.0',cmd:'sleep 3000'}],check:()=>!S.procs.some(p=>p.pid===666)&&!fs['/tmp/.kswapd0'],hints:['ps aux and look at the CPU column and the command.','A hidden file in /tmp is running. ls -la /tmp','kill -9 666 and rm /tmp/.kswapd0'],why:'ps aux exposed one process at 98% CPU running a hidden file in /tmp, a classic malware spot. Killing the process stops it, and deleting the file stops a restart. In real life you would also find out how it got in.'}
//|];
//|=====CMDS=====
//|ssh(a){const i=a.indexOf('-i'),key=i>-1?a[i+1]:null,host=a.filter(x=>x[0]!=='-'&&x!==key).pop();if(!host)return 'usage: ssh [-i key] host';const k=key?res(key):HOME+'/.ssh/id_rsa',f=fs[k];
//|if(!f||f.d)return `Warning: Identity file ${key||k} not accessible: No such file or directory.\n${host}: Permission denied (publickey).`;
//|if(f.m.slice(3)!=='------')return `@@@ WARNING: UNPROTECTED PRIVATE KEY FILE! @@@\nPermissions 0${[0,3,6].map(j=>[...f.m.slice(j,j+3)].reduce((n,c,x)=>n+(c==='-'?0:[4,2,1][x]),0)).join('')} for '${k}' are too open.\nThis private key will be ignored.\n${host}: Permission denied (publickey).`;
//|if(S.ch&&S.ch.id==='sshkey')win();return `✔ Connected to ${host} as deploy`},
//|ufw(a){const r=S.fw||(S.fw=[]);if(a[0]==='status')return 'Status: active\n\nTo          Action   From\n22/tcp      ALLOW    Anywhere'+r.map(x=>`\nAnywhere    DENY     ${x}`).join('');
//|if(a[0]==='deny'&&a[1]==='from'&&/^\d{1,3}(\.\d{1,3}){3}$/.test(a[2]||'')){if(!r.includes(a[2]))r.push(a[2]);return a[2]==='10.0.0.5'?'Rule added\n✘ Warning: 10.0.0.5 is your admin workstation. You just locked yourself out!':'Rule added'}
//|return 'usage: ufw status | ufw deny from <ip>'},
//|sort(a,inp){const fl=a.filter(x=>x[0]==='-').join(''),f=a.find(x=>x[0]!=='-'),tx=f?(fs[res(f)]||{c:''}).c:inp||'',n=/n/.test(fl),L=tx.split('\n').filter(Boolean).sort((x,y)=>(n?parseFloat(x)-parseFloat(y):0)||(x<y?-1:x>y?1:0));if(/r/.test(fl))L.reverse();return L.join('\n')},
//|uniq(a,inp){const o=[];for(const l of (inp||'').split('\n').filter(Boolean)){if(o.length&&o[o.length-1][1]===l)o[o.length-1][0]++;else o.push([1,l])}return o.map(([c,l])=>a.includes('-c')?String(c).padStart(7)+' '+l:l).join('\n')},
//|awk(a,inp){const q=a.filter(x=>x[0]!=='-'),m=(q[0]||'').match(/^\{\s*print\s*(.*?)\s*\}$/);if(!m)return "awk: only '{print $N}' is supported here";const tx=q[1]?(fs[res(q[1])]||{c:''}).c:inp||'',cols=(m[1]||'$0').split(/\s*,\s*/);return tx.split('\n').filter(Boolean).map(l=>{const w=l.trim().split(/\s+/);return cols.map(t=>t==='$0'?l:/^\$\d+$/.test(t)?w[+t.slice(1)-1]||'':t).join(' ')}).join('\n')}
//|};
//|=====PS=====
//|ps:a=>/[ae]/.test(a.join(''))?'USER       PID %CPU COMMAND\n'+S.procs.map(p=>p.u.padEnd(10)+' '+String(p.pid).padStart(4)+' '+p.c.padStart(5)+' '+p.cmd).join('\n'):'  PID TTY      TIME CMD\n   88 pts/0 00:00:00 bash\n  131 pts/0 00:00:00 ps',
//|=====KILL=====
//|kill:a=>{const n=+a.filter(x=>x[0]!=='-').pop();if(!n)return 'kill: usage: kill [-9] pid';if([1,42,88].includes(n))return `kill: (${n}) - Operation not permitted`;const i=S.procs.findIndex(p=>p.pid===n);if(i<0)return `kill: (${n}) - No such process`;S.procs.splice(i,1);return ''},
//|=====GREP=====
//|grep(a,inp){const fl=a.filter(x=>x[0]=='-').join(''),r=a.filter(x=>x[0]!='-');if(!r[0])return 'usage: grep [-inrv] pattern [file]';let re;try{re=new RegExp(r[0],/i/.test(fl)?'i':'')}catch(e){return 'grep: invalid pattern'}const hit=(l,i)=>l!==''&&re.test(l)!=/v/.test(fl)?(/n/.test(fl)?i+':':'')+l:null;
//|if(/r/.test(fl)){const t=r[1]||'.',p=res(t);if(!fs[p])return `grep: ${t}: No such file or directory`;return Object.keys(fs).filter(k=>!fs[k].d&&(k===p||k.startsWith(p+'/'))).sort().flatMap(k=>fs[k].c.split('\n').map((l,i)=>hit(l,i+1)).filter(x=>x!==null).map(x=>(k===p?t:t.replace(/\/$/,'')+k.slice(p.length))+':'+x)).join('\n')}
//|let tx=inp;if(r[1]){const f=fs[res(r[1])];if(!f)return `grep: ${r[1]}: No such file or directory`;tx=f.c}if(tx==null)return '';return tx.split('\n').map((l,i)=>hit(l,i+1)).filter(x=>x!==null).join('\n')},
//|=====HELP=====
//|help:()=>'Try: ls cd pwd cat echo mkdir touch rm cp mv chmod grep(-r -i -n -v) head tail wc sort uniq awk env export whoami id ps(aux) kill ssh ufw curl history clear nano sudo\nSupports pipes (|), > and >>, $VARS, ~ and Tab completion.',
//|=====LOCAL=====
//|const LOCAL = {
//|  perm: 'Run ls -l on the file and look for an x in the permission column. Which command changes permissions?',
//|  sshkey: 'Read the SSH warning: who can read the key right now? Only the owner should. Which chmod mode gives owner-only access?',
//|  secret: 'Run ./audit.sh, then ls -l. Secrets should be readable by their owner only.',
//|  sshd: 'Compare the ./ssh-audit.sh output with the config. Three directives must be set to no.',
//|  leak: 'Search with grep -r. Move the key out of source (use an environment variable) and make sure .env is git-ignored.',
//|  brute: 'Count Failed lines per source IP: grep, awk, sort, uniq -c. Block the noisiest attacker, not your admin IP.',
//|  miner: 'ps aux and look at the CPU column. Stop the process and delete the file it runs from so it cannot return.',
//|};
