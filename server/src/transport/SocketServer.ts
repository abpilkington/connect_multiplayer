import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { Socket } from 'socket.io';
import { RoomService } from '../services/RoomService';


interface AuthenticatedSocket extends Socket {
  playerId?: string;
  roomCode?: string | undefined;
  adminToken?: string;
}

export class SocketServer {
  private io: SocketIOServer;
  private connectedSockets = new Map<string, AuthenticatedSocket>();

  constructor(httpServer: HTTPServer, private roomService: RoomService) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env['CLIENT_URL'] || "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`Socket connected: ${socket.id}`);
      
      // Store socket reference
      socket.playerId = socket.id;
      this.connectedSockets.set(socket.id, socket);

      // Set up event handlers
      this.setupRoomHandlers(socket);
      this.setupGameHandlers(socket);
      this.setupDisconnectHandler(socket);
    });
  }

  private setupRoomHandlers(socket: AuthenticatedSocket): void {
    socket.on('room:create', async (data: { password?: string; timerSec?: number }, callback) => {
      try {
        const result = await this.roomService.createRoom(data);
        socket.adminToken = result.adminToken;
        
        if (callback) callback({ success: true, data: result });
      } catch (error) {
        console.error('Error creating room:', error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to create room';
        if (callback) callback({ success: false, error: errorMsg });
      }
    });

    socket.on('room:join', async (data: { roomCode: string; nickname: string; password?: string }, callback) => {
      try {
        const result = await this.roomService.joinRoom(socket.playerId!, data);
        
        socket.roomCode = data.roomCode;
        socket.join(data.roomCode);
        
        // Notify all players in the room
        this.io.to(data.roomCode).emit('room:state', result.room);
        
        if (callback) callback({ success: true, data: { room: result.room, you: result.player } });
      } catch (error) {
        console.error('Error joining room:', error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to join room';
        if (callback) callback({ success: false, error: errorMsg });
      }
    });

    socket.on('room:start', async (data: { roomCode: string }, callback) => {
      try {
        await this.roomService.startGame(data.roomCode, socket.playerId!);
        
        const room = await this.roomService.getRoom(data.roomCode);
        if (room && room.game) {
          // Notify all players that game started
          this.io.to(data.roomCode).emit('game:started', {
            board: room.game.board,
            currentTeam: room.game.currentTeam,
            round: room.game.round,
            timerSec: room.settings.timerSec,
            endsAt: room.game.endsAt || 0
          });

          // Start the first voting round
          const turnManager = this.roomService.getTurnManager(data.roomCode);
          if (turnManager) {
            // Set up completion callback for timer expiration
            turnManager.setCompletionCallback(data.roomCode, async (roomCode, result) => {
              // Check if this is a timeout notification
              if (result && 'timeout' in result && result.timeout) {
                // Handle timeout by processing the turn completion
                await this.processTurnCompletion(roomCode, turnManager, room.game, room.players);
              }
            });
            
            turnManager.startVoting(room.game, room.players, room.settings.timerSec);
            await this.roomService.getRoom(data.roomCode); // Update room state
            
            // Setup turn completion handler and timer updates
            this.setupTurnCompletionHandler(data.roomCode, turnManager);
          this.setupTimerUpdates(data.roomCode);
          
          // Send initial timer update
          this.io.to(data.roomCode).emit('game:tick', { 
            remainingMs: room.game.endsAt ? Math.max(0, room.game.endsAt - Date.now()) : 0 
          });
          }
        }
        
        if (callback) callback({ success: true });
      } catch (error) {
        console.error('Error starting game:', error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to start game';
        if (callback) callback({ success: false, error: errorMsg });
      }
    });

    socket.on('room:leave', async (data: { roomCode: string }) => {
      try {
        await this.roomService.leaveRoom(socket.playerId!, data.roomCode);
        socket.leave(data.roomCode);
        socket.roomCode = undefined;
        
        // Notify remaining players
        const room = await this.roomService.getRoom(data.roomCode);
        if (room) {
          this.io.to(data.roomCode).emit('room:state', room);
        }
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });
  }

  private setupGameHandlers(socket: AuthenticatedSocket): void {
    socket.on('room:vote', async (data: { roomCode: string; column: number }, callback) => {
      try {
        await this.roomService.castVote(data.roomCode, socket.playerId!, data.column);
        
        const room = await this.roomService.getRoom(data.roomCode);
        if (room && room.game) {
          const turnManager = this.roomService.getTurnManager(data.roomCode);
          if (turnManager) {
            // Update the room's perColumnCounts with current team's votes
            const currentTeamCounts = turnManager.getTeamVoteCounts(room.game, room.players, room.game.currentTeam);
            room.game.perColumnCounts = currentTeamCounts;
            
            // Send vote update to all players in the room
            this.io.to(data.roomCode).emit('game:voteUpdate', { 
              team: room.game.currentTeam, 
              counts: currentTeamCounts 
            });
            
            // Also send the updated room state so clients have the latest vote information
            // This ensures the client sees the updated game.votes object
            await this.roomService.updateRoomState(room.code, room);
            this.io.to(data.roomCode).emit('room:state', room);

            // Check if all team members have voted for early resolution
            if (turnManager.hasAllTeamVoted(room.game, room.players)) {
              this.processTurnCompletion(data.roomCode, turnManager, room.game, room.players);
            }
          }
        }
        
        if (callback) callback({ success: true });
      } catch (error) {
        console.error('Error casting vote:', error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to cast vote';
        if (callback) callback({ success: false, error: errorMsg });
      }
    });

    socket.on('room:rematch', async (data: { roomCode: string }, callback) => {
      try {
        await this.roomService.startRematch(data.roomCode, socket.playerId!);
        
        // Notify all players
        const updatedRoom = await this.roomService.getRoom(data.roomCode);
        if (updatedRoom && updatedRoom.game) {
          this.io.to(data.roomCode).emit('game:started', {
            board: updatedRoom.game.board,
            currentTeam: updatedRoom.game.currentTeam,
            round: updatedRoom.game.round,
            timerSec: updatedRoom.settings.timerSec,
            endsAt: updatedRoom.game.endsAt || 0
          });

          // Start voting
          const turnManager = this.roomService.getTurnManager(data.roomCode);
          if (turnManager) {
                      // Set up completion callback for timer expiration
          turnManager.setCompletionCallback(data.roomCode, async (roomCode, result) => {
            // Check if this is a timeout notification
            if (result && 'timeout' in result && result.timeout) {
              // Handle timeout by processing the turn completion
              await this.processTurnCompletion(roomCode, turnManager, updatedRoom.game, updatedRoom.players);
            }
          });
            
            turnManager.startVoting(updatedRoom.game, updatedRoom.players, updatedRoom.settings.timerSec);
            this.setupTurnCompletionHandler(data.roomCode, turnManager);
            this.setupTimerUpdates(data.roomCode);
          }
        }
        
        if (callback) callback({ success: true });
      } catch (error) {
        console.error('Error starting rematch:', error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to start rematch';
        if (callback) callback({ success: false, error: errorMsg });
      }
    });
  }

  private setupTurnCompletionHandler(_roomCode: string, _turnManager: any): void {
    // This would be called by the turn manager when voting completes
    // For now, we'll handle it in the vote handler above
  }

  private setupTimerUpdates(roomCode: string): void {
    const sendTimerUpdate = async () => {
      try {
        const room = await this.roomService.getRoom(roomCode);
        if (!room || !room.game || !room.game.endsAt) {
          return; // No active voting or room doesn't exist
        }

        const remainingMs = Math.max(0, room.game.endsAt - Date.now());
        
        // Send timer update to all players in the room
        this.io.to(roomCode).emit('game:tick', { remainingMs });

        // Schedule next update if time remaining
        if (remainingMs > 0) {
          setTimeout(sendTimerUpdate, 1000); // Update every second
        }
      } catch (error) {
        console.error('Error sending timer update:', error);
      }
    };

    // Start timer updates
    setTimeout(sendTimerUpdate, 1000);
  }

  private async processTurnCompletion(roomCode: string, turnManager: any, gameState: any, players: any[]): Promise<void> {
    const result = turnManager.finishVoting(gameState, players);
    
    if (result.moveApplied) {
      // Notify all players of the move
      this.io.to(roomCode).emit('game:moveApplied', {
        board: gameState.board,
        lastMove: gameState.lastMove,
        nextTeam: gameState.currentTeam
      });

      if (result.gameEnded) {
        // Game is over - update room state
        const room = await this.roomService.getRoom(roomCode);
        if (room) {
          room.state = 'ended';
          await this.roomService.updateRoomState(roomCode, room);
        }
        
        const resultType = gameState.result?.winner || (gameState.result?.draw ? 'draw' : 'unknown');
        
        this.io.to(roomCode).emit('game:ended', {
          result: resultType,
          line: gameState.result?.winningLine,
          scoreboard: players
        });
      } else {
        // Start next voting round
        const room = await this.roomService.getRoom(roomCode);
        if (room && room.game) {
                      // Set up completion callback for timer expiration - use a stable reference
            const nextTurnCallback = async (roomCode: string, result: any) => {
              // Check if this is a timeout notification
              if (result && 'timeout' in result && result.timeout) {
                // Handle timeout by processing the turn completion
                await this.processTurnCompletion(roomCode, turnManager, room.game, room.players);
              }
            };
          turnManager.setCompletionCallback(roomCode, nextTurnCallback);
          
          turnManager.startVoting(room.game, room.players, room.settings.timerSec);
          
          this.io.to(roomCode).emit('game:tick', {
            remainingMs: room.settings.timerSec * 1000
          });
        }
      }
    }
  }

  private setupDisconnectHandler(socket: AuthenticatedSocket): void {
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      this.connectedSockets.delete(socket.id);
      
      if (socket.roomCode) {
        try {
          await this.roomService.leaveRoom(socket.playerId!, socket.roomCode);
          
          // Notify remaining players
          const room = await this.roomService.getRoom(socket.roomCode);
          if (room) {
            this.io.to(socket.roomCode).emit('room:state', room);
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}
