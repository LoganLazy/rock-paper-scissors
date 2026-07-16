# Rock-Paper-Scissors WebSocket API 文档

## 概述

Rock-Paper-Scissors 使用 WebSocket 进行实时通信。服务器端监听 `/ws` 路径。

## 连接信息

- **协议**: WebSocket (ws:// 或 wss://)
- **端口**: 8787 (默认)
- **路径**: `/ws`
- **健康检查**: `/health` (HTTP)

## 消息格式

所有消息使用 JSON 格式，包含 `type` 字段标识消息类型。

```json
{
  "type": "消息类型",
  "...": "其他字段"
}
```

---

## 客户端 → 服务器

### 1. 创建房间 (create)

```json
{
  "type": "create",
  "name": "玩家昵称",
  "bestOf": 3  // 3, 5, 或 7
}
```

**响应**: `joined` 消息

### 2. 加入房间 (join)

```json
{
  "type": "join",
  "name": "玩家昵称",
  "code": "ROOM123"  // 6位房间码
}
```

**响应**: `joined` 消息

### 3. 重新加入房间 (rejoin)

断线重连时使用

```json
{
  "type": "rejoin",
  "playerId": "uuid",
  "code": "ROOM123"
}
```

**响应**: `joined` 消息

### 4. 出拳 (choose)

```json
{
  "type": "choose",
  "choice": "rock"  // "rock", "paper", 或 "scissors"
}
```

**响应**: `choiceStatus` 消息，双方都出拳后触发 `state` 消息

### 5. 添加自定义惩罚 (customPunishment)

```json
{
  "type": "customPunishment",
  "level": "L1",  // "L1", "L2", 或 "L3"
  "text": "惩罚内容"  // 1-40字符
}
```

**限制**: 每人最多2条

**响应**: `state` 消息

### 6. 删除自定义惩罚 (removeCustomPunishment)

```json
{
  "type": "removeCustomPunishment",
  "id": "punishment-uuid"
}
```

**响应**: `state` 消息

### 7. 重赛 (rematch)

```json
{
  "type": "rematch",
  "bestOf": 5  // 3, 5, 或 7
}
```

**响应**: `state` 消息，双方确认相同局数后开始新游戏

### 8. 设置惩罚结果 (punishment)

```json
{
  "type": "punishment",
  "punishment": {
    "level": "L2",
    "text": "惩罚内容"
  }
}
```

**响应**: `state` 消息

### 9. 心跳 (ping)

```json
{
  "type": "ping"
}
```

**响应**: `pong` 消息

---

## 服务器 → 客户端

### 1. 加入成功 (joined)

```json
{
  "type": "joined",
  "playerId": "uuid",
  "room": {
    // 房间完整信息 (见下方 Room 对象)
  }
}
```

### 2. 房间状态更新 (state)

```json
{
  "type": "state",
  "room": {
    // 房间完整信息 (见下方 Room 对象)
  }
}
```

### 3. 出拳状态 (choiceStatus)

```json
{
  "type": "choiceStatus",
  "readyIds": ["player-uuid-1", "player-uuid-2"]
}
```

### 4. 房间关闭 (roomClosed)

```json
{
  "type": "roomClosed",
  "reason": "房间长时间无活动已关闭"
}
```

### 5. 错误消息 (error)

```json
{
  "type": "error",
  "message": "错误描述"
}
```

### 6. 心跳响应 (pong)

```json
{
  "type": "pong"
}
```

---

## 数据结构

### Room 对象

```json
{
  "code": "ABC123",
  "bestOf": 3,
  "status": "waiting",  // "waiting", "playing", "finished"
  "players": [
    {
      "id": "uuid",
      "name": "玩家1",
      "offline": false
    }
  ],
  "scores": {
    "player-uuid": 1
  },
  "rounds": [
    {
      "choices": {
        "player-uuid-1": "rock",
        "player-uuid-2": "scissors"
      },
      "winnerId": "player-uuid-1"  // null 表示平局
    }
  ],
  "winnerId": null,  // 系列赛胜者
  "loserId": null,
  "punishment": null,  // 惩罚对象
  "rematch": {
    "bestOf": 5,
    "readyIds": ["player-uuid-1"]
  },
  "customPunishments": [
    {
      "id": "uuid",
      "playerId": "player-uuid",
      "playerName": "玩家1",
      "level": "L1",
      "text": "自定义惩罚"
    }
  ]
}
```

---

## 游戏流程

1. **创建房间**: 玩家A发送 `create` → 收到 `joined`
2. **等待加入**: 房间状态为 `waiting`
3. **加入房间**: 玩家B发送 `join` → 双方收到 `state`，状态变为 `playing`
4. **游戏回合**:
   - 玩家出拳 (`choose`)
   - 收到 `choiceStatus` 显示就绪状态
   - 双方都出拳后，收到 `state` 包含回合结果
5. **系列赛结束**: 状态变为 `finished`，`winnerId` 和 `loserId` 被设置
6. **惩罚环节**: 输家转盘，发送 `punishment` 设置结果
7. **重赛**: 双方发送 `rematch` 并选择相同局数

---

## 错误码

| 错误信息 | 说明 |
|---------|------|
| `消息格式错误` | JSON 解析失败 |
| `房间码格式错误` | 房间码不是6位字母数字 |
| `房间不存在` | 房间已关闭或不存在 |
| `房间已满` | 房间已有2名玩家 |
| `请先创建或加入房间` | 操作需要先进入房间 |
| `操作过快，请稍后再试` | 触发速率限制 |
| `每人最多添加N条自定义惩罚` | 超过自定义惩罚限制 |

---

## 配置限制

| 参数 | 限制 |
|------|------|
| 昵称长度 | 2-10 字符 |
| 房间码长度 | 6 字符 (字母数字) |
| 自定义惩罚长度 | 1-40 字符 |
| 每人自定义惩罚数 | 最多 2 条 |
| 局数选项 | 3, 5, 7 |
| 房间不活跃超时 | 1 小时 |
| 空房间超时 | 6 小时 |
| 玩家离线宽限期 | 5 分钟 |
| 操作速率限制 | 500ms |

---

## 心跳机制

客户端每 30 秒发送一次 `ping`，服务器响应 `pong`。如果 10 秒内未收到 `pong`，客户端将断开并尝试重连。

---

## 断线重连

1. 客户端检测到连接断开
2. 使用指数退避策略重连 (1s → 2s → 4s → ... → 30s)
3. 最多重试 10 次
4. 重连成功后发送 `rejoin` 消息
5. 服务器恢复玩家状态

---

## 示例代码

### JavaScript 客户端

```javascript
const ws = new WebSocket('ws://localhost:8787/ws');

ws.onopen = () => {
  // 创建房间
  ws.send(JSON.stringify({
    type: 'create',
    name: '玩家1',
    bestOf: 3
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'joined':
      console.log('房间码:', message.room.code);
      break;
    case 'state':
      console.log('房间状态:', message.room);
      break;
    case 'error':
      console.error('错误:', message.message);
      break;
  }
};

// 出拳
ws.send(JSON.stringify({
  type: 'choose',
  choice: 'rock'
}));
```

---

## 健康检查

### HTTP GET /health

返回服务器健康状态：

```json
{
  "status": "ok",
  "uptime": 12345,
  "memory": {
    "used": "50MB",
    "total": "100MB"
  },
  "rooms": 5,
  "timestamp": "2026-06-16T10:00:00.000Z"
}
```
