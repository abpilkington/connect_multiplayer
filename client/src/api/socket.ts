import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types';

class SocketManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private serverUrl: string;

  constructor() {
    this.serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
  }

  connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(this.serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Set up connection event handlers
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Helper methods for common operations
  createRoom(password?: string, timerSec?: number): Promise<{ roomCode: string; adminToken: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      const payload: { password?: string; timerSec?: number } = {};
      if (password) payload.password = password;
      if (timerSec) payload.timerSec = timerSec;
      
      this.socket.emit('room:create', payload, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  joinRoom(roomCode: string, nickname: string, password?: string): Promise<{ room: any; you: any }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      const payload: { roomCode: string; nickname: string; password?: string } = { roomCode, nickname };
      if (password) payload.password = password;
      
      this.socket.emit('room:join', payload, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  startGame(roomCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('room:start', { roomCode }, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  castVote(roomCode: string, column: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('room:vote', { roomCode, column }, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  startRematch(roomCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('room:rematch', { roomCode }, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  leaveRoom(roomCode: string): void {
    if (this.socket) {
      this.socket.emit('room:leave', { roomCode });
    }
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
