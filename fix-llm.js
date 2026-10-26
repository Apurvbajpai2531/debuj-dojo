const fs = require('fs');
const f = 'backend/server.js';
let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const a = s.indexOf('async function llm('), b = s.indexOf('\n}\n', a);
if (a < 0 || b < 0) throw new Error('llm() not found - run patch-groq.js first');
const NEW = `async function llm(system, messages, max = 400) {
  let r;
  try {
    r = await fetch((process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1') + '/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(20000),
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.GROQ_API_KEY },
      body: JSON.stringify({ model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b', max_tokens: max + 800, temperature: 0.4, messages: [{ role: 'system', content: system }, ...messages] }),
    });
  } catch (e) { console.error('Groq network error:', e.message); throw e; }
  const raw = await r.text();
  if (!r.ok) { console.error('Groq error', r.status, raw.slice(0, 300)); throw new Error('upstream ' + r.status); }
  let j;
  try { j = JSON.parse(raw); } catch (e) { console.error('Groq sent invalid JSON:', raw.slice(0, 300)); throw e; }
  const text = ((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '').trim();
  if (!text) console.error('Groq returned an EMPTY reply:', raw.slice(0, 500));
  return text;`;
fs.writeFileSync(f, s.slice(0, a) + NEW + s.slice(b));
console.log('server.js updated: AI problems will now be printed in this terminal.');
