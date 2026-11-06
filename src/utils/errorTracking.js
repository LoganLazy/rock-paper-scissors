/**
 * 前端错误追踪和监控
 * 捕获全局错误和未处理的Promise拒绝
 *
 * 注意：目前仅在本地 console 记录错误，暂未接入远程错误监控服务。
 */

/**
 * 初始化错误追踪
 */
export function initErrorTracking() {
  // 全局错误捕获
  window.addEventListener('error', (event) => {
    const errorInfo = {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    console.error('Global error caught:', errorInfo);

    // 防止默认错误处理
    return false;
  });

  // 未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    const errorInfo = {
      reason: event.reason,
      promise: event.promise,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    console.error('Unhandled promise rejection:', errorInfo);
  });
}

/**
 * 手动报告错误
 * @param {Error} error
 * @param {Object} context
 */
export function reportError(error, context = {}) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  console.error('Error reported:', errorInfo);
}
