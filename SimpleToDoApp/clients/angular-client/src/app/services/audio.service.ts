import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioCtx: AudioContext | null = null;
  private isMuted = false;

  constructor() {
    // Initialize AudioContext only after first user interaction to bypass autoplay policies
    const initAudio = () => {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      document.removeEventListener('click', initAudio);
    };
    document.addEventListener('click', initAudio);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
  }

  get muted() {
    return this.isMuted;
  }

  playHover() {
    if (this.isMuted || !this.audioCtx) return;
    this.playOscillator(800, 'sine', 0.02, 0.05);
  }

  playClick() {
    if (this.isMuted || !this.audioCtx) return;
    this.playOscillator(400, 'triangle', 0.05, 0.1);
  }

  playSuccess() {
    if (this.isMuted || !this.audioCtx) return;
    // Arpeggio: C5, E5, G5, C6
    const t = this.audioCtx.currentTime;
    this.playOscillatorAtTime(523.25, 'sine', 0.1, t, 0.1);
    this.playOscillatorAtTime(659.25, 'sine', 0.1, t + 0.1, 0.1);
    this.playOscillatorAtTime(783.99, 'sine', 0.1, t + 0.2, 0.1);
    this.playOscillatorAtTime(1046.50, 'sine', 0.2, t + 0.3, 0.2);
  }

  playDelete() {
    if (this.isMuted || !this.audioCtx) return;
    // Descending slide
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.audioCtx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.3);
  }

  private playOscillator(freq: number, type: OscillatorType, duration: number, vol: number) {
    if (!this.audioCtx) return;
    this.playOscillatorAtTime(freq, type, vol, this.audioCtx.currentTime, duration);
  }

  private playOscillatorAtTime(freq: number, type: OscillatorType, vol: number, startTime: number, duration: number) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    
    gainNode.gain.setValueAtTime(vol, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}
