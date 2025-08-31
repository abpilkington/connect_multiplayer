import { useState, useEffect } from 'react';
import { useAppContext } from '../state/AppContext';


export function GameView() {
  const { state, castVote, leaveRoom } = useAppContext();
  const { room, currentPlayer } = state;
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  if (!room || !currentPlayer || !room.game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  const { game } = room;
  const isMyTeamsTurn = currentPlayer.team === game.currentTeam;
  const hasVoted = game.votes && game.votes[currentPlayer.id] !== undefined;
  const voteCounts = game.perColumnCounts || [0, 0, 0, 0, 0, 0, 0];

  // Timer effect
  useEffect(() => {
    if (!game.endsAt) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, game.endsAt! - now);
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        setTimeRemaining(0);
      }
    };

    // Update immediately
    updateTimer();
    
    // Update every 100ms for smooth countdown
    const interval = setInterval(updateTimer, 100);
    
    return () => clearInterval(interval);
  }, [game.endsAt]);

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };



  const handleColumnClick = async (column: number) => {
    if (!isMyTeamsTurn || hasVoted) return;
    
    try {
      await castVote(column);
    } catch (error) {
      console.error('Failed to cast vote:', error);
    }
  };





  const redTeam = room.players.filter(p => p.team === 'red');
  const yellowTeam = room.players.filter(p => p.team === 'yellow');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">🔴 Connect Four 🟡</h1>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-3 inline-block shadow-xl">
            <span className="text-xl font-mono font-bold tracking-wider text-gray-800">
              Room: {room.code}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm">{state.error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-12 2xl:gap-16 3xl:gap-20 4xl:gap-24 5xl:gap-28 6xl:gap-32 7xl:gap-36 8xl:gap-40 9xl:gap-44 10xl:gap-48 11xl:gap-52 12xl:gap-56 13xl:gap-60">
          {/* Team Info - Left */}
          <div className="space-y-6 max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4xl:max-w-3xl 5xl:max-w-4xl 6xl:max-w-5xl 7xl:max-w-6xl 8xl:max-w-7xl 9xl:max-w-8xl 10xl:max-w-9xl 11xl:max-w-10xl 12xl:max-w-11xl">
            {/* Red Team */}
            <div className={`p-6 rounded-xl shadow-lg ${game.currentTeam === 'red' ? 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-500' : 'bg-gradient-to-br from-red-50 to-red-75 border border-red-200'}`}>
              <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
                🔴 Red Team {game.currentTeam === 'red' && (
                  <span className="ml-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                    Current Turn
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                {redTeam.map(player => (
                  <div key={player.id} className={`text-sm p-3 rounded-lg ${player.id === currentPlayer.id ? 'bg-red-200 font-bold shadow-md' : 'bg-white shadow-sm'}`}>
                    <div className="flex items-center justify-between">
                      <span>{player.nickname}</span>
                      {game.votes && game.votes[player.id] !== undefined && (
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          ✓ Voted
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Yellow Team */}
            <div className={`p-6 rounded-xl shadow-lg ${game.currentTeam === 'yellow' ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-500' : 'bg-gradient-to-br from-yellow-50 to-yellow-75 border border-yellow-200'}`}>
              <h3 className="text-xl font-bold text-yellow-700 mb-4 flex items-center">
                🟡 Yellow Team {game.currentTeam === 'yellow' && (
                  <span className="ml-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                    Current Turn
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                {yellowTeam.map(player => (
                  <div key={player.id} className={`text-sm p-3 rounded-lg ${player.id === currentPlayer.id ? 'bg-yellow-200 font-bold shadow-md' : 'bg-white shadow-sm'}`}>
                    <div className="flex items-center justify-between">
                      <span>{player.nickname}</span>
                      {game.votes && game.votes[player.id] !== undefined && (
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          ✓ Voted
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Game Info */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">🎮 Game Info</h3>
              <div className="text-sm text-gray-600 space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span>Round:</span>
                  <span className="font-bold text-blue-600">{game.round}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span>Timer:</span>
                  <span className="font-bold text-purple-600">{room.settings.timerSec}s per turn</span>
                </div>
                {timeRemaining !== null && (
                  <div className={`flex items-center justify-between p-2 rounded-lg font-bold ${
                    timeRemaining <= 5000 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <span>⏰ Time:</span>
                    <span>{formatTime(timeRemaining)} remaining</span>
                  </div>
                )}
                {isMyTeamsTurn && (
                  <div className={`p-3 rounded-lg font-bold ${
                    hasVoted ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {hasVoted ? '✓ You have voted!' : '→ Your team\'s turn!'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Game Board - Center */}
          <div className="flex flex-col items-center px-4 w-full max-w-5xl mx-auto mt-8">
            {/* Board + Headers Container (shared padding) */}
            <div className="bg-blue-700 rounded-2xl p-4 shadow-xl w-full">
              {/* Column Headers */}
              <div className="grid grid-cols-7 gap-4 mb-3">
                {[0, 1, 2, 3, 4, 5, 6].map(col => (
                  <div key={col} className="flex justify-center items-end">
                    {(voteCounts[col] || 0) > 0 ? (
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
                        {voteCounts[col]}
                      </span>
                    ) : (
                      <span className="text-gray-200 text-lg">↓</span>
                    )}
                  </div>
                                 ))}
               </div>

              {/* Connect 4 Board */}
              <div className="grid grid-cols-7 gap-4 w-full">
                {game.board.map((row, rowIndex) =>
                  [0, 1, 2, 3, 4, 5, 6].map(colIndex => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleColumnClick(colIndex)}
                      className="aspect-square flex items-center justify-center cursor-pointer"
                    >
                      {/* Hole */}
                      <div className="w-full h-full rounded-full bg-blue-900 flex items-center justify-center">
                        {/* Token */}
                        {row[colIndex] !== null && (
                          <div
                            className={`w-[85%] h-[85%] rounded-full shadow-md border-2
                              ${row[colIndex] === 'red'
                                ? 'bg-red-500 border-red-700'
                                : row[colIndex] === 'yellow'
                                ? 'bg-yellow-400 border-yellow-600'
                                : ''}`}
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>




            {/* Action Buttons */}
            <div className="mt-12 lg:mt-16 xl:mt-20 2xl:mt-24 3xl:mt-28 4xl:mt-32 5xl:mt-36 6xl:mt-40 7xl:mt-44 8xl:mt-48 9xl:mt-52 10xl:mt-56 11xl:mt-60 space-y-4">
              <div className="text-center">
                {isMyTeamsTurn ? (
                  hasVoted ? (
                    <div className="bg-green-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg">
                      ✓ Waiting for other team members to vote...
                    </div>
                  ) : (
                    <div className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg animate-pulse">
                      🎯 Click a column to vote!
                    </div>
                  )
                ) : (
                  <div className="bg-gray-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg">
                    ⏳ Waiting for {game.currentTeam === 'red' ? '🔴 Red' : '🟡 Yellow'} team to vote...
                  </div>
                )}
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={leaveRoom}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all duration-200 hover:scale-105 shadow-lg font-medium"
                >
                  🚪 Leave Game
                </button>
              </div>
            </div>
          </div>

          {/* Game Status - Right */}
          <div className="space-y-6 max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4xl:max-w-3xl 5xl:max-w-4xl 6xl:max-w-5xl 7xl:max-w-6xl 8xl:max-w-7xl 9xl:max-w-8xl 10xl:max-w-9xl 11xl:max-w-10xl 12xl:max-w-11xl">
            {/* Current Turn Status */}
            {/* <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">🔄 Turn Status</h3>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg border-2 ${
                  game.currentTeam === 'red' 
                    ? 'bg-red-50 border-red-300 text-red-800' 
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">🔴 Red Team</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      game.currentTeam === 'red' 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-gray-400 text-white'
                    }`}>
                      {game.currentTeam === 'red' ? 'Voting...' : 'Waiting'}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg border-2 ${
                  game.currentTeam === 'yellow' 
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-800' 
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">🟡 Yellow Team</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      game.currentTeam === 'yellow' 
                        ? 'bg-yellow-500 text-white animate-pulse' 
                        : 'bg-gray-400 text-white'
                    }`}>
                      {game.currentTeam === 'yellow' ? 'Voting...' : 'Waiting'}
                    </span>
                  </div>
                </div>
              </div>
            </div> */}

            {/* Voting Progress */}
            {/* {isMyTeamsTurn && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">🗳️ Vote Progress</h3>
                <div className="space-y-3">
                  {(currentPlayer.team === 'red' ? redTeam : yellowTeam).map(player => (
                    <div key={player.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{player.nickname}</span>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        game.votes && game.votes[player.id] !== undefined 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-400 text-white'
                      }`}>
                        {game.votes && game.votes[player.id] !== undefined ? '✓ Voted' : '⏳ Waiting'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {voteCounts.reduce((sum, count) => sum + count, 0)}
                    </div>
                    <div className="text-sm text-blue-600">Total Votes</div>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-gray-50 rounded-lg text-center">
                  <span className="text-xs text-gray-600">
                    {timeRemaining !== null && timeRemaining > 0 
                      ? `⏰ ${formatTime(timeRemaining)} remaining`
                      : '🗳️ Voting in progress...'
                    }
                  </span>
                </div>
              </div>
            )} */}

            {/* Game Rules */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">📖 How to Play</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Teams take turns dropping pieces
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Vote for which column to use
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Majority vote wins
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Connect 4 pieces to win!
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
