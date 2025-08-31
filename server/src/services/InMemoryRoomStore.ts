import type { IRoomStore, Room } from '../types';

export class InMemoryRoomStore implements IRoomStore {
  private rooms = new Map<string, Room>();

  async createRoom(room: Room): Promise<void> {
    this.rooms.set(room.code, room);
  }

  async getRoom(code: string): Promise<Room | null> {
    return this.rooms.get(code) || null;
  }

  async updateRoom(code: string, room: Room): Promise<void> {
    if (this.rooms.has(code)) {
      this.rooms.set(code, room);
    } else {
      throw new Error(`Room ${code} not found`);
    }
  }

  async deleteRoom(code: string): Promise<void> {
    this.rooms.delete(code);
  }

  // Helper methods for testing and management
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  clear(): void {
    this.rooms.clear();
  }
}

