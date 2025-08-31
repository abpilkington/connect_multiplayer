import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HomePage } from './HomePage';
import { AppProvider } from '../state/AppContext';
import type { AppState } from '../state/AppContext';

// Mock the AppContext
const mockAppContext = {
  state: {
    connectionStatus: 'connected' as const,
    error: null,
  } as AppState,
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
};

vi.mock('../state/AppContext', () => ({
  useAppContext: () => mockAppContext,
  AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Helper function to render HomePage with context
const renderHomePage = () => {
  return render(
    <AppProvider>
      <HomePage />
    </AppProvider>
  );
};

// Helper function to get the submit button (not the mode selector button)
const getSubmitButton = (name: string) => {
  const buttons = screen.getAllByRole('button', { name });
  return buttons.find(button => button.getAttribute('type') === 'submit');
};

// Helper function to get the Create Room submit button
const getCreateRoomSubmitButton = () => {
  const buttons = screen.getAllByRole('button', { name: 'Create Room' });
  return buttons.find(button => button.getAttribute('type') === 'submit');
};

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppContext.state.connectionStatus = 'connected';
    mockAppContext.state.error = null;
  });

  describe('Rendering', () => {
    it('should render the main heading and description', () => {
      renderHomePage();

      expect(screen.getByText('🔴 Connect Four 🟡')).toBeInTheDocument();
      expect(screen.getByText('Multiplayer team-based Connect Four')).toBeInTheDocument();
    });

    it('should render connection status indicator', () => {
      renderHomePage();

      expect(screen.getByText('✅ Connected')).toBeInTheDocument();
    });

    it('should render mode selector buttons', () => {
      renderHomePage();

      // Check that mode selector buttons exist (these are the tab-like buttons)
      const modeSelectorContainer = document.querySelector('.flex.mb-6.bg-gray-100.rounded-lg.p-1');
      expect(modeSelectorContainer).toBeInTheDocument();
      expect(modeSelectorContainer?.querySelector('button:first-child')).toHaveTextContent('Join Room');
      expect(modeSelectorContainer?.querySelector('button:last-child')).toHaveTextContent('Create Room');
    });

    it('should render instructions section', () => {
      renderHomePage();

      expect(screen.getByText('How to Play:')).toBeInTheDocument();
      expect(screen.getByText(/Join a room with friends/)).toBeInTheDocument();
      expect(screen.getByText(/Teams are automatically balanced/)).toBeInTheDocument();
      expect(screen.getByText(/Each team votes on which column/)).toBeInTheDocument();
      expect(screen.getByText(/First team to connect 4 pieces wins/)).toBeInTheDocument();
    });

    it('should default to join mode', () => {
      renderHomePage();

      expect(screen.getByLabelText('Room Code')).toBeInTheDocument();
      expect(screen.getByLabelText('Your Nickname')).toBeInTheDocument();
      expect(screen.getByLabelText('Password (if required)')).toBeInTheDocument();
    });
  });

  describe('Connection Status Display', () => {
    it('should show connected status when connected', () => {
      mockAppContext.state.connectionStatus = 'connected';
      renderHomePage();

      expect(screen.getByText('✅ Connected')).toBeInTheDocument();
      expect(screen.getByText('✅ Connected')).toHaveClass('bg-green-100', 'text-green-700');
    });

    it('should show connecting status when connecting', () => {
      mockAppContext.state.connectionStatus = 'connecting';
      renderHomePage();

      expect(screen.getByText('🔄 Connecting...')).toBeInTheDocument();
      expect(screen.getByText('🔄 Connecting...')).toHaveClass('bg-yellow-100', 'text-yellow-700');
    });

    it('should show disconnected status when disconnected', () => {
      mockAppContext.state.connectionStatus = 'disconnected';
      renderHomePage();

      expect(screen.getByText('❌ Disconnected')).toBeInTheDocument();
      expect(screen.getByText('❌ Disconnected')).toHaveClass('bg-red-100', 'text-red-700');
    });
  });

  describe('Error Display', () => {
    it('should display error message when present', () => {
      mockAppContext.state.error = 'Test error message';
      renderHomePage();

      expect(screen.getByText('Test error message')).toBeInTheDocument();
      const errorContainer = screen.getByText('Test error message').closest('div');
      expect(errorContainer).toHaveClass('bg-red-100', 'border-red-400', 'text-red-700');
    });

    it('should not display error section when no error', () => {
      mockAppContext.state.error = null;
      renderHomePage();

      expect(screen.queryByText(/Test error message/)).not.toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    it('should switch to create mode when create button is clicked', () => {
      renderHomePage();

      const createButton = screen.getByText('Create Room');
      fireEvent.click(createButton);

      expect(screen.getByLabelText('Your Nickname')).toBeInTheDocument();
      expect(screen.getByLabelText('Room Password (optional)')).toBeInTheDocument();
      expect(screen.getByLabelText('Vote Timer: 15 seconds')).toBeInTheDocument();
    });

    it('should switch back to join mode when join button is clicked', () => {
      renderHomePage();

      // Switch to create mode first
      const createButton = screen.getByText('Create Room');
      fireEvent.click(createButton);

      // Switch back to join mode
      const joinButton = screen.getByText('Join Room');
      fireEvent.click(joinButton);

      expect(screen.getByLabelText('Room Code')).toBeInTheDocument();
    });

    it('should highlight active mode button', () => {
      renderHomePage();

      // Get the mode selector buttons by finding the container first
      const modeSelectorContainer = document.querySelector('.flex.mb-6.bg-gray-100.rounded-lg.p-1');
      const joinButton = modeSelectorContainer?.querySelector('button:first-child');
      const createButton = modeSelectorContainer?.querySelector('button:last-child');

      expect(joinButton).toHaveClass('bg-white', 'text-gray-900', 'shadow-sm');
      expect(createButton).not.toHaveClass('bg-white', 'shadow-sm');
    });
  });

  describe('Join Room Form', () => {
    it('should render all join form fields', () => {
      renderHomePage();

      expect(screen.getByLabelText('Room Code')).toBeInTheDocument();
      expect(screen.getByLabelText('Your Nickname')).toBeInTheDocument();
      expect(screen.getByLabelText('Password (if required)')).toBeInTheDocument();
      const submitButton = getSubmitButton('Join Room');
      expect(submitButton).toBeInTheDocument();
    });

    it('should handle room code input with auto-uppercase', () => {
      renderHomePage();

      const roomCodeInput = screen.getByLabelText('Room Code');
      fireEvent.change(roomCodeInput, { target: { value: 'abc123' } });

      expect(roomCodeInput).toHaveValue('ABC123');
    });

    it('should handle nickname input', () => {
      renderHomePage();

      const nicknameInput = screen.getByLabelText('Your Nickname');
      fireEvent.change(nicknameInput, { target: { value: 'TestPlayer' } });

      expect(nicknameInput).toHaveValue('TestPlayer');
    });

    it('should handle password input', () => {
      renderHomePage();

      const passwordInput = screen.getByLabelText('Password (if required)');
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });

      expect(passwordInput).toHaveValue('testpass');
    });

    it('should submit join form with correct data', async () => {
      mockAppContext.joinRoom.mockResolvedValue(undefined);
      renderHomePage();

      const roomCodeInput = screen.getByLabelText('Room Code');
      const nicknameInput = screen.getByLabelText('Your Nickname');
      const passwordInput = screen.getByLabelText('Password (if required)');
      const submitButton = getSubmitButton('Join Room');

      fireEvent.change(roomCodeInput, { target: { value: 'ABC123' } });
      fireEvent.change(nicknameInput, { target: { value: 'TestPlayer' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAppContext.joinRoom).toHaveBeenCalledWith('ABC123', 'TestPlayer', 'testpass');
      });
    });

    it('should submit join form without password when password is empty', async () => {
      mockAppContext.joinRoom.mockResolvedValue(undefined);
      renderHomePage();

      const roomCodeInput = screen.getByLabelText('Room Code');
      const nicknameInput = screen.getByLabelText('Your Nickname');
      const submitButton = getSubmitButton('Join Room');

      fireEvent.change(roomCodeInput, { target: { value: 'ABC123' } });
      fireEvent.change(nicknameInput, { target: { value: 'TestPlayer' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAppContext.joinRoom).toHaveBeenCalledWith('ABC123', 'TestPlayer', undefined);
      });
    });

    it('should not submit form when room code is empty', () => {
      renderHomePage();

      const nicknameInput = screen.getByLabelText('Your Nickname');
      const submitButton = getSubmitButton('Join Room');

      fireEvent.change(nicknameInput, { target: { value: 'TestPlayer' } });
      fireEvent.click(submitButton);

      expect(mockAppContext.joinRoom).not.toHaveBeenCalled();
    });

    it('should not submit form when nickname is empty', () => {
      renderHomePage();

      const roomCodeInput = screen.getByLabelText('Room Code');
      const submitButton = getSubmitButton('Join Room');

      fireEvent.change(roomCodeInput, { target: { value: 'ABC123' } });
      fireEvent.click(submitButton);

      expect(mockAppContext.joinRoom).not.toHaveBeenCalled();
    });

    it('should not submit form when room code is only whitespace', () => {
      renderHomePage();

      const roomCodeInput = screen.getByLabelText('Room Code');
      const nicknameInput = screen.getByLabelText('Your Nickname');
      const submitButton = getSubmitButton('Join Room');

      fireEvent.change(roomCodeInput, { target: { value: '   ' } });
      fireEvent.change(nicknameInput, { target: { value: 'TestPlayer' } });
      fireEvent.click(submitButton);

      expect(mockAppContext.joinRoom).not.toHaveBeenCalled();
    });

    it('should not submit form when nickname is only whitespace', () => {
      renderHomePage();

      const roomCodeInput = screen.getByLabelText('Room Code');
      const nicknameInput = screen.getByLabelText('Your Nickname');
      const submitButton = getSubmitButton('Join Room');

      fireEvent.change(roomCodeInput, { target: { value: 'ABC123' } });
      fireEvent.change(nicknameInput, { target: { value: '   ' } });
      fireEvent.click(submitButton);

      expect(mockAppContext.joinRoom).not.toHaveBeenCalled();
    });

    it('should handle join room errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAppContext.joinRoom.mockRejectedValue(new Error('Room not found'));
      
      renderHomePage();

      const roomCodeInput = screen.getByLabelText('Room Code');
      const nicknameInput = screen.getByLabelText('Your Nickname');
      const submitButton = getSubmitButton('Join Room');

      fireEvent.change(roomCodeInput, { target: { value: 'ABC123' } });
      fireEvent.change(nicknameInput, { target: { value: 'TestPlayer' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to join room:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Create Room Form', () => {
    beforeEach(() => {
      renderHomePage();
      const createButton = screen.getByText('Create Room');
      fireEvent.click(createButton);
    });

    it('should render all create form fields', () => {
      expect(screen.getByLabelText('Your Nickname')).toBeInTheDocument();
      expect(screen.getByLabelText('Room Password (optional)')).toBeInTheDocument();
      expect(screen.getByLabelText('Vote Timer: 15 seconds')).toBeInTheDocument();
      expect(getCreateRoomSubmitButton()).toBeInTheDocument();
    });

    it('should handle nickname input in create form', () => {
      const nicknameInput = screen.getByLabelText('Your Nickname');
      fireEvent.change(nicknameInput, { target: { value: 'TestPlayer' } });

      expect(nicknameInput).toHaveValue('TestPlayer');
    });

    it('should handle password input in create form', () => {
      const passwordInput = screen.getByLabelText('Room Password (optional)');
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });

      expect(passwordInput).toHaveValue('testpass');
    });

    it('should handle timer slider input', () => {
      const timerSlider = screen.getByLabelText('Vote Timer: 15 seconds');
      fireEvent.change(timerSlider, { target: { value: '20' } });

      expect(screen.getByText('Vote Timer: 20 seconds')).toBeInTheDocument();
    });

    it('should display timer range labels', () => {
      expect(screen.getByText('10s')).toBeInTheDocument();
      expect(screen.getByText('15s')).toBeInTheDocument();
      expect(screen.getByText('20s')).toBeInTheDocument();
      expect(screen.getByText('25s')).toBeInTheDocument();
      expect(screen.getByText('30s')).toBeInTheDocument();
    });

    it('should submit create form with correct data', async () => {
      mockAppContext.createRoom.mockResolvedValue(undefined);

      const nicknameInput = screen.getByLabelText('Your Nickname');
      const passwordInput = screen.getByLabelText('Room Password (optional)');
      const submitButton = getCreateRoomSubmitButton();

      fireEvent.change(nicknameInput, { target: { value: 'TestPlayer' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAppContext.createRoom).toHaveBeenCalledWith('testpass', 15, 'TestPlayer');
      });
    });

    it('should submit create form without password when password is empty', async () => {
      mockAppContext.createRoom.mockResolvedValue(undefined);

      const nicknameInput = screen.getByLabelText('Your Nickname');
      const submitButton = getCreateRoomSubmitButton();

      fireEvent.change(nicknameInput, { target: { value: 'TestPlayer' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAppContext.createRoom).toHaveBeenCalledWith(undefined, 15, 'TestPlayer');
      });
    });

    it('should not submit form when nickname is empty', () => {
      const submitButton = getCreateRoomSubmitButton();
      fireEvent.click(submitButton);

      expect(mockAppContext.createRoom).not.toHaveBeenCalled();
    });

    it('should not submit form when nickname is only whitespace', () => {
      const nicknameInput = screen.getByLabelText('Your Nickname');
      const submitButton = getCreateRoomSubmitButton();

      fireEvent.change(nicknameInput, { target: { value: '   ' } });
      fireEvent.click(submitButton);

      expect(mockAppContext.createRoom).not.toHaveBeenCalled();
    });

    it('should handle create room errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAppContext.createRoom.mockRejectedValue(new Error('Failed to create room'));

      const nicknameInput = screen.getByLabelText('Your Nickname');
      const submitButton = getCreateRoomSubmitButton();

      fireEvent.change(nicknameInput, { target: { value: 'TestPlayer' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create room:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Form Validation and Constraints', () => {
    it('should limit room code to 8 characters', () => {
      renderHomePage();

      const roomCodeInput = screen.getByLabelText('Room Code');
      expect(roomCodeInput).toHaveAttribute('maxLength', '8');
    });

    it('should limit nickname to 20 characters', () => {
      renderHomePage();

      const nicknameInput = screen.getByLabelText('Your Nickname');
      expect(nicknameInput).toHaveAttribute('maxLength', '20');
    });

    it('should make room code required', () => {
      renderHomePage();

      const roomCodeInput = screen.getByLabelText('Room Code');
      expect(roomCodeInput).toHaveAttribute('required');
    });

    it('should make nickname required', () => {
      renderHomePage();

      const nicknameInput = screen.getByLabelText('Your Nickname');
      expect(nicknameInput).toHaveAttribute('required');
    });

    it('should make create nickname required', () => {
      renderHomePage();
      const createButton = screen.getByText('Create Room');
      fireEvent.click(createButton);

      const nicknameInput = screen.getByLabelText('Your Nickname');
      expect(nicknameInput).toHaveAttribute('required');
    });
  });

  describe('Loading States', () => {
    it('should show loading state when joining room', async () => {
      mockAppContext.joinRoom.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderHomePage();

      const roomCodeInput = screen.getByLabelText('Room Code');
      const nicknameInput = screen.getByLabelText('Your Nickname');
      const submitButton = getSubmitButton('Join Room');

      fireEvent.change(roomCodeInput, { target: { value: 'ABC123' } });
      fireEvent.change(nicknameInput, { target: { value: 'TestPlayer' } });
      fireEvent.click(submitButton);

      expect(screen.getByText('Joining...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state when creating room', async () => {
      mockAppContext.createRoom.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderHomePage();

      const createButton = screen.getByText('Create Room');
      fireEvent.click(createButton);

      const nicknameInput = screen.getByLabelText('Your Nickname');
      const submitButton = getCreateRoomSubmitButton();

      fireEvent.change(nicknameInput, { target: { value: 'TestPlayer' } });
      fireEvent.click(submitButton);

      expect(screen.getByText('Creating...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Button Disabling', () => {
    it('should disable join button when disconnected', () => {
      mockAppContext.state.connectionStatus = 'disconnected';
      renderHomePage();

      // Get the form submit button specifically (the one with type="submit")
      const submitButtons = screen.getAllByRole('button', { name: 'Join Room' });
      const submitButton = submitButtons.find(button => button.getAttribute('type') === 'submit');
      expect(submitButton).toBeDisabled();
    });

    it('should disable create button when disconnected', () => {
      mockAppContext.state.connectionStatus = 'disconnected';
      renderHomePage();

      const createButton = screen.getByText('Create Room');
      fireEvent.click(createButton);

      const submitButtons = screen.getAllByRole('button', { name: 'Create Room' });
      const submitButton = submitButtons.find(button => button.getAttribute('type') === 'submit');
      expect(submitButton).toBeDisabled();
    });

    it('should disable join button when connecting', () => {
      mockAppContext.state.connectionStatus = 'connecting';
      renderHomePage();

      const submitButtons = screen.getAllByRole('button', { name: 'Join Room' });
      const submitButton = submitButtons.find(button => button.getAttribute('type') === 'submit');
      expect(submitButton).toBeDisabled();
    });

    it('should disable create button when connecting', () => {
      mockAppContext.state.connectionStatus = 'connecting';
      renderHomePage();

      const createButton = screen.getByText('Create Room');
      fireEvent.click(createButton);

      const submitButtons = screen.getAllByRole('button', { name: 'Create Room' });
      const submitButton = submitButtons.find(button => button.getAttribute('type') === 'submit');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderHomePage();

      expect(screen.getByLabelText('Room Code')).toBeInTheDocument();
      expect(screen.getByLabelText('Your Nickname')).toBeInTheDocument();
      expect(screen.getByLabelText('Password (if required)')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderHomePage();

      // Use getAllByRole since there are multiple buttons with the same names
      const joinButtons = screen.getAllByRole('button', { name: 'Join Room' });
      const createButtons = screen.getAllByRole('button', { name: 'Create Room' });
      expect(joinButtons.length).toBeGreaterThan(0);
      expect(createButtons.length).toBeGreaterThan(0);
    });

    it('should have proper heading structure', () => {
      renderHomePage();

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('🔴 Connect Four 🟡');

      const instructionsHeading = screen.getByRole('heading', { level: 3 });
      expect(instructionsHeading).toHaveTextContent('How to Play:');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long input values', () => {
      renderHomePage();

      const roomCodeInput = screen.getByLabelText('Room Code');
      const nicknameInput = screen.getByLabelText('Your Nickname');

      const longRoomCode = 'A'.repeat(100);
      const longNickname = 'B'.repeat(100);

      fireEvent.change(roomCodeInput, { target: { value: longRoomCode } });
      fireEvent.change(nicknameInput, { target: { value: longNickname } });

      // maxLength attribute allows setting long values programmatically
      // but prevents typing more characters in the UI
      expect(roomCodeInput).toHaveValue(longRoomCode);
      expect(nicknameInput).toHaveValue(longNickname);
      expect(roomCodeInput).toHaveAttribute('maxLength', '8');
      expect(nicknameInput).toHaveAttribute('maxLength', '20');
    });

    it('should handle special characters in inputs', () => {
      renderHomePage();

      const roomCodeInput = screen.getByLabelText('Room Code');
      const nicknameInput = screen.getByLabelText('Your Nickname');

      fireEvent.change(roomCodeInput, { target: { value: 'ABC@#$' } });
      fireEvent.change(nicknameInput, { target: { value: 'Test@Player#123' } });

      expect(roomCodeInput).toHaveValue('ABC@#$');
      expect(nicknameInput).toHaveValue('Test@Player#123');
    });

    it('should handle empty string inputs', () => {
      renderHomePage();

      const roomCodeInput = screen.getByLabelText('Room Code');
      const nicknameInput = screen.getByLabelText('Your Nickname');

      fireEvent.change(roomCodeInput, { target: { value: '' } });
      fireEvent.change(nicknameInput, { target: { value: '' } });

      expect(roomCodeInput).toHaveValue('');
      expect(nicknameInput).toHaveValue('');
    });
  });
});
