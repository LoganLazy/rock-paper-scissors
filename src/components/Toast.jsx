/**
 * Toast 提示组件
 */
import React, { useEffect } from 'react';
import { ANIMATION_CONFIG } from '../config.js';

/**
 * @typedef {'success' | 'error' | 'info'} ToastType
 */

/**
 * Toast 组件
 * @param {{ message: string, type: ToastType, onClose: () => void, duration?: number }} props
 */
export function Toast({ message, type = 'info', onClose, duration = ANIMATION_CONFIG.TOAST_DURATION }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {message}
    </div>
  );
}

/**
 * Toast 容器组件
 * @param {{ toasts: Array<{ id: string, message: string, type: ToastType }>, onRemove: (id: string) => void }} props
 */
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
