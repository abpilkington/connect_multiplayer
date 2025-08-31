import { describe, it, expect } from 'vitest';
import { MajorityTurnDecider } from '../src/services/MajorityTurnDecider';

describe('MajorityTurnDecider', () => {
  const turnDecider = new MajorityTurnDecider();

  describe('tallyVotes', () => {
    it('should count votes for each column', () => {
      const votes = {
        'player1': 0,
        'player2': 1,
        'player3': 0,
        'player4': 2,
      };
      const validCols = [0, 1, 2, 3, 4, 5, 6];
      
      const result = turnDecider.tallyVotes(votes, validCols);
      expect(result).toEqual([2, 1, 1, 0, 0, 0, 0]);
    });

    it('should ignore votes for invalid columns', () => {
      const votes = {
        'player1': 0,
        'player2': 7, // Invalid column
        'player3': -1, // Invalid column
        'player4': 2,
      };
      const validCols = [0, 1, 2, 3, 4, 5]; // Column 6 is full
      
      const result = turnDecider.tallyVotes(votes, validCols);
      expect(result).toEqual([1, 0, 1, 0, 0, 0, 0]);
    });

    it('should handle empty votes', () => {
      const votes = {};
      const validCols = [0, 1, 2, 3, 4, 5, 6];
      
      const result = turnDecider.tallyVotes(votes, validCols);
      expect(result).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });

    it('should only count votes for valid columns', () => {
      const votes = {
        'player1': 0, // Valid
        'player2': 3, // Valid  
        'player3': 6, // Invalid (full column)
        'player4': 3, // Valid
      };
      const validCols = [0, 1, 2, 3, 4, 5]; // Column 6 is full
      
      const result = turnDecider.tallyVotes(votes, validCols);
      expect(result).toEqual([1, 0, 0, 2, 0, 0, 0]);
    });
  });

  describe('decideColumn', () => {
    it('should choose column with most votes', () => {
      const counts = [1, 3, 0, 2, 1, 0, 0];
      const result = turnDecider.decideColumn(counts);
      expect(result).toBe(1);
    });

    it('should choose randomly among tied columns', () => {
      const counts = [2, 1, 2, 1, 0, 2, 0];
      const validCols = [0, 1, 2, 3, 4, 5, 6];
      const result = turnDecider.decideColumn(counts, validCols);
      // Should be one of the tied columns (0, 2, 5)
      expect([0, 2, 5]).toContain(result);
    });

    it('should choose randomly from valid columns when all are zero', () => {
      const counts = [0, 0, 0, 0, 0, 0, 0];
      const validCols = [0, 1, 2, 3, 4, 5, 6];
      const result = turnDecider.decideColumn(counts, validCols);
      expect(validCols).toContain(result);
    });

    it('should choose randomly from valid columns only when some columns are full', () => {
      const counts = [0, 0, 0, 0, 0, 0, 0];
      const validCols = [1, 3, 5]; // Only columns 1, 3, 5 are not full
      const result = turnDecider.decideColumn(counts, validCols);
      expect(validCols).toContain(result);
    });

    it('should handle single vote', () => {
      const counts = [0, 0, 0, 1, 0, 0, 0];
      const result = turnDecider.decideColumn(counts);
      expect(result).toBe(3);
    });

    it('should handle all columns having same vote count', () => {
      const counts = [1, 1, 1, 1, 1, 1, 1];
      const validCols = [0, 1, 2, 3, 4, 5, 6];
      const result = turnDecider.decideColumn(counts, validCols);
      expect(validCols).toContain(result); // Should pick one of the valid columns randomly
    });
  });
});
