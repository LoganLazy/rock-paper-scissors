# 贡献指南 | Contributing Guide

感谢你对本项目的关注！欢迎提交 Issue 和 Pull Request。

## 开发流程

### 1. Fork 并克隆仓库

```bash
git clone https://github.com/YOUR_USERNAME/rock-paper-scissors.git
cd rock-paper-scissors
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm start
```

### 4. 创建功能分支

```bash
git checkout -b feature/AmazingFeature
```

### 5. 提交更改

```bash
git add .
git commit -m "Add some AmazingFeature"
```

### 6. 推送到分支

```bash
git push origin feature/AmazingFeature
```

### 7. 提交 Pull Request

访问 GitHub 仓库页面，点击 "New Pull Request"。

## 代码规范

- 使用 ESLint 和 Prettier 格式化代码
- 组件使用 JSDoc 注释
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型：**
- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具链相关

**示例：**
```
feat(game): 添加倒计时功能

在游戏开始前增加 3 秒倒计时，提升用户体验。

Closes #123
```

## 运行测试

```bash
# 单元测试
npm test

# E2E 测试
npm run test:e2e
```

## 项目结构

```
src/
├── components/      # React 组件
├── hooks/          # 自定义 Hooks
├── utils/          # 工具函数
├── config.js       # 配置文件
└── main.jsx        # 入口文件
```

## 需要帮助？

- 查看 [README.md](./README.md) 了解项目详情
- 查看 [QUICKSTART.md](./QUICKSTART.md) 快速开始
- 查看 [docs/API.md](./docs/API.md) 了解 API 文档
- 提交 [Issue](https://github.com/LoganLazy/rock-paper-scissors/issues)

## 行为准则

- 尊重他人
- 欢迎新手
- 建设性反馈
- 保持友好和专业

感谢你的贡献！🎉
