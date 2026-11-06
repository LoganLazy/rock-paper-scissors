/**
 * 服务端集成测试：用 node:test + 子进程跑真实 server/index.js，
 * 通过 ws 客户端验证第 1–7 项服务端修复。
 * 运行：npm run test:server（不要用 vitest 跑本文件）
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import WebSocket from 'ws';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.RPS_TEST_PORT || 18787);
const WS_URL = `ws://127.0.0.1:${PORT}/ws`;
const HEALTH_URL = `http://127.0.0.1:${PORT}/health`;

let serverProcess = null;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForHealth(timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const res = await fetch(HEALTH_URL);
      if (res.ok) return;
    } catch {
      // 服务端还没起来，继续等
    }
    if (Date.now() > deadline) throw new Error('服务端在 10 秒内没有就绪');
    await sleep(100);
  }
}

before(async () => {
  serverProcess = spawn(process.execPath, ['server/index.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  serverProcess.stderr.on('data', (chunk) => {
    process.stderr.write(`[server stderr] ${chunk}`);
  });
  await waitForHealth();
});

after(async () => {
  if (!serverProcess) return;
  const exited = new Promise((resolve) => serverProcess.once('exit', resolve));
  serverProcess.kill('SIGTERM');
  const timeout = sleep(5000).then(() => serverProcess.kill('SIGKILL'));
  await Promise.race([exited, timeout]);
});

// ---- 客户端工具 ----

const clients = new Set();

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const client = { ws, msgs: [] };
    ws.on('message', (data) => {
      try {
        client.msgs.push(JSON.parse(data.toString()));
      } catch {
        // 忽略无法解析的消息
      }
    });
    ws.on('open', () => {
      clients.add(client);
      resolve(client);
    });
    ws.on('error', reject);
  });
}

function send(client, message) {
  client.ws.send(JSON.stringify(message));
}

function closeClient(client) {
  clients.delete(client);
  try {
    client.ws.close();
  } catch {
    // 已关闭
  }
}

async function waitFor(client, predicate, timeoutMs = 5000, label = '消息') {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const found = [...client.msgs].reverse().find(predicate);
    if (found) return found;
    if (Date.now() > deadline) {
      throw new Error(`等待超时：${label}；已收到：${JSON.stringify(client.msgs.slice(-3))}`);
    }
    await sleep(50);
  }
}

const isError = (text) => (m) => m.type === 'error' && m.message === text;
const isErrorContaining = (text) => (m) => m.type === 'error' && m.message.includes(text);
const latestState = (client) => [...client.msgs].reverse().find((m) => m.type === 'state');

async function createRoom(client, name = '玩家A', bestOf = 3) {
  send(client, { type: 'create', name, bestOf });
  const joined = await waitFor(client, (m) => m.type === 'joined', 5000, 'joined');
  return { code: joined.room.code, playerId: joined.playerId, rejoinToken: joined.rejoinToken };
}

async function joinRoom(client, code, name = '玩家B') {
  send(client, { type: 'join', name, code });
  const joined = await waitFor(client, (m) => m.type === 'joined', 5000, 'joined');
  return { code: joined.room.code, playerId: joined.playerId, rejoinToken: joined.rejoinToken };
}

/** 打满一个系列：A 出石头、B 出剪刀，A 以 2-0 获胜，返回结束时的 state */
async function finishSeries(a, b) {
  for (let round = 0; round < 2; round++) {
    send(a, { type: 'choose', choice: 'rock' });
    await sleep(700); // 避开 500ms 的 choose 限流窗口
    send(b, { type: 'choose', choice: 'scissors' });
    await sleep(700);
  }
  const state = await waitFor(
    a,
    (m) => m.type === 'state' && m.room.status === 'finished',
    5000,
    'finished 状态',
  );
  return state.room;
}

// ---- 测试用例 ----

test('陌生连接用他人 playerId 重连被拒绝，带正确 token 重连成功', async () => {
  const a = await connect();
  const { code, playerId: idA, rejoinToken: tokenA } = await createRoom(a, '玩家A');
  const b = await connect();
  await joinRoom(b, code, '玩家B');

  // 攻击者：从房间公开状态里看到 A 的 playerId，但没有 token
  const attacker = await connect();
  send(attacker, { type: 'rejoin', playerId: idA, code, rejoinToken: '00'.repeat(32) });
  const rejected = await waitFor(attacker, isError('重连验证失败'), 5000, '重连验证失败');
  assert.equal(rejected.message, '重连验证失败');

  // 不带 token 也不行
  send(attacker, { type: 'rejoin', playerId: idA, code });
  await waitFor(attacker, (m) => m.type === 'error', 5000, '缺 token 的重连报错');

  // 本人断线后用正确 token 重连成功，拿回同一身份
  closeClient(a);
  await sleep(300);
  const a2 = await connect();
  send(a2, { type: 'rejoin', playerId: idA, code, rejoinToken: tokenA });
  const rejoined = await waitFor(a2, (m) => m.type === 'joined', 5000, '重连成功');
  assert.equal(rejoined.playerId, idA);

  closeClient(a2);
  closeClient(b);
  closeClient(attacker);
});

test('同一局内改拳被拒绝，原出拳保留', async () => {
  const a = await connect();
  const { code, playerId: idA } = await createRoom(a, '玩家A');
  const b = await connect();
  await joinRoom(b, code, '玩家B');

  send(a, { type: 'choose', choice: 'rock' });
  await sleep(700); // 避开限流窗口，确保第二次出拳走到“已出拳”校验
  send(a, { type: 'choose', choice: 'paper' });
  const rejected = await waitFor(a, isError('已出拳，不可更改'), 5000, '已出拳报错');
  assert.equal(rejected.message, '已出拳，不可更改');

  send(b, { type: 'choose', choice: 'scissors' });
  const state = await waitFor(
    a,
    (m) => m.type === 'state' && m.room.rounds.length === 1,
    5000,
    '第一局结果',
  );
  assert.equal(state.room.rounds[0].choices[idA], 'rock');
  assert.equal(state.room.rounds[0].winnerId, idA);

  closeClient(a);
  closeClient(b);
});

test('惩罚校验：赢家不能设，输家只能设一次合法惩罚', async () => {
  const a = await connect();
  const { playerId: idA } = await createRoom(a, '玩家A');
  const b = await connect();
  await joinRoom(b, (await waitFor(a, (m) => m.type === 'joined')).room.code, '玩家B');
  const room = await finishSeries(a, b);
  assert.equal(room.winnerId, idA);
  assert.equal(room.loserId, room.players.find((p) => p.id !== idA).id);

  // 赢家设置惩罚被拒绝
  send(a, { type: 'punishment', punishment: { level: 'L1', text: '赢家乱设' } });
  await waitFor(a, isError('只有输家可以设置惩罚'), 5000, '赢家设惩罚报错');

  // 输家设置超长惩罚被拒绝
  send(b, { type: 'punishment', punishment: { level: 'L1', text: '超'.repeat(50) } });
  await waitFor(b, isErrorContaining('长度'), 5000, '超长惩罚报错');
  await sleep(650);

  // 输家设置非对象惩罚被拒绝
  send(b, { type: 'punishment', punishment: '一段纯文本' });
  await waitFor(b, isError('惩罚内容无效'), 5000, '非法类型惩罚报错');
  await sleep(650);

  // 输家设置非法等级被拒绝
  send(b, { type: 'punishment', punishment: { level: 'L9', text: '等级不对' } });
  await waitFor(b, isError('惩罚等级无效'), 5000, '非法等级惩罚报错');
  await sleep(650);

  // 输家设置合法惩罚成功
  send(b, { type: 'punishment', punishment: { level: 'L2', text: '说一句好听的话' } });
  const okState = await waitFor(
    b,
    (m) => m.type === 'state' && m.room.punishment?.text === '说一句好听的话',
    5000,
    '合法惩罚生效',
  );
  assert.equal(okState.room.punishment.level, 'L2');
  await sleep(650);

  // 每局只能设置一次
  send(b, { type: 'punishment', punishment: { level: 'L1', text: '再设一次' } });
  await waitFor(b, isError('惩罚已设置'), 5000, '重复设惩罚报错');

  closeClient(a);
  closeClient(b);
});

test('对手离线后单人 rematch 不重置系列，双人 rematch 成功重置', async () => {
  const a = await connect();
  const { code, playerId: idA } = await createRoom(a, '玩家A');
  const b = await connect();
  const { playerId: idB, rejoinToken: tokenB } = await joinRoom(b, code, '玩家B');
  const room = await finishSeries(a, b);
  assert.equal(room.status, 'finished');
  assert.equal(room.rounds.length, 2);

  // 对手断线，单人 rematch 只记录意愿，不重置
  closeClient(b);
  await sleep(400);
  send(a, { type: 'rematch', bestOf: 3 });
  await sleep(500);
  const afterSolo = latestState(a);
  assert.equal(afterSolo.room.status, 'finished');
  assert.equal(afterSolo.room.rounds.length, 2);

  // 对手凭 token 重连回来，双方确认后才重置
  const b2 = await connect();
  send(b2, { type: 'rejoin', playerId: idB, code, rejoinToken: tokenB });
  await waitFor(b2, (m) => m.type === 'joined', 5000, '对手重连');
  send(b2, { type: 'rematch', bestOf: 3 });
  const reset = await waitFor(
    a,
    (m) => m.type === 'state' && m.room.status === 'playing' && m.room.rounds.length === 0,
    5000,
    '双人重赛重置',
  );
  assert.equal(reset.room.status, 'playing');
  assert.equal(reset.room.rounds.length, 0);
  assert.equal(reset.room.scores[idA], 0);

  closeClient(a);
  closeClient(b2);
});

test('同一连接重复 create/join 被拒绝', async () => {
  const a = await connect();
  const { code } = await createRoom(a, '玩家A');

  send(a, { type: 'create', name: '玩家A', bestOf: 3 });
  await waitFor(a, isError('已在房间中，请先离开'), 5000, '重复建房报错');

  send(a, { type: 'join', name: '玩家A', code });
  await waitFor(a, isError('已在房间中，请先离开'), 5000, '在房中加入报错');

  closeClient(a);
});

test('join 不存在与已满的房间返回同一错误', async () => {
  const x = await connect();
  send(x, { type: 'join', name: '路人', code: 'ZZZZZZ' });
  const notFound = await waitFor(x, (m) => m.type === 'error', 5000, '不存在房间报错');

  const a = await connect();
  const { code } = await createRoom(a, '玩家A');
  const b = await connect();
  await joinRoom(b, code, '玩家B');

  const c = await connect();
  send(c, { type: 'join', name: '路人', code });
  const full = await waitFor(c, (m) => m.type === 'error', 5000, '房间已满报错');

  assert.equal(notFound.message, '无法加入该房间');
  assert.equal(full.message, '无法加入该房间');

  closeClient(x);
  closeClient(a);
  closeClient(b);
  closeClient(c);
});

test('30 次快速 create 被限流，不得全部通过', async () => {
  const spammer = await connect();
  for (let i = 0; i < 30; i++) {
    send(spammer, { type: 'create', name: `spam${i}`, bestOf: 3 });
  }
  await sleep(1500);
  const joinedCount = spammer.msgs.filter((m) => m.type === 'joined').length;
  const rateLimited = spammer.msgs.filter(
    (m) => m.type === 'error' && m.message === '操作过快，请稍后再试',
  ).length;
  assert.ok(joinedCount < 30, `30 次建房全部通过，限流未生效`);
  assert.ok(joinedCount <= 5, `建房通过 ${joinedCount} 次，超过单连接 60 秒 5 次上限`);
  assert.ok(rateLimited >= 1, '没有出现限流报错');

  closeClient(spammer);
});

test('30 个不同连接快速建房也被限流（单连接限流拦不住多连接刷房）', async () => {
  // 每个连接只发一次 create：单连接限流对此无效，必须靠单 IP 限流拦住
  const flooders = [];
  for (let i = 0; i < 30; i++) {
    const c = await connect();
    send(c, { type: 'create', name: `flood${i}`, bestOf: 3 });
    flooders.push(c);
  }
  await sleep(1500);
  const joinedCount = flooders.reduce(
    (n, c) => n + c.msgs.filter((m) => m.type === 'joined').length,
    0,
  );
  const rateLimited = flooders.reduce(
    (n, c) => n + c.msgs.filter(
      (m) => m.type === 'error' && m.message === '操作过快，请稍后再试',
    ).length,
    0,
  );
  assert.ok(joinedCount < 30, `30 个连接建房全部通过，IP 限流未生效`);
  assert.ok(rateLimited >= 1, '没有出现限流报错');
  flooders.forEach(closeClient);
});
