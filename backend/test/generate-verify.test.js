'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const os = require('os');
const path = require('path');
process.env.DATA_FILE = path.join(os.tmpdir(), `dojo-genv-${process.pid}.json`);
try { require('fs').unlinkSync(process.env.DATA_FILE); } catch { /* no old data */ }
process.env.GROQ_API_KEY = 'test-key';
const app = require('../server');

let srv, mock, base, ck, reply = '', seen = [];
before(() => new Promise((r) => {
  mock = http.createServer((req, res) => {
    let b = '';
    req.on('data', (d) => { b += d; });
    req.on('end', () => {
      seen.push(JSON.parse(b));
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ choices: [{ message: { content: reply } }] }));
    });
  }).listen(0, () => {
    process.env.GROQ_BASE_URL = 'http://127.0.0.1:' + mock.address().port;
    srv = app.listen(0, () => { base = 'http://127.0.0.1:' + srv.address().port; r(); });
  });
}));
after(() => { srv.close(); mock.close(); });
const post = (u, b, cookie) => fetch(base + u, { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(b) });
const gen = (b) => post('/api/generate', { topic: 'cron job', ...b }, ck);
const CH = { title: 'Weak cron script', story: 'A cron script is writable by everyone.', files: [{ path: 'cron.sh', content: '#!/bin/sh\necho hi\n', mode: '777' }], rules: [{ path: 'cron.sh', op: 'mode', val: '750' }], hints: ['ls -l', 'chmod', '750'], why: 'Others can edit it.' };
const SOL = [{ type: 'run', cmd: 'chmod 750 cron.sh' }];

test('setup', async () => {
  ck = (await post('/api/auth/register', { username: 'maker', password: 'password123' })).headers.get('set-cookie').split(';')[0];
});
test('the AI solution is validated and returned; the prompt asks for it and forbids tool calls', async () => {
  reply = JSON.stringify({ ...CH, solution: [...SOL, { type: 'write', path: 'notes.txt', content: 'done\n' }] });
  seen = [];
  const j = await (await gen({})).json();
  assert.deepEqual(j.solution, [...SOL, { type: 'write', path: 'notes.txt', content: 'done\n' }]);
  assert.equal(j.title, 'Weak cron script');
  const sys = seen[0].messages[0].content;
  assert.match(sys, /"solution"/);
  assert.match(sys, /every rule must be FALSE at the start/i);
  assert.match(sys, /Do NOT call tools/);
});
test('a missing solution still works (empty list)', async () => {
  reply = JSON.stringify(CH);
  assert.deepEqual((await (await gen({})).json()).solution, []);
});
test('unsafe or malformed solution steps are rejected', async () => {
  // kept small on purpose: /api/generate is rate limited to 12 requests a minute
  for (const bad of [[{ type: 'finish', summary: 'x' }], [{ type: 'run', cmd: 'a\nb' }], 'nope', Array(9).fill(SOL[0])]) {
    reply = JSON.stringify({ ...CH, solution: bad });
    assert.equal((await gen({})).status, 502);
  }
});
test('repair mode sends the previous attempt and the verification report', async () => {
  reply = JSON.stringify({ ...CH, solution: SOL });
  seen = [];
  const report = 'After running the solution in a sandbox: rule "mode 750" on cron.sh is still false.';
  const j = await (await gen({ previous: { ...CH, solution: [{ type: 'run', cmd: 'chmod 700 cron.sh' }] }, problem: report })).json();
  assert.deepEqual(j.solution, SOL);
  const user = seen[0].messages[1].content;
  assert.match(user, /Your previous attempt/);
  assert.match(user, /chmod 700 cron\.sh/);
  assert.ok(user.includes(report));
  assert.match(user, /<topic>cron job<\/topic>/);
});
test('an invalid previous attempt is ignored, and the report is capped', async () => {
  seen = [];
  await gen({ previous: { title: 'x' }, problem: 'something' });
  assert.ok(!seen[0].messages[1].content.includes('previous attempt'));
  seen = [];
  await gen({ previous: { ...CH, solution: SOL }, problem: 'x'.repeat(5000) });
  assert.ok(seen[0].messages[1].content.length < 2500);
});
test('login and topic rules still apply', async () => {
  assert.equal((await post('/api/generate', { topic: 'cron job' })).status, 401);
  assert.equal((await gen({ topic: 'x' })).status, 400);
});
