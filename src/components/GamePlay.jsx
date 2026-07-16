/**
 * 游戏界面组件 - 出拳选择
 */
import React from 'react';
import { choices } from '../config.js';

/**
 * @param {{
 *   onChoose: (choice: string) => void,
 *   myChoice: string,
 *   readyCount: number,
 *   lastRoundResult: string | null
 * }} props
 */
export function GamePlay({ onChoose, myChoice, readyCount, lastRoundResult }) {
  return (
    <section className="card game-card">
      <h2>{myChoice ? '已出拳，等待对方' : '请选择你的出拳'}</h2>
      <div className="choices">
        {choices.map((choice) => (
          <button
            key={choice.key}
            disabled={Boolean(myChoice)}
            className={myChoice === choice.key ? 'chosen' : ''}
            onClick={() => onChoose(choice.key)}
          >
            <span>{choice.icon}</span>
            {choice.label}
          </button>
        ))}
      </div>
      <p className="muted">{readyCount}/2 人已出拳</p>
      {lastRoundResult && (
        <div className="round-result">{lastRoundResult}</div>
      )}
    </section>
  );
}
