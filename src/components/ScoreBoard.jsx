/**
 * 比分牌组件
 */
import React from 'react';

/**
 * @param {{
 *   myName: string,
 *   myScore: number,
 *   opponentName: string,
 *   opponentScore: number,
 *   targetWins: number
 * }} props
 */
export function ScoreBoard({ myName, myScore, opponentName, opponentScore, targetWins }) {
  return (
    <section className="card score-card">
      <div className="player-box">
        <span>{myName || '你'}</span>
        <strong>{myScore}</strong>
      </div>
      <div className="versus">先到 {targetWins} 胜</div>
      <div className="player-box">
        <span>{opponentName || '等待对方'}</span>
        <strong>{opponentName ? opponentScore : '-'}</strong>
      </div>
    </section>
  );
}
