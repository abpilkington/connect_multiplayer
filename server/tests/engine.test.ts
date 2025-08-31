import { describe, it, expect } from 'vitest';
import { GameEngine } from '../src/engine/GameEngine';


describe('GameEngine', () => {
  const engine = new GameEngine();

  describe('newGame', () => {
    it('should create a new game with empty 7x6 board', () => {
      const game = engine.newGame();
      
      expect(game.board).toHaveLength(6); // 6 rows
      game.board.forEach(row => {
        expect(row).toHaveLength(7); // 7 columns each
        row.forEach(cell => {
          expect(cell).toBeNull();
        });
      });
      
      expect(game.currentTeam).toBe('red');
      expect(game.round).toBe(1);
      expect(game.votes).toEqual({});
      expect(game.perColumnCounts).toEqual([0, 0, 0, 0, 0, 0, 0]);
      expect(game.lastMove).toBeUndefined();
      expect(game.result).toBeUndefined();
    });
  });

  describe('isValidMove', () => {
    it('should return true for empty column', () => {
      const game = engine.newGame();
      expect(engine.isValidMove(game.board, 0)).toBe(true);
      expect(engine.isValidMove(game.board, 6)).toBe(true);
    });

    it('should return false for invalid column numbers', () => {
      const game = engine.newGame();
      expect(engine.isValidMove(game.board, -1)).toBe(false);
      expect(engine.isValidMove(game.board, 7)).toBe(false);
    });

    it('should return false for full column', () => {
      const game = engine.newGame();
      // Fill column 0 completely
      for (let row = 0; row < 6; row++) {
        game.board[0]![row] = 'red';
      }
      expect(engine.isValidMove(game.board, 0)).toBe(false);
    });

    it('should return true for partially filled column', () => {
      const game = engine.newGame();
      // Fill bottom 3 rows of column 0 (rows 3, 4, 5)
      for (let row = 3; row < 6; row++) {
        game.board[row]![0] = 'red';
      }
      expect(engine.isValidMove(game.board, 0)).toBe(true);
    });
  });

  describe('applyMove', () => {
    it('should place piece in bottom row of empty column', () => {
      const game = engine.newGame();
      const result = engine.applyMove(game.board, 3, 'red');
      
      expect(result.row).toBe(5); // Bottom row is now index 5
      expect(result.board[5]![3]).toBe('red'); // board[row][col]
      // Original board should not be mutated
      expect(game.board[5]![3]).toBeNull();
    });

    it('should stack pieces from bottom up', () => {
      const game = engine.newGame();
      let result = engine.applyMove(game.board, 3, 'red');
      expect(result.row).toBe(5); // Bottom row
      expect(result.board[5]![3]).toBe('red');
      
      result = engine.applyMove(result.board, 3, 'yellow');
      expect(result.row).toBe(4); // Second from bottom
      expect(result.board[4]![3]).toBe('yellow');
      expect(result.board[5]![3]).toBe('red'); // First piece should still be there
    });

    it('should throw error for invalid column', () => {
      const game = engine.newGame();
      expect(() => engine.applyMove(game.board, -1, 'red')).toThrow();
      expect(() => engine.applyMove(game.board, 7, 'red')).toThrow();
    });

    it('should throw error for full column', () => {
      const game = engine.newGame();
      // Fill column completely
      for (let row = 0; row < 6; row++) {
        game.board[0]![row] = 'red';
      }
      expect(() => engine.applyMove(game.board, 0, 'yellow')).toThrow();
    });
  });

  describe('checkWin', () => {
    it('should detect horizontal win', () => {
      const game = engine.newGame();
      // Place 4 red pieces horizontally in bottom row (row 5)
      for (let col = 0; col < 4; col++) {
        game.board[5]![col] = 'red';
      }
      
      const result = engine.checkWin(game.board, { col: 3, row: 5, team: 'red' });
      expect(result.winner).toBe('red');
      expect(result.winningLine).toEqual([
        { col: 0, row: 5 },
        { col: 1, row: 5 },
        { col: 2, row: 5 },
        { col: 3, row: 5 }
      ]);
    });

    it('should detect vertical win', () => {
      const game = engine.newGame();
      // Place 4 red pieces vertically in column 0 (rows 2-5)
      for (let row = 2; row < 6; row++) {
        game.board[row]![0] = 'red';
      }
      
      const result = engine.checkWin(game.board, { col: 0, row: 5, team: 'red' });
      expect(result.winner).toBe('red');
      expect(result.winningLine).toEqual([
        { col: 0, row: 2 },
        { col: 0, row: 3 },
        { col: 0, row: 4 },
        { col: 0, row: 5 }
      ]);
    });

    it('should detect diagonal win (bottom-left to top-right)', () => {
      const game = engine.newGame();
      // Create diagonal win
      game.board[0]![0] = 'red';
      game.board[1]![1] = 'red';
      game.board[2]![2] = 'red';
      game.board[3]![3] = 'red';
      
      const result = engine.checkWin(game.board, { col: 3, row: 3, team: 'red' });
      expect(result.winner).toBe('red');
      expect(result.winningLine).toEqual([
        { col: 0, row: 0 },
        { col: 1, row: 1 },
        { col: 2, row: 2 },
        { col: 3, row: 3 }
      ]);
    });

    it('should detect diagonal win (top-left to bottom-right)', () => {
      const game = engine.newGame();
      // Create diagonal win
      game.board[0]![3] = 'red';
      game.board[1]![2] = 'red';
      game.board[2]![1] = 'red';
      game.board[3]![0] = 'red';
      
      const result = engine.checkWin(game.board, { col: 3, row: 0, team: 'red' });
      expect(result.winner).toBe('red');
      expect(result.winningLine).toEqual([
        { col: 0, row: 3 },
        { col: 1, row: 2 },
        { col: 2, row: 1 },
        { col: 3, row: 0 }
      ]);
    });

    it('should return no winner when no win condition is met', () => {
      const game = engine.newGame();
      game.board[0]![0] = 'red';
      game.board[1]![0] = 'yellow';
      game.board[2]![0] = 'red';
      
      const result = engine.checkWin(game.board, { col: 2, row: 0, team: 'red' });
      expect(result.winner).toBeUndefined();
      expect(result.winningLine).toBeUndefined();
    });
  });

  describe('isBoardFull', () => {
    it('should return false for empty board', () => {
      const game = engine.newGame();
      expect(engine.isBoardFull(game.board)).toBe(false);
    });

    it('should return false for partially filled board', () => {
      const game = engine.newGame();
      game.board[0]![0] = 'red';
      game.board[1]![0] = 'yellow';
      expect(engine.isBoardFull(game.board)).toBe(false);
    });

    it('should return true for completely filled board', () => {
      const game = engine.newGame();
      // Fill entire board
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
          game.board[row]![col] = col % 2 === 0 ? 'red' : 'yellow';
        }
      }
      expect(engine.isBoardFull(game.board)).toBe(true);
    });
  });

  describe('nextTeam', () => {
    it('should alternate between red and yellow', () => {
      expect(engine.nextTeam('red')).toBe('yellow');
      expect(engine.nextTeam('yellow')).toBe('red');
    });
  });
});
