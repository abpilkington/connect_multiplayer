// Shared types with server
export type Team = 'red' | 'yellow';

export interface Player {
  id: string;
  nickname: string;
  team: Team;
  isAdmin: boolean;
  matchingVotes: number;
  connected: boolean;
}

export interface Room {
  code: string;
  passwordHash?: string;
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
  votes: Record<string, number>;
  perColumnCounts: number[];
  endsAt?: number;
  lastMove?: { col: number; row: number; team: Team };
  result?: { winner?: Team; draw?: boolean; winningLine?: {col:number,row:number}[] };
}

// Client-specific types
export interface GameSettings {
  timerSec: number;
  maxPlayers: number;
}

export interface VoteCount {
  team: Team;
  counts: number[];
}

// Socket event types
export interface ClientToServerEvents {
  'room:create': (data: { password?: string; timerSec?: number }, callback: (response: any) => void) => void;
  'room:join': (data: { roomCode: string; nickname: string; password?: string }, callback: (response: any) => void) => void;
  'room:start': (data: { roomCode: string }, callback: (response: any) => void) => void;
  'room:vote': (data: { roomCode: string; column: number }, callback: (response: any) => void) => void;
  'room:rematch': (data: { roomCode: string }, callback: (response: any) => void) => void;
  'room:kick': (data: { roomCode: string; nickname: string }, callback: (response: any) => void) => void;
  'room:leave': (data: { roomCode: string }) => void;
}

export interface ServerToClientEvents {
  'room:state': (data: Room) => void;
  'game:started': (data: { board: (Team | null)[][]; currentTeam: Team; round: number; timerSec: number; endsAt: number }) => void;
  'game:tick': (data: { remainingMs: number }) => void;
  'game:voteUpdate': (data: VoteCount) => void;
  'game:moveApplied': (data: { board: (Team | null)[][]; lastMove: {col:number,row:number,team:Team}; nextTeam: Team }) => void;
  'game:ended': (data: { result: 'red'|'yellow'|'draw'; line?: Array<{col:number,row:number}>; scoreboard: Player[] }) => void;
  'error': (data: { code: string; message: string }) => void;
}

// Game end data
export interface GameEndData {
  result: 'red' | 'yellow' | 'draw';
  line?: Array<{col: number; row: number}>;
  scoreboard: Player[];
}

// UI State types
export interface AppState {
  currentView: 'home' | 'lobby' | 'game' | 'ended';
  room: Room | null;
  currentPlayer: Player | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  error: string | null;
  gameEndData: GameEndData | null;
}

export interface BoardState {
  highlightedColumn: number | null;
  animatingPiece: { col: number; row: number; team: Team } | null;
  winningLine: { col: number; row: number }[] | null;
}

// Form types
export interface CreateRoomForm {
  password: string;
  timerSec: number;
}

export interface JoinRoomForm {
  roomCode: string;
  nickname: string;
  password: string;
}
