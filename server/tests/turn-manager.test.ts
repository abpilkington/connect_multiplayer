import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from '../src/services/TurnManager';
import { GameEngine } from '../src/engine/GameEngine';
import { MajorityTurnDecider } from '../src/services/MajorityTurnDecider';
import { FakeClock } from '../src/utils/Clock';
import type { GameState, Player } from '../src/types';

describe('TurnManager', () => {
  let turnManager: TurnManager;
  let gameEngine: GameEngine;
  let turnDecider: MajorityTurnDecider;
  let clock: FakeClock;
  let gameState: GameState;
  let mockPlayers: Player[];

  beforeEach(() => {
    gameEngine = new GameEngine();
    turnDecider = new MajorityTurnDecider();
    clock = new FakeClock();
    gameState = gameEngine.newGame();
    
    mockPlayers = [
      { id: 'p1', nickname: 'Player1', team: 'red', isAdmin: false, matchingVotes: 0, connected: true },
      { id: 'p2', nickname: 'Player2', team: 'red', isAdmin: false, matchingVotes: 0, connected: true },
      { id: 'p3', nickname: 'Player3', team: 'yellow', isAdmin: false, matchingVotes: 0, connected: true },
      { id: 'p4', nickname: 'Player4', team: 'yellow', isAdmin: false, matchingVotes: 0, connected: true },
    ];

    turnManager = new TurnManager(gameEngine, turnDecider, clock);
  });

  describe('startVoting', () => {
    it('should start voting window with correct deadline', () => {
      clock.setTime(1000);
      const timerSec = 15;
      
      turnManager.startVoting(gameState, mockPlayers, timerSec);
      
      expect(gameState.endsAt).toBe(1000 + 15000); // 15 seconds later
      expect(gameState.votes).toEqual({});
    });

    it('should schedule timeout for voting deadline', () => {
      clock.setTime(1000);
      const timerSec = 10;
      
      turnManager.startVoting(gameState, mockPlayers, timerSec);
      
      expect(clock.hasScheduledTimeouts()).toBe(true);
      expect(clock.getNextTimeoutTime()).toBe(1000 + 10000);
    });
  });

  describe('castVote', () => {
    beforeEach(() => {
      turnManager.startVoting(gameState, mockPlayers, 15);
    });

    it('should accept vote from active team player', () => {
      const result = turnManager.castVote(gameState, mockPlayers, 'p1', 3);
      
      expect(result.success).toBe(true);
      expect(gameState.votes['p1']).toBe(3);
    });

    it('should reject vote from inactive team player', () => {
      const result = turnManager.castVote(gameState, mockPlayers, 'p3', 3);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not your team\'s turn');
      expect(gameState.votes['p3']).toBeUndefined();
    });

    it('should allow player to change their vote', () => {
      turnManager.castVote(gameState, mockPlayers, 'p1', 3);
      const result = turnManager.castVote(gameState, mockPlayers, 'p1', 5);
      
      expect(result.success).toBe(true);
      expect(gameState.votes['p1']).toBe(5);
    });

    it('should reject vote for invalid column', () => {
      const result = turnManager.castVote(gameState, mockPlayers, 'p1', 7);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid column');
    });

    it('should reject vote for full column', () => {
      // Fill column 0
      for (let row = 0; row < 6; row++) {
        gameState.board[0]![row] = 'red';
      }
      
      const result = turnManager.castVote(gameState, mockPlayers, 'p1', 0);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Column is full');
    });

    it('should reject vote when voting window is closed', () => {
      delete gameState.endsAt; // Simulate closed voting
      
      const result = turnManager.castVote(gameState, mockPlayers, 'p1', 3);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Voting window is closed');
    });
  });

  describe('finishVoting', () => {
    beforeEach(() => {
      turnManager.startVoting(gameState, mockPlayers, 15);
    });

    it('should apply winning move and update game state', () => {
      // Cast votes
      gameState.votes = { 'p1': 3, 'p2': 3 }; // Both red players vote for column 3
      
      const result = turnManager.finishVoting(gameState, mockPlayers);
      
      expect(result.moveApplied).toBe(true);
      expect(gameState.board[5]![3]).toBe('red'); // board[row][col]
      expect(gameState.currentTeam).toBe('yellow');
      expect(gameState.round).toBe(2);
      expect(gameState.lastMove).toEqual({ col: 3, row: 5, team: 'red' });
      expect(gameState.votes).toEqual({});
      expect(gameState.endsAt).toBeUndefined();
    });

    it('should detect win condition', () => {
      // Set up near-win state (3 red pieces in a row)
      gameState.board[5]![0] = 'red'; // bottom row, columns 0-2
      gameState.board[5]![1] = 'red';
      gameState.board[5]![2] = 'red';
      
      // Vote to complete the win
      gameState.votes = { 'p1': 3, 'p2': 3 };
      
      const result = turnManager.finishVoting(gameState, mockPlayers);
      
      expect(result.gameEnded).toBe(true);
      expect(gameState.result?.winner).toBe('red');
      expect(gameState.result?.winningLine).toEqual([
        { col: 0, row: 5 },
        { col: 1, row: 5 },
        { col: 2, row: 5 },
        { col: 3, row: 5 }
      ]);
    });

    it('should detect draw condition', () => {
      // Create a specific board state that will result in a draw
      // Fill entire board with alternating pattern to avoid wins
      const pattern = [
        ['red', 'yellow', 'red', 'yellow', 'red', 'yellow'],
        ['yellow', 'red', 'yellow', 'red', 'yellow', 'red'],
        ['red', 'yellow', 'red', 'yellow', 'red', 'yellow'],
        ['yellow', 'red', 'yellow', 'red', 'yellow', 'red'],
        ['red', 'yellow', 'red', 'yellow', 'red', 'yellow'],
        ['yellow', 'red', 'yellow', 'red', 'yellow', 'red'],
        ['red', 'yellow', 'red', 'yellow', 'red', null] // Last spot empty
      ];
      
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
          gameState.board[row]![col] = pattern[col]![row] as any;
        }
      }
      
      // Vote for the last empty spot (column 6, row 5)
      gameState.votes = { 'p1': 6, 'p2': 6 };
      
      const result = turnManager.finishVoting(gameState, mockPlayers);
      
      expect(result.gameEnded).toBe(true);
      expect(gameState.result?.draw).toBe(true);
      expect(gameState.result?.winner).toBeUndefined();
    });

    it('should update matching votes for players who voted for chosen column', () => {
      gameState.votes = { 'p1': 3, 'p2': 5 }; // p1 votes for 3, p2 votes for 5
      
      const result = turnManager.finishVoting(gameState, mockPlayers);
      
      expect(result.moveApplied).toBe(true);
      expect(result.chosenColumn).toBeDefined();
      
      // One of the columns should be chosen randomly
      const chosenColumn = result.chosenColumn!;
      expect([3, 5]).toContain(chosenColumn);
      
      // Check that the piece was placed
      expect(gameState.board[5]![chosenColumn]).toBe('red');
      
      // Check matching votes
      const p1 = mockPlayers.find(p => p.id === 'p1')!;
      const p2 = mockPlayers.find(p => p.id === 'p2')!;
      
      if (chosenColumn === 3) {
        expect(p1.matchingVotes).toBe(1); // Voted for winning column
        expect(p2.matchingVotes).toBe(0); // Voted for different column
      } else {
        expect(p1.matchingVotes).toBe(0); // Voted for different column
        expect(p2.matchingVotes).toBe(1); // Voted for winning column
      }
    });

    it('should handle tie-breaking correctly', () => {
      gameState.votes = { 'p1': 5, 'p2': 3 }; // Tie between columns 3 and 5
      
      const result = turnManager.finishVoting(gameState, mockPlayers);
      
      expect(result.moveApplied).toBe(true);
      expect(result.chosenColumn).toBeDefined();
      
      // Should choose one of the tied columns randomly
      const chosenColumn = result.chosenColumn!;
      expect([3, 5]).toContain(chosenColumn);
      expect(gameState.board[5]![chosenColumn]).toBe('red'); // board[row][col]
    });

    it('should handle no votes by choosing random valid column', () => {
      gameState.votes = {}; // No votes
      
      const result = turnManager.finishVoting(gameState, mockPlayers);
      
      expect(result.moveApplied).toBe(true);
      expect(result.chosenColumn).toBeDefined();
      
      // Should choose a valid column randomly (0-6)
      const chosenColumn = result.chosenColumn!;
      expect(chosenColumn).toBeGreaterThanOrEqual(0);
      expect(chosenColumn).toBeLessThan(7);
      expect(gameState.board[5]![chosenColumn]).toBe('red'); // board[row][col]
    });
  });

  describe('automatic voting deadline', () => {
    it('should automatically finish voting when timer expires', () => {
      clock.setTime(1000);
      
      // Mock the completion callback to track calls
      let completionCallbackCalled = false;
      let timeoutResult: any = null;
      turnManager.setCompletionCallback('test-room', (roomCode: string, result: any) => {
        completionCallbackCalled = true;
        timeoutResult = result;
      });
      
      turnManager.startVoting(gameState, mockPlayers, 10);
      gameState.votes = { 'p1': 3 };
      
      // Advance time past the deadline
      clock.tick(10001);
      
      expect(completionCallbackCalled).toBe(true);
      expect(timeoutResult).toEqual({ timeout: true });
    });

    it('should prevent multiple timeout notifications when multiple timeouts fire', () => {
      clock.setTime(1000);
      
      let completionCallbackCallCount = 0;
      turnManager.setCompletionCallback('test-room', (roomCode: string, result: any) => {
        completionCallbackCallCount++;
      });
      
      // Start voting with a short timer
      turnManager.startVoting(gameState, mockPlayers, 5);
      gameState.votes = { 'p1': 3 };
      
      // Simulate multiple timeout events (race condition scenario)
      clock.tick(6000); // First timeout
      clock.tick(1000); // Second potential timeout
      clock.tick(1000); // Third potential timeout
      
      // Should only call completion callback once
      expect(completionCallbackCallCount).toBe(1);
    });
  });
});
