import type { IClock } from '../types';

export class SystemClock implements IClock {
  now(): number {
    return Date.now();
  }

  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    return setTimeout(callback, delay);
  }

  clearTimeout(timeout: NodeJS.Timeout): void {
    clearTimeout(timeout);
  }
}

export class FakeClock implements IClock {
  private currentTime = 0;
  private timeouts: Array<{ callback: () => void; triggerTime: number; id: number }> = [];
  private nextTimeoutId = 1;

  now(): number {
    return this.currentTime;
  }

  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const id = this.nextTimeoutId++;
    const triggerTime = this.currentTime + delay;
    
    this.timeouts.push({ callback, triggerTime, id });
    this.timeouts.sort((a, b) => a.triggerTime - b.triggerTime);
    
    return id as any; // Cast to match NodeJS.Timeout type
  }

  clearTimeout(timeout: NodeJS.Timeout): void {
    const id = timeout as any;
    this.timeouts = this.timeouts.filter(t => t.id !== id);
  }

  // Test helper methods
  setTime(time: number): void {
    this.currentTime = time;
  }

  tick(milliseconds: number): void {
    const targetTime = this.currentTime + milliseconds;
    
    while (this.timeouts.length > 0 && this.timeouts[0]!.triggerTime <= targetTime) {
      const timeout = this.timeouts.shift()!;
      this.currentTime = timeout.triggerTime;
      timeout.callback();
    }
    
    this.currentTime = targetTime;
  }

  hasScheduledTimeouts(): boolean {
    return this.timeouts.length > 0;
  }

  getNextTimeoutTime(): number | null {
    return this.timeouts.length > 0 ? this.timeouts[0]!.triggerTime : null;
  }
}

