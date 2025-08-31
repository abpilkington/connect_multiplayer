import { useState } from 'react';

export function DemoMode() {
  const [currentView, setCurrentView] = useState<'home' | 'lobby' | 'game'>('home');
  const [demoBoard, setDemoBoard] = useState<(string | null)[][]>(
    Array(6).fill(null).map(() => Array(7).fill(null))
  );

  const addDemoToken = (column: number) => {
    const newBoard = [...demoBoard];
    // Find the lowest empty row in the column
    for (let row = 5; row >= 0; row--) {
      if (newBoard[row][column] === null) {
        newBoard[row][column] = Math.random() > 0.5 ? 'red' : 'yellow';
        break;
      }
    }
    setDemoBoard(newBoard);
  };

  const resetBoard = () => {
    setDemoBoard(Array(6).fill(null).map(() => Array(7).fill(null)));
  };

  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-8 drop-shadow-lg">🔴 Connect Four 🟡</h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl">
            Experience the multiplayer Connect Four game! This is a demo showing the game interface.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('lobby')}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-xl font-bold text-lg"
            >
              🎮 View Lobby Demo
            </button>
            <br />
            <button
              onClick={() => setCurrentView('game')}
              className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-all duration-200 hover:scale-105 shadow-xl font-bold text-lg"
            >
              🎯 View Game Demo
            </button>
          </div>
          <div className="mt-12 text-white/70">
            <p className="text-sm">
              This is a demo version. For the full multiplayer experience, you'll need to run the server locally.
            </p>
            <p className="text-sm mt-2">
              Check the README for setup instructions!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">🎮 Game Lobby</h1>
            <p className="text-white/80 text-xl">Demo Mode - Lobby Interface</p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Room: DEMO123</h2>
              <p className="text-gray-600">Share this code with friends to join!</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-red-700 mb-4">🔴 Red Team</h3>
                <div className="space-y-2">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <span className="font-medium">Player 1</span>
                    <span className="ml-2 text-sm text-red-600">👑 Admin</span>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg">
                    <span className="font-medium">Player 2</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-yellow-700 mb-4">🟡 Yellow Team</h3>
                <div className="space-y-2">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <span className="font-medium">Player 3</span>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <span className="font-medium">Player 4</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setCurrentView('game')}
                className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-all duration-200 hover:scale-105 shadow-xl font-bold text-lg"
              >
                🚀 Start Game Demo
              </button>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => setCurrentView('home')}
              className="text-white/80 hover:text-white transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">🎯 Game Demo</h1>
          <p className="text-white/80 text-xl">Interactive Connect Four Board</p>
        </div>

        <div className="flex flex-col items-center px-4 w-full max-w-5xl mx-auto mt-8">
          {/* Column Headers */}
          <div className="grid grid-cols-7 gap-4 w-full mb-3">
            {[0, 1, 2, 3, 4, 5, 6].map(col => (
              <div key={col} className="flex justify-center items-end">
                <span className="text-gray-200 text-lg">↓</span>
              </div>
            ))}
          </div>

          {/* Connect 4 Board Frame */}
          <div className="bg-blue-700 rounded-2xl p-4 shadow-xl w-full">
            <div className="grid grid-cols-7 gap-4 w-full">
              {demoBoard.map((row, rowIndex) =>
                [0, 1, 2, 3, 4, 5, 6].map(colIndex => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => addDemoToken(colIndex)}
                    className="aspect-square flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                  >
                    {/* Hole */}
                    <div className="w-full h-full rounded-full bg-blue-900 flex items-center justify-center">
                      {/* Token */}
                      {demoBoard[rowIndex][colIndex] !== null && (
                        <div
                          className={`w-[85%] h-[85%] rounded-full shadow-md border-2
                            ${demoBoard[rowIndex][colIndex] === 'red'
                              ? 'bg-red-500 border-red-700'
                              : 'bg-yellow-400 border-yellow-600'
                            }`}
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 space-y-4 text-center">
            <p className="text-white/80 text-lg">
              Click on any column to add a demo token!
            </p>
            <div className="space-x-4">
              <button
                onClick={resetBoard}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all duration-200 hover:scale-105 shadow-lg font-medium"
              >
                🔄 Reset Board
              </button>
              <button
                onClick={() => setCurrentView('home')}
                className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all duration-200 hover:scale-105 shadow-lg font-medium"
              >
                🏠 Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
