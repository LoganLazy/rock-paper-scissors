module.exports = {
  apps: [
    {
      name: 'rock-paper-scissors',
      script: 'server/index.js',
      instances: 1, // 单实例（WebSocket 有状态）
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8787,
      },
      // 错误重启策略
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      // 日志配置
      error_file: 'logs/error.log',
      out_file: 'logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      // 日志轮转
      log_type: 'json',
      // 自动重启
      autorestart: true,
      watch: false, // 生产环境不建议开启
    },
  ],
};
