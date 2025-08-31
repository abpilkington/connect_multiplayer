import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameEndView } from './GameEndView';
import { AppProvider } from '../state/AppContext';
import type { Room, Player, GameState, GameEndData, AppState } from '../types';

// Mock the AppContext
const mockAppContext = {
  state: {
    room: null,
    currentPlayer: null,
    gameEndData: null,
    error: null,
  } as AppState,
  startRematch: vi.fn(),
};

vi.mock('../state/AppContext', () => ({
  useAppContext: () => mockAppContext,
  AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: { reload: vi.fn() },
  writable: true,
});

// Test data
const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'player-1',
  nickname: 'TestPlayer',
  team: 'red',
  isAdmin: true,
  matchingVotes: 5,
  connected: true,
  ...overrides,
});

const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
  board: Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null)),
  currentTeam: 'red',
  round: 1,
  votes: {},
  perColumnCounts: [0, 0, 0, 0, 0, 0, 0],
  endsAt: Date.now() + 15000,
  ...overrides,
});

const createMockGameEndData = (overrides: Partial<GameEndData> = {}): GameEndData => ({
  result: 'red',
  line: [{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 3 }],
  ...overrides,
});

const createMockRoom = (overrides: Partial<Room> = {}): Room => ({
  code: 'TEST123',
  players: [createMockPlayer()],
  state: 'ended',
  game: createMockGameState(),
  settings: {
    timerSec: 15,
    maxPlayers: 10,
  },
  createdAt: Date.now(),
  ...overrides,
});

// Helper function to render GameEndView with context
const renderGameEndView = (room: Room, currentPlayer: Player, gameEndData: GameEndData) => {
  mockAppContext.state.room = room;
  mockAppContext.state.currentPlayer = currentPlayer;
  mockAppContext.state.gameEndData = gameEndData;
  
  return render(
    <AppProvider>
      <GameEndView />
    </AppProvider>
  );
};

describe('GameEndView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppContext.state.error = null;
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading state when room is missing', () => {
      mockAppContext.state.room = null;
      mockAppContext.state.currentPlayer = null;
      mockAppContext.state.gameEndData = null;

      render(
        <AppProvider>
          <GameEndView />
        </AppProvider>
      );

      expect(screen.getByText('Game Ended')).toBeInTheDocument();
      expect(screen.getByText('No game data available')).toBeInTheDocument();
    });

    it('should render loading state when game is missing', () => {
      const room = createMockRoom({ game: undefined });
      const player = createMockPlayer();
      const gameEndData = createMockGameEndData();

      mockAppContext.state.room = room;
      mockAppContext.state.currentPlayer = player;
      mockAppContext.state.gameEndData = gameEndData;

      render(
        <AppProvider>
          <GameEndView />
        </AppProvider>
      );

      expect(screen.getByText('Game Ended')).toBeInTheDocument();
      expect(screen.getByText('No game data available')).toBeInTheDocument();
    });

    it('should render loading state when gameEndData is missing', () => {
      const room = createMockRoom();
      const player = createMockPlayer();

      mockAppContext.state.room = room;
      mockAppContext.state.currentPlayer = player;
      mockAppContext.state.gameEndData = null;

      render(
        <AppProvider>
          <GameEndView />
        </AppProvider>
      );

      expect(screen.getByText('Game Ended')).toBeInTheDocument();
      expect(screen.getByText('No game data available')).toBeInTheDocument();
    });
  });

  describe('Header Section', () => {
    it('should display room code', () => {
      const room = createMockRoom();
      const player = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, player, gameEndData);

      expect(screen.getByText('Room: TEST123')).toBeInTheDocument();
    });

    it('should display win title when red team wins', () => {
      const room = createMockRoom();
      const player = createMockPlayer({ team: 'red' });
      const gameEndData = createMockGameEndData({ result: 'red' });

      renderGameEndView(room, player, gameEndData);

      expect(screen.getByText('Your Team Won!')).toBeInTheDocument();
    });

    it('should display win title when yellow team wins', () => {
      const room = createMockRoom();
      const player = createMockPlayer({ team: 'yellow' });
      const gameEndData = createMockGameEndData({ result: 'yellow' });

      renderGameEndView(room, player, gameEndData);

      expect(screen.getByText('Your Team Won!')).toBeInTheDocument();
    });

    it('should display opponent win title when other team wins', () => {
      const room = createMockRoom();
      const player = createMockPlayer({ team: 'red' });
      const gameEndData = createMockGameEndData({ result: 'yellow' });

      renderGameEndView(room, player, gameEndData);

      expect(screen.getByText('Yellow Team Wins!')).toBeInTheDocument();
    });

    it('should display draw title when game is a draw', () => {
      const room = createMockRoom();
      const player = createMockPlayer();
      const gameEndData = createMockGameEndData({ result: 'draw' });

      renderGameEndView(room, player, gameEndData);

      expect(screen.getByText("It's a Draw!")).toBeInTheDocument();
    });
  });

  describe('Game Board Rendering', () => {
    it('should render final board with title', () => {
      const room = createMockRoom();
      const player = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, player, gameEndData);

      expect(screen.getByText('Final Board')).toBeInTheDocument();
    });

    it('should render 7x6 game board', () => {
      const room = createMockRoom();
      const player = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, player, gameEndData);

      // Should have 42 cells (7x6) - now using aspect-square class
      const cells = document.querySelectorAll('[class*="aspect-square"]');
      expect(cells).toHaveLength(42);
    });

    it('should highlight winning line cells', () => {
      const room = createMockRoom();
      const player = createMockPlayer();
      const gameEndData = createMockGameEndData({
        line: [{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 3 }],
      });

      renderGameEndView(room, player, gameEndData);

      // Should have 4 winning cells with green indicators - now using w-4 h-4
      const winningIndicators = document.querySelectorAll('.w-4.h-4.bg-green-400');
      expect(winningIndicators).toHaveLength(4);
    });

    it('should render board with mixed pieces', () => {
      const gameState = createMockGameState();
      // Add some pieces to the board
      gameState.board[0][0] = 'red';
      gameState.board[1][1] = 'yellow';
      gameState.board[2][2] = 'red';
      
      const room = createMockRoom({ game: gameState });
      const player = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, player, gameEndData);

      // Should have cells with different colors
      const redCells = document.querySelectorAll('.bg-red-500');
      const yellowCells = document.querySelectorAll('.bg-yellow-400');
      const emptyCells = document.querySelectorAll('.bg-white');

      expect(redCells.length).toBeGreaterThan(0);
      expect(yellowCells.length).toBeGreaterThan(0);
      expect(emptyCells.length).toBeGreaterThan(0);
    });
  });

  describe('Team Rosters', () => {
    it('should display red team roster', () => {
      const redPlayer = createMockPlayer({ id: 'red-1', team: 'red', nickname: 'RedPlayer' });
      const room = createMockRoom({ players: [redPlayer] });
      const currentPlayer = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, currentPlayer, gameEndData);

      // Check that the text is displayed somewhere in the component
      const allText = document.body.textContent || '';
      expect(allText).toContain('Red Team');
      expect(allText).toContain('RedPlayer');
    });

    it('should display yellow team roster', () => {
      const yellowPlayer = createMockPlayer({ id: 'yellow-1', team: 'yellow', nickname: 'YellowPlayer' });
      const room = createMockRoom({ players: [yellowPlayer] });
      const currentPlayer = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, currentPlayer, gameEndData);

      // Team headers now include emojis
      expect(screen.getByText('🟡 Yellow Team')).toBeInTheDocument();
      // Use getAllByText to handle multiple elements with same text
      const yellowPlayerElements = screen.getAllByText('YellowPlayer');
      expect(yellowPlayerElements.length).toBeGreaterThan(0);
    });

    it('should show trophy for winning team', () => {
      const redPlayer = createMockPlayer({ id: 'red-1', team: 'red', nickname: 'RedPlayer' });
      const room = createMockRoom({ players: [redPlayer] });
      const currentPlayer = createMockPlayer();
      const gameEndData = createMockGameEndData({ result: 'red' });

      renderGameEndView(room, currentPlayer, gameEndData);

      // Check that the trophy is displayed somewhere in the component
      const allText = document.body.textContent || '';
      expect(allText).toContain('🏆');
    });

    it('should highlight current player with "(You)"', () => {
      const currentPlayer = createMockPlayer({ id: 'current-1', team: 'red', nickname: 'CurrentPlayer' });
      const room = createMockRoom({ players: [currentPlayer] });
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, currentPlayer, gameEndData);

      expect(screen.getByText('CurrentPlayer (You)')).toBeInTheDocument();
    });

    it('should show crown for admin players', () => {
      const adminPlayer = createMockPlayer({ id: 'admin-1', team: 'red', nickname: 'AdminPlayer', isAdmin: true });
      const room = createMockRoom({ players: [adminPlayer] });
      const currentPlayer = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, currentPlayer, gameEndData);

      // Check that the crown is displayed somewhere in the component
      const allText = document.body.textContent || '';
      expect(allText).toContain('👑');
    });
  });

  describe('Player Performance', () => {
    it('should display MVP section', () => {
      const mvpPlayer = createMockPlayer({ id: 'mvp-1', nickname: 'MVPPlayer', matchingVotes: 10 });
      const otherPlayer = createMockPlayer({ id: 'other-1', nickname: 'OtherPlayer', matchingVotes: 5 });
      const room = createMockRoom({ players: [mvpPlayer, otherPlayer] });
      const currentPlayer = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, currentPlayer, gameEndData);

      expect(screen.getByText('🏅')).toBeInTheDocument();
      expect(screen.getByText('MVP: MVPPlayer')).toBeInTheDocument();
      expect(screen.getByText('10 winning votes')).toBeInTheDocument();
    });

    it('should display all players sorted by performance', () => {
      const player1 = createMockPlayer({ id: '1', nickname: 'Player1', matchingVotes: 10 });
      const player2 = createMockPlayer({ id: '2', nickname: 'Player2', matchingVotes: 5 });
      const player3 = createMockPlayer({ id: '3', nickname: 'Player3', matchingVotes: 3 });
      const room = createMockRoom({ players: [player1, player2, player3] });
      const currentPlayer = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, currentPlayer, gameEndData);

      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
      // Use getAllByText to handle multiple elements with same text
      const player1Elements = screen.getAllByText('Player1');
      const player2Elements = screen.getAllByText('Player2');
      const player3Elements = screen.getAllByText('Player3');
      expect(player1Elements.length).toBeGreaterThan(0);
      expect(player2Elements.length).toBeGreaterThan(0);
      expect(player3Elements.length).toBeGreaterThan(0);
    });

    it('should highlight current player in performance list', () => {
      const currentPlayer = createMockPlayer({ id: 'current-1', nickname: 'CurrentPlayer', matchingVotes: 5 });
      const otherPlayer = createMockPlayer({ id: 'other-1', nickname: 'OtherPlayer', matchingVotes: 3 });
      const room = createMockRoom({ players: [currentPlayer, otherPlayer] });
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, currentPlayer, gameEndData);

      // The highlighting is on the outer div that contains the player info
      const currentPlayerContainer = screen.getByText('CurrentPlayer (You)').closest('div');
      const highlightedContainer = currentPlayerContainer?.parentElement;
      // Updated styling classes for current player highlighting
      expect(highlightedContainer).toHaveClass('bg-blue-100', 'border-2', 'border-blue-300');
    });

    it('should show team color indicators', () => {
      const redPlayer = createMockPlayer({ id: 'red-1', team: 'red', nickname: 'RedPlayer' });
      const yellowPlayer = createMockPlayer({ id: 'yellow-1', team: 'yellow', nickname: 'YellowPlayer' });
      const room = createMockRoom({ players: [redPlayer, yellowPlayer] });
      const currentPlayer = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, currentPlayer, gameEndData);

      const redIndicators = document.querySelectorAll('.bg-red-500');
      const yellowIndicators = document.querySelectorAll('.bg-yellow-400');
      expect(redIndicators.length).toBeGreaterThan(0);
      expect(yellowIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('User Interactions', () => {
    it('should call startRematch when admin clicks play again', async () => {
      mockAppContext.startRematch.mockResolvedValue(undefined);
      const room = createMockRoom();
      const adminPlayer = createMockPlayer({ isAdmin: true });
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, adminPlayer, gameEndData);

      const playAgainButton = screen.getByRole('button', { name: '🔄 Play Again' });
      fireEvent.click(playAgainButton);

      await waitFor(() => {
        expect(mockAppContext.startRematch).toHaveBeenCalled();
      });
    });

    it('should not show play again button for non-admin players', () => {
      const room = createMockRoom();
      const regularPlayer = createMockPlayer({ isAdmin: false });
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, regularPlayer, gameEndData);

      expect(screen.queryByRole('button', { name: '🔄 Play Again' })).not.toBeInTheDocument();
    });

    it('should show waiting message for non-admin players', () => {
      const room = createMockRoom();
      const regularPlayer = createMockPlayer({ isAdmin: false });
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, regularPlayer, gameEndData);

      expect(screen.getByText('Waiting for admin to start a rematch...')).toBeInTheDocument();
    });

    it('should call window.location.reload when back to home is clicked', () => {
      const room = createMockRoom();
      const player = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, player, gameEndData);

      const backButton = screen.getByRole('button', { name: '🏠 Back to Home' });
      fireEvent.click(backButton);

      expect(window.location.reload).toHaveBeenCalled();
    });

    it('should handle startRematch errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAppContext.startRematch.mockRejectedValue(new Error('Failed to start rematch'));
      
      const room = createMockRoom();
      const adminPlayer = createMockPlayer({ isAdmin: true });
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, adminPlayer, gameEndData);

      const playAgainButton = screen.getByRole('button', { name: '🔄 Play Again' });
      fireEvent.click(playAgainButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to start rematch:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Game Outcomes', () => {
    it('should handle red team win correctly', () => {
      const room = createMockRoom();
      const player = createMockPlayer({ team: 'red' });
      const gameEndData = createMockGameEndData({ result: 'red' });

      renderGameEndView(room, player, gameEndData);

      expect(screen.getByText('Your Team Won!')).toBeInTheDocument();
      expect(screen.getByText('Your Team Won!')).toHaveClass('text-green-600');
    });

    it('should handle yellow team win correctly', () => {
      const room = createMockRoom();
      const player = createMockPlayer({ team: 'yellow' });
      const gameEndData = createMockGameEndData({ result: 'yellow' });

      renderGameEndView(room, player, gameEndData);

      expect(screen.getByText('Your Team Won!')).toBeInTheDocument();
      expect(screen.getByText('Your Team Won!')).toHaveClass('text-green-600');
    });

    it('should handle opponent win correctly', () => {
      const room = createMockRoom();
      const player = createMockPlayer({ team: 'red' });
      const gameEndData = createMockGameEndData({ result: 'yellow' });

      renderGameEndView(room, player, gameEndData);

      expect(screen.getByText('Yellow Team Wins!')).toBeInTheDocument();
      expect(screen.getByText('Yellow Team Wins!')).toHaveClass('text-yellow-600');
    });

    it('should handle draw correctly', () => {
      const room = createMockRoom();
      const player = createMockPlayer();
      const gameEndData = createMockGameEndData({ result: 'draw' });

      renderGameEndView(room, player, gameEndData);

      expect(screen.getByText("It's a Draw!")).toBeInTheDocument();
      expect(screen.getByText("It's a Draw!")).toHaveClass('text-gray-600');
    });
  });

  describe('Edge Cases', () => {
    it('should handle room with no players', () => {
      const room = createMockRoom({ players: [] });
      const player = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, player, gameEndData);

      // Check that team headings exist
      const redTeamHeading = screen.getByRole('heading', { level: 4, name: /Red Team/ });
      const yellowTeamHeading = screen.getByRole('heading', { level: 4, name: /Yellow Team/ });
      expect(redTeamHeading).toBeInTheDocument();
      expect(yellowTeamHeading).toBeInTheDocument();
    });

    it('should handle room with only one team', () => {
      const redPlayer = createMockPlayer({ id: 'red-1', team: 'red', nickname: 'RedPlayer' });
      const room = createMockRoom({ players: [redPlayer] });
      const currentPlayer = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, currentPlayer, gameEndData);

      // Use getAllByText to handle multiple elements with same text
      const redPlayerElements = screen.getAllByText('RedPlayer');
      expect(redPlayerElements.length).toBeGreaterThan(0);
      // GameEndView shows team rosters even with empty teams, so no "No players yet" text
    });

    it('should handle very long nicknames', () => {
      const longNickname = 'A'.repeat(50);
      const player = createMockPlayer({ nickname: longNickname });
      const room = createMockRoom({ players: [player] });
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, player, gameEndData);

      // Check that the long nickname is displayed somewhere in the component
      const allText = document.body.textContent || '';
      expect(allText).toContain(longNickname);
    });

    it('should handle special characters in nicknames', () => {
      const specialNickname = 'Test@Player#123';
      const player = createMockPlayer({ nickname: specialNickname });
      const room = createMockRoom({ players: [player] });
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, player, gameEndData);

      // Check that the special nickname is displayed somewhere in the component
      const allText = document.body.textContent || '';
      expect(allText).toContain(specialNickname);
    });

    it('should handle players with zero matching votes', () => {
      const player1 = createMockPlayer({ id: '1', nickname: 'Player1', matchingVotes: 0 });
      const player2 = createMockPlayer({ id: '2', nickname: 'Player2', matchingVotes: 0 });
      const room = createMockRoom({ players: [player1, player2] });
      const currentPlayer = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, currentPlayer, gameEndData);

      // Should find multiple elements with "0 votes" text
      const voteElements = screen.getAllByText('0 votes');
      expect(voteElements.length).toBeGreaterThan(0);
    });

    it('should handle winning line with no coordinates', () => {
      const room = createMockRoom();
      const player = createMockPlayer();
      const gameEndData = createMockGameEndData({ line: undefined });

      renderGameEndView(room, player, gameEndData);

      // Should render board without winning highlights - now using w-4 h-4
      const winningIndicators = document.querySelectorAll('.w-4.h-4.bg-green-400');
      expect(winningIndicators).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles and labels', () => {
      const room = createMockRoom();
      const adminPlayer = createMockPlayer({ isAdmin: true });
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, adminPlayer, gameEndData);

      expect(screen.getByRole('button', { name: '🔄 Play Again' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '🏠 Back to Home' })).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      const room = createMockRoom();
      const player = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, player, gameEndData);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent(/Your Team Won!|Yellow Team Wins!|It's a Draw!/);

      const boardHeading = screen.getByRole('heading', { level: 3, name: 'Final Board' });
      expect(boardHeading).toHaveTextContent('Final Board');

      const performanceHeading = screen.getByRole('heading', { level: 3, name: 'Player Performance' });
      expect(performanceHeading).toHaveTextContent('Player Performance');
    });
  });

  describe('Responsive Design', () => {
    it('should have proper grid layout classes', () => {
      const room = createMockRoom();
      const player = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, player, gameEndData);

      // Game stats now use lg:grid-cols-2 instead of md:grid-cols-2
      const statsGrid = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2');
      expect(statsGrid).toBeInTheDocument();
    });

    it('should have proper flex layout for action buttons', () => {
      const room = createMockRoom();
      const player = createMockPlayer();
      const gameEndData = createMockGameEndData();

      renderGameEndView(room, player, gameEndData);

      // Action buttons now use gap-6 instead of gap-4
      const actionButtons = document.querySelector('.flex.justify-center.gap-6');
      expect(actionButtons).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should update when gameEndData changes', () => {
      const room = createMockRoom();
      const player = createMockPlayer();
      const gameEndData = createMockGameEndData({ result: 'red' });

      const { rerender } = renderGameEndView(room, player, gameEndData);

      // Initially should show red team win
      expect(screen.getByText('Your Team Won!')).toBeInTheDocument();

      // Update to yellow team win
      const updatedGameEndData = { ...gameEndData, result: 'yellow' };
      mockAppContext.state.gameEndData = updatedGameEndData;
      
      rerender(
        <AppProvider>
          <GameEndView />
        </AppProvider>
      );

      // Should now show yellow team win
      expect(screen.getByText('Yellow Team Wins!')).toBeInTheDocument();
    });

    it('should handle current player changes', () => {
      const room = createMockRoom();
      const player = createMockPlayer({ isAdmin: true });
      const gameEndData = createMockGameEndData();

      const { rerender } = renderGameEndView(room, player, gameEndData);

      // Should show admin controls
      expect(screen.getByRole('button', { name: '🔄 Play Again' })).toBeInTheDocument();

      // Change to non-admin player
      const nonAdminPlayer = { ...player, isAdmin: false };
      mockAppContext.state.currentPlayer = nonAdminPlayer;

      // Re-render with new context
      rerender(
        <AppProvider>
          <GameEndView />
        </AppProvider>
      );

      // Should not show admin controls
      expect(screen.queryByRole('button', { name: '🔄 Play Again' })).not.toBeInTheDocument();
    });
  });
});
