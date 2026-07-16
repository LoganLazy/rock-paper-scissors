/**
 * Service Worker for PWA support
 * 提供离线缓存和基本的 PWA 功能
 */

const CACHE_NAME = 'rps-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// 安装事件 - 缓存关键资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching files');
      return cache.addAll(urlsToCache).catch((err) => {
        console.error('Service Worker: Cache failed', err);
      });
    })
  );
  // 立即激活新的 Service Worker
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 立即控制所有页面
  self.clients.claim();
});

// 请求拦截 - 网络优先，缓存降级
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // WebSocket 请求不缓存
  if (request.url.includes('/ws') || request.url.includes('ws://') || request.url.includes('wss://')) {
    return;
  }

  // API 请求不缓存
  if (request.url.includes('/health') || request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 成功获取资源后更新缓存
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 网络失败，尝试从缓存获取
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // 如果缓存也没有，返回离线页面
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
