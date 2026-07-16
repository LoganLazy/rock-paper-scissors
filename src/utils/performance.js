/**
 * 性能监控工具
 * 监控页面加载时间和 Web Vitals 指标
 */

/**
 * 监控页面加载性能
 */
export function monitorPageLoad() {
  window.addEventListener('load', () => {
    // 使用 Performance API 获取性能数据
    if ('performance' in window && 'timing' in window.performance) {
      const perfData = window.performance.timing;
      const loadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domReady = perfData.domContentLoadedEventEnd - perfData.navigationStart;
      const firstPaint = perfData.responseStart - perfData.navigationStart;

      console.log('Performance Metrics:');
      console.log(`- Page Load Time: ${loadTime}ms`);
      console.log(`- DOM Ready: ${domReady}ms`);
      console.log(`- First Paint: ${firstPaint}ms`);

      // 可以发送到分析服务
      // sendPerformanceMetrics({ loadTime, domReady, firstPaint });
    }
  });
}

/**
 * 监控 Web Vitals（需要 web-vitals 库）
 * 这是一个简化版本，实际使用建议安装 web-vitals 包
 */
export function monitorWebVitals() {
  // Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP monitoring not supported');
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log('FID:', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID monitoring not supported');
    }
  }
}

/**
 * 初始化性能监控
 */
export function initPerformanceMonitoring() {
  monitorPageLoad();
  monitorWebVitals();
}
