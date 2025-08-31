# 🔴 Multiplayer Connect Four 🟡

An office-friendly multiplayer Connect Four game built with TypeScript, React, and Socket.io. Teams of up to 10 players collaborate to make strategic moves in real-time.

## ✨ Features

- **Team-based gameplay**: Up to 10 players split into Red and Yellow teams
- **Real-time voting**: Team members vote on each move with majority rule
- **Private rooms**: Room codes with optional password protection  
- **Live updates**: WebSocket-powered real-time game state synchronization
- **Accessibility**: Keyboard navigation and screen reader support
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Test-driven**: Comprehensive test coverage for game logic

## 🏗️ Architecture

### Server (Node.js + TypeScript)
- **Pure game engine**: Immutable, deterministic game logic
- **Room management**: In-memory room store with player management
- **Turn system**: Voting-based turn resolution with configurable timers
- **WebSocket API**: Socket.io for real-time communication
- **Access control**: Room codes, passwords, and rate limiting

### Client (React + TypeScript)
- **State management**: React Context with reducer pattern
- **Socket integration**: Real-time server communication
- **Responsive design**: Mobile-friendly interface
- **Component architecture**: Modular, testable components

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd multiplayer_connect_4
   npm install
   cd server && npm install
   cd ../client && npm install
   cd ..
   ```

2. **Start the application**
   ```bash
   # Start both server and client in development mode
   npm run dev
   ```

   The server will start on `http://localhost:3001` and the client on `http://localhost:5173`.

### Manual Start

```bash
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Start client  
cd client
npm run dev
```

## 🎮 How to Play

1. **Create or join a room**
   - Create a new room with optional password protection
   - Share the room code with up to 9 friends
   - Teams are automatically balanced

2. **Team voting**
   - Only the active team can vote during their turn
   - Vote for which column to drop your team's piece
   - Majority vote wins (ties go to lowest column index)

3. **Win the game**
   - Connect 4 pieces horizontally, vertically, or diagonally
   - Track your contribution with the matching votes scoreboard

## 🧪 Testing

```bash
# Run all tests
npm test

# Server tests only
cd server && npm test

# Client tests only  
cd client && npm test

# Test coverage
cd server && npm run test:coverage
```

## 🛠️ Development

### Project Structure

```
multiplayer_connect_4/
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── engine/        # Pure game logic
│   │   ├── services/      # Business logic
│   │   ├── transport/     # Socket.io handlers
│   │   ├── http/          # REST endpoints
│   │   └── types/         # TypeScript definitions
│   └── tests/             # Test suites
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── features/      # Feature modules
│   │   ├── state/         # State management
│   │   ├── api/           # Server communication
│   │   └── types/         # TypeScript definitions
│   └── tests/             # Test suites
└── package.json           # Root package for scripts
```

### Key Components

**Server:**
- `GameEngine`: Pure game logic with immutable operations
- `TurnManager`: Voting lifecycle and timer management  
- `RoomService`: Room creation, joining, and lifecycle
- `SocketServer`: WebSocket event handling

**Client:**
- `AppContext`: Global state management with React Context
- `SocketManager`: Server communication abstraction
- `HomePage`: Room creation and joining interface
- Component library for lobby, game board, and voting UI

### Development Scripts

```bash
# Type checking
npm run typecheck
npm run typecheck:server
npm run typecheck:client

# Linting
npm run lint
npm run lint:server  
npm run lint:client

# Building
npm run build
npm run build:server
npm run build:client
```

## 📋 Game Rules

### Room Management
- **Capacity**: 2-10 players per room
- **Teams**: Auto-balanced Red vs Yellow
- **Admin**: First player becomes room admin
- **Reconnection**: 60-second grace period for disconnected players

### Gameplay
- **Turn timer**: Configurable 10-30 seconds per team turn
- **Voting**: Only active team members can vote
- **Resolution**: Majority vote with deterministic tie-breaking
- **Win condition**: 4 pieces in a row (any direction)
- **Draw condition**: Board full with no winner

### Scoring
- **Matching votes**: Track how often your vote aligned with team decision
- **Contribution scoreboard**: Displayed at game end

## 🔧 Configuration

### Environment Variables

**Server:**
```bash
PORT=3001                   # Server port
CLIENT_URL=http://localhost:5173  # CORS origin
```

**Client:**
```bash
VITE_SERVER_URL=http://localhost:3001  # Server URL
```

### Game Settings
- **Timer duration**: 10-30 seconds (configurable per room)
- **Max players**: 10 (hardcoded, can be modified)
- **Room code length**: 6 characters (A-Z, 2-9, excluding confusing chars)

## 🚢 Production Deployment

### Quick Deploy Options

#### **Option 1: GitHub Pages Demo (FREE)**
Deploy just the client interface for people to see and interact with:

```bash
# Push your code to GitHub
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main

# Enable GitHub Pages in repository settings
# Your demo will be available at: https://yourusername.github.io/multiplayer_connect_4/
```

#### **Option 2: Full Multiplayer Game (FREE/PAID)**
Deploy both client and server for actual gameplay:

**Recommended: Render (Free)**
- Deploy server and client as separate web services
- Automatic builds from GitHub
- Free tier with 750 hours/month

**Alternative: Railway (Free trial)**
- Simple deployment process
- Good for testing and small-scale use

### Manual Deployment

#### Building for Production

```bash
npm run build
```

#### Server Deployment
The server builds to `server/dist/` and can be deployed to any Node.js hosting service:

```bash
cd server
npm run build
npm start
```

#### Client Deployment
The client builds to `client/dist/` as static files for any web server:

```bash
cd client  
npm run build
# Deploy dist/ folder to your static hosting service
```

### Configuration for Production

Update your client's socket connection for production:

```typescript
// In client/src/api/socket.ts
const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'wss://your-server-url.com'  // Your deployed server URL
  : 'ws://localhost:3001';        // Local development
```

### Detailed Deployment Guide

For step-by-step instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Docker Support
*Coming soon - Docker configurations for easy deployment*

## 🧑‍💻 API Reference

### Socket Events

**Client → Server:**
- `room:create` - Create new room
- `room:join` - Join existing room  
- `room:start` - Start game (admin only)
- `room:vote` - Cast vote for column
- `room:rematch` - Start rematch (admin only)
- `room:leave` - Leave room

**Server → Client:**
- `room:state` - Room state update
- `game:started` - Game began
- `game:moveApplied` - Move was made
- `game:ended` - Game finished
- `game:voteUpdate` - Vote counts updated
- `error` - Error occurred

### REST Endpoints

- `GET /api/health` - Health check
- `POST /api/rooms/create` - Create room (alternative to socket)
- `GET /api/rooms/:code` - Get room info

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Code Standards
- **TypeScript strict mode** for type safety
- **Test-driven development** for core logic
- **ESLint + Prettier** for code formatting
- **Semantic commit messages**

## 📝 License

MIT License - see LICENSE file for details.

## 🔮 Future Features

- **Persistent rooms** with Redis storage
- **Team chat** with moderation
- **Power-ups** and special abilities  
- **Best-of-3** tournament mode
- **Spectator mode** for viewers
- **Advanced analytics** and statistics
- **Company SSO integration**
- **3D visual themes**

## 🐛 Known Issues

- Room cleanup after server restart requires manual intervention
- Mobile keyboard navigation needs improvement
- No persistent user accounts (intentional for MVP)

## 📞 Support

For issues and questions:
1. Check existing GitHub issues
2. Create a new issue with detailed reproduction steps
3. Include browser/Node.js version information

---

**Built with ❤️ for office team building and remote collaboration**

