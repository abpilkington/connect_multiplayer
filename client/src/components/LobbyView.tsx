import { useAppContext } from '../state/AppContext';

export function LobbyView() {
  const { state, startGame, leaveRoom } = useAppContext();
  const { room, currentPlayer } = state;

  if (!room || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  const redTeamPlayers = room.players.filter(player => player.team === 'red');
  const yellowTeamPlayers = room.players.filter(player => player.team === 'yellow');
  const isAdmin = currentPlayer.isAdmin;
  const canStartGame = room.players.length >= 2; // Minimum 2 players to start

  const handleStartGame = async () => {
    try {
      await startGame();
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔴 Connect Four Lobby 🟡
          </h1>
          <div className="bg-gray-100 rounded-lg px-4 py-2 inline-block">
            <span className="text-lg font-mono font-bold tracking-wider">
              Room Code: {room.code}
            </span>
          </div>
          {room.passwordHash && (
            <p className="text-sm text-gray-600 mt-2">🔒 Password Protected</p>
          )}
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="text-sm">{state.error}</p>
          </div>
        )}

        {/* Room Settings */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Game Settings</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Vote Timer:</span> {room.settings.timerSec} seconds
            </div>
            <div>
              <span className="font-medium">Max Players:</span> {room.settings.maxPlayers}
            </div>
          </div>
        </div>

        {/* Teams */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Red Team */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-bold text-red-700 mb-3 flex items-center">
              🔴 Red Team ({redTeamPlayers.length})
            </h3>
            <div className="space-y-2">
              {redTeamPlayers.map(player => (
                <div
                  key={player.id}
                  className={`p-2 rounded-md ${
                    player.id === currentPlayer.id
                      ? 'bg-red-200 border-2 border-red-400'
                      : 'bg-white border border-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{player.nickname}</span>
                    {player.isAdmin && (
                      <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {redTeamPlayers.length === 0 && (
                <p className="text-red-500 text-sm italic">No players yet</p>
              )}
            </div>
          </div>

          {/* Yellow Team */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-bold text-yellow-700 mb-3 flex items-center">
              🟡 Yellow Team ({yellowTeamPlayers.length})
            </h3>
            <div className="space-y-2">
              {yellowTeamPlayers.map(player => (
                <div
                  key={player.id}
                  className={`p-2 rounded-md ${
                    player.id === currentPlayer.id
                      ? 'bg-yellow-200 border-2 border-yellow-400'
                      : 'bg-white border border-yellow-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{player.nickname}</span>
                    {player.isAdmin && (
                      <span className="bg-yellow-600 text-white px-2 py-1 rounded-full text-xs">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {yellowTeamPlayers.length === 0 && (
                <p className="text-yellow-600 text-sm italic">No players yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Players Summary */}
        <div className="text-center mb-6">
          <p className="text-gray-600">
            {room.players.length} / {room.settings.maxPlayers} players
          </p>
          {room.players.length < 2 && (
            <p className="text-sm text-gray-500 mt-1">
              Need at least 2 players to start the game
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAdmin && (
            <button
              onClick={handleStartGame}
              disabled={!canStartGame}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
            >
              {canStartGame ? 'Start Game' : 'Need More Players'}
            </button>
          )}
          
          <button
            onClick={handleLeaveRoom}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition"
          >
            Leave Room
          </button>
        </div>

        {!isAdmin && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Waiting for admin to start the game...
          </p>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Game Rules:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Teams take turns dropping pieces into the board</li>
            <li>• Each team votes on which column to use during their turn</li>
            <li>• Majority vote wins (admin breaks ties)</li>
            <li>• First team to connect 4 pieces horizontally, vertically, or diagonally wins!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
