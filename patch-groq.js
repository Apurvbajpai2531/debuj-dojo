// Run from the project root, AFTER patch-v3.js:   node patch-groq.js
// Switches every AI feature (Sensei hint, Sensei chat, explain, challenge generator) from Anthropic to Groq.
// Aborts and changes NOTHING if any required text is not found.
const fs = require('fs');
const rd = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const D = rd(__filename).split('//---DATA---\n')[1].split('\n').map((l) => l.replace(/^\/\/\|/, '')).join('\n');
const P = {};
D.split(/^=====(\w+)=====\n/m).slice(1).forEach((v, i, a) => { if (i % 2 === 0) P[v] = a[i + 1].replace(/\n+$/, ''); });
for (const f of ['backend/server.js', 'backend/public/index.html']) if (!fs.existsSync(f)) throw new Error('Run this from the folder that contains backend/ (cd debug-dojo)');

const out = {};            // file -> new text, written only at the very end
let s;
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`Expected 1 match, found ${n}: ${a.slice(0, 70)}`); s = s.replace(a, () => b); };
const all = (a, b) => { if (!s.includes(a)) throw new Error('Not found: ' + a.slice(0, 70)); s = s.split(a).join(b); };
const between = (a, b, t) => { const i = s.indexOf(a), j = s.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('Block not found: ' + a); s = s.slice(0, i) + t + s.slice(j); };
const soft = (file, fn) => { if (!fs.existsSync(file)) { console.log('skipped (not found): ' + file); return; } s = rd(file); fn(); out[file] = s; };

// ---- server.js ----
s = rd('backend/server.js');
if (!s.includes('async function claude(')) throw new Error('Run patch-v3.js first (or this was already applied).');
between('async function claude(', 'const SYSTEM_CHAT', P.LLM + '\n');
between("app.post('/api/sensei'", '// ---- v3:', P.SENSEI + '\n\n');
all('await claude(', 'await llm(');
all("source: 'claude'", "source: 'ai'");
all('ANTHROPIC_API_KEY', 'GROQ_API_KEY');
s = s.split('(Claude with local fallback)').join('(Groq with local fallback)');
out['backend/server.js'] = s;

// ---- frontend ----
s = rd('backend/public/index.html');
all("j.source==='claude'", "j.source==='ai'");
all('Claude builds a new broken setup', 'AI builds a new broken setup');
all('Claude builds a broken setup for you to fix', 'AI builds a broken setup for you to fix');
out['backend/public/index.html'] = s;

// ---- config ----
soft('docker-compose.yml', () => {
  rep('ANTHROPIC_API_KEY: "${ANTHROPIC_API_KEY:-}"', 'GROQ_API_KEY: "${GROQ_API_KEY:-}"');
  rep('ANTHROPIC_MODEL: "${ANTHROPIC_MODEL:-claude-sonnet-5-5}"', 'GROQ_MODEL: "${GROQ_MODEL:-llama-3.3-70b-versatile}"');
});
out['.env.example'] = P.ENV + '\n';

// ---- tests ----
soft('backend/test/v3.test.js', () => {
  all('ANTHROPIC_API_KEY', 'GROQ_API_KEY');
  all('ANTHROPIC_BASE_URL', 'GROQ_BASE_URL');
  all("'claude'", "'ai'");
  rep("const j = JSON.parse(b);", "seen.push(req.headers.authorization);\n      const j = JSON.parse(b);");
  rep("j.system.includes('JSON only')", "j.messages[0].content.includes('JSON only')");
  rep("res.end(JSON.stringify({ content: [{ type: 'text', text }] }));", "res.end(JSON.stringify({ choices: [{ message: { content: text } }] }));");
  rep('let srv, mock, base;', 'let srv, mock, base;\nconst seen = [];');
  rep("assert.equal(g.files[0].mode, '777');", "assert.equal(g.files[0].mode, '777');\n  const sn = await (await post('/api/sensei', { challenge: 'perm', history: ['ls'] }, ck)).json();\n  assert.equal(sn.source, 'ai');\n  assert.ok(seen.length >= 4 && seen.every((h) => h === 'Bearer test-key'));");
});
soft('backend/test/api.test.js', () => { s = s.split('ANTHROPIC_API_KEY').join('GROQ_API_KEY'); });

for (const [f, t] of Object.entries(out)) { if (fs.existsSync(f)) fs.copyFileSync(f, f + '.bakg'); fs.writeFileSync(f, t); }
console.log('Done. Get a free key at https://console.groq.com/keys and run:  cd backend && npm test && GROQ_API_KEY=your_key npm start');

//---DATA---
//|=====LLM=====
//|// Groq chat completion (OpenAI-compatible). Returns the reply text.
//|async function llm(system, messages, max = 400) {
//|  const r = await fetch((process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1') + '/chat/completions', {
//|    method: 'POST',
//|    signal: AbortSignal.timeout(20000),
//|    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.GROQ_API_KEY },
//|    body: JSON.stringify({ model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', max_tokens: max, temperature: 0.4, messages: [{ role: 'system', content: system }, ...messages] }),
//|  });
//|  if (!r.ok) throw new Error('upstream ' + r.status);
//|  const j = await r.json();
//|  return ((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '').trim();
//|}
//|=====SENSEI=====
//|app.post('/api/sensei', async (req, res) => {
//|  const { challenge, history, files } = req.body || {};
//|  if (!isChallenge(challenge)) return res.status(400).json({ error: 'unknown challenge' });
//|  const local = { answer: hintFor(challenge), source: 'local' };
//|  if (!process.env.GROQ_API_KEY || !sessionUser(req)) return res.json(local); // AI only for logged-in players
//|  try {
//|    const text = await llm(SYSTEM, [{ role: 'user', content: `Challenge: ${challenge}\n<commands>${clipHist(history).join('\n')}</commands>\n<files>${JSON.stringify(clipFiles(files))}</files>` }], 250);
//|    res.json({ answer: text || local.answer, source: text ? 'ai' : 'local' });
//|  } catch {
//|    res.json(local); // never leave the player without help
//|  }
//|});
//|=====ENV=====
//|PORT=3000
//|# Optional. Free key from https://console.groq.com/keys
//|# Without it, Sensei and explain use built-in local answers (the AI challenge generator needs the key).
//|GROQ_API_KEY=
//|GROQ_MODEL=llama-3.3-70b-versatile
