'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const os = require('os');
const path = require('path');
process.env.DATA_FILE = path.join(os.tmpdir(), `dojo-ctf-${process.pid}.json`);
try { require('fs').unlinkSync(process.env.DATA_FILE); } catch { /* no old data */ }
delete process.env.GROQ_API_KEY;
const app = require('../server');

let srv, base, ck;
before(() => new Promise((r) => { srv = app.listen(0, () => { base = 'http://127.0.0.1:' + srv.address().port; r(); }); }));
after(() => srv.close());
const post = (u, b, cookie) => fetch(base + u, { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(b) });
const get = (u, cookie) => fetch(base + u, { headers: cookie ? { cookie } : {} });
const FLAGS = { dotfile: 'flag{dotfiles_are_not_secret}', logs: 'flag{grep_is_your_friend}', deep: 'flag{find_can_search_everything}', b64: 'flag{base64_is_not_encryption}', ps: 'flag{processes_tell_stories}', env: 'flag{env_vars_leak_secrets}' };
const submit = (id, flag) => post('/api/ctf/submit', { id, flag }, ck);

test('submitting a flag needs a login', async () => {
  assert.equal((await post('/api/ctf/submit', { id: 'dotfile', flag: FLAGS.dotfile })).status, 401);
  ck = (await post('/api/auth/register', { username: 'hunter', password: 'password123' })).headers.get('set-cookie').split(';')[0];
});
test('rejects bad requests', async () => {
  assert.equal((await submit('nope', 'x')).status, 400);
  assert.equal((await submit('dotfile', 5)).status, 400);
  assert.equal((await submit('dotfile', 'x'.repeat(300))).status, 400);
});
test('a wrong flag scores nothing, and flags are not interchangeable', async () => {
  const a = await (await submit('dotfile', 'flag{guess}')).json();
  assert.deepEqual([a.correct, a.points, a.xp], [false, 0, 0]);
  assert.equal((await (await submit('dotfile', FLAGS.logs)).json()).correct, false);
});
test('the right flag scores once, whitespace is tolerated', async () => {
  const a = await (await submit('dotfile', '  ' + FLAGS.dotfile + ' \n')).json();
  assert.deepEqual([a.correct, a.points, a.xp], [true, 10, 10]);
  const again = await (await submit('dotfile', FLAGS.dotfile)).json();
  assert.equal(again.correct, true);
  assert.equal(again.xp, 10);
  assert.deepEqual(again.solved, ['dotfile']);
});
test('challenge XP and CTF points add up everywhere', async () => {
  const p = await (await post('/api/progress', { done: { perm: { t: 30, h: 0 } } }, ck)).json();
  assert.equal(p.xp, 60);
  const pr = await (await get('/api/progress', ck)).json();
  assert.equal(pr.xp, 60);
  assert.deepEqual(pr.ctf, ['dotfile']);
  assert.equal((await (await submit('env', FLAGS.env)).json()).xp, 100);
  const lb = await (await get('/api/leaderboard')).json();
  assert.equal(lb[0].xp, 100);
  const { code } = await (await post('/api/rooms', { name: 'Flag club' }, ck)).json();
  const room = await (await get('/api/rooms/' + code, ck)).json();
  assert.equal(room.members[0].xp, 100);
});
test('every flag is accepted for its own challenge', async () => {
  for (const [id, f] of Object.entries(FLAGS)) assert.equal((await (await submit(id, f)).json()).correct, true);
  const pr = await (await get('/api/progress', ck)).json();
  assert.equal(pr.xp, 50 + 150);
});
