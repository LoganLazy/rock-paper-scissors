/**
 * 历史记录组件
 */
import React, { useState } from 'react';
import { choices } from '../config.js';

/**
 * @param {{ rounds: Array, players: Array }} props
 */
export function History({ rounds, players }) {
  const [expanded, setExpanded] = useState(false);

  if (!rounds || rounds.length === 0) {
    return null;
  }

  const getChoiceIcon = (choiceKey) => {
    return choices.find((c) => c.key === choiceKey)?.icon || '?';
  };

  const getPlayerName = (playerId) => {
    return players.find((p) => p.id === playerId)?.name || '未知';
  };

  return (
    <section className="card history-card">
      <button className="history-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? '▼' : '▶'} 对战记录 ({rounds.length} 局)
      </button>
      {expanded && (
        <div className="history-list">
          {rounds.map((round, index) => {
            const [player1, player2] = players;
            const choice1 = round.choices[player1.id];
            const choice2 = round.choices[player2.id];
            const winner = round.winnerId
              ? getPlayerName(round.winnerId)
              : '平局';

            return (
              <div key={index} className="history-item">
                <span className="round-number">第 {index + 1} 局</span>
                <span className="round-choices">
                  {getChoiceIcon(choice1)} vs {getChoiceIcon(choice2)}
                </span>
                <span className={`round-winner ${!round.winnerId ? 'draw' : ''}`}>
                  {round.winnerId ? `${winner} 胜` : winner}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
