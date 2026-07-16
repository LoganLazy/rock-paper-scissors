/**
 * 游戏统计组件
 * 显示当前对战的详细统计数据
 */
import React, { useMemo, useState } from 'react';
import { choices } from '../config.js';

/**
 * @param {{ rounds: Array, players: Array, myId: string }} props
 */
export function Statistics({ rounds, players, myId }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const stats = useMemo(() => {
    if (!rounds || rounds.length === 0) return null;

    const opponent = players.find(p => p.id !== myId);
    if (!opponent) return null;

    let myWins = 0;
    let opponentWins = 0;
    let draws = 0;
    const myChoices = { rock: 0, paper: 0, scissors: 0 };
    const opponentChoices = { rock: 0, paper: 0, scissors: 0 };

    rounds.forEach(round => {
      if (round.winnerId === myId) {
        myWins++;
      } else if (round.winnerId === opponent.id) {
        opponentWins++;
      } else {
        draws++;
      }

      const myChoice = round.choices[myId];
      const oppChoice = round.choices[opponent.id];

      if (myChoice) myChoices[myChoice]++;
      if (oppChoice) opponentChoices[oppChoice]++;
    });

    // 计算最爱出的选择
    const getMostUsed = (choicesMap) => {
      const entries = Object.entries(choicesMap);
      if (entries.every(([, count]) => count === 0)) return '无';

      const [choice] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
      const choiceObj = choices.find(c => c.key === choice);
      return choiceObj ? `${choiceObj.icon} ${choiceObj.label}` : choice;
    };

    return {
      myWins,
      opponentWins,
      draws,
      totalRounds: rounds.length,
      myMostUsed: getMostUsed(myChoices),
      opponentMostUsed: getMostUsed(opponentChoices),
      opponentName: opponent.name
    };
  }, [rounds, players, myId]);

  if (!stats) return null;

  return (
    <section className="card history-card">
      <button
        className="history-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        📊 对战统计 {isExpanded ? '▼' : '▶'}
      </button>

      {isExpanded && (
        <div className="stats-content">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">总局数</span>
              <span className="stat-value">{stats.totalRounds}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">我赢</span>
              <span className="stat-value stat-win">{stats.myWins}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">对方赢</span>
              <span className="stat-value stat-lose">{stats.opponentWins}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">平局</span>
              <span className="stat-value stat-draw">{stats.draws}</span>
            </div>
          </div>

          <div className="stats-preferences">
            <div className="preference-item">
              <span className="preference-label">我最爱出：</span>
              <span className="preference-value">{stats.myMostUsed}</span>
            </div>
            <div className="preference-item">
              <span className="preference-label">{stats.opponentName}最爱出：</span>
              <span className="preference-value">{stats.opponentMostUsed}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
