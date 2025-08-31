
import { AppProvider, useAppContext } from './state/AppContext';
import { HomePage } from './components/HomePage';
import { LobbyView } from './components/LobbyView';
import { GameView } from './components/GameView';
import { GameEndView } from './components/GameEndView';
import { DemoMode } from './components/DemoMode';
import './index.css';

function AppContent() {
  const { state } = useAppContext();

  // Check if we're in demo mode (server connection failed)
  const isDemoMode = state.connectionStatus === 'disconnected' && state.error && state.error.startsWith('Failed to connect to server');

  const renderCurrentView = () => {
    // Show demo mode only if server connection explicitly failed
    if (isDemoMode) {
      return <DemoMode />;
    }
    
    // If still connecting, show the real client (it will handle connection state)
    if (state.connectionStatus === 'connecting') {
      return <HomePage />;
    }

    switch (state.currentView) {
      case 'home':
        return <HomePage />;
      
      case 'lobby':
        return <LobbyView />;
      
      case 'game':
        return <GameView />;
      
      case 'ended':
        return <GameEndView />;
      
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="app">
      {renderCurrentView()}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
