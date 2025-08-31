import type { ITurnDecider } from '../types';

export class MajorityTurnDecider implements ITurnDecider {
  tallyVotes(votes: Record<string, number>, validCols: number[]): number[] {
    const counts = [0, 0, 0, 0, 0, 0, 0]; // 7 columns
    
    for (const column of Object.values(votes)) {
      // Only count votes for valid columns
      if (validCols.includes(column) && column >= 0 && column < 7) {
        counts[column] = (counts[column] || 0) + 1;
      }
    }
    
    return counts;
  }

  decideColumn(perColumnCounts: number[], validCols: number[] = [0, 1, 2, 3, 4, 5, 6]): number {
    // If no votes at all, pick random valid column
    const totalVotes = perColumnCounts.reduce((sum, count) => sum + count, 0);
    if (totalVotes === 0) {
      return this.pickRandomColumn(validCols);
    }
    
    // Find maximum vote count among valid columns only
    let maxVotes = 0;
    for (let col = 0; col < perColumnCounts.length; col++) {
      const colVotes = perColumnCounts[col];
      if (validCols.includes(col) && colVotes !== undefined && colVotes > maxVotes) {
        maxVotes = colVotes;
      }
    }
    
    // If still no votes for valid columns, pick random valid column
    if (maxVotes === 0) {
      return this.pickRandomColumn(validCols);
    }
    
    // Find all columns with the maximum votes (among valid columns)
    const tiedColumns: number[] = [];
    for (let col = 0; col < perColumnCounts.length; col++) {
      if (validCols.includes(col) && perColumnCounts[col] === maxVotes) {
        tiedColumns.push(col);
      }
    }
    
    // Random selection among tied columns
    return this.pickRandomColumn(tiedColumns);
  }

  private pickRandomColumn(columns: number[]): number {
    if (columns.length === 0) {
      return 0; // Fallback
    }
    const randomIndex = Math.floor(Math.random() * columns.length);
    return columns[randomIndex]!;
  }
}
