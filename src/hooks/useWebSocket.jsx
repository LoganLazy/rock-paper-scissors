/**
 * WebSocket 连接管理 Hook
 * 支持自动断线重连、心跳检测、状态持久化
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { getWebSocketUrl, WS_CONFIG } from '../config.js';

const STORAGE_KEYS = {
  PLAYER_ID: 'rps_player_id',
  ROOM_CODE: 'rps_room_code',
  PLAYER_NAME: 'rps_player_name',
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
 *   savedState: { playerId: string | null, roomCode: string | null, name: string | null },
 *   saveState: (playerId: string, roomCode: string, name: string) => void,
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

  const [status, setStatus] = useState('disconnected');
  const [error, setError] = useState('');

  /**
   * 保存状态到 localStorage
   */
  const saveState = useCallback((playerId, roomCode, name) => {
    localStorage.setItem(STORAGE_KEYS.PLAYER_ID, playerId);
    localStorage.setItem(STORAGE_KEYS.ROOM_CODE, roomCode);
    localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
  }, []);

  /**
   * 清除保存的状态
   */
  const clearState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
    localStorage.removeItem(STORAGE_KEYS.ROOM_CODE);
    localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
  }, []);

  /**
   * 获取保存的状态
   */
  const getSavedState = useCallback(() => {
    return {
      playerId: localStorage.getItem(STORAGE_KEYS.PLAYER_ID),
      roomCode: localStorage.getItem(STORAGE_KEYS.ROOM_CODE),
      name: localStorage.getItem(STORAGE_KEYS.PLAYER_NAME),
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
   */
  const connect = useCallback((onOpen) => {
    // 如果已经连接，直接调用回调
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      onOpen?.(socketRef.current);
      return;
    }

    // 保存回调以便重连时使用
    onOpenCallbackRef.current = onOpen;

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
        console.log('✅ WebSocket connected');
        console.log('Current status before setState:', status);
        setStatus('connected');
        console.log('Status set to: connected');
        setError('');
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = WS_CONFIG.RECONNECT_DELAY_MIN;

        // 启动心跳
        startHeartbeat();
        console.log('❤️ Heartbeat started');

        // 尝试自动重新加入房间
        const savedState = getSavedState();
        console.log('Saved state:', savedState);
        if (savedState.playerId && savedState.roomCode) {
          console.log('Attempting to rejoin room:', savedState.roomCode);
          socket.send(
            JSON.stringify({
              type: 'rejoin',
              playerId: savedState.playerId,
              code: savedState.roomCode,
            })
          );
        } else {
          console.log('No saved room to rejoin');
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
          if (message.type === 'error' && (message.message.includes('房间不存在') || message.message.includes('房间已关闭'))) {
            console.log('Rejoin failed, clearing saved state');
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
        console.log('🔴 WebSocket closed - Code:', event.code, 'Reason:', event.reason, 'Clean:', event.wasClean);
        console.log('Socket state before close:', socketRef.current?.readyState);
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

  return {
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
  };
}
