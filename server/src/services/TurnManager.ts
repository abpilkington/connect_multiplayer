import type { GameState, Player, Team, IGameEngine, ITurnDecider, IClock } from '../types';

export interface VoteResult {
  success: boolean;
  error?: string;
}

export interface TurnResult {
  moveApplied: boolean;
  gameEnded: boolean;
  chosenColumn?: number;
  error?: string;
}

export interface TimeoutResult {
  timeout: true;
}

export class TurnManager {
  private currentTimeout?: NodeJS.Timeout | undefined;
  private completionCallback?: (roomCode: string, result: TurnResult | TimeoutResult) => void;
  private currentRoomCode?: string;

  constructor(
    private gameEngine: IGameEngine,
    private turnDecider: ITurnDecider,
    private clock: IClock
  ) {}

  setCompletionCallback(roomCode: string, callback: (roomCode: string, result: TurnResult | TimeoutResult) => void): void {
    this.currentRoomCode = roomCode;
    this.completionCallback = callback;
  }

  startVoting(gameState: GameState, _players: Player[], timerSec: number): void {
    // Set voting deadline
    const now = this.clock.now();
    gameState.endsAt = now + (timerSec * 1000);
    
    // Don't clear votes here - let them accumulate during the voting phase
    // Votes will be cleared in finishVoting after the turn is completed
    
    // Clear any existing timeout
    if (this.currentTimeout) {
      this.clock.clearTimeout(this.currentTimeout);
      this.currentTimeout = undefined;
    }
    
    // Schedule automatic finish when timer expires
    this.currentTimeout = this.clock.setTimeout(() => {
      // Clear the timeout reference first
      this.currentTimeout = undefined;
      // Don't call finishVoting here - let the completion callback handle it
      // This prevents double-processing of the same turn
      if (this.completionCallback && this.currentRoomCode) {
        this.completionCallback(this.currentRoomCode, { timeout: true });
      }
    }, timerSec * 1000);
  }

  castVote(gameState: GameState, players: Player[], playerId: string, column: number): VoteResult {
    // Check if voting window is open
    if (!gameState.endsAt) {
      return { success: false, error: 'Voting window is closed' };
    }

    // Find the player
    const player = players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // Check if it's the player's team turn
    if (player.team !== gameState.currentTeam) {
      return { success: false, error: 'Not your team\'s turn' };
    }

    // Validate column
    if (column < 0 || column >= 7) {
      return { success: false, error: 'Invalid column' };
    }

    // Check if column is full
    if (!this.gameEngine.isValidMove(gameState.board, column)) {
      return { success: false, error: 'Column is full' };
    }

    // Record the vote (overwrites previous vote from same player)
    gameState.votes[playerId] = column;
    
    return { success: true };
  }

  finishVoting(gameState: GameState, players: Player[]): TurnResult {
    // Clear the voting deadline
    delete gameState.endsAt;
    
    // Clear timeout if it exists
    if (this.currentTimeout) {
      this.clock.clearTimeout(this.currentTimeout);
      this.currentTimeout = undefined;
    }

    // Get valid columns (not full)
    const validColumns: number[] = [];
    for (let col = 0; col < 7; col++) {
      if (this.gameEngine.isValidMove(gameState.board, col)) {
        validColumns.push(col);
      }
    }

    // If no valid moves, game is a draw
    if (validColumns.length === 0) {
      gameState.result = { draw: true };
      return { moveApplied: false, gameEnded: true };
    }

    // Tally votes
    const perColumnCounts = this.turnDecider.tallyVotes(gameState.votes, validColumns);
    gameState.perColumnCounts = perColumnCounts;

    // Decide which column to play
    const chosenColumn = this.turnDecider.decideColumn(perColumnCounts, validColumns);

    // Update matching votes for players who voted for the chosen column
    const activeTeamPlayers = players.filter(p => p.team === gameState.currentTeam);
    for (const player of activeTeamPlayers) {
      if (gameState.votes[player.id] === chosenColumn) {
        player.matchingVotes++;
      }
    }

    // Clear votes
    gameState.votes = {};

    try {
      // Apply the move
      const moveResult = this.gameEngine.applyMove(gameState.board, chosenColumn, gameState.currentTeam);
      gameState.board = moveResult.board;
      gameState.lastMove = { col: chosenColumn, row: moveResult.row, team: gameState.currentTeam };

      // Check for win
      const winResult = this.gameEngine.checkWin(gameState.board, gameState.lastMove);
      if (winResult.winner) {
        if (winResult.winningLine) {
          gameState.result = {
            winner: winResult.winner,
            winningLine: winResult.winningLine
          };
        } else {
          gameState.result = {
            winner: winResult.winner
          };
        }
        return { moveApplied: true, gameEnded: true, chosenColumn };
      }

      // Check for draw (board full)
      if (this.gameEngine.isBoardFull(gameState.board)) {
        gameState.result = { draw: true };
        return { moveApplied: true, gameEnded: true, chosenColumn };
      }

      // Move to next team and round
      gameState.currentTeam = this.gameEngine.nextTeam(gameState.currentTeam);
      gameState.round++;

      return { moveApplied: true, gameEnded: false, chosenColumn };
    } catch (error) {
      return { 
        moveApplied: false, 
        gameEnded: false, 
        error: error instanceof Error ? error.message : 'Unknown error applying move'
      };
    }
  }

  // Check if all active team members have voted (for early resolution)
  hasAllTeamVoted(gameState: GameState, players: Player[]): boolean {
    const activeTeamPlayers = players.filter(p => 
      p.team === gameState.currentTeam && p.connected
    );
    
    return activeTeamPlayers.every(player => 
      gameState.votes[player.id] !== undefined
    );
  }

  // Get current vote counts for a team (for live updates)
  getTeamVoteCounts(gameState: GameState, players: Player[], team: Team): number[] {
    const teamVotes: Record<string, number> = {};
    const teamPlayers = players.filter(p => p.team === team);
    
    for (const player of teamPlayers) {
      const vote = gameState.votes[player.id];
      if (vote !== undefined) {
        teamVotes[player.id] = vote;
      }
    }

    // Get valid columns
    const validColumns: number[] = [];
    for (let col = 0; col < 7; col++) {
      if (this.gameEngine.isValidMove(gameState.board, col)) {
        validColumns.push(col);
      }
    }

    return this.turnDecider.tallyVotes(teamVotes, validColumns);
  }
}
