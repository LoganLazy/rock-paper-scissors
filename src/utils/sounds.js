/**
 * 音效管理工具
 * 使用 Web Audio API 生成简单音效
 */
import { SOUND_CONFIG } from '../config.js';

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = localStorage.getItem(SOUND_CONFIG.ENABLED_KEY) === 'true' || SOUND_CONFIG.DEFAULT_ENABLED;
  }

  /**
   * 初始化音频上下文（需要用户交互后调用）
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  /**
   * 设置音效开关
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem(SOUND_CONFIG.ENABLED_KEY, enabled.toString());
  }

  /**
   * 播放音效
   */
  play(type) {
    if (!this.enabled) return;

    this.init();

    if (!this.audioContext) return;

    try {
      switch (type) {
        case 'choose':
          this.playChoose();
          break;
        case 'win':
          this.playWin();
          break;
        case 'spin':
          this.playSpin();
          break;
        case 'result':
          this.playResult();
          break;
        default:
          break;
      }
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }

  /**
   * 出拳音效 - 短促的哔声
   */
  playChoose() {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  /**
   * 胜利音效 - 欢快和弦
   */
  playWin() {
    const frequencies = [523.25, 659.25, 783.99]; // C E G
    const duration = 0.4;

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
      }, index * 100);
    });
  }

  /**
   * 转盘音效 - 快速上升音
   */
  playSpin() {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  /**
   * 结果音效 - 提示音
   */
  playResult() {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 1000;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }
}

// 单例导出
export const soundManager = new SoundManager();
