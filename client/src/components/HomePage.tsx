import React, { useState } from 'react';
import { useAppContext } from '../state/AppContext';

export function HomePage() {
  const { createRoom, joinRoom, state } = useAppContext();
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [loading, setLoading] = useState(false);
  
  // Join room form state
  const [joinForm, setJoinForm] = useState({
    roomCode: '',
    nickname: '',
    password: ''
  });

  // Create room form state
  const [createForm, setCreateForm] = useState({
    password: '',
    timerSec: 15
  });
  
  const [nickname, setNickname] = useState('');

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinForm.roomCode.trim() || !joinForm.nickname.trim()) return;
    
    setLoading(true);
    try {
      await joinRoom(
        joinForm.roomCode.toUpperCase(),
        joinForm.nickname.trim(),
        joinForm.password || undefined
      );
    } catch (error) {
      console.error('Failed to join room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    
    setLoading(true);
    try {
      await createRoom(
        createForm.password || undefined,
        createForm.timerSec,
        nickname.trim()
      );
      // Room creation and auto-join will be handled by createRoom method
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔴 Connect Four 🟡
          </h1>
          <p className="text-gray-600">
            Multiplayer team-based Connect Four
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-6">
          <div className={`text-center text-sm px-3 py-2 rounded-lg ${
            state.connectionStatus === 'connected' 
              ? 'bg-green-100 text-green-700' 
              : state.connectionStatus === 'connecting'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {state.connectionStatus === 'connected' && '✅ Connected'}
            {state.connectionStatus === 'connecting' && '🔄 Connecting...'}
            {state.connectionStatus === 'disconnected' && '❌ Disconnected'}
          </div>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="text-sm">{state.error}</p>
          </div>
        )}

        {/* Mode Selector */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              mode === 'join'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Join Room
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              mode === 'create'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create Room
          </button>
        </div>

        {/* Join Room Form */}
        {mode === 'join' && (
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-1">
                Room Code
              </label>
              <input
                type="text"
                id="roomCode"
                value={joinForm.roomCode}
                onChange={(e) => setJoinForm(prev => ({ ...prev, roomCode: e.target.value.toUpperCase() }))}
                placeholder="Enter room code"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest font-mono"
                maxLength={8}
                required
              />
            </div>
            
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                Your Nickname
              </label>
              <input
                type="text"
                id="nickname"
                value={joinForm.nickname}
                onChange={(e) => setJoinForm(prev => ({ ...prev, nickname: e.target.value }))}
                placeholder="Enter your nickname"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={20}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password (if required)
              </label>
              <input
                type="password"
                id="password"
                value={joinForm.password}
                onChange={(e) => setJoinForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Room password (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading || state.connectionStatus !== 'connected'}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        )}

        {/* Create Room Form */}
        {mode === 'create' && (
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label htmlFor="createNickname" className="block text-sm font-medium text-gray-700 mb-1">
                Your Nickname
              </label>
              <input
                type="text"
                id="createNickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={20}
                required
              />
            </div>

            <div>
              <label htmlFor="createPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Room Password (optional)
              </label>
              <input
                type="password"
                id="createPassword"
                value={createForm.password}
                onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Set a password (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="timerSec" className="block text-sm font-medium text-gray-700 mb-1">
                Vote Timer: {createForm.timerSec} seconds
              </label>
              <input
                type="range"
                id="timerSec"
                min="10"
                max="30"
                step="5"
                value={createForm.timerSec}
                onChange={(e) => setCreateForm(prev => ({ ...prev, timerSec: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10s</span>
                <span>15s</span>
                <span>20s</span>
                <span>25s</span>
                <span>30s</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || state.connectionStatus !== 'connected'}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </form>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">How to Play:</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Join a room with friends (up to 10 players)</li>
            <li>• Teams are automatically balanced (Red vs Yellow)</li>
            <li>• Each team votes on which column to drop their piece</li>
            <li>• First team to connect 4 pieces wins!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
