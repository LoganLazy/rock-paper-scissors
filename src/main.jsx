import React, { useEffect, useState, useMemo, useRef, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { ConnectionStatus } from './components/ConnectionStatus.jsx';
import { ToastContainer } from './components/Toast.jsx';
import { Lobby } from './components/Lobby.jsx';
import { RoomInfo } from './components/RoomInfo.jsx';
import { ScoreBoard } from './components/ScoreBoard.jsx';
import { GamePlay } from './components/GamePlay.jsx';
import { SoundSettings } from './components/SoundSettings.jsx';
import { Statistics } from './components/Statistics.jsx';
import { ThemeToggle } from './components/ThemeToggle.jsx';
import { useWebSocket } from './hooks/useWebSocket.jsx';
import { useNetworkStatus } from './hooks/useNetworkStatus.js';
import { punishments, stageLevels, SOUND_CONFIG } from './config.js';
import { soundManager } from './utils/sounds.js';
import { initErrorTracking } from './utils/errorTracking.js';
import { initPerformanceMonitoring } from './utils/performance.js';

// 初始化错误追踪和性能监控（仅生产环境）
const isProd = import.meta.env.MODE === 'production';
if (isProd) {
  initErrorTracking();
  initPerformanceMonitoring();
}

// 懒加载非首屏组件 - 使用命名导出
const Punishment = lazy(() => import('./components/Punishment.jsx').then(module => ({ default: module.Punishment })));
const History = lazy(() => import('./components/History.jsx').then(module => ({ default: module.History })));

function App() {
  const ws = useWebSocket();
  const { isOnline, wasOffline } = useNetworkStatus();
  const [playerId, setPlayerId] = useState('');
  const [room, setRoom] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [readyIds, setReadyIds] = useState([]);
  const [myChoice, setMyChoice] = useState('');
  const [punishmentRound, setPunishmentRound] = useState(1);
  const [rematchBestOf, setRematchBestOf] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  // 上一次收到的房间状态（轮数、阶段），用于判断 state 广播是否意味着新一局开始；
  // 只有新一局开始时才重置出拳状态，避免对局中其他广播（如加自定义惩罚）清空已出拳
  const prevRoomRef = useRef({ rounds: -1, status: '' });
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem(SOUND_CONFIG.ENABLED_KEY) === 'true' || SOUND_CONFIG.DEFAULT_ENABLED
  );

  // 网络状态监控
  useEffect(() => {
    if (!isOnline) {
      showToast('网络连接已断开', 'error');
    } else if (wasOffline) {
      showToast('网络已恢复', 'success');
    }
  }, [isOnline, wasOffline]);

  // 获取 URL 参数中的房间码
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      // URL 参数会被 Lobby 组件使用
    }
  }, []);

  // 设置消息处理器
  useEffect(() => {
    ws.onMessage((message) => {
      setIsLoading(false);

      if (message.type === 'error') {
        showToast(message.message, 'error');
        return;
      }

      if (message.type === 'joined') {
        setPlayerId(message.playerId);
        setRoom(message.room);
        setRoomCode(message.room.code);
        setReadyIds([]);
        setMyChoice('');
        prevRoomRef.current = {
          rounds: message.room.rounds?.length ?? 0,
          status: message.room.status,
        };
        ws.saveState(message.playerId, message.room.code, getCurrentPlayerName(message.room, message.playerId), message.rejoinToken);
        return;
      }

      if (message.type === 'state') {
        const roundsLen = message.room.rounds?.length ?? 0;
        const prev = prevRoomRef.current;
        // 只有两种情况算新一局开始：刚判完一局（轮数增加），或新系列开始
        // （阶段从 waiting/finished 变成 playing 且轮数为空）；其他 state 广播
        // （如对方加自定义惩罚、确认重赛）只更新房间，不动出拳状态
        const roundJustFinished = roundsLen > prev.rounds;
        const seriesJustStarted =
          message.room.status === 'playing' && prev.status !== 'playing' && roundsLen === 0;
        if (roundJustFinished || seriesJustStarted) {
          setReadyIds([]);
          setMyChoice('');
          if (!message.room.punishment && seriesJustStarted) {
            setPunishmentRound(1);
          }
        }
        prevRoomRef.current = { rounds: roundsLen, status: message.room.status };
        setRoom(message.room);
        setRoomCode(message.room.code);
        return;
      }

      if (message.type === 'choiceStatus') {
        setReadyIds(message.readyIds);
      }

      if (message.type === 'roomClosed') {
        showToast(message.reason || '房间已关闭', 'error');
        handleLeaveRoom();
      }
    });
  }, [ws]);

  // 打开页面时自动重连回旧房间：本地存着重连凭证就直接连上，连接建立后
  // useWebSocket 会自动发 rejoin。没有存凭证时什么都不做，停留在大厅。
  // 放在消息处理器注册之后，确保重连回来的 joined/state 消息有人处理。
  // 只执行一次（ws 对象会随连接状态变化而变化，用 ref 守门）。
  const autoRejoinDoneRef = useRef(false);
  useEffect(() => {
    if (autoRejoinDoneRef.current) return;
    autoRejoinDoneRef.current = true;
    const saved = ws.savedState;
    if (saved?.playerId && saved?.roomCode && saved?.rejoinToken) {
      ws.connect();
    }
  }, [ws]);

  const getCurrentPlayerName = (room, playerId) => {
    return room?.players.find((p) => p.id === playerId)?.name || '';
  };

  const me = room?.players.find((player) => player.id === playerId);
  const opponent = room?.players.find((player) => player.id !== playerId);
  const loser = room?.players.find((player) => player.id === room.loserId);
  const isLoser = room?.loserId === playerId;
  const targetWins = Math.ceil((room?.bestOf || 3) / 2);

  const stageIndex = Math.min(punishmentRound - 1, stageLevels.length - 1);
  const unlockedLevels = stageLevels[stageIndex];
  const customPunishments = room?.customPunishments || [];
  const myCustomCount = customPunishments.filter((item) => item.playerId === playerId).length;

  const availablePunishments = useMemo(
    () => [...punishments, ...customPunishments].filter((item) => unlockedLevels.includes(item.level)),
    [customPunishments, unlockedLevels]
  );

  const lastRound = room?.rounds[room.rounds.length - 1];
  const lastRoundResult = lastRound
    ? lastRound.winnerId
      ? `上局：${room.players.find((p) => p.id === lastRound.winnerId)?.name} 赢了`
      : '上局：平局'
    : null;

  // Toast 管理
  const showToast = (message, type = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 房间操作
  const handleCreateRoom = (name, bestOf) => {
    setIsLoading(true);
    ws.connect((socket) => {
      socket.send(JSON.stringify({ type: 'create', name, bestOf }));
    }, { skipAutoRejoin: true });
  };

  const handleJoinRoom = (name, code) => {
    setIsLoading(true);
    ws.connect((socket) => {
      socket.send(JSON.stringify({ type: 'join', name, code }));
    }, { skipAutoRejoin: true });
  };

  const handleLeaveRoom = () => {
    // 必须先断开连接：服务端的“在房间中”状态是按连接记的，
    // 只清本地状态不关 socket，下一条 join 仍会在同一条连接上被拒绝。
    // 断开后服务端把该玩家标为离线；下次 join 会建新连接，不再受旧房间影响。
    // clearState 则阻止下次连接时自动 rejoin 回旧房间。
    ws.disconnect();
    ws.clearState();
    setRoom(null);
    setRoomCode('');
    setPlayerId('');
    setReadyIds([]);
    setMyChoice('');
    setPunishmentRound(1);
  };

  // 游戏操作
  const handleChoose = (choice) => {
    // 用连接状态判断，不用 ws.socket（ref 不触发渲染，引用不可靠）
    if (ws.status !== 'connected' || myChoice) return;
    setMyChoice(choice);
    soundManager.play('choose');
    ws.send({ type: 'choose', choice });
  };

  // 惩罚操作
  const handleSpin = (result) => {
    setPunishmentRound((round) => Math.min(round + 1, 3));
    ws.send({ type: 'punishment', punishment: result });
  };

  const handleAddCustom = (level, text) => {
    // 不立即弹成功提示：成功时界面随 state 广播自然更新，失败时服务端会返回 error
    ws.send({ type: 'customPunishment', level, text });
  };

  const handleRemoveCustom = (id) => {
    // 不立即弹成功提示：成功时界面随 state 广播自然更新，失败时服务端会返回 error
    ws.send({ type: 'removeCustomPunishment', id });
  };

  // 重赛操作
  const handleConfirmRematch = () => {
    ws.send({ type: 'rematch', bestOf: rematchBestOf });
  };

  // 分享操作
  const handleCopySuccess = () => {
    showToast('已复制到剪贴板', 'success');
  };

  // 从 URL 获取初始房间码；没有邀请链接时，用本地存着的房间码，
  // 这样重连失败落回大厅时也能一键重试加入同一个房间
  const urlJoinCode = new URLSearchParams(window.location.search).get('room')?.toUpperCase() || '';
  const initialJoinCode = urlJoinCode || ws.savedState?.roomCode || '';
  const initialName = ws.savedState?.name || '';

  // 注册 Service Worker (PWA 支持)
  useEffect(() => {
    const isProd = import.meta.env.MODE === 'production';
    if ('serviceWorker' in navigator && isProd) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration);
          })
          .catch((error) => {
            console.log('SW registration failed:', error);
          });
      });
    }
  }, []);

  return (
    <main className="app">
      <ConnectionStatus status={ws.status} />

      {soundEnabled !== null && (
        <div className="settings-bar">
          <SoundSettings enabled={soundEnabled} onChange={setSoundEnabled} />
          <ThemeToggle />
        </div>
      )}

      <section className="hero card">
        <p className="eyebrow">1v1 转盘惩罚小游戏</p>
        <h1>石头剪刀布</h1>
        <p>创建房间发给 TA，三局两胜或五局三胜，输了转趣味惩罚盘。</p>
      </section>

      {!room && (
        <Lobby
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          initialJoinCode={initialJoinCode}
          initialName={initialName}
          isLoading={isLoading}
        />
      )}

      {room && (
        <>
          <RoomInfo roomCode={roomCode} onCopySuccess={handleCopySuccess} onLeaveRoom={handleLeaveRoom} />

          <ScoreBoard
            myName={me?.name}
            myScore={room.scores[playerId] || 0}
            opponentName={opponent?.name}
            opponentScore={opponent ? room.scores[opponent.id] || 0 : 0}
            targetWins={targetWins}
          />

          {room.status === 'waiting' && (
            <section className="card notice">把房间码或链接发给对方，等 TA 加入后开始。</section>
          )}

          {room.status === 'playing' && (
            <GamePlay
              onChoose={handleChoose}
              myChoice={myChoice}
              readyCount={readyIds.length}
              lastRoundResult={lastRoundResult}
            />
          )}

          {room.status === 'finished' && (
            <Suspense fallback={<div className="card notice">加载中...</div>}>
              <Punishment
                loserName={loser?.name}
                isLoser={isLoser}
                unlockedLevels={unlockedLevels}
                availablePunishments={availablePunishments}
                customPunishments={customPunishments}
                myCustomCount={myCustomCount}
                myPlayerId={playerId}
                currentPunishment={room.punishment}
                punishmentRound={punishmentRound}
                onSpin={handleSpin}
                onAddCustom={handleAddCustom}
                onRemoveCustom={handleRemoveCustom}
                selectedBestOf={rematchBestOf}
                onSelectBestOf={setRematchBestOf}
                onConfirmRematch={handleConfirmRematch}
                rematchInfo={room.rematch ? { bestOf: room.rematch.bestOf, readyCount: room.rematch.readyIds.length } : null}
              />
            </Suspense>
          )}

          <Suspense fallback={null}>
            <History rounds={room.rounds} players={room.players} />
          </Suspense>

          {room.rounds && room.rounds.length > 0 && (
            <Statistics rounds={room.rounds} players={room.players} myId={playerId} />
          )}
        </>
      )}

      {ws.error && <p className="error">{ws.error}</p>}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
