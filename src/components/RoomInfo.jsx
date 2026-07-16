/**
 * 房间信息组件
 */
import React, { useState } from 'react';
import { copyToClipboard, getRoomShareLink } from '../utils/share.js';

/**
 * @param {{ roomCode: string, onCopySuccess: () => void }} props
 */
export function RoomInfo({ roomCode, onCopySuccess }) {
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    if (copying) return;

    setCopying(true);
    const link = getRoomShareLink(roomCode);
    const success = await copyToClipboard(link);

    if (success) {
      onCopySuccess?.();
    }

    setTimeout(() => {
      setCopying(false);
    }, 2000);
  };

  return (
    <section className="card room-card">
      <div>
        <span className="muted">房间码</span>
        <strong>{roomCode}</strong>
      </div>
      <button onClick={handleCopy} disabled={copying}>
        {copying ? '已复制' : '复制链接'}
      </button>
    </section>
  );
}
