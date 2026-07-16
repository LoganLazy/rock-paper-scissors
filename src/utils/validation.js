/**
 * 输入验证工具函数
 */
import { INPUT_LIMITS } from '../config.js';

/**
 * 验证昵称
 * @param {string} name - 昵称
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: '昵称不能为空' };
  }

  const trimmed = name.trim();

  if (trimmed.length < INPUT_LIMITS.NAME_MIN) {
    return { valid: false, error: `昵称至少 ${INPUT_LIMITS.NAME_MIN} 个字符` };
  }

  if (trimmed.length > INPUT_LIMITS.NAME_MAX) {
    return { valid: false, error: `昵称最多 ${INPUT_LIMITS.NAME_MAX} 个字符` };
  }

  return { valid: true };
}

/**
 * 验证房间码
 * @param {string} code - 房间码
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateRoomCode(code) {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: '房间码不能为空' };
  }

  const trimmed = code.trim().toUpperCase();
  const pattern = new RegExp(`^[A-Z0-9]{${INPUT_LIMITS.ROOM_CODE_LENGTH}}$`);

  if (!pattern.test(trimmed)) {
    return { valid: false, error: `房间码必须是 ${INPUT_LIMITS.ROOM_CODE_LENGTH} 位字母或数字` };
  }

  return { valid: true };
}

/**
 * 验证自定义惩罚
 * @param {string} text - 惩罚文本
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCustomPunishment(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: '惩罚内容不能为空' };
  }

  const trimmed = text.trim();

  if (trimmed.length < INPUT_LIMITS.CUSTOM_PUNISHMENT_MIN) {
    return { valid: false, error: '惩罚内容不能为空' };
  }

  if (trimmed.length > INPUT_LIMITS.CUSTOM_PUNISHMENT_MAX) {
    return { valid: false, error: `惩罚内容最多 ${INPUT_LIMITS.CUSTOM_PUNISHMENT_MAX} 个字符` };
  }

  return { valid: true };
}

/**
 * 清理和截断字符串
 * @param {string} str - 输入字符串
 * @param {number} maxLength - 最大长度
 * @returns {string}
 */
export function sanitizeString(str, maxLength) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}
