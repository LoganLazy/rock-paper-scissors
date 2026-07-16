/**
 * 主题切换组件
 * 支持亮色/暗色模式切换
 */
import React, { useState, useEffect } from 'react';

const THEME_STORAGE_KEY = 'rps_theme';

/**
 * @param {{ className?: string }} props
 */
export function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) return saved;

    // 检测系统偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={`切换到${theme === 'light' ? '暗色' : '亮色'}模式`}
      title={`切换到${theme === 'light' ? '暗色' : '亮色'}模式`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
