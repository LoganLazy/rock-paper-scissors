/**
 * 输入验证工具测试
 */
import { describe, it, expect } from 'vitest';
import { validateName, validateRoomCode, validateCustomPunishment, sanitizeString } from './validation.js';

describe('validateName', () => {
  it('should accept valid names', () => {
    const result = validateName('玩家1');
    expect(result.valid).toBe(true);
    expect(result.error).toBe('');
  });

  it('should reject names that are too short', () => {
    const result = validateName('A');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('2-10');
  });

  it('should reject names that are too long', () => {
    const result = validateName('这是一个非常非常长的名字');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('2-10');
  });

  it('should reject empty names', () => {
    const result = validateName('');
    expect(result.valid).toBe(false);
  });

  it('should trim whitespace', () => {
    const result = validateName('  玩家  ');
    expect(result.valid).toBe(true);
  });
});

describe('validateRoomCode', () => {
  it('should accept valid 6-character codes', () => {
    const result = validateRoomCode('ABC123');
    expect(result.valid).toBe(true);
  });

  it('should reject codes with wrong length', () => {
    expect(validateRoomCode('ABC').valid).toBe(false);
    expect(validateRoomCode('ABCDEFG').valid).toBe(false);
  });

  it('should reject codes with special characters', () => {
    const result = validateRoomCode('ABC@12');
    expect(result.valid).toBe(false);
  });

  it('should accept lowercase and convert to uppercase', () => {
    const result = validateRoomCode('abc123');
    expect(result.valid).toBe(true);
  });
});

describe('validateCustomPunishment', () => {
  it('should accept valid punishments', () => {
    const result = validateCustomPunishment('说一句好听的话');
    expect(result.valid).toBe(true);
  });

  it('should reject too short punishments', () => {
    const result = validateCustomPunishment('');
    expect(result.valid).toBe(false);
  });

  it('should reject too long punishments', () => {
    const longText = '这是一个非常非常非常非常非常非常非常非常非常非常长的惩罚文本';
    const result = validateCustomPunishment(longText);
    expect(result.valid).toBe(false);
  });
});

describe('sanitizeString', () => {
  it('should trim and limit string length', () => {
    const result = sanitizeString('  hello  ', 5);
    expect(result).toBe('hello');
  });

  it('should truncate long strings', () => {
    const result = sanitizeString('这是一个很长的字符串', 5);
    expect(result.length).toBe(5);
  });

  it('should handle empty strings', () => {
    const result = sanitizeString('', 10);
    expect(result).toBe('');
  });

  it('should handle null/undefined', () => {
    expect(sanitizeString(null, 10)).toBe('');
    expect(sanitizeString(undefined, 10)).toBe('');
  });
});
