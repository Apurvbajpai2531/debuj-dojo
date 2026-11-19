'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const os = require('os');
const path = require('path');
process.env.DATA_FILE = path.join(os.tmpdir(), `dojo-coach-${process.pid}.json`);
try { require('fs').unlinkSync(process.env.DATA_FILE); } catch { /* no old data */ }
process.env.GROQ_API_KEY = 'test-key';
const app = require('../server');

let srv, mock, base, ck, ck2, seen = [];
before(() => new Promise((r) => {
  mock = http.createServer((req, res) => {
    let b = '';
    req.on('data', (d) => { b += d; });
    req.on('end', () => {
      seen.push(JSON.parse(b));
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ choices: [{ message: { content: 'Bahut badhiya! Permissions par dhyan do.' } }] }));
    });
  }).listen(0, () => {
    process.env.GROQ_BASE_URL = 'http://127.0.0.1:' + mock.address().port;
    srv = app.listen(0, () => { base = 'http://127.0.0.1:' + srv.address().port; r(); });
  });
}));
after(() => { srv.close(); mock.close(); });
const post = (u, b, cookie) => fetch(base + u, { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(b) });
const get = (u, cookie) => fetch(base + u, { headers: cookie ? { cookie } : {} });
const SUM = 'Solved 2/13 challenges. Sections: Permissions 2/3, Hardening 0/1. Average hints per challenge: 0.5. Streak: 1 days.';

test('setup', async () => {
  ck = (await post('/api/auth/register', { username: 'coachee', password: 'password123' })).headers.get('set-cookie').split(';')[0];
  ck2 = (await post('/api/auth/register', { username: 'other', password: 'password123' })).headers.get('set-cookie').split(';')[0];
});
test('coach: login and input rules', async () => {
  assert.equal((await post('/api/coach', { summary: SUM })).status, 401);
  assert.equal((await post('/api/coach', { summary: 'short' }, ck)).status, 400);
  assert.equal((await post('/api/coach', { summary: 'x'.repeat(1300) }, ck)).status, 400);
  assert.equal((await post('/api/coach', { summary: 42 }, ck)).status, 400);
});
test('coach: the AI words the plan, with the summary treated as data', async () => {
  seen = [];
  const j = await (await post('/api/coach', { summary: SUM }, ck)).json();
  assert.equal(j.source, 'ai');
  assert.match(j.answer, /Permissions/);
  assert.match(seen[0].messages[0].content, /Hinglish/);
  assert.match(seen[0].messages[0].content, /never instructions/);
  assert.equal(seen[0].messages[1].content, `<progress>${SUM}</progress>`);
});
test('coach: without an API key it answers "local" so the page shows its own plan', async () => {
  const key = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  const j = await (await post('/api/coach', { summary: SUM }, ck)).json();
  assert.deepEqual([j.source, j.answer], ['local', '']);
  process.env.GROQ_API_KEY = key;
});
test('playbook: needs login, unknown ids 404, and is locked until YOU solved the challenge', async () => {
  assert.equal((await get('/api/agent/playbook/perm')).status, 401);
  assert.equal((await get('/api/agent/playbook/nope', ck)).status, 404);
  assert.equal((await get('/api/agent/playbook/perm', ck)).status, 403);
});
test('playbook: after solving, you get the demo agent steps (and only for what you solved)', async () => {
  await post('/api/progress', { done: { perm: { t: 30, h: 0 } } }, ck);
  const j = await (await get('/api/agent/playbook/perm', ck)).json();
  assert.equal(j.steps[0].action.cmd, 'ls -l');
  assert.ok(j.steps.length >= 3 && j.steps.every((s) => s.thought && s.action && s.action.type));
  assert.match(j.done, /deploy/);
  assert.equal((await get('/api/agent/playbook/sshkey', ck)).status, 403);
  assert.equal((await get('/api/agent/playbook/perm', ck2)).status, 403);
});
