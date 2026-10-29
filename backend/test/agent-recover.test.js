'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const os = require('os');
const path = require('path');
process.env.DATA_FILE = path.join(os.tmpdir(), `dojo-recover-${process.pid}.json`);
try { require('fs').unlinkSync(process.env.DATA_FILE); } catch { /* no old data */ }
process.env.GROQ_API_KEY = 'test-key';
const app = require('../server');

let srv, mock, base, ck, fg = '', status = 400, code = 'tool_use_failed';
const err = () => JSON.stringify({ error: { message: 'Tool choice is none, but model called a tool', type: 'invalid_request_error', code, failed_generation: fg } });
before(() => new Promise((r) => {
  mock = http.createServer((req, res) => {
    req.on('data', () => {});
    req.on('end', () => { res.statusCode = status; res.setHeader('content-type', 'application/json'); res.end(err()); });
  }).listen(0, () => {
    process.env.GROQ_BASE_URL = 'http://127.0.0.1:' + mock.address().port;
    srv = app.listen(0, () => { base = 'http://127.0.0.1:' + srv.address().port; r(); });
  });
}));
after(() => { srv.close(); mock.close(); });
const post = (u, b, cookie) => fetch(base + u, { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(b) });
const step = (b) => post('/api/agent/step', { goal: 'Create a folder called report', challenge: '', story: '', steps: [], ...b }, ck);
const want = { type: 'run', cmd: 'mkdir report' };
const inner = { thought: 'Create the report directory', action: want };

test('setup', async () => {
  ck = (await post('/api/auth/register', { username: 'recover', password: 'password123' })).headers.get('set-cookie').split(';')[0];
});
test('the exact error from the field is recovered (name/arguments wrapper)', async () => {
  fg = '{"name": "assistant", "arguments": ' + JSON.stringify(inner) + '}';
  const j = await (await step({})).json();
  assert.equal(j.source, 'ai');
  assert.deepEqual(j.action, want);
  assert.equal(j.thought, 'Create the report directory');
});
test('recovers when failed_generation is already the plain JSON', async () => {
  fg = JSON.stringify(inner);
  assert.deepEqual((await (await step({})).json()).action, want);
});
test('recovers when arguments is a JSON string, or has text around it', async () => {
  fg = JSON.stringify({ name: 'assistant', arguments: JSON.stringify(inner) });
  assert.deepEqual((await (await step({})).json()).action, want);
  fg = 'call: ' + JSON.stringify({ name: 'x', arguments: inner }) + ' <|end|>';
  assert.deepEqual((await (await step({})).json()).action, want);
});
test('a recovered but invalid action is still rejected', async () => {
  fg = JSON.stringify({ name: 'assistant', arguments: { thought: 'x', action: { type: 'delete_everything' } } });
  const j = await (await step({})).json();
  assert.equal(j.action.type, 'finish');
  assert.match(j.action.summary, /unusable/);
});
test('other Groq errors are NOT treated as recoverable', async () => {
  code = 'invalid_api_key';
  fg = JSON.stringify(inner);
  const j = await (await step({})).json();
  assert.equal(j.action.type, 'finish');
  const pb = await (await step({ challenge: 'perm', goal: 'Solve the challenge: Permission denied' })).json();
  assert.equal(pb.source, 'local');
  code = 'tool_use_failed';
});
test('AI challenge lab recovers too', async () => {
  const ch = { title: 'Weak cron script', story: 'A cron script is writable by everyone.', files: [{ path: 'cron.sh', content: 'echo hi\n', mode: '777' }], rules: [{ path: 'cron.sh', op: 'mode', val: '750' }], hints: ['a', 'b', 'c'], why: 'w' };
  fg = JSON.stringify({ name: 'assistant', arguments: ch });
  const j = await (await post('/api/generate', { topic: 'cron job' }, ck)).json();
  assert.equal(j.title, 'Weak cron script');
});
test('plain chat does not use recovery (falls back to the local hint)', async () => {
  fg = JSON.stringify({ name: 'assistant', arguments: { text: 'hello' } });
  const j = await (await post('/api/chat', { challenge: 'perm', messages: [{ role: 'user', content: 'hi' }] }, ck)).json();
  assert.equal(j.source, 'local');
  assert.match(j.answer, /^Think about it/);
});
