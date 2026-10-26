'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const os = require('os');
const path = require('path');
process.env.DATA_FILE = path.join(os.tmpdir(), `dojo-test-${process.pid}.json`);
try { require('fs').unlinkSync(process.env.DATA_FILE); } catch { /* no old data */ }
delete process.env.GROQ_API_KEY;
const app = require('../server');

let srv, base;
before(() => new Promise((r) => { srv = app.listen(0, () => { base = 'http://127.0.0.1:' + srv.address().port; r(); }); }));
after(() => srv.close());
const post = (u, b, cookie) => fetch(base + u, { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(b) });
const cookieOf = (r) => r.headers.get('set-cookie').split(';')[0];

test('health check', async () => {
  const r = await fetch(base + '/health');
  assert.equal(r.status, 200);
  assert.equal((await r.json()).status, 'ok');
});
test('register, save progress, leaderboard', async () => {
  const r = await post('/api/auth/register', { username: 'neo', password: 'password123' });
  assert.equal(r.status, 201);
  assert.match(r.headers.get('set-cookie'), /HttpOnly/);
  const ck = cookieOf(r);
  const p = await post('/api/progress', { done: { perm: { t: 30, h: 1 } } }, ck);
  assert.equal((await p.json()).xp, 40); // 50 - 1 hint * 10, computed by the server
  const pr = await (await fetch(base + '/api/progress', { headers: { cookie: ck } })).json();
  assert.equal(pr.xp, 40);
  const lb = await (await fetch(base + '/api/leaderboard')).json();
  assert.equal(lb[0].name, 'neo');
});
test('rejects weak password and duplicate username', async () => {
  assert.equal((await post('/api/auth/register', { username: 'abc', password: 'short' })).status, 400);
  assert.equal((await post('/api/auth/register', { username: 'neo', password: 'password123' })).status, 409);
});
test('login works, wrong password fails', async () => {
  assert.equal((await post('/api/auth/login', { username: 'neo', password: 'password123' })).status, 200);
  assert.equal((await post('/api/auth/login', { username: 'neo', password: 'wrongpass1' })).status, 401);
});
test('progress needs login and rejects bad data', async () => {
  assert.equal((await post('/api/progress', { done: {} })).status, 401);
  const ck = cookieOf(await post('/api/auth/login', { username: 'neo', password: 'password123' }));
  assert.equal((await post('/api/progress', { done: { fake: { t: 1, h: 0 } } }, ck)).status, 400);
});
test('logout ends the session', async () => {
  const ck = cookieOf(await post('/api/auth/login', { username: 'neo', password: 'password123' }));
  await post('/api/auth/logout', {}, ck);
  assert.equal((await fetch(base + '/api/auth/me', { headers: { cookie: ck } })).status, 401);
});
test('sensei falls back without API key', async () => {
  const j = await (await post('/api/sensei', { challenge: 'perm', history: ['ls'] })).json();
  assert.equal(j.source, 'local');
});
test('sensei rejects unknown challenge', async () => {
  assert.equal((await post('/api/sensei', { challenge: 'nope' })).status, 400);
});

test('clearing a whole section gives a bonus', async () => {
  const ck = cookieOf(await post('/api/auth/register', { username: 'bonus', password: 'password123' }));
  const r = await post('/api/progress', { done: { perm: { t: 5, h: 0 }, sshkey: { t: 5, h: 0 }, secret: { t: 5, h: 0 } } }, ck);
  assert.equal((await r.json()).xp, 50 + 60 + 60 + 50);
});
