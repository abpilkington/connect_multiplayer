import { useAppContext } from '../state/AppContext';
import { Team } from '../types';

export function GameEndView() {
  const { state, startRematch } = useAppContext();
  
  if (!state.room || !state.room.game || !state.gameEndData) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Game Ended</h2>
        <p>No game data available</p>
      </div>
    );
  }

  const { room, gameEndData } = state;
  const players = room.players;
  const currentPlayer = state.currentPlayer;
  
  // Determine game outcome
  const isWin = gameEndData.result !== 'draw';
  const isDraw = gameEndData.result === 'draw';
  const winnerTeam = isWin ? gameEndData.result : undefined;
  const winningLine = gameEndData.line;
  
  // Player's team result
  const playerTeam = currentPlayer?.team;
  const playerWon = playerTeam && winnerTeam === playerTeam;
  
  // Team rosters
  const redTeam = players.filter(p => p.team === 'red');
  const yellowTeam = players.filter(p => p.team === 'yellow');
  
  // Sorted players by matching votes (for MVP)
  const sortedPlayers = [...players].sort((a, b) => b.matchingVotes - a.matchingVotes);
  const mvp = sortedPlayers[0];

  const handlePlayAgain = async () => {
    if (currentPlayer?.isAdmin) {
      try {
        await startRematch();
      } catch (error) {
        console.error('Failed to start rematch:', error);
      }
    }
  };

  const handleBackToLobby = () => {
    // Reset to lobby view - this would need to be implemented on the server
    // For now, we'll just navigate to home
    window.location.reload();
  };

  const getResultTitle = () => {
    if (isDraw) return "It's a Draw!";
    if (playerWon) return "Your Team Won!";
    if (isWin) return `${winnerTeam?.charAt(0).toUpperCase()}${winnerTeam?.slice(1)} Team Wins!`;
    return "Game Over";
  };

  const getResultColor = () => {
    if (isDraw) return "text-gray-600";
    if (playerWon) return "text-green-600";
    if (isWin && winnerTeam === 'red') return "text-red-600";
    if (isWin && winnerTeam === 'yellow') return "text-yellow-600";
    return "text-gray-600";
  };

  const getTeamColor = (team: Team) => {
    return team === 'red' ? 'text-red-600' : 'text-yellow-600';
  };

  const renderBoard = () => {
    const board = room.game!.board;
    
    return (
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-center text-gray-700">Final Board</h3>
        <div className="flex justify-center">
          {/* Board + Headers Container (shared padding) */}
          <div className="bg-blue-700 rounded-2xl p-4 shadow-xl w-full max-w-2xl">
            {/* Column Headers */}
            <div className="grid grid-cols-7 gap-4 mb-3">
              {[0, 1, 2, 3, 4, 5, 6].map(col => (
                <div key={col} className="flex justify-center items-end">
                  <span className="text-gray-200 text-lg">↓</span>
                </div>
              ))}
            </div>

            {/* Connect 4 Board */}
            <div className="grid grid-cols-7 gap-4 w-full">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isWinningCell = winningLine?.some(
                    pos => pos.row === rowIndex && pos.col === colIndex
                  );
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="aspect-square flex items-center justify-center cursor-default"
                    >
                      {/* Hole */}
                      <div className={`w-full h-full rounded-full flex items-center justify-center ${
                        isWinningCell ? 'bg-green-600 ring-4 ring-green-400 animate-pulse' : 'bg-blue-900'
                      }`}>
                        {/* Token */}
                        {cell !== null && (
                          <div
                            className={`w-[85%] h-[85%] rounded-full shadow-md border-2
                              ${cell === 'red'
                                ? 'bg-red-500 border-red-700'
                                : cell === 'yellow'
                                ? 'bg-yellow-400 border-yellow-600'
                                : ''}`}
                          />
                        )}
                        {/* Winning indicator */}
                        {isWinningCell && (
                          <div className="absolute w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className={`text-5xl font-bold mb-4 drop-shadow-lg ${getResultColor()}`}>
            {getResultTitle()}
          </h1>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-3 inline-block shadow-xl">
            <span className="text-xl font-mono font-bold tracking-wider text-gray-800">
              Room: {room.code}
            </span>
          </div>
        </div>

        {/* Game Board */}
        <div className="text-center mb-10">
          {renderBoard()}
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Team Rosters */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Team Rosters</h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Red Team */}
              <div>
                <h4 className={`font-bold mb-3 text-lg ${getTeamColor('red')}`}>
                  🔴 Red Team {winnerTeam === 'red' ? '🏆' : ''}
                </h4>
                <ul className="space-y-2">
                  {redTeam.map(player => (
                    <li key={player.id} className="text-sm p-2 rounded-lg bg-red-50">
                      <span className="font-medium">{player.nickname}</span>
                      {player.id === currentPlayer?.id && ' (You)'}
                      {player.isAdmin && ' 👑'}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Yellow Team */}
              <div>
                <h4 className={`font-bold mb-3 text-lg ${getTeamColor('yellow')}`}>
                  🟡 Yellow Team {winnerTeam === 'yellow' ? '🏆' : ''}
                </h4>
                <ul className="space-y-2">
                  {yellowTeam.map(player => (
                    <li key={player.id} className="text-sm p-2 rounded-lg bg-yellow-50">
                      <span className="font-medium">{player.nickname}</span>
                      {player.id === currentPlayer?.id && ' (You)'}
                      {player.isAdmin && ' 👑'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Player Stats */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">Player Performance</h3>
            
            {/* MVP */}
            {mvp && (
              <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🏅</span>
                  <div>
                    <p className="font-bold text-lg text-yellow-800">MVP: {mvp.nickname}</p>
                    <p className="text-sm text-yellow-700">
                      {mvp.matchingVotes} winning votes
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* All Players Sorted by Performance */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">All Players:</h4>
              {sortedPlayers.map((player, index) => (
                <div 
                  key={player.id}
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    player.id === currentPlayer?.id 
                      ? 'bg-blue-100 border-2 border-blue-300 shadow-md' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-gray-300 text-gray-700'
                    }`}>#{index + 1}</span>
                    <div className={`w-4 h-4 rounded-full ${
                      player.team === 'red' ? 'bg-red-500' : 'bg-yellow-400'
                    }`}></div>
                    <span className="text-sm font-medium">
                      {player.nickname}
                      {player.id === currentPlayer?.id && ' (You)'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-600 bg-white px-3 py-1 rounded-full">
                    {player.matchingVotes} votes
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          {currentPlayer?.isAdmin && (
            <button
              onClick={handlePlayAgain}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
            >
              🔄 Play Again
            </button>
          )}
          
          <button
            onClick={handleBackToLobby}
            className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
          >
            🏠 Back to Home
          </button>
        </div>

        {!currentPlayer?.isAdmin && (
          <div className="text-center mt-6">
            <p className="text-white/80 text-lg">
              Waiting for admin to start a rematch...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
