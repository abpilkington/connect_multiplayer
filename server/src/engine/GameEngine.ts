import type { Team, GameState, Cell, IGameEngine } from '../types';

export class GameEngine implements IGameEngine {
  newGame(): GameState {
    // Create 6x7 board (6 rows, 7 columns each) - row-major order
    const board: (Team | null)[][] = Array.from({ length: 6 }, () => 
      Array.from({ length: 7 }, () => null)
    );

    return {
      board,
      currentTeam: 'red',
      round: 1,
      votes: {},
      perColumnCounts: [0, 0, 0, 0, 0, 0, 0],
    };
  }

  isValidMove(board: (Team | null)[][], col: number): boolean {
    // Check if column is within bounds
    if (col < 0 || col >= 7) {
      return false;
    }

    // Check if board has rows and column has space (top row is empty)
    // With row-major order: board[row][col], top row is index 0
    return !!(board[0] && board[0][col] === null);
  }

  applyMove(board: (Team | null)[][], col: number, team: Team): { board: (Team | null)[][]; row: number } {
    if (!this.isValidMove(board, col)) {
      throw new Error(`Invalid move: column ${col}`);
    }

    // Create a deep copy of the board to avoid mutation
    const newBoard = board.map(row => [...row]);

    // Find the lowest empty row (gravity effect) - start from bottom (row 5) and go up
    let targetRow = -1;
    for (let row = 5; row >= 0; row--) {
      const currentRow = newBoard[row];
      if (currentRow && currentRow[col] === null) {
        targetRow = row;
        break;
      }
    }

    if (targetRow === -1) {
      throw new Error(`Column ${col} is full`);
    }

    // Place the piece
    const targetRowArray = newBoard[targetRow];
    if (targetRowArray) {
      targetRowArray[col] = team;
    }

    return {
      board: newBoard,
      row: targetRow
    };
  }

  checkWin(board: (Team | null)[][], lastMove: { col: number; row: number; team: Team }): { winner?: Team; winningLine?: Cell[] } {
    const { col, row, team } = lastMove;

    // Check all four directions from the last move position
    const directions = [
      { deltaCol: 1, deltaRow: 0 },  // Horizontal
      { deltaCol: 0, deltaRow: 1 },  // Vertical
      { deltaCol: 1, deltaRow: 1 },  // Diagonal /
      { deltaCol: 1, deltaRow: -1 }  // Diagonal \
    ];

    for (const direction of directions) {
      const line = this.checkDirection(board, col, row, team, direction.deltaCol, direction.deltaRow);
      if (line.length >= 4) {
        return {
          winner: team,
          winningLine: line.slice(0, 4) // Return exactly 4 pieces
        };
      }
    }

    return {};
  }

  private checkDirection(
    board: (Team | null)[][],
    startCol: number,
    startRow: number,
    team: Team,
    deltaCol: number,
    deltaRow: number
  ): Cell[] {
    const line: Cell[] = [];

    // Check in both directions from the starting position
    // First, go backwards
    let col = startCol;
    let row = startRow;
    
    // Go backwards until we find a different piece or edge
    while (col >= 0 && col < 7 && row >= 0 && row < 6 && board[row]?.[col] === team) {
      col -= deltaCol;
      row -= deltaRow;
    }
    
    // Now go forward and collect all matching pieces
    col += deltaCol;
    row += deltaRow;
    
    while (col >= 0 && col < 7 && row >= 0 && row < 6 && board[row]?.[col] === team) {
      line.push({ col, row });
      col += deltaCol;
      row += deltaRow;
    }

    return line;
  }

  isBoardFull(board: (Team | null)[][]): boolean {
    // Check if all top rows are filled (row 0 for each column)
    if (!board[0]) return false;
    for (let col = 0; col < 7; col++) {
      if (board[0][col] === null) {
        return false;
      }
    }
    return true;
  }

  nextTeam(team: Team): Team {
    return team === 'red' ? 'yellow' : 'red';
  }
}
