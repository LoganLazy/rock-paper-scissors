/**
 * WebSocket 连接管理 Hook
 * 支持自动断线重连、心跳检测、状态持久化
 */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { getWebSocketUrl, WS_CONFIG } from '../config.js';

const STORAGE_KEYS = {
  PLAYER_ID: 'rps_player_id',
  ROOM_CODE: 'rps_room_code',
  PLAYER_NAME: 'rps_player_name',
  REJOIN_TOKEN: 'rps_rejoin_token',
};

/**
 * @typedef {'disconnected' | 'connecting' | 'connected' | 'reconnecting'} ConnectionStatus
 */

/**
 * WebSocket 连接管理 Hook
 * @returns {{
 *   socket: WebSocket | null,
 *   status: ConnectionStatus,
 *   error: string,
 *   connect: (onOpen: Function) => void,
 *   disconnect: () => void,
 *   send: (data: any) => void,
 *   onMessage: (handler: Function) => void,
 *   savedState: { playerId: string | null, roomCode: string | null, name: string | null, rejoinToken: string | null },
 *   saveState: (playerId: string, roomCode: string, name: string, rejoinToken?: string) => void,
 *   clearState: () => void,
 * }}
 */
export function useWebSocket() {
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const heartbeatTimeoutRef = useRef(null);
  const messageHandlerRef = useRef(null);
  const onOpenCallbackRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectDelayRef = useRef(WS_CONFIG.RECONNECT_DELAY_MIN);
  const intentionalCloseRef = useRef(false);
  // 显式建房/加房时跳过一次自动 rejoin：连接打开后先发 rejoin 会抢占
  // 本次显式操作（同一条连接只能在一个房间，join 会被服务端以
  // “已在房间中，请先离开”拒绝）。该标志只消费一次，断线重连时
  // 自动 rejoin 照常工作。
  const skipAutoRejoinRef = useRef(false);

  const [status, setStatus] = useState('disconnected');
  const [error, setError] = useState('');

  /**
   * 保存状态到 localStorage（重连凭证只存本地，绝不发给除服务端外的任何人）
   */
  const saveState = useCallback((playerId, roomCode, name, rejoinToken) => {
    localStorage.setItem(STORAGE_KEYS.PLAYER_ID, playerId);
    localStorage.setItem(STORAGE_KEYS.ROOM_CODE, roomCode);
    localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
    if (rejoinToken) {
      localStorage.setItem(STORAGE_KEYS.REJOIN_TOKEN, rejoinToken);
    }
  }, []);

  /**
   * 清除保存的状态
   */
  const clearState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
    localStorage.removeItem(STORAGE_KEYS.ROOM_CODE);
    localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
    localStorage.removeItem(STORAGE_KEYS.REJOIN_TOKEN);
  }, []);

  /**
   * 获取保存的状态
   */
  const getSavedState = useCallback(() => {
    return {
      playerId: localStorage.getItem(STORAGE_KEYS.PLAYER_ID),
      roomCode: localStorage.getItem(STORAGE_KEYS.ROOM_CODE),
      name: localStorage.getItem(STORAGE_KEYS.PLAYER_NAME),
      rejoinToken: localStorage.getItem(STORAGE_KEYS.REJOIN_TOKEN),
    };
  }, []);

  /**
   * 启动心跳检测
   */
  const startHeartbeat = useCallback(() => {
    stopHeartbeat();

    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ping' }));

        // 设置心跳超时
        heartbeatTimeoutRef.current = setTimeout(() => {
          console.warn('Heartbeat timeout, reconnecting...');
          socketRef.current?.close();
        }, WS_CONFIG.HEARTBEAT_TIMEOUT);
      }
    }, WS_CONFIG.HEARTBEAT_INTERVAL);
  }, []);

  /**
   * 停止心跳检测
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  /**
   * 处理 pong 响应
   */
  const handlePong = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  /**
   * 连接 WebSocket
   * @param {Function} onOpen 连接建立后调用（发送本次显式操作）
   * @param {{ skipAutoRejoin?: boolean }} [options] skipAutoRejoin 为 true 时，
   *   本次连接不发自动 rejoin——用于显式建房/加房，让本次操作优先于本地存着的旧房间
   */
  const connect = useCallback((onOpen, options) => {
    // 如果已经连接，直接调用回调
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      onOpen?.(socketRef.current);
      return;
    }

    // 保存回调以便重连时使用
    onOpenCallbackRef.current = onOpen;

    // 显式操作本次跳过自动 rejoin；标志只消费一次
    skipAutoRejoinRef.current = Boolean(options?.skipAutoRejoin);

    // 清除之前的重连定时器
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    intentionalCloseRef.current = false;
    setStatus('connecting');
    setError('');

    try {
      const socket = new WebSocket(getWebSocketUrl());
      socketRef.current = socket;

      socket.onopen = () => {
        setStatus('connected');
        setError('');
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = WS_CONFIG.RECONNECT_DELAY_MIN;

        // 启动心跳
        startHeartbeat();

        // 尝试自动重新加入房间（带服务端签发的重连凭证）；
        // 显式建房/加房的本次连接跳过 rejoin，让本次操作优先
        const skipRejoin = skipAutoRejoinRef.current;
        skipAutoRejoinRef.current = false;
        const savedState = getSavedState();
        if (!skipRejoin && savedState.playerId && savedState.roomCode && savedState.rejoinToken) {
          socket.send(
            JSON.stringify({
              type: 'rejoin',
              playerId: savedState.playerId,
              code: savedState.roomCode,
              rejoinToken: savedState.rejoinToken,
            })
          );
        }

        onOpenCallbackRef.current?.(socket);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // 处理 pong 消息
          if (message.type === 'pong') {
            handlePong();
            return;
          }

          // 处理 rejoin 失败 - 清除旧状态
          if (message.type === 'error' && (message.message.includes('房间不存在') || message.message.includes('房间已关闭') || message.message.includes('重连验证失败'))) {
            clearState();
          }

          // 调用用户定义的消息处理器
          messageHandlerRef.current?.(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('连接错误');
      };

      socket.onclose = (event) => {
        stopHeartbeat();

        // 如果是主动关闭，不重连
        if (intentionalCloseRef.current) {
          setStatus('disconnected');
          return;
        }

        // 检查是否达到最大重连次数
        if (reconnectAttemptsRef.current >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
          setStatus('disconnected');
          setError('连接失败，请刷新页面重试');
          return;
        }

        // 安排重连
        setStatus('reconnecting');
        setError(`连接断开，正在重连 (${reconnectAttemptsRef.current + 1}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS})...`);

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          reconnectDelayRef.current = Math.min(
            reconnectDelayRef.current * 2,
            WS_CONFIG.RECONNECT_DELAY_MAX
          );
          connect(onOpenCallbackRef.current);
        }, reconnectDelayRef.current);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setStatus('disconnected');
      setError('无法建立连接');
    }
  }, [startHeartbeat, stopHeartbeat, handlePong, getSavedState]);

  /**
   * 断开连接
   */
  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    stopHeartbeat();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setStatus('disconnected');
    setError('');
  }, [stopHeartbeat]);

  /**
   * 发送消息
   */
  const send = useCallback((data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected, cannot send message');
    }
  }, []);

  /**
   * 设置消息处理器
   */
  const onMessage = useCallback((handler) => {
    messageHandlerRef.current = handler;
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      intentionalCloseRef.current = true;
      stopHeartbeat();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [stopHeartbeat]);

  // 返回对象用 useMemo 固定引用，避免调用方 useEffect([ws]) 每渲染都重注册消息处理器
  // 注意：socketRef.current 不触发渲染，返回的 socket 字段可能滞后；
  // 判断连接状态请用 status（connected），不要用 socket 是否为 null
  return useMemo(() => ({
    socket: socketRef.current,
    status,
    error,
    connect,
    disconnect,
    send,
    onMessage,
    savedState: getSavedState(),
    saveState,
    clearState,
  }), [status, error, connect, disconnect, send, onMessage, getSavedState, saveState, clearState]);
}
