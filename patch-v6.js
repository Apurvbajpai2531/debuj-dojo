// Run from the project root, AFTER patch-v5.js:   node patch-v6.js
// Adds 70+ simulated Linux commands (files, text, users, network, services, archives, packages, git,
// security tools) and a searchable Commands page with a "Try" button. Only index.html changes.
// Aborts and changes NOTHING if anything is missing.
const fs = require('fs');
const rd = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const D = rd(__filename).split('//---DATA---\n')[1].split('\n').map((l) => l.replace(/^\/\/\|/, '')).join('\n');
const P = {};
D.split(/^=====(\w+)=====\n/m).slice(1).forEach((v, i, a) => { if (i % 2 === 0) P[v] = a[i + 1].replace(/\n+$/, ''); });
if (!fs.existsSync('backend/public/index.html')) throw new Error('Run this from the folder that contains backend/ (cd debug-dojo)');

const HTML = 'backend/public/index.html';
let s = rd(HTML);
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`Expected 1 match, found ${n}: ${a.slice(0, 70)}`); s = s.replace(a, () => b); };
const line = (p, t) => { const i = s.indexOf('\n' + p); if (i < 0) throw new Error('Line not found: ' + p); const j = s.indexOf('\n', i + 1); s = s.slice(0, i + 1) + t + s.slice(j); };
if (!s.includes('function learn(')) throw new Error('Run patch-v5.js first.');
if (s.includes('function cmds(')) throw new Error('patch-v6 was already applied.');

rep('</style>', P.CSS + '\n</style>');
rep('const C={\n', P.HELPERS + '\nconst C={\n');
rep('\nsort(a,inp){', '\n' + P.CMDS + '\nsort(a,inp){');
line('systemctl:a=>', '');
line('help:()=>', P.HELP);
rep("if(c==='sudo'){c=a[0];a=a.slice(1)}", "S.sudo=false;if(c==='sudo'){c=a[0];a=a.slice(1);S.sudo=true}");
rep("${e.d?'d':'-'}${e.m} 1 dojo dojo ${String((e.c||'').length).padStart(5)} ${n}", "${e.d?'d':e.link?'l':'-'}${e.m} 1 ${e.own||'dojo dojo'} ${String((e.c||'').length).padStart(5)} ${n}${e.link?' -> '+e.link:''}");
rep('<a href="#learn">Learn</a>', '<a href="#learn">Learn</a><a href="#cmds">Commands</a>');
rep('room.*|learn.*|ch-.+', 'room.*|learn.*|cmds|ch-.+');
rep("else if(h.startsWith('learn'))learn(h.slice(6));", "else if(h.startsWith('learn'))learn(h.slice(6));else if(h==='cmds')cmds();");
rep('boot(null)}', "boot(null);if(PRE){$('#I').value=PRE;PRE=''}}");
rep('function chal(id){', P.UI + '\nfunction chal(id){');

fs.copyFileSync(HTML, HTML + '.bak6');
fs.writeFileSync(HTML, s);
console.log('Done. Refresh the page (Ctrl+Shift+R), then open Commands in the header.');

//---DATA---
//|=====CSS=====
//|.cmd{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:9px 0;border-bottom:1px solid var(--l)}.cmd:last-child{border:0}.cmd code{color:var(--c)}
//|=====HELPERS=====
//|Object.assign(MAN,{
//|file:['file path','Guesses what kind of file something is.','file notes.txt'],
//|du:['du [-h] [-s] [path]','Shows how much space files and folders use.','du -sh .'],
//|basename:['basename path','Prints only the last part of a path.','basename /home/dojo/notes.txt'],
//|dirname:['dirname path','Prints a path without its last part.','dirname /home/dojo/notes.txt'],
//|realpath:['realpath path','Prints the full absolute path.','realpath notes.txt'],
//|readlink:['readlink link','Shows where a symbolic link points.','readlink mylink'],
//|rmdir:['rmdir folder','Removes an EMPTY folder (use rm -r for full ones).','rmdir old'],
//|ln:['ln [-s] target link','Makes a link. -s makes a symbolic link (a shortcut).','ln -s notes.txt n'],
//|less:['less file','Reads a file page by page (here it prints the file).','less server.log'],
//|more:['more file','Older page-by-page reader (here it prints the file).','more server.log'],
//|vi:['vi file','Classic editor. Here it opens the editor panel.','vi notes.txt'],
//|vim:['vim file','Improved vi. Here it opens the editor panel.','vim notes.txt'],
//|tee:['tee [-a] file','Prints its input AND saves it to a file. -a appends.','echo hi | tee out.txt'],
//|tac:['tac file','Prints a file with the last line first.','tac notes.txt'],
//|rev:['rev file','Reverses the characters of every line.','echo hello | rev'],
//|nl:['nl file','Prints a file with line numbers.','nl notes.txt'],
//|sed:['sed [-n] [-i] SCRIPT [file]','Edits text on the fly. Supported: s/old/new/g, Np, N,Mp, Nd. -i changes the file itself.','sed s/linux/Linux/g notes.txt'],
//|tr:['tr [-d] FROM TO','Swaps or deletes characters. Ranges like a-z work.','echo hello | tr a-z A-Z'],
//|diff:['diff file1 file2','Shows lines that differ (< only in the first, > only in the second). Simplified.','diff a.txt b.txt'],
//|xargs:['xargs command','Turns input words into arguments of a command.','echo notes.txt | xargs cat'],
//|chown:['sudo chown user[:group] file','Changes who owns a file (administrator only).','sudo chown root:root notes.txt'],
//|chgrp:['sudo chgrp group file','Changes the group of a file (administrator only).','sudo chgrp staff notes.txt'],
//|groups:['groups','Shows the groups you belong to.','groups'],
//|who:['who','Shows who is logged in.','who'],
//|w:['w','Shows who is logged in and what they are doing.','w'],
//|last:['last','Shows the history of logins.','last'],
//|useradd:['sudo useradd name','Creates a new user (adds a line to /etc/passwd).','sudo useradd bob'],
//|userdel:['sudo userdel name','Deletes a user.','sudo userdel bob'],
//|passwd:['passwd [user]','Changes a password (simulated).','passwd'],
//|su:['su [user]','Switch user. Disabled here, use sudo.','su'],
//|top:['top','Shows the busiest processes (a one-time snapshot here).','top'],
//|htop:['sudo apt install htop, then htop','A friendlier top. Not installed until you install it.','htop'],
//|uptime:['uptime','Shows how long the machine has been running and its load.','uptime'],
//|lsblk:['lsblk','Lists disks and partitions.','lsblk'],
//|lscpu:['lscpu','Shows CPU information.','lscpu'],
//|dmesg:['dmesg','Shows kernel messages from boot.','dmesg'],
//|hostname:['hostname','Prints the machine name.','hostname'],
//|cal:['cal','Prints a calendar of this month.','cal'],
//|lsb_release:['lsb_release -a','Shows which Linux distribution this is.','lsb_release -a'],
//|systemctl:['systemctl status|start|stop|restart|is-active NAME','Shows or controls services. start, stop and restart need sudo.','sudo systemctl restart nginx'],
//|service:['service NAME status|start|stop|restart','Older way to control services.','service nginx status'],
//|journalctl:['journalctl [-u NAME]','Shows system and service logs.','journalctl -u nginx'],
//|crontab:['crontab -l | -e | -r','Lists, edits or removes your scheduled jobs. -e opens the editor panel.','crontab -e'],
//|ip:['ip addr','Shows network interfaces and addresses.','ip addr'],
//|ifconfig:['ifconfig','Older way to show network interfaces.','ifconfig'],
//|netstat:['netstat -tlnp','Lists listening ports (older than ss).','netstat -tlnp'],
//|ping:['ping [-c N] host','Checks that a host answers. Simulated.','ping -c 3 example.com'],
//|nslookup:['nslookup name','Looks up the address of a name. Simulated.','nslookup example.com'],
//|dig:['dig [+short] name','Looks up DNS records. Simulated.','dig +short example.com'],
//|wget:['wget url','Downloads a file (simulated, saves a small test file).','wget http://example.com/a.txt'],
//|scp:['scp file host:path','Copies a file to another machine over SSH. Simulated.','scp notes.txt prod:/tmp/'],
//|rsync:['rsync -av source target','Syncs folders efficiently. Simulated.','rsync -av proj/ backup/'],
//|nmap:['sudo apt install nmap, then nmap host','Scans a machine for open ports. Only localhost can be scanned here. ufw-blocked ports show as filtered.','nmap localhost'],
//|tar:['tar -czf out.tgz files | tar -tf out.tgz | tar -xzf out.tgz','Packs files into one archive, lists it, or unpacks it.','tar -czf backup.tgz notes.txt'],
//|gzip:['gzip file','Compresses a file into file.gz.','gzip server.log'],
//|gunzip:['gunzip file.gz','Restores a compressed file.','gunzip server.log.gz'],
//|zip:['zip out.zip files','Packs files into a zip archive.','zip out.zip notes.txt'],
//|unzip:['unzip out.zip','Unpacks a zip archive.','unzip out.zip'],
//|apt:['sudo apt update | install PKG | remove PKG | list --installed | search WORD','Installs software on Debian/Ubuntu. Needs sudo, except list and search.','sudo apt install htop'],
//|'apt-get':['sudo apt-get install PKG','The older form of apt.','sudo apt-get install nmap'],
//|dpkg:['dpkg -l','Lists installed packages.','dpkg -l'],
//|pip:['pip install NAME | pip list','Installs Python packages (simulated).','pip install requests'],
//|git:['git init | status | add FILE | commit -m MSG | log | branch','Tracks versions of your files (simplified).','git init'],
//|'ssh-keygen':['ssh-keygen [-t type] [-f path]','Makes a key pair. The private key is saved with mode 600.','ssh-keygen -f mykey'],
//|openssl:['openssl rand -hex N | openssl version','Crypto toolbox. Here: random values (simulated, not for real secrets).','openssl rand -hex 16'],
//|printf:['printf format args','Prints formatted text. %s is text, %d is a number.','printf "%s has %d files\\n" dojo 3'],
//|printenv:['printenv [NAME]','Prints one environment variable, or all.','printenv HOME'],
//|unset:['unset NAME','Removes an environment variable.','unset DB_URL'],
//|seq:['seq [first] last','Prints a sequence of numbers.','seq 5'],
//|yes:['yes [text]','Repeats a word (stops after 5 lines here).','yes ok'],
//|expr:['expr 6 + 3','Calculates simple maths.','expr 6 % 4'],
//|bc:['echo "1+2*3" | bc','A calculator. Supports + - * / % ^ and brackets.','echo "(1+2)^3" | bc'],
//|true:['true','Does nothing and succeeds.','true'],
//|false:['false','Does nothing and fails.','false'],
//|sleep:['sleep seconds','Waits (instant here).','sleep 1'],
//|exit:['exit','Leaves the shell (the practice shell just keeps going).','exit'],
//|help:['help','Shows a quick start and how to find commands.','help']
//|});
//|const CATS=[['📁 Navigate & inspect',['pwd','ls','cd','tree','stat','file','du','find','which','basename','dirname','realpath','readlink']],['✂️ Create, copy, delete',['mkdir','rmdir','touch','cp','mv','rm','ln']],['📖 Read & edit text',['cat','less','more','head','tail','nano','vi','vim','tee','tac','rev','nl']],['🔎 Search & transform text',['grep','sort','uniq','wc','cut','awk','sed','tr','diff','xargs']],['🔐 Permissions & users',['chmod','chown','chgrp','id','whoami','groups','who','w','last','useradd','userdel','passwd','su','sudo']],['⚙️ Processes & system',['ps','top','htop','kill','uptime','df','free','lsblk','lscpu','dmesg','uname','hostname','date','cal','lsb_release','systemctl','service','journalctl','crontab']],['🌐 Network',['ip','ifconfig','ss','netstat','ping','nslookup','dig','curl','wget','ssh','scp','rsync','nmap','ufw']],['📦 Archives, packages & git',['tar','gzip','gunzip','zip','unzip','apt','apt-get','dpkg','pip','npm','git']],['🛡️ Security tools',['ssh-keygen','openssl','hadolint','trivy']],['🧮 Variables & scripting',['echo','printf','env','printenv','export','unset','seq','yes','expr','bc','true','false','sleep','history','clear','exit','man','help']]];
//|const PKG_REPO=['tree','htop','nmap','vim','git','python3','nodejs','net-tools','zip','unzip','jq','wget','tmux','fail2ban','mysql-server','rsync'];
//|const inst=p=>(S.pkgs||(S.pkgs=new Set(['bash','coreutils','openssh-server','nginx','curl','sudo','ufw','tree','git','zip','unzip','wget','rsync','vim']))).has(p);
//|const notInst=p=>"Command '"+p+"' not found, but can be installed with:\nsudo apt install "+p;
//|const NOLOCK='E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?';
//|const fakeIp=h=>/^\d+\.\d+\.\d+\.\d+$/.test(h)?h:h==='localhost'?'127.0.0.1':h==='example.com'?'93.184.216.34':'203.0.113.'+(([...h].reduce((a,c)=>a+c.charCodeAt(0),0)%200)+10);
//|const sizeFmt=(n,h)=>{const k=Math.max(4,Math.ceil(n/4096)*4);return h?(k<1024?k+'K':(k/1024).toFixed(1)+'M'):String(k)};
//|const mkp=p=>{for(let d=dirname(p);d!=='/'&&!fs[d];d=dirname(d))fs[d]={d:1,m:'rwxr-xr-x'}};
//|const packFiles=args=>{const o={};for(const x of args){const p=res(x);if(!fs[p])return {err:x};const base=dirname(p);Object.keys(fs).filter(k=>k===p||k.startsWith(p+'/')).forEach(k=>{o[k.slice(base==='/'?1:base.length+1)]=fs[k].d?null:fs[k].c})}return {o}};
//|const unpack=o=>{for(const [rel,c] of Object.entries(o)){const p=res(rel);mkp(p);fs[p]=c===null?{d:1,m:'rwxr-xr-x'}:{c,m:'rw-r--r--'}}};
//|const calc=s=>{let i=0;const ws=()=>{while(s[i]===' ')i++},num=()=>{ws();if(s[i]==='('){i++;const v=add();ws();i++;return v}if(s[i]==='-'){i++;return -num()}const m=s.slice(i).match(/^\d+(\.\d+)?/);if(!m)throw 0;i+=m[0].length;return +m[0]},pow=()=>{let v=num();ws();while(s[i]==='^'||(s[i]==='*'&&s[i+1]==='*')){i+=s[i]==='^'?1:2;v=Math.pow(v,num());ws()}return v},mul=()=>{let v=pow();ws();while('*/%'.includes(s[i]||'#')){const o=s[i++],r=pow();v=o==='*'?v*r:o==='/'?v/r:v%r;ws()}return v},add=()=>{let v=mul();ws();while('+-'.includes(s[i]||'#')){const o=s[i++],r=mul();v=o==='+'?v+r:v-r;ws()}return v};const v=add();ws();if(i<s.length)throw 0;return v};
//|=====CMDS=====
//|basename(a){return (a[0]||'').replace(/\/+$/,'').split('/').pop()||'/'},
//|dirname(a){const p=(a[0]||'').replace(/\/+$/,'');return p.includes('/')?(p.replace(/\/[^/]*$/,'')||'/'):'.'},
//|realpath(a){const p=res(a[0]);return fs[p]?p:'realpath: '+a[0]+': No such file or directory'},
//|readlink(a){const f=fs[res(a[0])];return f&&f.link?f.link:''},
//|rmdir(a){return a.filter(x=>x[0]!=='-').map(x=>{const p=res(x),f=fs[p];if(!f)return "rmdir: failed to remove '"+x+"': No such file or directory";if(!f.d)return "rmdir: failed to remove '"+x+"': Not a directory";if(kids(p).length)return "rmdir: failed to remove '"+x+"': Directory not empty";delete fs[p];return ''}).filter(Boolean).join('\n')},
//|ln(a){const s=a.includes('-s'),t=a.filter(x=>x[0]!=='-');if(t.length<2)return 'ln: missing file operand';const src=fs[res(t[0])];if(!src&&!s)return "ln: failed to access '"+t[0]+"': No such file or directory";let d=res(t[1]);if(fs[d]&&fs[d].d)d+='/'+t[0].split('/').pop();fs[d]=src?{...src,link:s?t[0]:undefined,m:s?'rwxrwxrwx':src.m}:{c:'',m:'rwxrwxrwx',link:t[0]};return ''},
//|less(a,inp){return C.cat(a,inp)},
//|more(a,inp){return C.cat(a,inp)},
//|file(a){return a.filter(x=>x[0]!=='-').map(x=>{const f=fs[res(x)];if(!f)return x+': cannot open (No such file or directory)';if(f.d)return x+': directory';const c=f.c||'';return x+': '+(f.link?'symbolic link to '+f.link:!c?'empty':c.startsWith('DOJO-GZIP')?'gzip compressed data':c.startsWith('DOJO-ARCHIVE')?'tar archive':/^#!/.test(c)?'shell script, ASCII text executable':/<html/i.test(c)?'HTML document, ASCII text':/^\s*[{[]/.test(c)?'JSON data':'ASCII text')}).join('\n')},
//|du(a){const fl=a.filter(x=>x[0]==='-').join(''),h=fl.includes('h'),sm=fl.includes('s'),t=a.find(x=>x[0]!=='-')||'.',b=res(t);if(!fs[b])return "du: cannot access '"+t+"': No such file or directory";const keys=Object.keys(fs).filter(k=>k===b||k.startsWith(b==='/'?'/':b+'/')),sz=d=>keys.filter(k=>!fs[k].d&&(k===d||k.startsWith(d+'/'))).reduce((n,k)=>n+(fs[k].c||'').length,0),dirs=keys.filter(k=>fs[k].d).sort(),show=k=>k===b?t:t.replace(/\/$/,'')+k.slice(b.length);return (sm||!dirs.length?[b]:dirs).map(d=>sizeFmt(sz(d),h)+'\t'+show(d)).join('\n')},
//|chown(a){const t=a.filter(x=>x[0]!=='-');if(t.length<2)return 'chown: missing operand';const [o,...fl]=t,rec=a.includes('-R');if(!S.sudo)return "chown: changing ownership of '"+fl[0]+"': Operation not permitted";const [u,g]=o.split(':'),own=(u||'dojo')+' '+(g||u||'dojo');for(const x of fl){const p=res(x);if(!fs[p])return "chown: cannot access '"+x+"': No such file or directory";Object.keys(fs).filter(k=>k===p||(rec&&k.startsWith(p+'/'))).forEach(k=>{fs[k].own=own})}return ''},
//|chgrp(a){const t=a.filter(x=>x[0]!=='-');return t.length<2?'chgrp: missing operand':C.chown([':'+t[0],...t.slice(1)])},
//|tee(a,inp){const f=a.find(x=>x[0]!=='-');if(f){const p=res(f);if(!fs[dirname(p)])return 'tee: '+f+': No such file or directory';fs[p]={m:'rw-r--r--',...fs[p],c:(a.includes('-a')&&fs[p]?fs[p].c:'')+(inp||'')+'\n'}}return inp||''},
//|tac(a,inp){const tx=a[0]?(fs[res(a[0])]||{c:null}).c:inp;if(tx==null)return 'tac: '+a[0]+': No such file or directory';return tx.replace(/\n$/,'').split('\n').reverse().join('\n')},
//|rev(a,inp){const tx=a[0]?(fs[res(a[0])]||{c:null}).c:inp;if(tx==null)return 'rev: '+a[0]+': No such file or directory';return tx.replace(/\n$/,'').split('\n').map(l=>[...l].reverse().join('')).join('\n')},
//|nl(a,inp){const tx=a[0]?(fs[res(a[0])]||{c:null}).c:inp;if(tx==null)return 'nl: '+a[0]+': No such file or directory';return tx.replace(/\n$/,'').split('\n').map((l,i)=>String(i+1).padStart(6)+'\t'+l).join('\n')},
//|tr(a,inp){const exr=s=>s.replace('[:lower:]','a-z').replace('[:upper:]','A-Z').replace(/(.)-(.)/g,(_,p,q)=>{let r='';for(let c=p.charCodeAt(0);c<=q.charCodeAt(0);c++)r+=String.fromCharCode(c);return r}),d=a.includes('-d'),ar=a.filter(x=>x!=='-d'),from=exr(ar[0]||''),to=exr(ar[1]||'');return (inp||'').split('').map(c=>{const i=from.indexOf(c);return i<0?c:d?'':(to[Math.min(i,to.length-1)]??c)}).join('')},
//|sed(a,inp){let n=false,ip=false,ex=null,file=null;for(let i=0;i<a.length;i++){const x=a[i];if(x==='-n')n=true;else if(x==='-i')ip=true;else if(x==='-e')ex=a[++i];else if(ex===null)ex=x;else file=x}
//|if(ex===null)return 'usage: sed [-n] [-i] SCRIPT [file]';let tx=inp;if(file){const f=fs[res(file)];if(!f)return "sed: can't read "+file+': No such file or directory';tx=f.c}if(tx==null)return '';let L=tx.replace(/\n$/,'').split('\n'),m;
//|if(m=ex.match(/^s(.)(.*?)\1(.*?)\1([gi]*)$/)){let re;try{re=new RegExp(m[2],m[4])}catch(e){return 'sed: -e expression #1: invalid regex'}L=L.map(l=>l.replace(re,m[3]));if(n)L=[]}
//|else if(m=ex.match(/^(\d+)(?:,(\d+))?([pd])$/)){const s0=+m[1],e0=+(m[2]||m[1]),inr=i=>i+1>=s0&&i+1<=e0;L=m[3]==='p'?(n?L.filter((_,i)=>inr(i)):L.flatMap((l,i)=>inr(i)?[l,l]:[l])):L.filter((_,i)=>!inr(i))}
//|else return "sed: only s/old/new/g, 'Np', 'N,Mp' and 'Nd' are supported here";
//|const out=L.join('\n')+(L.length?'\n':'');if(ip&&file){fs[res(file)].c=out;return ''}return out.replace(/\n$/,'')},
//|diff(a){const [x,y]=a.filter(v=>v[0]!=='-'),f=fs[res(x||'')],g=fs[res(y||'')];if(!f||!g)return 'diff: '+(!f?x:y)+': No such file or directory';const A=f.c.replace(/\n$/,'').split('\n'),B=g.c.replace(/\n$/,'').split('\n');return [...A.filter(l=>!B.includes(l)).map(l=>'< '+l),...B.filter(l=>!A.includes(l)).map(l=>'> '+l)].join('\n')},
//|xargs(a,inp){const t=(inp||'').split(/\s+/).filter(Boolean);return a.length?run(a.join(' ')+' '+t.join(' ')):t.join(' ')},
//|seq(a){const n=a.map(Number);if(!n.length||n.some(isNaN))return 'seq: missing operand';const [s0,e0]=n.length===1?[1,n[0]]:n,o=[];for(let i=s0;i<=e0&&o.length<1000;i++)o.push(i);return o.join('\n')},
//|yes(a){return Array(5).fill(a.join(' ')||'y').join('\n')+'\n(stopped after 5 lines; the real yes never ends)'},
//|printf(a){const f=(a[0]||'').replace(/\\n/g,'\n').replace(/\\t/g,'\t');let i=1;return f.replace(/%[sd]/g,()=>a[i++]??'')},
//|bc(a,inp){const x=(a[0]||inp||'').trim();try{const v=calc(x);return isFinite(v)?String(Number.isInteger(v)?v:+v.toFixed(4)):'Runtime error: divide by zero'}catch(e){return '(standard_in) 1: syntax error'}},
//|expr(a){return C.bc([a.join(' ')])},
//|true:()=>'',
//|false:()=>'',
//|sleep:()=>'',
//|exit:()=>'logout\n(This is a simulated shell, so it keeps running. Close the tab when you are done.)',
//|reboot:()=>'Failed to reboot: this is a safe simulation, the dojo stays up.',
//|shutdown:()=>'Failed to power off: this is a safe simulation, the dojo stays up.',
//|cal(){const d=new Date(),y=d.getFullYear(),m=d.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),t=d.toLocaleString('en',{month:'long'})+' '+y;let o=' '.repeat(Math.max(0,Math.floor((20-t.length)/2)))+t+'\nSu Mo Tu We Th Fr Sa\n'+'   '.repeat(first);for(let i=1;i<=days;i++)o+=String(i).padStart(2)+((first+i)%7===0?'\n':' ');return o.trimEnd()},
//|uptime:()=>' 09:41:07 up 3 days,  4:12,  1 user,  load average: 0.08, 0.03, 0.01',
//|who:()=>'dojo     pts/0        2026-10-26 09:12 (10.0.0.5)',
//|w:()=>' 09:41:07 up 3 days,  4:12,  1 user,  load average: 0.08, 0.03, 0.01\nUSER     TTY      FROM       LOGIN@  WHAT\ndojo     pts/0    10.0.0.5   09:12   -bash',
//|last:()=>'dojo     pts/0        10.0.0.5         Mon Oct 26 09:12   still logged in\ndojo     pts/0        10.0.0.5         Sun Oct 25 18:40 - 19:05  (00:25)\nreboot   system boot  6.8.0-dojo       Thu Oct 22 05:29   still running',
//|top:()=>'top - 09:41:07 up 3 days, load average: 0.08, 0.03, 0.01\nTasks: '+S.procs.length+' total\n  PID USER      %CPU COMMAND\n'+[...S.procs].sort((x,y)=>parseFloat(y.c)-parseFloat(x.c)).map(p=>String(p.pid).padStart(5)+' '+p.u.padEnd(9)+String(p.c).padStart(5)+' '+p.cmd).join('\n')+'\n(press q to quit in a real terminal)',
//|htop(){return inst('htop')?C.top():notInst('htop')},
//|lsblk:()=>'NAME   SIZE TYPE MOUNTPOINT\nvda     20G disk\n└─vda1  20G part /',
//|lscpu:()=>'Architecture:        x86_64\nCPU(s):              2\nModel name:          Dojo Virtual CPU @ 2.40GHz\nThread(s) per core:  1',
//|dmesg:()=>'[    0.000000] Linux version 6.8.0-dojo\n[    1.204311] EXT4-fs (vda1): mounted filesystem\n[    3.512907] random: crng init done',
//|lsb_release:()=>'Distributor ID:\tUbuntu\nDescription:\tUbuntu 24.04 LTS (Dojo)\nRelease:\t24.04\nCodename:\tnoble',
//|printenv(a){return a[0]?(S.env[a[0]]??''):C.env()},
//|unset(a){a.forEach(x=>{delete S.env[x]});return ''},
//|ip(a){return !a[0]||/^a(ddr)?/.test(a[0])?'1: lo: <LOOPBACK,UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500\n    inet 10.0.0.12/24 brd 10.0.0.255 scope global eth0':'usage: ip addr'},
//|ifconfig:()=>'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 10.0.0.12  netmask 255.255.255.0  broadcast 10.0.0.255\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0',
//|netstat:()=>'Proto Local Address     State    PID/Program\ntcp   0.0.0.0:22        LISTEN   42/sshd\ntcp   0.0.0.0:80        LISTEN   77/nginx\ntcp   0.0.0.0:3306      LISTEN   120/mysqld\ntcp   0.0.0.0:6379      LISTEN   131/redis-server',
//|ping(a){const ci=a.indexOf('-c'),sk=ci>-1?ci+1:-1,n=ci>-1?Math.min(+a[ci+1]||4,10):4,h=a.filter((x,i)=>x[0]!=='-'&&i!==sk).pop();if(!h)return 'ping: usage error: Destination address required';if(!/^(localhost|(\d{1,3}\.){3}\d{1,3}|[\w-]+(\.[\w-]+)+)$/.test(h))return 'ping: '+h+': Name or service not known';const ip=fakeIp(h);let o='PING '+h+' ('+ip+') 56(84) bytes of data.';for(let i=1;i<=n;i++)o+='\n64 bytes from '+ip+': icmp_seq='+i+' ttl=57 time='+(11+i*1.3).toFixed(1)+' ms';return o+'\n\n--- '+h+' ping statistics ---\n'+n+' packets transmitted, '+n+' received, 0% packet loss'},
//|nslookup(a){return a[0]?'Server:\t\t10.0.0.2\nAddress:\t10.0.0.2#53\n\nNon-authoritative answer:\nName:\t'+a[0]+'\nAddress: '+fakeIp(a[0])+'\n(simulated: addresses are not real)':'usage: nslookup name'},
//|dig(a){const h=a.find(x=>x[0]!=='-'&&x[0]!=='+');return h?(a.includes('+short')?fakeIp(h):';; ANSWER SECTION:\n'+h+'.\t300\tIN\tA\t'+fakeIp(h)+'\n(simulated)'):'usage: dig name'},
//|wget(a){const u=a.find(x=>x[0]!=='-');if(!u)return 'wget: missing URL';const seg=u.replace(/^\w+:\/\//,'').replace(/[?#].*$/,'').split('/').filter(Boolean),last=seg.length>1?seg[seg.length-1]:'',name=/\./.test(last)?last:'index.html';fs[res(name)]={c:'<html><body>Downloaded by the dojo (simulated)</body></html>\n',m:'rw-r--r--'};return '--2026-10-26 09:41:07--  '+u+'\nResolving host... done.\nHTTP request sent, awaiting response... 200 OK\nSaving to: '+name+'\n\n'+name+' saved [52]'},
//|scp(a){const p=a.filter(x=>x[0]!=='-');return p.length<2?'usage: scp source [user@]host:path':p[0]+'   100%   52   1.2KB/s   00:00\n(simulated copy)'},
//|rsync:()=>'sending incremental file list\n\nsent 154 bytes  received 35 bytes\ntotal size is 52  speedup is 0.27\n(simulated)',
//|nmap(a){if(!inst('nmap'))return notInst('nmap');const h=a.find(x=>x[0]!=='-');if(!h)return 'Usage: nmap [target]';if(!/^(localhost|127\.0\.0\.1|10\.0\.0\.12)$/.test(h))return 'Note: only localhost and 10.0.0.12 can be scanned in the dojo.';const bl=S.fwp||[];return 'Starting Nmap (simulated)\nNmap scan report for '+h+'\nPORT      STATE     SERVICE\n'+[['22','ssh'],['80','http'],['3306','mysql'],['6379','redis']].map(([p,sv])=>(p+'/tcp').padEnd(10)+(bl.includes(p)?'filtered  ':'open      ')+sv).join('\n')},
//|'ssh-keygen'(a){const i=a.indexOf('-f'),p=i>-1?res(a[i+1]||''):HOME+'/.ssh/id_rsa',ty=a.includes('-t')?a[a.indexOf('-t')+1]:'rsa';if(fs[p])return p+' already exists.\nOverwrite (y/n)? n';mkp(p);const r=()=>Math.random().toString(36).slice(2,18);fs[p]={c:'-----BEGIN DEMO PRIVATE KEY-----\n'+r()+r()+r()+'\n-----END DEMO PRIVATE KEY-----\n',m:'rw-------'};fs[p+'.pub']={c:'ssh-'+ty+' AAAA'+r()+' dojo@dojo\n',m:'rw-r--r--'};return 'Generating public/private '+ty+' key pair.\nYour identification has been saved in '+p+'\nYour public key has been saved in '+p+'.pub\nThe key fingerprint is: SHA256:'+r()+' dojo@dojo'},
//|openssl(a){if(a[0]==='version')return 'OpenSSL 3.0.13 (simulated)';if(a[0]==='rand'){const n=+(a.filter(x=>/^\d+$/.test(x))[0]||16);return a.includes('-hex')?Array.from({length:n},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(''):Array.from({length:n},()=>String.fromCharCode(97+Math.floor(Math.random()*26))).join('')}return 'usage: openssl rand -hex N | openssl version'},
//|useradd(a){if(!S.sudo)return 'useradd: Permission denied.\nuseradd: cannot lock /etc/passwd; try again later.';const n=a.filter(x=>x[0]!=='-').pop();if(!n||!/^[a-z_][a-z0-9_-]{0,31}$/.test(n))return 'useradd: invalid user name';const pw=fs['/etc/passwd'];if(pw.c.split('\n').some(l=>l.split(':')[0]===n))return "useradd: user '"+n+"' already exists";const uid=1000+pw.c.split('\n').filter(l=>+l.split(':')[2]>=1000).length;pw.c+=n+':x:'+uid+':'+uid+'::/home/'+n+':/bin/bash\n';fs['/home/'+n]={d:1,m:'rwxr-xr-x'};return ''},
//|userdel(a){if(!S.sudo)return 'userdel: Permission denied.';const n=a.filter(x=>x[0]!=='-').pop(),pw=fs['/etc/passwd'];if(!n||!pw.c.split('\n').some(l=>l.split(':')[0]===n))return "userdel: user '"+n+"' does not exist";if(n==='root'||n==='dojo')return 'userdel: user '+n+' is currently used by process 88';pw.c=pw.c.split('\n').filter(l=>l.split(':')[0]!==n).join('\n');return ''},
//|passwd(a){if(a[0]&&a[0]!=='dojo'&&!S.sudo)return 'passwd: You may not view or modify password information for '+a[0]+'.';return 'New password: ********\npasswd: password updated successfully (simulated)'},
//|su:()=>'su: switching users is disabled in the dojo. Use sudo instead.',
//|groups:()=>'dojo sudo docker',
//|tar(a){const f=a.find(x=>/^-?[cxtzvf]+$/.test(x));if(!f)return 'tar: You must specify one of the -c, -x, -t options';const fl=f.replace('-',''),fi=a.indexOf(f)+1,file=a[fi],rest=a.slice(fi+1);if(!file)return 'tar: option requires an argument -- f';
//|if(fl.includes('c')){if(!rest.length)return 'tar: Cowardly refusing to create an empty archive';const r=packFiles(rest);if(r.err)return 'tar: '+r.err+': Cannot stat: No such file or directory';fs[res(file)]={c:'DOJO-ARCHIVE '+JSON.stringify(r.o),m:'rw-r--r--'};return fl.includes('v')?Object.keys(r.o).join('\n'):''}
//|const ar=fs[res(file)];if(!ar)return 'tar: '+file+': Cannot open: No such file or directory';if(!ar.c.startsWith('DOJO-ARCHIVE '))return 'tar: This does not look like a tar archive';const o=JSON.parse(ar.c.slice(13));if(fl.includes('t'))return Object.keys(o).join('\n');if(fl.includes('x')){unpack(o);return fl.includes('v')?Object.keys(o).join('\n'):''}return 'tar: You must specify one of the -c, -x, -t options'},
//|gzip(a){const x=a.find(y=>y[0]!=='-');if(!x)return 'gzip: compressing from a terminal is not supported';const p=res(x),f=fs[p];if(!f)return 'gzip: '+x+': No such file or directory';if(f.d)return 'gzip: '+x+' is a directory -- ignored';fs[p+'.gz']={c:'DOJO-GZIP '+f.c,m:f.m};delete fs[p];return ''},
//|gunzip(a){const x=a.find(y=>y[0]!=='-');if(!x)return 'gunzip: missing file';const p=res(x),f=fs[p];if(!f)return 'gunzip: '+x+': No such file or directory';if(!f.c.startsWith('DOJO-GZIP '))return 'gunzip: '+x+': not in gzip format';fs[p.replace(/\.gz$/,'')]={c:f.c.slice(10),m:f.m};delete fs[p];return ''},
//|zip(a){const t=a.filter(x=>x[0]!=='-');if(t.length<2)return 'zip error: Nothing to do! usage: zip out.zip files';const r=packFiles(t.slice(1));if(r.err)return '\tzip warning: name not matched: '+r.err;fs[res(t[0])]={c:'DOJO-ARCHIVE '+JSON.stringify(r.o),m:'rw-r--r--'};return t.slice(1).map(x=>'  adding: '+x+' (deflated 0%)').join('\n')},
//|unzip(a){const x=a.find(y=>y[0]!=='-');const ar=x&&fs[res(x)];if(!ar)return 'unzip:  cannot find or open '+x;if(!ar.c.startsWith('DOJO-ARCHIVE '))return 'End-of-central-directory signature not found.';const o=JSON.parse(ar.c.slice(13));unpack(o);return 'Archive:  '+x+'\n'+Object.keys(o).map(k=>'  inflating: '+k).join('\n')},
//|apt(a){const sub=a[0],pk=a.slice(1).filter(x=>x[0]!=='-');inst('x');const P=S.pkgs;
//|if(sub==='list')return [...P].sort().map(p=>p+'/noble,now installed [installed]').join('\n');
//|if(sub==='search')return PKG_REPO.filter(p=>p.includes(pk[0]||'')).map(p=>p+' - '+(P.has(p)?'[installed]':'available')).join('\n')||'Sorting... Done';
//|if(!['update','install','remove','upgrade','purge'].includes(sub))return 'usage: apt update | install PKG | remove PKG | list --installed | search WORD';
//|if(!S.sudo)return NOLOCK;
//|if(sub==='update')return 'Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease\nReading package lists... Done\nAll packages are up to date.';
//|if(sub==='upgrade')return 'Reading package lists... Done\n0 upgraded, 0 newly installed, 0 to remove.';
//|if(!pk.length)return 'E: No packages specified';
//|return pk.map(p=>{if(sub==='install'){if(!PKG_REPO.includes(p)&&!P.has(p))return 'E: Unable to locate package '+p;if(P.has(p))return p+' is already the newest version.';P.add(p);return 'Setting up '+p+' ...\n✔ '+p+' installed'}if(!P.has(p))return 'Package '+p+' is not installed, so not removed';P.delete(p);return 'Removing '+p+' ...\n✔ '+p+' removed'}).join('\n')},
//|'apt-get'(a){return C.apt(a)},
//|dpkg(a){inst('x');return a[0]==='-l'?'ii  '+[...S.pkgs].sort().join('  1.0  amd64\nii  ')+'  1.0  amd64':'usage: dpkg -l'},
//|yum:()=>'bash: yum: this is a Debian/Ubuntu system. Use apt instead.',
//|dnf:()=>'bash: dnf: this is a Debian/Ubuntu system. Use apt instead.',
//|pip(a){if(a[0]==='list')return 'Package    Version\npip        24.0\nsetuptools 68.1.2'+[...(S.pip||[])].map(p=>'\n'+p.padEnd(10)+' 1.0.0').join('');if(a[0]==='install'&&a[1]){(S.pip=S.pip||new Set()).add(a[1]);return 'Collecting '+a[1]+'\nSuccessfully installed '+a[1]+'-1.0.0 (simulated)'}return 'usage: pip install NAME | pip list'},
//|pip3(a){return C.pip(a)},
//|git(a){const G=S.git||(S.git={on:false,staged:[],tracked:[],commits:[]}),s0=a[0];if(s0==='--version')return 'git version 2.43.0 (simulated)';
//|if(s0==='init'){G.on=true;G.root=S.cwd;fs[S.cwd+'/.git']={d:1,m:'rwxr-xr-x'};return 'Initialized empty Git repository in '+S.cwd+'/.git/'}
//|if(!G.on)return 'fatal: not a git repository (or any of the parent directories): .git';
//|const here=()=>kids(G.root).filter(k=>!fs[k].d).map(k=>k.split('/').pop());
//|if(s0==='status'){const un=here().filter(f=>!G.tracked.includes(f)&&!G.staged.includes(f));return 'On branch main'+(G.staged.length?'\nChanges to be committed:\n'+G.staged.map(f=>'\tnew file:   '+f).join('\n'):'')+(un.length?'\nUntracked files:\n'+un.map(f=>'\t'+f).join('\n'):(G.staged.length?'':'\nnothing to commit, working tree clean'))}
//|if(s0==='add'){const t=a.slice(1);if(!t.length)return 'Nothing specified, nothing added.';for(const x of t){if(x==='.'||x==='-A')here().forEach(f=>{if(!G.tracked.includes(f)&&!G.staged.includes(f))G.staged.push(f)});else{if(!fs[res(x)])return "fatal: pathspec '"+x+"' did not match any files";const n=x.split('/').pop();if(!G.staged.includes(n)&&!G.tracked.includes(n))G.staged.push(n)}}return ''}
//|if(s0==='commit'){const i=a.indexOf('-m');if(i<0||!a[i+1])return 'Aborting commit due to empty commit message. Use: git commit -m "message"';if(!G.staged.length)return 'nothing to commit, working tree clean';const id=Math.random().toString(16).slice(2,9),n=G.staged.length;G.commits.unshift({id,msg:a[i+1]});G.tracked.push(...G.staged);G.staged=[];return '[main '+id+'] '+a[i+1]+'\n '+n+' file(s) changed'}
//|if(s0==='log')return G.commits.length?G.commits.map(c=>'commit '+c.id+'\nAuthor: dojo <dojo@dojo>\n\n    '+c.msg+'\n').join('\n'):"fatal: your current branch 'main' does not have any commits yet";
//|if(s0==='branch')return '* main';
//|return 'usage: git init | status | add FILE | commit -m MSG | log | branch'},
//|systemctl(a){const sv=S.svc||(S.svc={nginx:'active',ssh:'active',cron:'active',mysql:'active',docker:'inactive'}),[sub,n]=a;
//|if(sub==='list-units')return 'UNIT            ACTIVE\n'+Object.entries(sv).map(([k,v])=>(k+'.service').padEnd(16)+v).join('\n');
//|if(!n)return 'usage: systemctl status|start|stop|restart|enable|disable|is-active NAME';if(!(n in sv))return 'Unit '+n+'.service could not be found.';
//|if(sub==='status')return '● '+n+'.service - '+n+'\n   Active: '+(sv[n]==='active'?'active (running)':'inactive (dead)');
//|if(sub==='is-active')return sv[n];
//|if(['start','stop','restart','enable','disable'].includes(sub)){if(!S.sudo)return '==== AUTHENTICATION REQUIRED ====\nFailed to '+sub+' '+n+'.service: Interactive authentication required. (use sudo)';if(sub==='start'||sub==='restart')sv[n]='active';if(sub==='stop')sv[n]='inactive';return ''}
//|return 'Unknown command verb '+sub},
//|service(a){return a.length<2?'usage: service NAME status|start|stop|restart':C.systemctl([a[1],a[0]])},
//|journalctl(a){const u=a.indexOf('-u'),n=u>-1?a[u+1]:'system';return '-- Logs begin at Thu 2026-10-22 --\nOct 26 09:12:01 dojo '+n+'[42]: started\nOct 26 09:30:44 dojo '+n+'[42]: reloaded configuration\nOct 26 09:41:02 dojo '+n+'[42]: ready'},
//|crontab(a){const p='/var/spool/cron/dojo';if(a[0]==='-l')return fs[p]?fs[p].c.replace(/\n$/,''):'no crontab for dojo';if(a[0]==='-r'){delete fs[p];return ''}if(a[0]==='-e'){if(!fs[p]){mkp(p);fs[p]={c:'# m h dom mon dow command\n',m:'rw-------'}}S.edit(p);return 'Opened your crontab in the editor panel. Save it, then run crontab -l.'}return 'usage: crontab -l | -e | -r'},
//|=====HELP=====
//|help:()=>'Over '+Object.keys(MAN).length+' commands work in this simulated shell. Open the Commands page (header) for the full searchable list, or type man <command>.\nQuick start: ls cd pwd cat grep find sed awk sort tar ps kill ping ssh chmod git apt\nTips: pipes (|), > and >>, $VARS, ~, Tab completion, the arrow keys for history. explain [error] asks Sensei.',
//|=====UI=====
//|let PRE='';
//|const stem=w=>{const r=w.replace(/(ies|ied)$/,'y').replace(/(ing|ed|es|s)$/,'');return r.length>=2?r:w};
//|const hit=(c,q)=>{const t=(c+' '+MAN[c][1]+' '+MAN[c][0]).toLowerCase(),ws=t.split(/[^a-z0-9]+/).map(stem);return t.includes(q)||q.split(/\s+/).every(w=>ws.some(x=>x.startsWith(stem(w))))};
//|function cmds(){app.innerHTML=`<div class="wrap"><h2>📖 Command reference</h2><p style="color:var(--m)">${Object.keys(MAN).length} commands work in the practice terminals. Search, read what each one does, and press <b>Try</b> to open the Linux Lab with the example ready to run. Commands are simulated: safe to experiment with, and a few behave in a simplified way.</p><input class="f" id="cq" placeholder="Search commands (try: copy, permission, port, text)..." aria-label="Search commands"><div id="cl" style="margin-bottom:40px"></div></div>`;
//|const draw=q=>{q=q.trim().toLowerCase();const html=CATS.map(([t,L])=>{const rows=L.filter(c=>MAN[c]&&(!q||hit(c,q)));return rows.length?`<h3 style="margin:22px 0 6px">${t} <small class="mono" style="color:var(--m)">${rows.length}</small></h3><div class="card" style="padding:6px 14px">${rows.map(c=>`<div class="cmd"><div><span class="mono" style="color:var(--g)">${esc(c)}</span> <span style="color:var(--m)">${esc(MAN[c][1])}</span><br><code class="mono" style="font-size:12px">${esc(MAN[c][2])}</code></div><button class="btn sm" data-t="${esc(MAN[c][2])}">▶ Try</button></div>`).join('')}</div>`:''}).join('');
//|$('#cl').innerHTML=html||'<p style="color:var(--m)">No command matches that. Try another word.</p>';$('#cl').querySelectorAll('[data-t]').forEach(b=>{b.onclick=()=>{PRE=b.dataset.t;location.hash='lab'}})};
//|$('#cq').oninput=e=>draw(e.target.value);draw('');$('#cq').focus()}
