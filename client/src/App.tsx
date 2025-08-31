
import { AppProvider, useAppContext } from './state/AppContext';
import { HomePage } from './components/HomePage';
import { LobbyView } from './components/LobbyView';
import { GameView } from './components/GameView';
import { GameEndView } from './components/GameEndView';
import { DemoMode } from './components/DemoMode';
import './index.css';

function AppContent() {
  const { state } = useAppContext();

  // Check if we're in demo mode (no server connection)
  const isDemoMode = !state.room && !state.currentPlayer;

  const renderCurrentView = () => {
    // Show demo mode if no server connection
    if (isDemoMode) {
      return <DemoMode />;
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
