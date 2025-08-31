import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { GameEngine } from './engine/GameEngine';
import { MajorityTurnDecider } from './services/MajorityTurnDecider';
import { SystemClock } from './utils/Clock';
import { InMemoryRoomStore } from './services/InMemoryRoomStore';
import { AccessControl } from './services/AccessControl';
import { RoomService } from './services/RoomService';
import { SocketServer } from './transport/SocketServer';
import { createRoutes } from './http/routes';

const PORT = process.env['PORT'] || 3001;
const CLIENT_URL = process.env['CLIENT_URL'] || 'http://localhost:5173';

async function startServer() {
  // Initialize dependencies
  const gameEngine = new GameEngine();
  const turnDecider = new MajorityTurnDecider();
  const clock = new SystemClock();
  const roomStore = new InMemoryRoomStore();
  const accessControl = new AccessControl();
  
  // Initialize services
  const roomService = new RoomService(
    roomStore,
    accessControl,
    gameEngine,
    turnDecider,
    clock
  );

  // Create Express app
  const app = express();
  
  // Middleware
  app.use(cors({
    origin: CLIENT_URL,
    credentials: true
  }));
  app.use(express.json());

  // HTTP routes
  app.use('/api', createRoutes(roomService));

  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize Socket.IO
  new SocketServer(httpServer, roomService);

  // Start server
  httpServer.listen(PORT, () => {
    console.log(`🎮 Connect Four Server running on port ${PORT}`);
    console.log(`📡 Socket.IO enabled`);
    console.log(`🌐 Client URL: ${CLIENT_URL}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    httpServer.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
