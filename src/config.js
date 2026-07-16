/**
 * 应用配置和常量
 */

// WebSocket 配置
export const WS_CONFIG = {
  RECONNECT_DELAY_MIN: 1000,
  RECONNECT_DELAY_MAX: 30000,
  MAX_RECONNECT_ATTEMPTS: 10,
  HEARTBEAT_INTERVAL: 30000,
  HEARTBEAT_TIMEOUT: 10000,
};

// 游戏选项
export const choices = [
  { key: 'rock', label: '石头', icon: '✊' },
  { key: 'paper', label: '布', icon: '✋' },
  { key: 'scissors', label: '剪刀', icon: '✌️' },
];

// 惩罚列表
export const punishments = [
  { level: 'L1', text: '认真夸对方 20 秒' },
  { level: 'L1', text: '给自己取一个搞笑称号' },
  { level: 'L1', text: '发一个最符合现在心情的表情包' },
  { level: 'L1', text: '说一句"这局我认输"' },
  { level: 'L2', text: '说一个对对方的第一印象' },
  { level: 'L2', text: '说一个你愿意继续和对方玩的理由' },
  { level: 'L2', text: '说一个想和对方一起做的小事' },
  { level: 'L2', text: '分享一个最近让你开心的瞬间' },
  { level: 'L3', text: '说一句让对方心动的话' },
  { level: 'L3', text: '让赢家指定一句撒娇台词' },
  { level: 'L3', text: '说一个对方让你有点心动的瞬间' },
  { level: 'L3', text: '说一个你对对方好奇但没问过的问题' },
];

// 等级标签
export const levelLabels = {
  L1: 'L1 轻松',
  L2: 'L2 真心话',
  L3: 'L3 暧昧',
};

// 阶段解锁规则
export const stageLevels = [
  ['L1'],
  ['L1', 'L2'],
  ['L2', 'L3'],
];

// 局数选项
export const BEST_OF_OPTIONS = [3, 5, 7];

// 输入限制
export const INPUT_LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 10,
  ROOM_CODE_LENGTH: 6,
  CUSTOM_PUNISHMENT_MIN: 1,
  CUSTOM_PUNISHMENT_MAX: 40,
  CUSTOM_PUNISHMENT_PER_PLAYER: 2,
};

// 房间过期配置（服务器端）
export const ROOM_CONFIG = {
  INACTIVE_TIMEOUT: 60 * 60 * 1000, // 1 小时
  EMPTY_ROOM_TIMEOUT: 6 * 60 * 60 * 1000, // 6 小时
  CLEANUP_INTERVAL: 10 * 60 * 1000, // 10 分钟
  PLAYER_OFFLINE_GRACE: 5 * 60 * 1000, // 5 分钟
};

// 音效配置
export const SOUND_CONFIG = {
  ENABLED_KEY: 'rps_sound_enabled',
  DEFAULT_ENABLED: false,
};

// 动画配置
export const ANIMATION_CONFIG = {
  WHEEL_SPIN_DURATION: 800,
  WHEEL_SLOW_DURATION: 400,
  WHEEL_FAST_INTERVAL: 100,
  TOAST_DURATION: 2000,
};

/**
 * 构建 WebSocket URL
 */
export function getWebSocketUrl() {
  // 开发环境直连后端（绕过 Vite proxy）
  if (window.location.port === '5173') {
    return 'ws://localhost:8787/ws';
  }

  // 生产环境通过 Nginx 代理
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}
