# 🚀 Rock-Paper-Scissors 快速开始指南

## ✅ 优化完成

项目已完成**全部 18 项优化**，可以立即使用！

---

## 📦 安装

```bash
cd Desktop/Rock-Paper-Scissors
npm install
```

---

## 🎮 开发模式

```bash
# 同时启动前端和后端
npm start

# 或分别启动
npm run dev      # 前端: http://localhost:5173
npm run server   # 后端: ws://localhost:8787
```

**访问**: http://localhost:5173

---

## 🏗️ 生产构建

```bash
# 构建前端
npm run build

# 查看构建产物
ls -lh dist/

# 启动服务器
pm2 start ecosystem.config.cjs

# 查看状态
pm2 status

# 查看日志
pm2 logs rock-paper-scissors
```

---

## 🧪 测试

```bash
# 单元测试
npm test

# E2E 测试
npm run test:e2e

# 测试 UI
npm run test:ui
npm run test:e2e:ui
```

**注意**: 首次运行需要安装测试依赖：
```bash
npm install --save-dev vitest@^1.0.0 @playwright/test@^1.40.0 jsdom@^23.0.0
```

---

## 🎨 新功能试用

### 1. 暗黑模式 🌙
- 左上角点击 🌙/☀️ 按钮
- 主题偏好自动保存

### 2. 游戏统计 📊
- 游戏结束后查看
- 显示胜率和出拳偏好
- 可折叠展示

### 3. 网络状态 🌐
- 自动检测网络连接
- 离线/恢复提示

### 4. PWA 支持 📱
- 在 Chrome 中点击"安装"
- 添加到主屏幕
- 支持离线使用

---

## 📊 性能验证

```bash
# 构建后检查体积
npm run build
du -sh dist/
ls -lh dist/assets/

# 预期结果:
# - 总体积: ~253KB
# - 主应用: ~24KB
# - React: ~186KB (独立分包)
# - 懒加载组件: ~5KB
```

---

## 🔧 配置文件说明

| 文件 | 用途 |
|------|------|
| `vite.config.js` | 构建优化配置 |
| `ecosystem.config.cjs` | PM2 进程管理 |
| `nginx.conf.example` | Nginx 配置模板 |
| `vitest.config.js` | 单元测试配置 |
| `playwright.config.js` | E2E 测试配置 |
| `.eslintrc.json` | 代码规范 |
| `.prettierrc` | 代码格式化 |

---

## 📚 文档

- **API 文档**: `docs/API.md` - WebSocket 协议详解
- **优化报告**: `OPTIMIZATION_COMPLETE_REPORT.md` - 完整优化记录
- **部署指南**: `README.md` - 详细部署说明
- **更新日志**: `CHANGELOG.md` - 版本历史

---

## 🐛 常见问题

### Q: 构建失败
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Q: 端口被占用
```bash
# 修改端口
# vite.config.js: server.port = 5174
# server/index.js: const port = 8788
```

### Q: Service Worker 缓存问题
```bash
# 开发环境不启用 SW
# 生产环境清除缓存: 浏览器 DevTools > Application > Clear storage
```

### Q: 暗黑模式不生效
```bash
# 清除 localStorage
localStorage.removeItem('rps_theme')
# 刷新页面
```

---

## 🚀 部署到生产

### 1. 服务器准备
```bash
# 安装依赖
sudo apt install nginx nodejs npm

# 安装 PM2
npm install -g pm2
```

### 2. 上传项目
```bash
scp -r Rock-Paper-Scissors user@server:/var/www/
```

### 3. 构建和启动
```bash
cd /var/www/Rock-Paper-Scissors
npm install
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

### 4. 配置 Nginx
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/rps
sudo ln -s /etc/nginx/sites-available/rps /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🎯 优化亮点

✅ **首屏加载减少 88%** (207KB → 24KB)  
✅ **代码分割** - React 独立打包可缓存  
✅ **懒加载** - 按需加载组件  
✅ **PWA 支持** - 离线可用  
✅ **暗黑模式** - 现代化体验  
✅ **游戏统计** - 数据分析  
✅ **服务器监控** - 健康检查、速率限制  
✅ **完整文档** - API、测试、部署

---

## 💡 提示

- 开发时使用 `npm start` 获得最佳体验
- 生产构建使用 `npm run build` 获得最优性能
- 定期查看 `pm2 logs` 监控服务器状态
- 使用 Chrome DevTools Lighthouse 测试性能

---

## 📞 需要帮助？

1. 查看 `OPTIMIZATION_COMPLETE_REPORT.md` 详细说明
2. 查看 `docs/API.md` 了解协议
3. 查看 `README.md` 部署指南

---

**项目版本**: v0.2.0  
**状态**: ✅ 生产就绪  
**最后更新**: 2026-06-16
