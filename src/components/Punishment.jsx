/**
 * 惩罚转盘组件
 */
import React, { useState, useEffect } from 'react';
import { levelLabels, ANIMATION_CONFIG } from '../config.js';
import { CustomPunishments } from './CustomPunishments.jsx';
import { RematchControl } from './RematchControl.jsx';
import { soundManager } from '../utils/sounds.js';

/**
 * @param {{
 *   loserName: string,
 *   isLoser: boolean,
 *   unlockedLevels: Array<string>,
 *   availablePunishments: Array,
 *   customPunishments: Array,
 *   myCustomCount: number,
 *   myPlayerId: string,
 *   currentPunishment: object | null,
 *   punishmentRound: number,
 *   onSpin: (result: object) => void,
 *   onAddCustom: (level: string, text: string) => void,
 *   onRemoveCustom: (id: string) => void,
 *   selectedBestOf: number,
 *   onSelectBestOf: (bestOf: number) => void,
 *   onConfirmRematch: () => void,
 *   rematchInfo: object | null
 * }} props
 */
export function Punishment({
  loserName,
  isLoser,
  unlockedLevels,
  availablePunishments,
  customPunishments,
  myCustomCount,
  myPlayerId,
  currentPunishment,
  punishmentRound,
  onSpin,
  onAddCustom,
  onRemoveCustom,
  selectedBestOf,
  onSelectBestOf,
  onConfirmRematch,
  rematchInfo,
}) {
  const [spinning, setSpinning] = useState(false);
  const [tempResult, setTempResult] = useState(null);
  const [wheelResult, setWheelResult] = useState(null);

  useEffect(() => {
    if (currentPunishment) {
      setWheelResult(currentPunishment);
      setTempResult(null);
    }
  }, [currentPunishment]);

  const getRandomPunishment = () => {
    return availablePunishments[Math.floor(Math.random() * availablePunishments.length)];
  };

  const handleSpin = async () => {
    if (!isLoser || spinning || currentPunishment) return;

    setSpinning(true);
    setWheelResult(null);
    setTempResult(null);

    soundManager.play('spin');

    // 阶段1：快速切换
    const fastInterval = setInterval(() => {
      setTempResult(getRandomPunishment());
    }, ANIMATION_CONFIG.WHEEL_FAST_INTERVAL);

    await new Promise((resolve) => setTimeout(resolve, ANIMATION_CONFIG.WHEEL_SPIN_DURATION));
    clearInterval(fastInterval);

    // 阶段2：减速
    for (let i = 0; i < 4; i++) {
      await new Promise((resolve) =>
        setTimeout(resolve, ANIMATION_CONFIG.WHEEL_FAST_INTERVAL + i * 50)
      );
      setTempResult(getRandomPunishment());
    }

    // 阶段3：显示结果
    const finalResult = availablePunishments[
      Math.floor(Math.random() * availablePunishments.length)
    ];

    setWheelResult(finalResult);
    setTempResult(null);
    setSpinning(false);

    soundManager.play('result');

    // 通知父组件
    onSpin(finalResult);
  };

  const displayResult = currentPunishment || wheelResult || tempResult;
  // 防御：惩罚内容只渲染字符串，非字符串（如服务端漏网的非法数据）一律不渲染，
  // 避免 React 因渲染对象子节点而抛错、导致整站被 ErrorBoundary 兜底
  const displayLevel = typeof displayResult?.level === 'string' ? displayResult.level : '';
  const displayText = typeof displayResult?.text === 'string' ? displayResult.text : '';

  return (
    <section className="card punishment-card">
      <h2>{loserName} 输了，转盘惩罚</h2>

      <div className="level-banner">
        <strong>当前转盘：{unlockedLevels.map((level) => levelLabels[level]).join(' + ')}</strong>
      </div>

      <CustomPunishments
        customPunishments={customPunishments}
        myCustomCount={myCustomCount}
        myPlayerId={myPlayerId}
        onAdd={onAddCustom}
        onRemove={onRemoveCustom}
      />

      <div className={`wheel ${spinning ? 'spinning' : ''} ${wheelResult ? 'result-shown' : ''}`}>
        {displayResult ? (
          <div>
            <strong>{displayLevel}</strong>
            <span>{displayText}</span>
          </div>
        ) : (
          <div>甜蜜转盘</div>
        )}
      </div>

      {isLoser ? (
        <button
          className="primary"
          onClick={handleSpin}
          disabled={spinning || Boolean(currentPunishment)}
        >
          {spinning ? '转盘中...' : '开始转盘'}
        </button>
      ) : (
        <p className="muted">等待输家转盘。</p>
      )}

      <RematchControl
        selectedBestOf={selectedBestOf}
        onSelectBestOf={onSelectBestOf}
        onConfirm={onConfirmRematch}
        rematchInfo={rematchInfo}
        isLoading={false}
      />
    </section>
  );
}
