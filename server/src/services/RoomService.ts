import type { 
  Room, 
  Player, 
  Team,
  IRoomStore, 
  IAccessControl, 
  IClock,
  IGameEngine
} from '../types';
import { TurnManager } from './TurnManager';
import { v4 as uuidv4 } from 'uuid';

export interface CreateRoomRequest {
  password?: string;
  timerSec?: number;
}

export interface CreateRoomResponse {
  roomCode: string;
  adminToken: string;
}

export interface JoinRoomRequest {
  roomCode: string;
  nickname: string;
  password?: string;
}

export interface JoinRoomResponse {
  room: Room;
  player: Player;
}



export class RoomService {
  private turnManagers = new Map<string, TurnManager>();

  constructor(
    private roomStore: IRoomStore,
    private accessControl: IAccessControl,
    private gameEngine: IGameEngine,
    private turnDecider: any,
    private clock: IClock
  ) {}

  async createRoom(request: CreateRoomRequest): Promise<CreateRoomResponse> {
    const roomCode = this.accessControl.generateRoomCode();
    const adminToken = uuidv4();
    
    const room: Room = {
      code: roomCode,
      passwordHash: request.password ? await this.accessControl.hashPassword(request.password) : undefined,
      players: [],
      state: 'lobby',
      settings: {
        timerSec: request.timerSec || 15,
        maxPlayers: 10
      },
      createdAt: this.clock.now()
    };

    await this.roomStore.createRoom(room);
    
    // Create turn manager for this room
    this.turnManagers.set(roomCode, new TurnManager(this.gameEngine, this.turnDecider, this.clock));

    return { roomCode, adminToken };
  }

  async joinRoom(playerId: string, request: JoinRoomRequest): Promise<JoinRoomResponse> {
    const room = await this.roomStore.getRoom(request.roomCode);
    if (!room) {
      throw new RoomServiceError('ROOM_NOT_FOUND', 'Room not found');
    }

    // Validate password if required
    if (room.passwordHash && !request.password) {
      throw new RoomServiceError('PASSWORD_REQUIRED', 'Room requires a password');
    }

    if (room.passwordHash && request.password) {
      const validPassword = await this.accessControl.validatePassword(request.password, room.passwordHash);
      if (!validPassword) {
        throw new RoomServiceError('INVALID_PASSWORD', 'Invalid password');
      }
    }

    // Validate nickname
    const nicknameValidation = this.accessControl.validateNickname(request.nickname);
    if (!nicknameValidation.valid) {
      throw new RoomServiceError('INVALID_NICKNAME', nicknameValidation.error!);
    }

    const sanitizedNickname = this.accessControl.sanitizeNickname(request.nickname);

    // Check if nickname is already taken
    const existingPlayer = room.players.find(p => p.nickname.toLowerCase() === sanitizedNickname.toLowerCase());
    if (existingPlayer) {
      // If it's the same player reconnecting, allow it
      if (existingPlayer.id === playerId) {
        existingPlayer.connected = true;
        await this.roomStore.updateRoom(room.code, room);
        return { room: this.sanitizeRoomForClient(room), player: existingPlayer };
      } else {
        throw new RoomServiceError('NICKNAME_TAKEN', 'Nickname already taken');
      }
    }

    // Check room capacity
    if (room.players.length >= room.settings.maxPlayers) {
      throw new RoomServiceError('ROOM_FULL', 'Room is full');
    }

    // Auto-assign team (balance teams)
    const redCount = room.players.filter(p => p.team === 'red').length;
    const yellowCount = room.players.filter(p => p.team === 'yellow').length;
    const team: Team = redCount <= yellowCount ? 'red' : 'yellow';

    // Create new player
    const player: Player = {
      id: playerId,
      nickname: sanitizedNickname,
      team,
      isAdmin: room.players.length === 0, // First player is admin
      matchingVotes: 0,
      connected: true
    };

    room.players.push(player);
    await this.roomStore.updateRoom(room.code, room);

    return { room: this.sanitizeRoomForClient(room), player };
  }

  async leaveRoom(playerId: string, roomCode: string): Promise<void> {
    const room = await this.roomStore.getRoom(roomCode);
    if (!room) {
      return; // Room doesn't exist, nothing to do
    }

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return; // Player not in room
    }

    // Mark player as disconnected (grace period)
    room.players[playerIndex]!.connected = false;

    // If this was the admin and there are other players, promote the next player
    if (room.players[playerIndex]!.isAdmin && room.players.length > 1) {
      const nextAdmin = room.players.find(p => p.id !== playerId && p.connected);
      if (nextAdmin) {
        nextAdmin.isAdmin = true;
      }
    }

    await this.roomStore.updateRoom(room.code, room);

    // Schedule removal after grace period (60 seconds)
    this.clock.setTimeout(async () => {
      await this.removeDisconnectedPlayer(roomCode, playerId);
    }, 60000);
  }

  private async removeDisconnectedPlayer(roomCode: string, playerId: string): Promise<void> {
    const room = await this.roomStore.getRoom(roomCode);
    if (!room) {
      return;
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player || player.connected) {
      return; // Player reconnected or already removed
    }

    // Remove the player
    room.players = room.players.filter(p => p.id !== playerId);

    // If no players left, delete the room
    if (room.players.length === 0) {
      await this.roomStore.deleteRoom(roomCode);
      this.turnManagers.delete(roomCode);
      return;
    }

    await this.roomStore.updateRoom(room.code, room);
  }

  async startGame(roomCode: string, adminPlayerId: string): Promise<void> {
    const room = await this.roomStore.getRoom(roomCode);
    if (!room) {
      throw new RoomServiceError('ROOM_NOT_FOUND', 'Room not found');
    }

    const admin = room.players.find(p => p.id === adminPlayerId);
    if (!admin || !admin.isAdmin) {
      throw new RoomServiceError('UNAUTHORIZED', 'Only admin can start the game');
    }

    if (room.state !== 'lobby') {
      throw new RoomServiceError('INVALID_STATE', 'Game is not in lobby state');
    }

    if (room.players.length < 2) {
      throw new RoomServiceError('NOT_ENOUGH_PLAYERS', 'Need at least 2 players to start');
    }

    // Initialize game state
    room.game = this.gameEngine.newGame();
    room.state = 'active';

    await this.roomStore.updateRoom(room.code, room);
  }

  async updateRoomState(roomCode: string, room: Room): Promise<void> {
    await this.roomStore.updateRoom(roomCode, room);
  }

  async startRematch(roomCode: string, adminPlayerId: string): Promise<void> {
    const room = await this.roomStore.getRoom(roomCode);
    if (!room) {
      throw new RoomServiceError('ROOM_NOT_FOUND', 'Room not found');
    }

    const admin = room.players.find(p => p.id === adminPlayerId);
    if (!admin || !admin.isAdmin) {
      throw new RoomServiceError('UNAUTHORIZED', 'Only admin can start a rematch');
    }

    if (room.state !== 'ended') {
      throw new RoomServiceError('INVALID_STATE', 'Can only rematch after game has ended');
    }

    if (room.players.length < 2) {
      throw new RoomServiceError('NOT_ENOUGH_PLAYERS', 'Need at least 2 players to start');
    }

    // Reset room to lobby state
    room.state = 'lobby';
    delete room.game;
    
    // Reset player stats
    room.players.forEach(p => p.matchingVotes = 0);

    await this.roomStore.updateRoom(room.code, room);

    // Now start the new game
    await this.startGame(roomCode, adminPlayerId);
  }

  async castVote(roomCode: string, playerId: string, column: number): Promise<void> {
    const room = await this.roomStore.getRoom(roomCode);
    if (!room) {
      throw new RoomServiceError('ROOM_NOT_FOUND', 'Room not found');
    }

    if (room.state !== 'active' || !room.game) {
      throw new RoomServiceError('INVALID_STATE', 'Game is not active');
    }

    const turnManager = this.turnManagers.get(roomCode);
    if (!turnManager) {
      throw new RoomServiceError('INTERNAL_ERROR', 'Turn manager not found');
    }

    const result = turnManager.castVote(room.game, room.players, playerId, column);
    if (!result.success) {
      throw new RoomServiceError('VOTE_REJECTED', result.error!);
    }

    await this.roomStore.updateRoom(room.code, room);
  }

  async getRoom(roomCode: string): Promise<Room | null> {
    const room = await this.roomStore.getRoom(roomCode);
    return room ? this.sanitizeRoomForClient(room) : null;
  }

  getTurnManager(roomCode: string): TurnManager | undefined {
    return this.turnManagers.get(roomCode);
  }

  // Remove sensitive data from room before sending to client
  private sanitizeRoomForClient(room: Room): Room {
    const sanitized = { ...room };
    delete sanitized.passwordHash; // Never send password hash to client
    return sanitized;
  }
}

export class RoomServiceError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'RoomServiceError';
  }
}
