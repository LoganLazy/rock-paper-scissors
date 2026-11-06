import { createServer } from 'node:http';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { WebSocketServer } from 'ws';

// 注意：不做 Origin 校验，保留局域网直连能力（同一 WiFi 下用服务器 IP 直接访问也能玩）。
// 房间与玩家身份不依赖 Origin，敏感操作（重连）改由服务端签发的 rejoinToken 校验。

const port = Number(process.env.PORT) || 8787;
const server = createServer((request, response) => {
  if (request.url === '/health') {
    const memUsage = process.memoryUsage();
    const healthData = {
      status: 'ok',
      uptime: process.uptime(),
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      },
      rooms: rooms.size,
      timestamp: new Date().toISOString(),
    };
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(healthData));
    return;
  }
  response.writeHead(404);
  response.end();
});
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 64 * 1024 });
const rooms = new Map();
const rateLimitMap = new Map(); // 速率限制映射

// 配置常量
const CONFIG = {
  ROOM_CODE_LENGTH: 6,
  NAME_MAX_LENGTH: 10,
  CUSTOM_PUNISHMENT_MAX_LENGTH: 40,
  CUSTOM_PUNISHMENT_PER_PLAYER: 2,
  INACTIVE_TIMEOUT: 60 * 60 * 1000, // 1 小时
  EMPTY_ROOM_TIMEOUT: 6 * 60 * 60 * 1000, // 6 小时
  CLEANUP_INTERVAL: 10 * 60 * 1000, // 10 分钟
  PLAYER_OFFLINE_GRACE: 5 * 60 * 1000, // 5 分钟
  RATE_LIMIT_WINDOW: 500, // 速率限制窗口（毫秒）
  JOIN_CREATE_LIMIT: 5, // 单连接 60 秒内最多 create/join 次数
  JOIN_CREATE_WINDOW: 60 * 1000, // create/join 限流窗口（毫秒）
  CREATE_PER_IP_LIMIT: 20, // 单 IP 60 秒内最多建房次数（防多连接刷房）
  CREATE_PER_IP_WINDOW: 60 * 1000, // 建房 IP 限流窗口（毫秒）
  MAX_ROOMS: 500, // 房间总数上限（防内存耗尽的最后防线）
};

const beats = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper',
};

/**
 * 生成唯一房间码（密码学随机，避免被猜出）
 */
function createRoomCode() {
  let code;
  let attempts = 0;
  do {
    code = randomBytes(3).toString('hex').toUpperCase();
    attempts++;
  } while (rooms.has(code) && attempts < 100);

  if (attempts >= 100) {
    throw new Error('Failed to generate unique room code');
  }
  return code;
}

/**
 * 生成重连凭证（只发给玩家本人，绝不能出现在房间广播里）
 */
function createRejoinToken() {
  return randomBytes(32).toString('hex');
}

/**
 * 清理和验证字符串
 */
function sanitizeString(str, maxLength) {
  if (!str || typeof str !== 'string') return '';
  return String(str).trim().slice(0, maxLength);
}

/**
 * 验证房间码格式
 */
function validateRoomCode(code) {
  const pattern = new RegExp(`^[A-Z0-9]{${CONFIG.ROOM_CODE_LENGTH}}$`);
  return pattern.test(String(code).trim().toUpperCase());
}

/**
 * 安全发送消息
 */
function send(player, message) {
  if (player?.socket?.readyState === 1) {
    try {
      player.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }
}

/**
 * 广播消息到房间所有玩家
 */
function broadcast(room, message) {
  room.players.forEach((player) => {
    if (!player.offline) {
      send(player, message);
    }
  });
}

/**
 * 生成房间的公开信息
 */
function publicRoom(room) {
  return {
    code: room.code,
    bestOf: room.bestOf,
    status: room.status,
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      offline: player.offline || false
    })),
    scores: room.scores,
    rounds: room.rounds,
    winnerId: room.winnerId,
    loserId: room.loserId,
    punishment: room.punishment,
    rematch: room.rematch,
    customPunishments: room.customPunishments,
  };
}

/**
 * 统计玩家的自定义惩罚数量
 */
function customCountForPlayer(room, playerId) {
  return room.customPunishments.filter((item) => item.playerId === playerId).length;
}

/**
 * 更新房间活跃时间
 */
function touchRoom(room) {
  room.lastActivityTime = Date.now();
}

/**
 * 速率限制检查
 * @param {string} playerId
 * @param {string} action
 * @returns {boolean} true 表示允许，false 表示限流
 */
function checkRateLimit(playerId, action) {
  const key = `${playerId}:${action}`;
  const now = Date.now();
  const lastTime = rateLimitMap.get(key);

  if (lastTime && now - lastTime < CONFIG.RATE_LIMIT_WINDOW) {
    return false; // 操作过快
  }

  rateLimitMap.set(key, now);

  // 定期清理旧的速率限制记录
  if (rateLimitMap.size > 10000) {
    const threshold = now - CONFIG.RATE_LIMIT_WINDOW * 10;
    for (const [k, time] of rateLimitMap.entries()) {
      if (time < threshold) {
        rateLimitMap.delete(k);
      }
    }
  }

  return true;
}

/**
 * 常量时间比较两个重连凭证（防时序攻击；长度不等直接返回 false）
 */
function rejoinTokenMatches(actual, provided) {
  if (typeof actual !== 'string' || typeof provided !== 'string') return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const createAttemptsByIp = new Map(); // 单 IP 建房限流：ip -> [时间戳]

/**
 * 单 IP 建房限流（滑动窗口）：60 秒内超过上限返回 false。
 * 只拦 create——join 不分配房间资源，不计入。
 */
function checkCreatePerIpLimit(ip) {
  const now = Date.now();
  const windowStart = now - CONFIG.CREATE_PER_IP_WINDOW;
  const attempts = (createAttemptsByIp.get(ip) || []).filter((t) => t > windowStart);
  attempts.push(now);
  createAttemptsByIp.set(ip, attempts);
  // 顺手清理过期 IP 记录，避免 Map 无限增长
  if (createAttemptsByIp.size > 10000) {
    for (const [key, times] of createAttemptsByIp.entries()) {
      if (times.length === 0 || times[times.length - 1] <= windowStart) {
        createAttemptsByIp.delete(key);
      }
    }
  }
  return attempts.length <= CONFIG.CREATE_PER_IP_LIMIT;
}

/**
 * 取客户端 IP：直连用 socket 远端地址；经 Nginx 等反向代理时，
 * 远端地址是代理本机（回环地址），此时取 X-Forwarded-For 的第一项。
 * 注意：只有回环来源才信任该头，公网直连的请求头不可信。
 */
function getClientIp(socket, request) {
  const remote = request?.socket?.remoteAddress || '';
  const loopback = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
  if (loopback) {
    const forwarded = request?.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
      return forwarded.split(',')[0].trim();
    }
  }
  return remote || 'unknown';
}

/**
 * 重置游戏系列
 */
function resetSeries(room, bestOf = room.bestOf) {
  room.bestOf = bestOf;
  room.status = room.players.filter(p => !p.offline).length === 2 ? 'playing' : 'waiting';
  room.scores = {};
  room.players.forEach((player) => {
    room.scores[player.id] = 0;
  });
  room.choices = {};
  room.rounds = [];
  room.winnerId = null;
  room.loserId = null;
  room.punishment = null;
  room.rematch = null;
  touchRoom(room);
}

/**
 * 判断单局结果
 */
function judgeRound(room) {
  const activePlayers = room.players.filter(p => !p.offline);
  if (activePlayers.length < 2) return;

  const [a, b] = activePlayers;
  const choiceA = room.choices[a.id];
  const choiceB = room.choices[b.id];
  let winnerId = null;

  if (choiceA !== choiceB) {
    winnerId = beats[choiceA] === choiceB ? a.id : b.id;
    room.scores[winnerId] += 1;
  }

  const round = {
    choices: { [a.id]: choiceA, [b.id]: choiceB },
    winnerId,
  };
  room.rounds.push(round);
  room.choices = {};

  const target = Math.ceil(room.bestOf / 2);
  const seriesWinner = activePlayers.find((player) => room.scores[player.id] >= target);
  if (seriesWinner) {
    const loser = activePlayers.find((player) => player.id !== seriesWinner.id);
    room.status = 'finished';
    room.winnerId = seriesWinner.id;
    room.loserId = loser.id;
  }

  touchRoom(room);
  broadcast(room, { type: 'state', room: publicRoom(room) });
}

/**
 * 房间清理任务
 */
function startRoomCleanup() {
  return setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [code, room] of rooms.entries()) {
      const inactive = now - room.lastActivityTime > CONFIG.INACTIVE_TIMEOUT;
      const emptyTooLong = room.players.filter(p => !p.offline).length === 0 &&
                           now - room.createdTime > CONFIG.EMPTY_ROOM_TIMEOUT;

      if (inactive || emptyTooLong) {
        broadcast(room, {
          type: 'roomClosed',
          reason: inactive ? '房间长时间无活动已关闭' : '房间已过期'
        });
        rooms.delete(code);
        cleanedCount++;
        console.log(`[${new Date().toISOString()}] Room ${code} cleaned up (${inactive ? 'inactive' : 'empty'})`);
      }
    }

    if (cleanedCount > 0) {
      console.log(`[${new Date().toISOString()}] Cleaned ${cleanedCount} rooms, ${rooms.size} remaining`);
    }
  }, CONFIG.CLEANUP_INTERVAL);
}

// 启动房间清理
const cleanupTimer = startRoomCleanup();

/**
 * 内存监控
 */
function startMemoryMonitoring() {
  return setInterval(() => {
    const memUsage = process.memoryUsage();
    const mbUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
    const mbTotal = Math.round(memUsage.heapTotal / 1024 / 1024);

    console.log(`[${new Date().toISOString()}] Memory: ${mbUsed}MB / ${mbTotal}MB, Rooms: ${rooms.size}, Rate Limits: ${rateLimitMap.size}`);

    if (mbUsed > 500) {
      console.warn(`[${new Date().toISOString()}] High memory usage detected: ${mbUsed}MB`);
    }
  }, 60000); // 每分钟
}

// 启动内存监控
const memoryTimer = startMemoryMonitoring();

/**
 * WebSocket 连接处理
 */
wss.on('connection', (socket, request) => {
  let currentRoom = null;
  let currentPlayer = null;
  // 本连接的客户端 IP（用于建房限流）
  const clientIp = getClientIp(socket, request);

  // 单连接 create/join 限流：60 秒窗口内最多 5 次
  let joinCreateCount = 0;
  let joinCreateWindowStart = Date.now();
  function checkJoinCreateLimit() {
    const now = Date.now();
    if (now - joinCreateWindowStart >= CONFIG.JOIN_CREATE_WINDOW) {
      joinCreateWindowStart = now;
      joinCreateCount = 0;
    }
    joinCreateCount += 1;
    return joinCreateCount <= CONFIG.JOIN_CREATE_LIMIT;
  }

  socket.on('message', (raw) => {
    let message;
    try {
      message = JSON.parse(raw);
    } catch (error) {
      send(currentPlayer, { type: 'error', message: '消息格式错误' });
      return;
    }

    try {
      // Ping/Pong 心跳
      if (message.type === 'ping') {
        send(currentPlayer, { type: 'pong' });
        if (currentRoom) touchRoom(currentRoom);
        return;
      }

      // 创建房间
      if (message.type === 'create') {
        if (!checkJoinCreateLimit()) {
          socket.send(JSON.stringify({ type: 'error', message: '操作过快，请稍后再试' }));
          return;
        }
        if (currentRoom) {
          socket.send(JSON.stringify({ type: 'error', message: '已在房间中，请先离开' }));
          return;
        }
        // 房间总数上限（最后防线）与单 IP 建房限流：单连接限流拦不住多连接刷房
        if (rooms.size >= CONFIG.MAX_ROOMS) {
          socket.send(JSON.stringify({ type: 'error', message: '房间数量已达上限，请稍后再试' }));
          return;
        }
        if (!checkCreatePerIpLimit(clientIp)) {
          socket.send(JSON.stringify({ type: 'error', message: '操作过快，请稍后再试' }));
          return;
        }
        const name = sanitizeString(message.name, CONFIG.NAME_MAX_LENGTH) || '玩家1';
        const bestOf = [3, 5, 7].includes(Number(message.bestOf)) ? Number(message.bestOf) : 3;

        const code = createRoomCode();
        const player = { id: randomUUID(), name, socket, offline: false, rejoinToken: createRejoinToken() };
        const now = Date.now();
        const room = {
          code,
          bestOf,
          status: 'waiting',
          players: [player],
          scores: { [player.id]: 0 },
          choices: {},
          rounds: [],
          winnerId: null,
          loserId: null,
          punishment: null,
          rematch: null,
          customPunishments: [],
          createdTime: now,
          lastActivityTime: now,
        };
        rooms.set(code, room);
        currentRoom = room;
        currentPlayer = player;
        // rejoinToken 只发给玩家本人，绝不能出现在 publicRoom 或任何广播里
        send(player, { type: 'joined', playerId: player.id, rejoinToken: player.rejoinToken, room: publicRoom(room) });
        console.log(`[${new Date().toISOString()}] Room ${code} created by ${name}`);
        return;
      }

      // 加入房间
      if (message.type === 'join') {
        if (!checkJoinCreateLimit()) {
          socket.send(JSON.stringify({ type: 'error', message: '操作过快，请稍后再试' }));
          return;
        }
        if (currentRoom) {
          socket.send(JSON.stringify({ type: 'error', message: '已在房间中，请先离开' }));
          return;
        }
        const code = String(message.code || '').trim().toUpperCase();

        if (!validateRoomCode(code)) {
          socket.send(JSON.stringify({ type: 'error', message: '房间码格式错误' }));
          return;
        }

        const room = rooms.get(code);
        const activePlayers = room ? room.players.filter(p => !p.offline) : [];
        // 不存在与已满统一报错，避免用报错区分来枚举房间
        if (!room || activePlayers.length >= 2) {
          socket.send(JSON.stringify({ type: 'error', message: '无法加入该房间' }));
          return;
        }

        const name = sanitizeString(message.name, CONFIG.NAME_MAX_LENGTH) || '玩家2';
        const player = { id: randomUUID(), name, socket, offline: false, rejoinToken: createRejoinToken() };
        room.players.push(player);
        currentRoom = room;
        currentPlayer = player;
        resetSeries(room, room.bestOf);
        // rejoinToken 只发给玩家本人，绝不能出现在 publicRoom 或任何广播里
        send(player, { type: 'joined', playerId: player.id, rejoinToken: player.rejoinToken, room: publicRoom(room) });
        broadcast(room, { type: 'state', room: publicRoom(room) });
        console.log(`[${new Date().toISOString()}] ${name} joined room ${code}`);
        return;
      }

      // 重新加入房间（断线重连）
      if (message.type === 'rejoin') {
        if (currentRoom) {
          socket.send(JSON.stringify({ type: 'error', message: '已在房间中，请先离开' }));
          return;
        }
        const code = String(message.code || '').trim().toUpperCase();
        const playerId = message.playerId;
        const rejoinToken = message.rejoinToken;

        if (!validateRoomCode(code) || !playerId || !rejoinToken) {
          socket.send(JSON.stringify({ type: 'error', message: '重连信息错误' }));
          return;
        }

        const room = rooms.get(code);
        if (!room) {
          socket.send(JSON.stringify({ type: 'error', message: '房间不存在' }));
          return;
        }

        const player = room.players.find(p => p.id === playerId);
        // 仅凭 playerId 不能重连，必须同时出示服务端签发的重连凭证
        if (!player || !rejoinTokenMatches(player.rejoinToken, rejoinToken)) {
          socket.send(JSON.stringify({ type: 'error', message: '重连验证失败' }));
          return;
        }

        // 更新玩家 socket 和状态
        player.socket = socket;
        player.offline = false;
        currentRoom = room;
        currentPlayer = player;

        send(player, { type: 'joined', playerId: player.id, rejoinToken: player.rejoinToken, room: publicRoom(room) });
        broadcast(room, { type: 'state', room: publicRoom(room) });
        console.log(`[${new Date().toISOString()}] ${player.name} rejoined room ${code}`);
        return;
      }

      // 以下操作需要已加入房间
      if (!currentRoom || !currentPlayer) {
        socket.send(JSON.stringify({ type: 'error', message: '请先创建或加入房间' }));
        return;
      }

      // 出拳
      if (message.type === 'choose') {
        if (currentRoom.status !== 'playing') return;
        if (!['rock', 'paper', 'scissors'].includes(message.choice)) return;

        // 同一局内已出拳不可更改
        if (Object.prototype.hasOwnProperty.call(currentRoom.choices, currentPlayer.id)) {
          send(currentPlayer, { type: 'error', message: '已出拳，不可更改' });
          return;
        }

        // 速率限制检查
        if (!checkRateLimit(currentPlayer.id, 'choose')) {
          send(currentPlayer, { type: 'error', message: '操作过快，请稍后再试' });
          return;
        }

        currentRoom.choices[currentPlayer.id] = message.choice;
        broadcast(currentRoom, {
          type: 'choiceStatus',
          readyIds: Object.keys(currentRoom.choices),
        });

        if (Object.keys(currentRoom.choices).length === 2) {
          judgeRound(currentRoom);
        }
        touchRoom(currentRoom);
        return;
      }

      // 添加自定义惩罚
      if (message.type === 'customPunishment') {
        if (!checkRateLimit(currentPlayer.id, 'customPunishment')) {
          send(currentPlayer, { type: 'error', message: '操作过快，请稍后再试' });
          return;
        }
        const text = sanitizeString(message.text, CONFIG.CUSTOM_PUNISHMENT_MAX_LENGTH);
        const level = ['L1', 'L2', 'L3'].includes(message.level) ? message.level : 'L1';

        if (!text) return;

        if (customCountForPlayer(currentRoom, currentPlayer.id) >= CONFIG.CUSTOM_PUNISHMENT_PER_PLAYER) {
          send(currentPlayer, { type: 'error', message: `每人最多添加 ${CONFIG.CUSTOM_PUNISHMENT_PER_PLAYER} 条自定义惩罚` });
          return;
        }

        currentRoom.customPunishments.push({
          id: randomUUID(),
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          level,
          text
        });
        touchRoom(currentRoom);
        broadcast(currentRoom, { type: 'state', room: publicRoom(currentRoom) });
        return;
      }

      // 删除自定义惩罚
      if (message.type === 'removeCustomPunishment') {
        if (!checkRateLimit(currentPlayer.id, 'removeCustomPunishment')) {
          send(currentPlayer, { type: 'error', message: '操作过快，请稍后再试' });
          return;
        }
        currentRoom.customPunishments = currentRoom.customPunishments.filter(
          (item) => item.id !== message.id || item.playerId !== currentPlayer.id
        );
        touchRoom(currentRoom);
        broadcast(currentRoom, { type: 'state', room: publicRoom(currentRoom) });
        return;
      }

      // 重赛
      if (message.type === 'rematch') {
        if (currentRoom.status !== 'finished') return;

        if (!checkRateLimit(currentPlayer.id, 'rematch')) {
          send(currentPlayer, { type: 'error', message: '操作过快，请稍后再试' });
          return;
        }

        const bestOf = [3, 5, 7].includes(Number(message.bestOf)) ? Number(message.bestOf) : currentRoom.bestOf;

        if (!currentRoom.rematch || currentRoom.rematch.bestOf !== bestOf) {
          currentRoom.rematch = { bestOf, readyIds: [] };
        }

        if (!currentRoom.rematch.readyIds.includes(currentPlayer.id)) {
          currentRoom.rematch.readyIds.push(currentPlayer.id);
        }

        const activePlayers = currentRoom.players.filter(p => !p.offline);
        // 只有双方都在线且都确认，才重置系列；单人确认只记录意愿，不重置
        const allActiveReady = activePlayers.length >= 2 &&
          activePlayers.every((player) => currentRoom.rematch.readyIds.includes(player.id));
        if (allActiveReady) {
          resetSeries(currentRoom, bestOf);
        }

        touchRoom(currentRoom);
        broadcast(currentRoom, { type: 'state', room: publicRoom(currentRoom) });
        return;
      }

      // 设置惩罚结果
      if (message.type === 'punishment') {
        if (currentRoom.status !== 'finished') return;

        if (!checkRateLimit(currentPlayer.id, 'punishment')) {
          send(currentPlayer, { type: 'error', message: '操作过快，请稍后再试' });
          return;
        }

        // 只有输家可以设置，且每局只能设置一次
        if (currentRoom.loserId !== currentPlayer.id) {
          send(currentPlayer, { type: 'error', message: '只有输家可以设置惩罚' });
          return;
        }
        if (currentRoom.punishment) {
          send(currentPlayer, { type: 'error', message: '惩罚已设置' });
          return;
        }

        const punishment = message.punishment;
        if (!punishment || typeof punishment !== 'object' || Array.isArray(punishment)) {
          send(currentPlayer, { type: 'error', message: '惩罚内容无效' });
          return;
        }
        if (!['L1', 'L2', 'L3'].includes(punishment.level)) {
          send(currentPlayer, { type: 'error', message: '惩罚等级无效' });
          return;
        }
        const text = typeof punishment.text === 'string' ? punishment.text.trim() : '';
        if (!text || text.length > CONFIG.CUSTOM_PUNISHMENT_MAX_LENGTH) {
          send(currentPlayer, { type: 'error', message: '惩罚内容长度需为 1-40 个字符' });
          return;
        }

        currentRoom.punishment = { level: punishment.level, text };
        touchRoom(currentRoom);
        broadcast(currentRoom, { type: 'state', room: publicRoom(currentRoom) });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      send(currentPlayer, { type: 'error', message: '操作失败，请重试' });
    }
  });

  socket.on('close', () => {
    if (!currentRoom || !currentPlayer) return;

    // 标记玩家为离线，而不是立即删除
    currentPlayer.offline = true;
    console.log(`[${new Date().toISOString()}] ${currentPlayer.name} disconnected from room ${currentRoom.code}`);

    // 设置定时器，如果玩家在grace period内没有重连，则清理
    setTimeout(() => {
      if (currentPlayer.offline && currentRoom) {
        currentRoom.players = currentRoom.players.filter((player) => player.id !== currentPlayer.id);

        if (currentRoom.players.length === 0) {
          rooms.delete(currentRoom.code);
          console.log(`[${new Date().toISOString()}] Room ${currentRoom.code} deleted (empty)`);
          return;
        }

        currentRoom.status = 'waiting';
        currentRoom.choices = {};
        touchRoom(currentRoom);
        broadcast(currentRoom, { type: 'state', room: publicRoom(currentRoom) });
      }
    }, CONFIG.PLAYER_OFFLINE_GRACE);
  });
});

// 全局错误处理：未捕获异常说明进程状态已不可信，记录后退出，由 PM2 重启
process.on('uncaughtException', (error) => {
  console.error('[uncaughtException]', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[unhandledRejection]', reason, promise);
});

/**
 * 优雅退出：停掉定时器、断开全部客户端、关闭 HTTP/WS 服务
 */
function shutdown(signal) {
  console.log(`[${new Date().toISOString()}] Received ${signal}, shutting down...`);
  clearInterval(cleanupTimer);
  clearInterval(memoryTimer);
  wss.clients.forEach((client) => {
    try { client.terminate(); } catch { /* 已关闭 */ }
  });
  wss.close(() => {
    server.close(() => {
      process.exit(0);
    });
  });
  // 兜底：5 秒后强制退出，避免被挂起的连接卡住
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(port, () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${port}`);
  console.log(`[${new Date().toISOString()}] Room cleanup interval: ${CONFIG.CLEANUP_INTERVAL / 1000}s`);
});
