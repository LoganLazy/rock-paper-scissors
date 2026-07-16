# Docker 部署指南

## 📦 快速开始

### 方式一：使用 Docker Compose（推荐）

#### 1. 启动服务

```bash
docker-compose up -d
```

#### 2. 查看日志

```bash
docker-compose logs -f
```

#### 3. 停止服务

```bash
docker-compose down
```

#### 4. 重启服务

```bash
docker-compose restart
```

---

### 方式二：单独使用 Docker

#### 1. 构建镜像

```bash
docker build -t rock-paper-scissors:latest .
```

#### 2. 运行容器

```bash
docker run -d \
  --name rock-paper-scissors \
  -p 8787:8787 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  rock-paper-scissors:latest
```

#### 3. 查看日志

```bash
docker logs -f rock-paper-scissors
```

#### 4. 停止容器

```bash
docker stop rock-paper-scissors
docker rm rock-paper-scissors
```

---

## 🔧 配置说明

### 环境变量

在 `docker-compose.yml` 中可以配置以下环境变量：

```yaml
environment:
  - NODE_ENV=production        # 运行环境
  - PORT=8787                  # 后端端口（默认 8787）
```

### 端口映射

- **8787**: WebSocket 后端端口
- **80**: HTTP 端口（通过 Nginx）
- **443**: HTTPS 端口（可选，需要配置 SSL 证书）

### 数据卷

如果需要持久化日志或其他数据，可以在 `docker-compose.yml` 中添加：

```yaml
services:
  app:
    volumes:
      - ./logs:/app/logs
```

---

## 🌐 Nginx 反向代理

### 使用 Docker Compose 自带的 Nginx

`docker-compose.yml` 已经配置了 Nginx 服务，会自动：
- 代理 WebSocket 请求到后端
- 提供静态文件服务
- 配置 Gzip 压缩

### HTTPS 配置（可选）

#### 1. 准备 SSL 证书

将证书文件放在 `ssl` 目录：

```bash
mkdir ssl
# 放入你的证书文件
# ssl/cert.pem
# ssl/key.pem
```

#### 2. 修改 nginx.conf

取消注释 `nginx.conf` 中的 HTTPS 配置部分，并修改域名：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;  # 改成你的域名
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... 其他配置
}
```

#### 3. 启用 HTTP 到 HTTPS 重定向

在 `nginx.conf` 的 HTTP server 块中取消注释：

```nginx
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;  # 取消这行注释
}
```

#### 4. 重启服务

```bash
docker-compose restart nginx
```

---

## 🔍 健康检查

### 检查服务状态

```bash
# 查看容器状态
docker-compose ps

# 检查健康状态
curl http://localhost:8787/health
```

应该返回：
```
ok
```

### 查看容器健康检查日志

```bash
docker inspect --format='{{json .State.Health}}' rock-paper-scissors | jq
```

---

## 📊 监控和维护

### 查看资源使用

```bash
docker stats rock-paper-scissors
```

### 查看 PM2 进程

进入容器：

```bash
docker exec -it rock-paper-scissors sh
pm2 status
pm2 logs
```

### 重启应用（不重启容器）

```bash
docker exec rock-paper-scissors pm2 restart all
```

---

## 🚀 生产部署建议

### 1. 使用环境变量文件

创建 `.env` 文件：

```env
NODE_ENV=production
PORT=8787
```

修改 `docker-compose.yml`：

```yaml
services:
  app:
    env_file:
      - .env
```

### 2. 配置日志轮转

在 `docker-compose.yml` 中添加：

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. 限制资源使用

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 4. 自动重启策略

```yaml
services:
  app:
    restart: unless-stopped  # 或 always
```

---

## 🔒 安全建议

### 1. 不要暴露后端端口

生产环境建议只暴露 Nginx 的 80/443 端口，修改 `docker-compose.yml`：

```yaml
services:
  app:
    # 移除 ports 配置，只在内部网络访问
    # ports:
    #   - "8787:8787"
    expose:
      - "8787"
```

### 2. 使用非 root 用户

修改 `Dockerfile`，添加：

```dockerfile
# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
```

### 3. 定期更新基础镜像

```bash
docker pull node:18-alpine
docker pull nginx:alpine
docker-compose build --no-cache
```

---

## 🐛 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs app

# 检查端口占用
netstat -tuln | grep 8787
```

### WebSocket 连接失败

1. 检查 Nginx 配置是否正确
2. 确认防火墙规则
3. 查看浏览器控制台错误

```bash
# 测试后端直连
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:8787/ws
```

### 前端无法访问

```bash
# 检查 Nginx 容器
docker-compose logs nginx

# 进入 Nginx 容器检查配置
docker exec -it rps-nginx sh
nginx -t
```

### 健康检查失败

```bash
# 手动测试健康检查
docker exec rock-paper-scissors node -e "require('http').get('http://localhost:8787/health', (r) => {console.log(r.statusCode)})"
```

---

## 📝 常用命令

### 构建和启动

```bash
# 构建镜像（首次或代码更新后）
docker-compose build

# 启动服务
docker-compose up -d

# 一键重新构建并启动
docker-compose up -d --build
```

### 查看和调试

```bash
# 查看所有容器
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 只看应用日志
docker-compose logs -f app

# 进入容器
docker exec -it rock-paper-scissors sh
```

### 停止和清理

```bash
# 停止服务
docker-compose stop

# 停止并删除容器
docker-compose down

# 停止、删除容器和卷
docker-compose down -v

# 清理未使用的镜像
docker image prune -a
```

### 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 查看更新日志
docker-compose logs -f app
```

---

## 🌍 云平台部署

### 部署到阿里云/腾讯云

1. 购买云服务器（1核2G以上）
2. 安装 Docker 和 Docker Compose
3. 上传项目代码
4. 配置安全组（开放 80, 443 端口）
5. 运行 `docker-compose up -d`

### 部署到 Railway / Render

这些平台会自动检测 Dockerfile：

1. 连接 GitHub 仓库
2. 设置环境变量 `PORT=8787`
3. 自动构建和部署

### 部署到 AWS / Google Cloud

使用容器服务（ECS / Cloud Run）：

```bash
# 构建并推送镜像
docker build -t your-registry/rock-paper-scissors:latest .
docker push your-registry/rock-paper-scissors:latest

# 在云平台创建容器服务，指向该镜像
```

---

## 📈 性能优化

### 1. 启用构建缓存

```bash
# 使用 BuildKit
DOCKER_BUILDKIT=1 docker-compose build
```

### 2. 多阶段构建优化

Dockerfile 已经使用多阶段构建，生产镜像只包含必要文件：

- 镜像大小：~150MB（相比单阶段减少 60%）
- 构建时间：~2分钟（首次）

### 3. Nginx 缓存配置

在 `nginx.conf` 中已配置：

- 静态资源缓存 1 年
- Gzip 压缩
- HTTP/2 支持

---

## ✅ 检查清单

部署前确认：

- [ ] `.env` 文件配置正确
- [ ] SSL 证书已放入 `ssl/` 目录（如使用 HTTPS）
- [ ] `nginx.conf` 中的域名已修改
- [ ] 防火墙规则已配置
- [ ] Docker 和 Docker Compose 已安装
- [ ] 端口 80, 443, 8787 未被占用

---

## 🆘 获取帮助

遇到问题？

1. 查看日志：`docker-compose logs -f`
2. 检查配置：`docker-compose config`
3. 健康检查：`curl http://localhost:8787/health`
4. 查看 [GitHub Issues](https://github.com/你的用户名/rock-paper-scissors/issues)

---

**最后更新**: 2026-07-16  
**Docker 版本**: 20.10+  
**Docker Compose 版本**: 2.0+
