# 🎮 Rock-Paper-Scissors

[![Version](https://img.shields.io/badge/version-0.2.0-blue)](https://github.com/LoganLazy/rock-paper-scissors)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![React](https://img.shields.io/badge/React-19.2.7-61DAFB?logo=react)](https://react.dev)
[![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org)
[![WebSocket](https://img.shields.io/badge/WebSocket-ws-yellow)](https://github.com/websockets/ws)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](./DOCKER.md)

> 🎲 多人在线石头剪刀布游戏，支持自定义惩罚转盘、断线重连、移动端适配

一个基于 **React** + **WebSocket** 的实时多人对战游戏，专为情侣和朋友设计，输了要接受惩罚哦！

[在线演示](#) | [快速开始](#快速开始) | [Docker 部署](./DOCKER.md) | [更新日志](./CHANGELOG.md)

---

## ✨ 功能特性

---

## ✨ 功能特性

### 🎯 核心功能
- ✅ **实时对战** - WebSocket 低延迟通信，毫秒级响应
- ✅ **自动断线重连** - 网络波动自动恢复，无需刷新页面
- ✅ **自定义惩罚转盘** - 添加专属惩罚内容，增加游戏趣味
- ✅ **房间管理** - 创建/加入房间，支持房间码分享
- ✅ **游戏历史** - 记录每局对战详情，可回顾精彩瞬间

### 🎨 用户体验
- 📱 **移动端完美适配** - 响应式设计，320px+ 全屏幕支持
- 🎵 **音效系统** - Web Audio API 实现，可开关控制
- 🎲 **流畅动画** - 转盘动画、弹跳效果、硬件加速
- 💬 **实时反馈** - Toast 提示、加载状态、连接指示器
- 🌐 **一键分享** - 复制房间链接，邀请好友

### 🔧 技术特性
- 🔄 **断线重连机制** - 指数退避策略 + 心跳检测
- 🏠 **房间自动清理** - 定时清理过期房间，防止内存泄漏
- 🛡️ **完整错误处理** - ErrorBoundary + 全局异常捕获
- ✅ **输入验证** - 前后端双重验证，防止恶意输入
- 📦 **组件化架构** - 14 个独立 React 组件，易于维护

---

## 🚀 快速开始

### 方式一：本地运行（开发）

**前提条件**
- Node.js 18+
- npm 9+

**安装依赖**
```bash
npm install
```

**启动开发服务器**
```bash
# 同时启动前端和后端
npm start

# 或分别启动
npm run dev      # 前端 (Vite dev server)
npm run server   # 后端 (WebSocket server)
```

访问 http://localhost:5173

---

### 方式二：Docker 部署（推荐）

**一键启动**
```bash
docker-compose up -d
```

访问 http://localhost

详细 Docker 部署指南：[DOCKER.md](./DOCKER.md)

---

### 方式三：生产部署

详细部署步骤请查看下方 [部署指南](#部署指南)

---

## 📸 项目截图

> TODO: 添加项目截图

---

## 🏗️ 技术栈

### 前端
- ⚛️ **React 19.2.7** - UI 框架
- ⚡ **Vite 8.1.1** - 构建工具
- 🎨 **CSS3** - 样式和动画

### 后端
- 🟢 **Node.js 18+** - 运行时
- 🔌 **ws** - WebSocket 库
- 🔄 **PM2** - 进程管理

### 开发工具
- 🧪 **Vitest** - 单元测试
- 🎭 **Playwright** - E2E 测试
- 🐳 **Docker** - 容器化部署

---

## 📁 项目结构

```
Rock-Paper-Scissors/
├── src/
│   ├── components/          # React 组件
│   │   ├── ErrorBoundary.jsx       # 错误边界
│   │   ├── ConnectionStatus.jsx    # 连接状态
│   │   ├── Toast.jsx              # 提示组件
│   │   ├── Lobby.jsx              # 大厅
│   │   ├── RoomInfo.jsx           # 房间信息
│   │   ├── ScoreBoard.jsx         # 比分牌
│   │   ├── GamePlay.jsx           # 游戏界面
│   │   ├── Punishment.jsx         # 惩罚转盘
│   │   ├── CustomPunishments.jsx  # 自定义惩罚
│   │   ├── RematchControl.jsx     # 重赛控制
│   │   ├── History.jsx            # 历史记录
│   │   ├── SoundSettings.jsx      # 音效设置
│   │   ├── Statistics.jsx         # 统计数据
│   │   └── ThemeToggle.jsx        # 主题切换
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useWebSocket.jsx       # WebSocket 管理
│   │   └── useNetworkStatus.js    # 网络状态
│   ├── utils/               # 工具函数
│   │   ├── validation.js          # 输入验证
│   │   ├── sounds.js              # 音效管理
│   │   ├── share.js               # 分享工具
│   │   ├── errorTracking.js       # 错误追踪
│   │   └── performance.js         # 性能监控
│   ├── config.js            # 配置常量
│   ├── main.jsx             # 入口文件
│   └── styles.css           # 全局样式
├── server/
│   └── index.js             # WebSocket 服务器
├── public/                  # 静态资源
├── docs/                    # 文档
├── e2e/                     # E2E 测试
├── Dockerfile              # Docker 镜像
├── docker-compose.yml      # Docker Compose 配置
├── nginx.conf              # Nginx 配置
├── ecosystem.config.cjs    # PM2 配置
├── vite.config.js          # Vite 配置
└── package.json
```

---

## 🎮 游戏规则

### 基础玩法
1. **创建房间** - 输入昵称，创建房间，获得房间码
2. **邀请好友** - 分享房间码或链接给好友
3. **开始游戏** - 两人同时出拳（石头/剪刀/布）
4. **判定胜负** - 石头克剪刀，剪刀克布，布克石头
5. **惩罚转盘** - 输的一方转惩罚转盘

### 胜负规则
- 先赢得指定局数（3局2胜/5局3胜/7局4胜）获胜
- 平局不计入局数，继续对战

### 自定义惩罚
- 默认提供 12 种趣味惩罚
- 可添加专属惩罚内容（最多 20 个）
- 转盘随机选择惩罚内容

---

## 📦 部署指南

### 环境要求

服务器需要安装：

- Node.js 18 或更高版本
- npm 9+
- Nginx（可选，推荐）
- PM2（进程管理）
- Docker（可选）

### 方式一：传统部署（Linux + Nginx）

#### 1. 安装 PM2

```bash
npm install -g pm2
```

#### 2. 上传项目到服务器

```bash
scp -r Rock-Paper-Scissors user@server:/var/www/rock-paper-scissors
```

#### 3. 安装依赖并构建

```bash
cd /var/www/rock-paper-scissors
npm install
npm run build
```

#### 4. 启动后端服务

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # 设置开机自启
```

#### 5. 配置 Nginx

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/rock-paper-scissors
```

写入以下内容（替换 `your-domain.com` 为你的域名）：

```nginx
server {
  listen 80;
  server_name your-domain.com;

  root /var/www/rock-paper-scissors/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /ws {
    proxy_pass http://127.0.0.1:8787/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
  }

  location /health {
    proxy_pass http://127.0.0.1:8787/health;
  }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/rock-paper-scissors /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. 访问网站

打开浏览器访问：`http://your-domain.com`

---

### 方式二：宝塔面板部署

详细步骤请参考原 README 的宝塔部署章节，或查看 [QUICKSTART.md](./QUICKSTART.md)

---

### 方式三：Docker 部署（推荐）

#### 快速启动

```bash
# 克隆项目
git clone https://github.com/LoganLazy/rock-paper-scissors.git
cd rock-paper-scissors

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### 访问

- HTTP: http://localhost
- 后端: http://localhost:8787

#### 详细文档

完整 Docker 部署指南请查看 [DOCKER.md](./DOCKER.md)，包括：
- HTTPS 配置
- 生产优化
- 监控和维护
- 故障排查

---

## 🛠️ 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 或分别启动
npm run dev      # 前端 (http://localhost:5173)
npm run server   # 后端 (ws://localhost:8787)
```

### 运行测试

```bash
# 单元测试
npm test

# 单元测试 UI
npm run test:ui

# E2E 测试
npm run test:e2e

# E2E 测试 UI
npm run test:e2e:ui
```

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

### Docker 命令

```bash
# 构建镜像
npm run docker:build

# 运行容器
npm run docker:run

# 停止容器
npm run docker:stop

# 使用 Docker Compose
npm run docker:compose
npm run docker:compose:down
```

---

## 🔧 配置说明

### 后端配置

修改 `server/index.js` 中的常量：

```javascript
const PORT = process.env.PORT || 8787;           // WebSocket 端口
const ROOM_CLEANUP_INTERVAL = 10 * 60 * 1000;   // 房间清理间隔
const ROOM_EXPIRY_TIME = 60 * 60 * 1000;        // 房间过期时间
const PING_INTERVAL = 30000;                     // 心跳间隔
```

### 前端配置

修改 `src/config.js`：

```javascript
export const WS_URL = 'ws://localhost:8787';    // WebSocket 地址
export const RECONNECT_DELAY = 1000;            // 重连延迟
export const MAX_RECONNECT_ATTEMPTS = 10;       // 最大重连次数
```

### PM2 配置

修改 `ecosystem.config.cjs`：

```javascript
module.exports = {
  apps: [{
    name: 'rock-paper-scissors',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 8787
    }
  }]
};
```

---

## 📊 性能优化

### 前端优化
- ✅ Vite 构建优化
- ✅ 组件懒加载
- ✅ CSS 硬件加速
- ✅ Gzip 压缩

### 后端优化
- ✅ 房间自动清理
- ✅ 心跳检测
- ✅ PM2 进程管理
- ✅ 健康检查接口

### 网络优化
- ✅ WebSocket 长连接
- ✅ 断线重连机制
- ✅ Nginx 反向代理
- ✅ 静态资源缓存

---

## 🐛 故障排查

### 页面打不开

```bash
# 检查 Nginx
sudo systemctl status nginx

# 检查网站根目录
ls -la /var/www/rock-paper-scissors/dist
```

### WebSocket 连接失败

```bash
# 检查后端服务
pm2 status
pm2 logs rock-paper-scissors

# 测试健康接口
curl http://localhost:8787/health
```

### 房间无法创建

检查 Nginx 的 WebSocket 代理配置是否正确：

```nginx
location /ws {
  proxy_pass http://127.0.0.1:8787/ws;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

### 端口冲突

如果 8787 端口被占用，修改：
1. `ecosystem.config.cjs` 中的 `PORT`
2. `nginx.conf` 中的 `proxy_pass` 端口
3. `src/config.js` 中的 `WS_URL`

更多故障排查请查看 [DOCKER.md](./DOCKER.md) 的故障排查章节。

---

## 🔄 更新项目

### 传统部署更新

```bash
cd /var/www/rock-paper-scissors
git pull
npm install
npm run build
pm2 restart rock-paper-scissors
sudo systemctl reload nginx
```

### Docker 部署更新

```bash
git pull
docker-compose up -d --build
```

---

## 📝 常用命令

### PM2 管理

```bash
pm2 status                        # 查看状态
pm2 logs rock-paper-scissors      # 查看日志
pm2 restart rock-paper-scissors   # 重启服务
pm2 stop rock-paper-scissors      # 停止服务
pm2 delete rock-paper-scissors    # 删除服务
```

### Nginx 管理

```bash
sudo nginx -t                     # 测试配置
sudo systemctl reload nginx       # 重载配置
sudo systemctl restart nginx      # 重启 Nginx
sudo systemctl status nginx       # 查看状态
```

### Docker 管理

```bash
docker-compose ps                 # 查看容器
docker-compose logs -f            # 查看日志
docker-compose restart            # 重启服务
docker-compose down               # 停止服务
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 代码规范

- 使用 ESLint 和 Prettier
- 组件使用 JSDoc 注释
- 提交信息遵循 Conventional Commits

---

## 📄 许可证

本项目采用 [MIT License](./LICENSE) 开源协议。

---

## 🙏 致谢

- [React](https://react.dev) - UI 框架
- [Vite](https://vitejs.dev) - 构建工具
- [ws](https://github.com/websockets/ws) - WebSocket 库
- [PM2](https://pm2.keymetrics.io) - 进程管理

---

## 📧 联系方式

- 作者：LoganLazy
- Email：lazyease@gmail.com
- GitHub：[@LoganLazy](https://github.com/LoganLazy)

---

## 📚 相关文档

- [快速开始指南](./QUICKSTART.md)
- [Docker 部署指南](./DOCKER.md)
- [更新日志](./CHANGELOG.md)
- [GitHub 上传检查清单](./GITHUB_CHECKLIST.md)

---

**⭐ 如果这个项目对你有帮助，请给一个 Star！**

---

<div align="center">

Made with ❤️ by [LoganLazy](https://github.com/LoganLazy)

</div>


服务器需要安装：

- Node.js 18 或更高版本
- npm
- Nginx
- PM2

安装 PM2：

```bash
npm install -g pm2
```

---

## 二、上传项目

把本地项目文件夹上传到服务器，例如上传到：

```text
/var/www/rock-paper-scissors
```

示例：

```bash
scp -r Rock-Paper-Scissors user@服务器IP:/var/www/rock-paper-scissors
```

进入项目目录：

```bash
cd /var/www/rock-paper-scissors
```

安装依赖并打包：

```bash
npm install
npm run build
```

---

## 三、普通 Linux + Nginx 部署方式

### 1. 启动后端服务

在项目目录执行：

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

查看服务状态：

```bash
pm2 status
```

检查后端是否正常：

```bash
curl http://127.0.0.1:8787/health
```

如果返回：

```text
ok
```

说明后端服务正常。

### 2. 配置 Nginx

新建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/rock-paper-scissors
```

写入以下内容，把 `your-domain.com` 改成你的域名或服务器 IP：

```nginx
server {
  listen 80;
  server_name your-domain.com;

  root /var/www/rock-paper-scissors/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /ws {
    proxy_pass http://127.0.0.1:8787/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
  }

  location /health {
    proxy_pass http://127.0.0.1:8787/health;
  }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/rock-paper-scissors /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

然后访问：

```text
http://你的域名或服务器IP
```

---

## 四、aaPanel / 宝塔面板部署方式

aaPanel 中文环境通常也叫宝塔面板。下面以宝塔面板操作为例。

### 1. 安装运行环境

在宝塔面板中安装：

- Nginx
- Node.js 版本管理器，选择 Node.js 18 或更高版本
- PM2 管理器，如果面板里没有，也可以在终端执行 `npm install -g pm2`

### 2. 上传项目

在宝塔面板文件管理中上传项目到：

```text
/www/wwwroot/rock-paper-scissors
```

如果上传的是压缩包，上传后解压到该目录。

### 3. 安装依赖并打包

在宝塔面板终端执行：

```bash
cd /www/wwwroot/rock-paper-scissors
npm install
npm run build
```

### 4. 启动 Node 后端

继续执行：

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

检查状态：

```bash
pm2 status
curl http://127.0.0.1:8787/health
```

返回 `ok` 表示后端正常。

### 5. 创建网站

在宝塔面板中：

1. 打开「网站」
2. 点击「添加站点」
3. 域名填写你的域名，或者先填写服务器 IP
4. 根目录选择：

```text
/www/wwwroot/rock-paper-scissors/dist
```

5. PHP 版本选择「纯静态」
6. 提交创建

### 6. 配置反向代理 WebSocket

进入刚创建的网站设置：

1. 点击「配置文件」
2. 找到 `server { ... }` 配置
3. 在 `server` 配置里面加入以下内容：

```nginx
location /ws {
  proxy_pass http://127.0.0.1:8787/ws;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_read_timeout 3600s;
}

location /health {
  proxy_pass http://127.0.0.1:8787/health;
}
```

如果原本没有前端路由配置，也建议确认有这一段：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

保存后，在宝塔面板中重载 Nginx。

### 7. 访问网站

浏览器打开：

```text
http://你的域名或服务器IP
```

---

## 五、常用维护命令

查看服务：

```bash
pm2 status
```

查看日志：

```bash
pm2 logs rock-paper-scissors
```

重启服务：

```bash
pm2 restart rock-paper-scissors
```

停止服务：

```bash
pm2 stop rock-paper-scissors
```

重新打包前端：

```bash
npm run build
```

重载 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 六、更新项目

上传新代码后，在服务器项目目录执行：

```bash
npm install
npm run build
pm2 restart rock-paper-scissors
```

如果修改了 Nginx 配置，还需要执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 七、排查问题

### 页面打不开

检查 Nginx 是否运行：

```bash
sudo systemctl status nginx
```

检查网站根目录是否指向：

```text
/var/www/rock-paper-scissors/dist
```

或宝塔面板：

```text
/www/wwwroot/rock-paper-scissors/dist
```

### 房间无法创建或加入

通常是 WebSocket 反向代理没有配置好。重点检查 Nginx 是否有：

```nginx
location /ws {
  proxy_pass http://127.0.0.1:8787/ws;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

### 后端没有启动

检查 PM2：

```bash
pm2 status
pm2 logs rock-paper-scissors
```

检查健康接口：

```bash
curl http://127.0.0.1:8787/health
```

### 端口冲突

项目默认使用 `8787` 端口。如果服务器上该端口被占用，可以修改：

```text
ecosystem.config.cjs
```

把：

```js
PORT: 8787
```

改成其他端口，同时 Nginx 配置里的 `127.0.0.1:8787` 也要一起修改。
