# 多阶段构建
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 生产镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装 PM2
RUN npm install -g pm2

# 从构建阶段复制文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/ecosystem.config.cjs ./

# 暴露端口
EXPOSE 8787

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8787/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 以非 root 用户运行（node:18-alpine 自带 node 用户）
USER node

# 启动服务
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
