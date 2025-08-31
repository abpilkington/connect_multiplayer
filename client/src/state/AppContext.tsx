import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, Room, Player, VoteCount, GameEndData } from '../types';
import { socketManager } from '../api/socket';

// State management
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Socket methods
  createRoom: (password?: string, timerSec?: number, nickname?: string) => Promise<{ roomCode: string; adminToken: string }>;
  joinRoom: (roomCode: string, nickname: string, password?: string) => Promise<void>;
  startGame: () => Promise<void>;
  castVote: (column: number) => Promise<void>;
  startRematch: () => Promise<void>;
  leaveRoom: () => void;
}

type AppAction =
  | { type: 'SET_VIEW'; view: AppState['currentView'] }
  | { type: 'SET_ROOM'; room: Room }
  | { type: 'SET_PLAYER'; player: Player }
  | { type: 'SET_CONNECTION_STATUS'; status: AppState['connectionStatus'] }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'UPDATE_ROOM_STATE'; room: Room }
  | { type: 'GAME_STARTED'; gameData: any }
  | { type: 'GAME_MOVE_APPLIED'; moveData: any }
  | { type: 'GAME_ENDED'; endData: GameEndData }
  | { type: 'VOTE_UPDATE'; voteData: VoteCount }
  | { type: 'TIMER_UPDATE'; timerData: { endsAt: number } }
  | { type: 'RESET' };

const initialState: AppState = {
  currentView: 'home',
  room: null,
  currentPlayer: null,
  connectionStatus: 'disconnected',
  error: null,
  gameEndData: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.view };
    
    case 'SET_ROOM':
      return { ...state, room: action.room };
    
    case 'SET_PLAYER':
      return { ...state, currentPlayer: action.player };
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.status };
    
    case 'SET_ERROR':
      return { ...state, error: action.error };
    
    case 'UPDATE_ROOM_STATE':
      return { ...state, room: action.room };
    
    case 'GAME_STARTED':
      if (!state.room) return state;
      return {
        ...state,
        currentView: 'game',
        room: {
          ...state.room,
          state: 'active',
          game: {
            ...action.gameData,
            votes: {},
            perColumnCounts: [0, 0, 0, 0, 0, 0, 0],
          }
        }
      };
    
    case 'GAME_MOVE_APPLIED':
      if (!state.room || !state.room.game) return state;
      return {
        ...state,
        room: {
          ...state.room,
          game: {
            ...state.room.game,
            board: action.moveData.board,
            lastMove: action.moveData.lastMove,
            currentTeam: action.moveData.nextTeam,
            round: state.room.game.round + 1,
            votes: {},
            perColumnCounts: [0, 0, 0, 0, 0, 0, 0],
          }
        }
      };
    
    case 'GAME_ENDED':
      if (!state.room || !state.room.game) return state;
      
      const gameResult = action.endData.result === 'draw' 
        ? { draw: true as const }
        : { 
            winner: action.endData.result, 
            ...(action.endData.line && { winningLine: action.endData.line })
          };
      
      return {
        ...state,
        currentView: 'ended',
        gameEndData: action.endData,
        room: {
          ...state.room,
          state: 'ended',
          players: action.endData.scoreboard,
          game: {
            ...state.room.game,
            result: gameResult
          }
        }
      };
    
    case 'VOTE_UPDATE':
      if (!state.room || !state.room.game) return state;
      return {
        ...state,
        room: {
          ...state.room,
          game: {
            ...state.room.game,
            perColumnCounts: action.voteData.counts
          }
        }
      };
    
    case 'TIMER_UPDATE':
      if (!state.room || !state.room.game) return state;
      return {
        ...state,
        room: {
          ...state.room,
          game: {
            ...state.room.game,
            endsAt: action.timerData.endsAt
          }
        }
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Set up socket event listeners
  useEffect(() => {
    const socket = socketManager.connect();
    
    dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connecting' });

    // Connection events
    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connected' });
      dispatch({ type: 'SET_ERROR', error: null });
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', status: 'disconnected' });
    });

    socket.on('connect_error', (error) => {
      dispatch({ type: 'SET_CONNECTION_STATUS', status: 'disconnected' });
      dispatch({ type: 'SET_ERROR', error: `Failed to connect to server: ${error.message || 'Server unreachable'}` });
    });

    // Game events
    socket.on('room:state', (room) => {
      dispatch({ type: 'UPDATE_ROOM_STATE', room });
    });

    socket.on('game:started', (gameData) => {
      dispatch({ type: 'GAME_STARTED', gameData });
    });

    socket.on('game:moveApplied', (moveData) => {
      dispatch({ type: 'GAME_MOVE_APPLIED', moveData });
    });

    socket.on('game:ended', (endData) => {
      dispatch({ type: 'GAME_ENDED', endData });
    });

    socket.on('game:voteUpdate', (voteData) => {
      dispatch({ type: 'VOTE_UPDATE', voteData });
    });

    socket.on('game:tick', (timerData) => {
      const endsAt = Date.now() + timerData.remainingMs;
      dispatch({ type: 'TIMER_UPDATE', timerData: { endsAt } });
    });

    socket.on('error', (errorData) => {
      dispatch({ type: 'SET_ERROR', error: errorData.message });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('room:state');
      socket.off('game:started');
      socket.off('game:moveApplied');
      socket.off('game:ended');
      socket.off('game:voteUpdate');
      socket.off('game:tick');
      socket.off('error');
    };
  }, []);

  // Socket action methods
  const createRoom = async (password?: string, timerSec?: number, nickname?: string) => {
    try {
      dispatch({ type: 'SET_ERROR', error: null });
      const result = await socketManager.createRoom(password, timerSec);
      console.log('Room created:', result.roomCode);
      
      // If nickname is provided, automatically join the room
      if (nickname) {
        const joinResult = await socketManager.joinRoom(result.roomCode, nickname, password);
        dispatch({ type: 'SET_ROOM', room: joinResult.room });
        dispatch({ type: 'SET_PLAYER', player: joinResult.you });
        dispatch({ type: 'SET_VIEW', view: 'lobby' });
      }
      
      return result;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
      throw error;
    }
  };

  const joinRoom = async (roomCode: string, nickname: string, password?: string) => {
    try {
      dispatch({ type: 'SET_ERROR', error: null });
      const result = await socketManager.joinRoom(roomCode, nickname, password);
      dispatch({ type: 'SET_ROOM', room: result.room });
      dispatch({ type: 'SET_PLAYER', player: result.you });
      dispatch({ type: 'SET_VIEW', view: 'lobby' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
      throw error;
    }
  };

  const startGame = async () => {
    if (!state.room) throw new Error('No room to start game');
    try {
      dispatch({ type: 'SET_ERROR', error: null });
      await socketManager.startGame(state.room.code);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
      throw error;
    }
  };

  const castVote = async (column: number) => {
    if (!state.room) throw new Error('No room to cast vote');
    try {
      dispatch({ type: 'SET_ERROR', error: null });
      await socketManager.castVote(state.room.code, column);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
      throw error;
    }
  };

  const startRematch = async () => {
    if (!state.room) throw new Error('No room for rematch');
    try {
      dispatch({ type: 'SET_ERROR', error: null });
      await socketManager.startRematch(state.room.code);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: (error as Error).message });
      throw error;
    }
  };

  const leaveRoom = () => {
    if (state.room) {
      socketManager.leaveRoom(state.room.code);
    }
    dispatch({ type: 'RESET' });
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    createRoom,
    joinRoom,
    startGame,
    castVote,
    startRematch,
    leaveRoom,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
