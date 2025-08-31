import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LobbyView } from './LobbyView';
import { AppProvider } from '../state/AppContext';
import type { Room, Player, AppState } from '../types';

// Mock the AppContext
const mockAppContext = {
  state: {
    room: null,
    currentPlayer: null,
    error: null,
  } as AppState,
  startGame: vi.fn(),
  leaveRoom: vi.fn(),
};

vi.mock('../state/AppContext', () => ({
  useAppContext: () => mockAppContext,
  AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Test data
const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'player-1',
  nickname: 'TestPlayer',
  team: 'red',
  isAdmin: true,
  matchingVotes: 0,
  connected: true,
  ...overrides,
});

const createMockRoom = (overrides: Partial<Room> = {}): Room => ({
  code: 'TEST123',
  players: [createMockPlayer()],
  state: 'lobby',
  settings: {
    timerSec: 15,
    maxPlayers: 10,
  },
  createdAt: Date.now(),
  ...overrides,
});

// Helper function to render LobbyView with context
const renderLobbyView = (room: Room, currentPlayer: Player) => {
  mockAppContext.state.room = room;
  mockAppContext.state.currentPlayer = currentPlayer;
  
  return render(
    <AppProvider>
      <LobbyView />
    </AppProvider>
  );
};

describe('LobbyView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppContext.state.error = null;
  });

  describe('Loading State', () => {
    it('should render loading state when room is missing', () => {
      mockAppContext.state.room = null;
      mockAppContext.state.currentPlayer = null;

      render(
        <AppProvider>
          <LobbyView />
        </AppProvider>
      );

      expect(screen.getByText('Loading room...')).toBeInTheDocument();
    });

    it('should render loading state when currentPlayer is missing', () => {
      const room = createMockRoom();
      mockAppContext.state.room = room;
      mockAppContext.state.currentPlayer = null;

      render(
        <AppProvider>
          <LobbyView />
        </AppProvider>
      );

      expect(screen.getByText('Loading room...')).toBeInTheDocument();
    });
  });

  describe('Header Section', () => {
    it('should render the main heading', () => {
      const room = createMockRoom();
      const player = createMockPlayer();

      renderLobbyView(room, player);

      expect(screen.getByText('🔴 Connect Four Lobby 🟡')).toBeInTheDocument();
    });

    it('should display room code', () => {
      const room = createMockRoom();
      const player = createMockPlayer();

      renderLobbyView(room, player);

      expect(screen.getByText('Room Code: TEST123')).toBeInTheDocument();
    });

    it('should show password protected indicator when room has password', () => {
      const room = createMockRoom({ passwordHash: 'hashedPassword' });
      const player = createMockPlayer();

      renderLobbyView(room, player);

      expect(screen.getByText('🔒 Password Protected')).toBeInTheDocument();
    });

    it('should not show password protected indicator when room has no password', () => {
      const room = createMockRoom({ passwordHash: undefined });
      const player = createMockPlayer();

      renderLobbyView(room, player);

      expect(screen.queryByText('🔒 Password Protected')).not.toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display error message when present', () => {
      mockAppContext.state.error = 'Test error message';
      const room = createMockRoom();
      const player = createMockPlayer();

      renderLobbyView(room, player);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
      // The error message is wrapped in a div with the classes, not the paragraph itself
      const errorContainer = screen.getByText('Test error message').closest('div');
      expect(errorContainer).toHaveClass('bg-red-100', 'border-red-400', 'text-red-700');
    });

    it('should not display error section when no error', () => {
      mockAppContext.state.error = null;
      const room = createMockRoom();
      const player = createMockPlayer();

      renderLobbyView(room, player);

      expect(screen.queryByText(/Test error message/)).not.toBeInTheDocument();
    });
  });

  describe('Room Settings', () => {
    it('should display game settings', () => {
      const room = createMockRoom({
        settings: {
          timerSec: 20,
          maxPlayers: 8,
        },
      });
      const player = createMockPlayer();

      renderLobbyView(room, player);

      expect(screen.getByText('Game Settings')).toBeInTheDocument();
      expect(screen.getByText('Vote Timer:')).toBeInTheDocument();
      expect(screen.getByText('20 seconds')).toBeInTheDocument();
      expect(screen.getByText('Max Players:')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should handle different timer values', () => {
      const room = createMockRoom({
        settings: {
          timerSec: 30,
          maxPlayers: 10,
        },
      });
      const player = createMockPlayer();

      renderLobbyView(room, player);

      expect(screen.getByText('30 seconds')).toBeInTheDocument();
    });
  });

  describe('Team Display', () => {
    it('should display red team with players', () => {
      const redPlayer = createMockPlayer({ id: 'red-1', team: 'red', nickname: 'RedPlayer' });
      const room = createMockRoom({
        players: [redPlayer],
      });
      const currentPlayer = createMockPlayer();

      renderLobbyView(room, currentPlayer);

      expect(screen.getByText('🔴 Red Team (1)')).toBeInTheDocument();
      expect(screen.getByText('RedPlayer')).toBeInTheDocument();
    });

    it('should display yellow team with players', () => {
      const yellowPlayer = createMockPlayer({ id: 'yellow-1', team: 'yellow', nickname: 'YellowPlayer' });
      const room = createMockRoom({
        players: [yellowPlayer],
      });
      const currentPlayer = createMockPlayer();

      renderLobbyView(room, currentPlayer);

      expect(screen.getByText('🟡 Yellow Team (1)')).toBeInTheDocument();
      expect(screen.getByText('YellowPlayer')).toBeInTheDocument();
    });

    it('should display both teams with multiple players', () => {
      const redPlayer1 = createMockPlayer({ id: 'red-1', team: 'red', nickname: 'RedPlayer1' });
      const redPlayer2 = createMockPlayer({ id: 'red-2', team: 'red', nickname: 'RedPlayer2' });
      const yellowPlayer = createMockPlayer({ id: 'yellow-1', team: 'yellow', nickname: 'YellowPlayer' });
      const room = createMockRoom({
        players: [redPlayer1, redPlayer2, yellowPlayer],
      });
      const currentPlayer = createMockPlayer();

      renderLobbyView(room, currentPlayer);

      expect(screen.getByText('🔴 Red Team (2)')).toBeInTheDocument();
      expect(screen.getByText('🟡 Yellow Team (1)')).toBeInTheDocument();
      expect(screen.getByText('RedPlayer1')).toBeInTheDocument();
      expect(screen.getByText('RedPlayer2')).toBeInTheDocument();
      expect(screen.getByText('YellowPlayer')).toBeInTheDocument();
    });

    it('should show admin badge for admin players', () => {
      const adminPlayer = createMockPlayer({ id: 'admin-1', team: 'red', nickname: 'AdminPlayer', isAdmin: true });
      const regularPlayer = createMockPlayer({ id: 'regular-1', team: 'red', nickname: 'RegularPlayer', isAdmin: false });
      const room = createMockRoom({
        players: [adminPlayer, regularPlayer],
      });
      const currentPlayer = createMockPlayer();

      renderLobbyView(room, currentPlayer);

      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.queryByText('Admin')).toBeInTheDocument(); // Should appear once
    });

    it('should highlight current player in their team', () => {
      const currentPlayer = createMockPlayer({ id: 'current-1', team: 'red', nickname: 'CurrentPlayer' });
      const otherPlayer = createMockPlayer({ id: 'other-1', team: 'red', nickname: 'OtherPlayer' });
      const room = createMockRoom({
        players: [currentPlayer, otherPlayer],
      });

      renderLobbyView(room, currentPlayer);

      // Current player should have different styling
      const currentPlayerElement = screen.getByText('CurrentPlayer').closest('.p-2.rounded-md');
      const otherPlayerElement = screen.getByText('OtherPlayer').closest('.p-2.rounded-md');

      expect(currentPlayerElement).toHaveClass('bg-red-200', 'border-2', 'border-red-400');
      expect(otherPlayerElement).toHaveClass('bg-white', 'border', 'border-red-300');
    });

    it('should show "No players yet" when team is empty', () => {
      const yellowPlayer = createMockPlayer({ id: 'yellow-1', team: 'yellow', nickname: 'YellowPlayer' });
      const room = createMockRoom({
        players: [yellowPlayer], // Only yellow team has players
      });
      const currentPlayer = createMockPlayer();

      renderLobbyView(room, currentPlayer);

      expect(screen.getByText('No players yet')).toBeInTheDocument();
    });
  });

  describe('Player Summary', () => {
    it('should display player count', () => {
      const room = createMockRoom({
        players: [
          createMockPlayer({ id: '1', team: 'red' }),
          createMockPlayer({ id: '2', team: 'yellow' }),
        ],
        settings: { timerSec: 15, maxPlayers: 10 },
      });
      const player = createMockPlayer();

      renderLobbyView(room, player);

      expect(screen.getByText('2 / 10 players')).toBeInTheDocument();
    });

    it('should show message when not enough players to start', () => {
      const room = createMockRoom({
        players: [createMockPlayer()], // Only 1 player
        settings: { timerSec: 15, maxPlayers: 10 },
      });
      const player = createMockPlayer();

      renderLobbyView(room, player);

      expect(screen.getByText('Need at least 2 players to start the game')).toBeInTheDocument();
    });

    it('should not show insufficient players message when enough players', () => {
      const room = createMockRoom({
        players: [
          createMockPlayer({ id: '1', team: 'red' }),
          createMockPlayer({ id: '2', team: 'yellow' }),
        ],
        settings: { timerSec: 15, maxPlayers: 10 },
      });
      const player = createMockPlayer();

      renderLobbyView(room, player);

      expect(screen.queryByText('Need at least 2 players to start the game')).not.toBeInTheDocument();
    });
  });

  describe('Admin Controls', () => {
    it('should show start game button for admin when enough players', () => {
      const room = createMockRoom({
        players: [
          createMockPlayer({ id: '1', team: 'red' }),
          createMockPlayer({ id: '2', team: 'yellow' }),
        ],
      });
      const adminPlayer = createMockPlayer({ isAdmin: true });

      renderLobbyView(room, adminPlayer);

      expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
    });

    it('should show disabled start game button for admin when not enough players', () => {
      const room = createMockRoom({
        players: [createMockPlayer()], // Only 1 player
      });
      const adminPlayer = createMockPlayer({ isAdmin: true });

      renderLobbyView(room, adminPlayer);

      const startButton = screen.getByRole('button', { name: 'Need More Players' });
      expect(startButton).toBeInTheDocument();
      expect(startButton).toBeDisabled();
    });

    it('should not show start game button for non-admin players', () => {
      const room = createMockRoom({
        players: [
          createMockPlayer({ id: '1', team: 'red' }),
          createMockPlayer({ id: '2', team: 'yellow' }),
        ],
      });
      const regularPlayer = createMockPlayer({ isAdmin: false });

      renderLobbyView(room, regularPlayer);

      expect(screen.queryByRole('button', { name: /Start Game|Need More Players/ })).not.toBeInTheDocument();
    });

    it('should show waiting message for non-admin players', () => {
      const room = createMockRoom({
        players: [
          createMockPlayer({ id: '1', team: 'red' }),
          createMockPlayer({ id: '2', team: 'yellow' }),
        ],
      });
      const regularPlayer = createMockPlayer({ isAdmin: false });

      renderLobbyView(room, regularPlayer);

      expect(screen.getByText('Waiting for admin to start the game...')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call startGame when start button is clicked', async () => {
      mockAppContext.startGame.mockResolvedValue(undefined);
      const room = createMockRoom({
        players: [
          createMockPlayer({ id: '1', team: 'red' }),
          createMockPlayer({ id: '2', team: 'yellow' }),
        ],
      });
      const adminPlayer = createMockPlayer({ isAdmin: true });

      renderLobbyView(room, adminPlayer);

      const startButton = screen.getByRole('button', { name: 'Start Game' });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockAppContext.startGame).toHaveBeenCalled();
      });
    });

    it('should call leaveRoom when leave button is clicked', () => {
      const room = createMockRoom();
      const player = createMockPlayer();

      renderLobbyView(room, player);

      const leaveButton = screen.getByRole('button', { name: 'Leave Room' });
      fireEvent.click(leaveButton);

      expect(mockAppContext.leaveRoom).toHaveBeenCalled();
    });

    it('should handle startGame errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAppContext.startGame.mockRejectedValue(new Error('Failed to start game'));
      
      const room = createMockRoom({
        players: [
          createMockPlayer({ id: '1', team: 'red' }),
          createMockPlayer({ id: '2', team: 'yellow' }),
        ],
      });
      const adminPlayer = createMockPlayer({ isAdmin: true });

      renderLobbyView(room, adminPlayer);

      const startButton = screen.getByRole('button', { name: 'Start Game' });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to start game:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Game Rules', () => {
    it('should display game rules section', () => {
      const room = createMockRoom();
      const player = createMockPlayer();

      renderLobbyView(room, player);

      expect(screen.getByText('Game Rules:')).toBeInTheDocument();
      expect(screen.getByText(/Teams take turns dropping pieces/)).toBeInTheDocument();
      expect(screen.getByText(/Each team votes on which column/)).toBeInTheDocument();
      expect(screen.getByText(/Majority vote wins/)).toBeInTheDocument();
      expect(screen.getByText(/First team to connect 4 pieces/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle room with maximum players', () => {
      const maxPlayers = 10;
      const players = Array.from({ length: maxPlayers }, (_, i) => 
        createMockPlayer({ 
          id: `player-${i}`, 
          team: i % 2 === 0 ? 'red' : 'yellow',
          nickname: `Player${i}`,
        })
      );
      const room = createMockRoom({
        players,
        settings: { timerSec: 15, maxPlayers },
      });
      const player = createMockPlayer();

      renderLobbyView(room, player);

      expect(screen.getByText(`${maxPlayers} / ${maxPlayers} players`)).toBeInTheDocument();
    });

    it('should handle room with no players', () => {
      const room = createMockRoom({ players: [] });
      const player = createMockPlayer();

      renderLobbyView(room, player);

      expect(screen.getByText('0 / 10 players')).toBeInTheDocument();
      expect(screen.getByText('Need at least 2 players to start the game')).toBeInTheDocument();
    });

    it('should handle very long nicknames', () => {
      const longNickname = 'A'.repeat(50);
      const player = createMockPlayer({ nickname: longNickname });
      const room = createMockRoom({ players: [player] });

      renderLobbyView(room, player);

      expect(screen.getByText(longNickname)).toBeInTheDocument();
    });

    it('should handle special characters in nicknames', () => {
      const specialNickname = 'Test@Player#123';
      const player = createMockPlayer({ nickname: specialNickname });
      const room = createMockRoom({ players: [player] });

      renderLobbyView(room, player);

      expect(screen.getByText(specialNickname)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles and labels', () => {
      const room = createMockRoom({
        players: [
          createMockPlayer({ id: '1', team: 'red' }),
          createMockPlayer({ id: '2', team: 'yellow' }),
        ],
      });
      const adminPlayer = createMockPlayer({ isAdmin: true });

      renderLobbyView(room, adminPlayer);

      expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Leave Room' })).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      const room = createMockRoom();
      const player = createMockPlayer();

      renderLobbyView(room, player);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('🔴 Connect Four Lobby 🟡');

      const settingsHeading = screen.getByRole('heading', { level: 3, name: 'Game Settings' });
      expect(settingsHeading).toHaveTextContent('Game Settings');

      const teamHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(teamHeadings).toHaveLength(3); // Game Settings, Red Team, Yellow Team
    });

    it('should have proper form labels and structure', () => {
      const room = createMockRoom();
      const player = createMockPlayer();

      renderLobbyView(room, player);

      // Check that all interactive elements are properly labeled
      expect(screen.getByText('Room Code: TEST123')).toBeInTheDocument();
      expect(screen.getByText('Game Settings')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have proper grid layout classes', () => {
      const room = createMockRoom();
      const player = createMockPlayer();

      renderLobbyView(room, player);

      const teamsGrid = document.querySelector('.grid.md\\:grid-cols-2');
      expect(teamsGrid).toBeInTheDocument();
    });

    it('should have proper flex layout for action buttons', () => {
      const room = createMockRoom();
      const player = createMockPlayer();

      renderLobbyView(room, player);

      const actionButtons = document.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(actionButtons).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should update when room state changes', () => {
      const room = createMockRoom({
        players: [
          createMockPlayer({ id: '1', team: 'red' }),
          createMockPlayer({ id: '2', team: 'yellow' }),
        ],
      });
      const player = createMockPlayer();

      const { rerender } = renderLobbyView(room, player);

      // Initially should show start game button
      expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();

      // Update room to have fewer players
      const updatedRoom = { ...room, players: [createMockPlayer({ id: '1', team: 'red' })] };
      mockAppContext.state.room = updatedRoom;
      
      rerender(
        <AppProvider>
          <LobbyView />
        </AppProvider>
      );

      // Should now show disabled button
      expect(screen.getByRole('button', { name: 'Need More Players' })).toBeInTheDocument();
    });

    it('should handle current player changes', () => {
      const room = createMockRoom({
        players: [
          createMockPlayer({ id: '1', team: 'red' }),
          createMockPlayer({ id: '2', team: 'yellow' }),
        ],
      });
      const player = createMockPlayer({ isAdmin: true });

      const { rerender } = renderLobbyView(room, player);

      // Should show admin controls
      expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();

      // Change to non-admin player and re-render
      const nonAdminPlayer = { ...player, isAdmin: false };
      mockAppContext.state.currentPlayer = nonAdminPlayer;
      
      rerender(
        <AppProvider>
          <LobbyView />
        </AppProvider>
      );

      // Should not show admin controls
      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
      expect(screen.queryByText('Need More Players')).not.toBeInTheDocument();
    });
  });
});
