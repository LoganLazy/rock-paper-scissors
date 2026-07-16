/**
 * 重赛控制组件
 */
import React from 'react';
import { BEST_OF_OPTIONS } from '../config.js';

/**
 * @param {{
 *   selectedBestOf: number,
 *   onSelectBestOf: (bestOf: number) => void,
 *   onConfirm: () => void,
 *   rematchInfo: { bestOf: number, readyCount: number } | null,
 *   isLoading: boolean
 * }} props
 */
export function RematchControl({
  selectedBestOf,
  onSelectBestOf,
  onConfirm,
  rematchInfo,
  isLoading,
}) {
  const isWaitingForOther = rematchInfo && rematchInfo.readyCount === 1;
  const bothReady = rematchInfo && rematchInfo.readyCount === 2;

  return (
    <div className="rematch-box">
      <h3>重赛</h3>
      <p className="muted">选择局数并点击确认，双方都确认相同局数后开始新游戏</p>

      <div className="segmented">
        {BEST_OF_OPTIONS.map((value) => (
          <button
            key={value}
            className={selectedBestOf === value ? 'active' : ''}
            onClick={() => onSelectBestOf(value)}
            disabled={isLoading || isWaitingForOther}
          >
            {value} 局
          </button>
        ))}
      </div>

      <button
        onClick={onConfirm}
        disabled={isLoading || isWaitingForOther}
        className="primary"
      >
        {isLoading ? '确认中...' :
         isWaitingForOther ? '等待对方确认...' :
         `确认再来 ${selectedBestOf} 局`}
      </button>

      {rematchInfo && (
        <p className="muted" style={{ marginTop: '8px', fontSize: '14px' }}>
          {bothReady ?
            '✅ 双方已确认，游戏即将开始...' :
            `⏳ ${rematchInfo.readyCount}/2 人已确认 ${rematchInfo.bestOf} 局`
          }
        </p>
      )}
    </div>
  );
}
