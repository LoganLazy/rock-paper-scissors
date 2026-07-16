/**
 * 音效设置组件
 */
import React from 'react';
import { soundManager } from '../utils/sounds.js';

/**
 * @param {{ enabled: boolean, onChange: (enabled: boolean) => void }} props
 */
export function SoundSettings({ enabled, onChange }) {
  const handleToggle = () => {
    const newState = !enabled;
    soundManager.setEnabled(newState);
    onChange(newState);

    // 播放测试音效
    if (newState) {
      soundManager.play('choose');
    }
  };

  return (
    <button className="sound-toggle" onClick={handleToggle} title={enabled ? '关闭音效' : '开启音效'}>
      {enabled ? '🔊' : '🔇'}
    </button>
  );
}
