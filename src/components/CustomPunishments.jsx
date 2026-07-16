/**
 * 自定义惩罚管理组件
 */
import React, { useState } from 'react';
import { levelLabels, INPUT_LIMITS } from '../config.js';
import { validateCustomPunishment } from '../utils/validation.js';

/**
 * @param {{
 *   customPunishments: Array,
 *   myCustomCount: number,
 *   myPlayerId: string,
 *   onAdd: (level: string, text: string) => void,
 *   onRemove: (id: string) => void
 * }} props
 */
export function CustomPunishments({
  customPunishments,
  myCustomCount,
  myPlayerId,
  onAdd,
  onRemove,
}) {
  const [customPunishment, setCustomPunishment] = useState('');
  const [customLevel, setCustomLevel] = useState('L1');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const validation = validateCustomPunishment(customPunishment);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    if (myCustomCount >= INPUT_LIMITS.CUSTOM_PUNISHMENT_PER_PLAYER) {
      setError(`每人最多添加 ${INPUT_LIMITS.CUSTOM_PUNISHMENT_PER_PLAYER} 条`);
      return;
    }

    onAdd(customLevel, customPunishment.trim());
    setCustomPunishment('');
    setError('');
  };

  const handleInputChange = (value) => {
    setCustomPunishment(value);
    setError('');
  };

  return (
    <div className="custom-punishments">
      <label>
        自定义惩罚
        <div className="custom-row">
          <select value={customLevel} onChange={(e) => setCustomLevel(e.target.value)}>
            {Object.keys(levelLabels).map((level) => (
              <option key={level} value={level}>
                {levelLabels[level]}
              </option>
            ))}
          </select>
          <input
            value={customPunishment}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="比如：回答一个只想问 TA 的问题"
            maxLength={INPUT_LIMITS.CUSTOM_PUNISHMENT_MAX}
          />
          <button
            onClick={handleAdd}
            disabled={myCustomCount >= INPUT_LIMITS.CUSTOM_PUNISHMENT_PER_PLAYER}
          >
            添加
          </button>
        </div>
        {error && <span className="error-text">{error}</span>}
      </label>
      <p className="muted">
        自定义惩罚：{myCustomCount}/{INPUT_LIMITS.CUSTOM_PUNISHMENT_PER_PLAYER}
      </p>
      {customPunishments.length > 0 && (
        <div className="custom-list">
          {customPunishments.map((item) => (
            <button
              key={item.id}
              disabled={item.playerId !== myPlayerId}
              onClick={() => onRemove(item.id)}
            >
              {levelLabels[item.level]} · {item.text}
              {item.playerId === myPlayerId ? ' ×' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
