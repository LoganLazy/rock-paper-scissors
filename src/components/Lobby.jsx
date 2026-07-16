/**
 * 大厅组件 - 创建和加入房间
 */
import React, { useState } from 'react';
import { BEST_OF_OPTIONS } from '../config.js';
import { validateName, validateRoomCode } from '../utils/validation.js';

/**
 * @param {{
 *   onCreateRoom: (name: string, bestOf: number) => void,
 *   onJoinRoom: (name: string, code: string) => void,
 *   initialJoinCode?: string,
 *   isLoading?: boolean
 * }} props
 */
export function Lobby({ onCreateRoom, onJoinRoom, initialJoinCode = '', isLoading = false }) {
  const [name, setName] = useState('');
  const [bestOf, setBestOf] = useState(3);
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [nameError, setNameError] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleNameChange = (value) => {
    setName(value);
    setNameError('');
  };

  const handleJoinCodeChange = (value) => {
    setJoinCode(value.toUpperCase());
    setCodeError('');
  };

  const handleCreateRoom = () => {
    const validation = validateName(name || '玩家1');
    if (!validation.valid) {
      setNameError(validation.error);
      return;
    }
    onCreateRoom(name || '玩家1', bestOf);
  };

  const handleJoinRoom = () => {
    const nameValidation = validateName(name || '玩家2');
    if (!nameValidation.valid) {
      setNameError(nameValidation.error);
      return;
    }

    const codeValidation = validateRoomCode(joinCode);
    if (!codeValidation.valid) {
      setCodeError(codeValidation.error);
      return;
    }

    onJoinRoom(name || '玩家2', joinCode);
  };

  return (
    <section className="card lobby">
      <label>
        你的昵称
        <input
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="比如：玩家A"
          disabled={isLoading}
        />
        {nameError && <span className="error-text">{nameError}</span>}
      </label>

      <div className="segmented">
        {BEST_OF_OPTIONS.map((value) => (
          <button
            key={value}
            className={bestOf === value ? 'active' : ''}
            onClick={() => setBestOf(value)}
            disabled={isLoading}
          >
            {value} 局 {Math.ceil(value / 2)} 胜
          </button>
        ))}
      </div>

      <button className="primary" onClick={handleCreateRoom} disabled={isLoading}>
        {isLoading ? '创建中...' : '创建房间'}
      </button>

      <div className="join-row">
        <input
          value={joinCode}
          onChange={(e) => handleJoinCodeChange(e.target.value)}
          placeholder="输入房间码"
          disabled={isLoading}
        />
        <button onClick={handleJoinRoom} disabled={isLoading}>
          {isLoading ? '加入中...' : '加入'}
        </button>
      </div>
      {codeError && <span className="error-text">{codeError}</span>}
    </section>
  );
}
