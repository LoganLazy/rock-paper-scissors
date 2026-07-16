/**
 * 连接状态指示器组件
 */
import React from 'react';

/**
 * @param {{ status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' }} props
 */
export function ConnectionStatus({ status }) {
  const statusConfig = {
    connected: { text: '已连接', className: 'status-connected' },
    disconnected: { text: '已断开', className: 'status-disconnected' },
    connecting: { text: '连接中...', className: 'status-connecting' },
    reconnecting: { text: '重连中...', className: 'status-reconnecting' },
  };

  const config = statusConfig[status] || statusConfig.disconnected;

  return (
    <div className={`connection-status ${config.className}`}>
      <span className="status-dot"></span>
      {config.text}
    </div>
  );
}
