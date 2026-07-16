/**
 * 分享工具函数
 */

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否成功
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textarea);

    return success;
  } catch (error) {
    console.error('Copy failed:', error);
    return false;
  }
}

/**
 * 生成房间分享链接
 * @param {string} roomCode - 房间码
 * @returns {string}
 */
export function getRoomShareLink(roomCode) {
  return `${window.location.origin}?room=${roomCode}`;
}
