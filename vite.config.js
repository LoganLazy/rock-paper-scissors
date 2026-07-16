import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/ws': {
        target: 'http://localhost:8787',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('[Vite Proxy Error]', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[Vite Proxy] Proxying request to:', proxyReq.path);
          });
        },
      },
    },
  },
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
          }
        },
      },
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // chunk 大小警告限制
    chunkSizeWarningLimit: 600,
  },
  // 依赖预构建优化
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
