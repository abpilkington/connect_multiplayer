export type Team = 'red' | 'yellow';

export interface Player {
  id: string;          // socket-bound
  nickname: string;
  team: Team;
  isAdmin: boolean;
  matchingVotes: number;
  connected: boolean;
}

export interface Room {
  code: string;
  passwordHash?: string | undefined;
  players: Player[];
  state: 'lobby' | 'active' | 'ended' | 'aborted';
  game?: GameState;
  settings: { timerSec: number; maxPlayers: number };
  createdAt: number;
}

export interface GameState {
  board: (Team | null)[][];     // [rows][cols] - 6 rows x 7 columns
  currentTeam: Team;
  round: number;
  votes: Record<string, number>; // playerId -> column (only during voting)
  perColumnCounts: number[];     // derived during tally
  endsAt?: number;               // epoch ms for vote window end
  lastMove?: { col: number; row: number; team: Team };
  result?: { winner?: Team; draw?: boolean; winningLine?: {col:number,row:number}[] };
}

export interface Cell {
  col: number;
  row: number;
}

// Socket event types
export interface SocketEvents {
  // Client to Server
  'room:create': (data: { password?: string; timerSec?: number }) => void;
  'room:join': (data: { roomCode: string; nickname: string; password?: string }) => void;
  'room:start': (data: { roomCode: string }) => void;
  'room:vote': (data: { roomCode: string; column: number }) => void;
  'room:rematch': (data: { roomCode: string }) => void;
  'room:kick': (data: { roomCode: string; nickname: string }) => void;
  'room:leave': (data: { roomCode: string }) => void;

  // Server to Client
  'room:state': (data: Room) => void;
  'game:started': (data: { board: (Team | null)[][]; currentTeam: Team; round: number; timerSec: number; endsAt: number }) => void;
  'game:tick': (data: { remainingMs: number }) => void;
  'game:voteUpdate': (data: { team: Team; counts: number[] }) => void;
  'game:moveApplied': (data: { board: (Team | null)[][]; lastMove: {col:number,row:number,team:Team}; nextTeam: Team }) => void;
  'game:ended': (data: { result: 'red'|'yellow'|'draw'; line?: Array<{col:number,row:number}>; scoreboard: Player[] }) => void;
  'error': (data: { code: string; message: string }) => void;
}

// Abstract interfaces for swappable components
export interface IGameEngine {
  newGame(): GameState;
  isValidMove(board: (Team | null)[][], col: number): boolean;
  applyMove(board: (Team | null)[][], col: number, team: Team): { board: (Team | null)[][]; row: number };
  checkWin(board: (Team | null)[][], lastMove: { col: number; row: number; team: Team }): { winner?: Team; winningLine?: Cell[] };
  isBoardFull(board: (Team | null)[][]): boolean;
  nextTeam(team: Team): Team;
}

export interface IRoomStore {
  createRoom(room: Room): Promise<void>;
  getRoom(code: string): Promise<Room | null>;
  updateRoom(code: string, room: Room): Promise<void>;
  deleteRoom(code: string): Promise<void>;
}

export interface ITurnDecider {
  tallyVotes(votes: Record<string, number>, validCols: number[]): number[];
  decideColumn(perColumnCounts: number[], validCols?: number[]): number;
}

export interface IAccessControl {
  validateRoomCode(code: string): boolean;
  validatePassword(password: string, hash: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  generateRoomCode(): string;
  validateNickname(nickname: string): { valid: boolean; error?: string };
  sanitizeNickname(nickname: string): string;
}

export interface IClock {
  now(): number;
  setTimeout(callback: () => void, delay: number): NodeJS.Timeout;
  clearTimeout(timeout: NodeJS.Timeout): void;
}
