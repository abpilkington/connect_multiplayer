import express from 'express';
import { RoomService } from '../services/RoomService';

export function createRoutes(roomService: RoomService): express.Router {
  const router = express.Router();

  // Health check endpoint
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Create room endpoint (alternative to socket)
  router.post('/rooms/create', async (req, res) => {
    try {
      const { password, timerSec } = req.body;
      const result = await roomService.createRoom({ password, timerSec });
      res.json(result);
    } catch (error) {
      console.error('Error creating room via HTTP:', error);
      res.status(500).json({ 
        error: 'Failed to create room',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get room info (for debugging/admin purposes)
  router.get('/rooms/:code', async (req, res) => {
    try {
      const room = await roomService.getRoom(req.params.code);
      if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
      }
      res.json(room);
    } catch (error) {
      console.error('Error getting room via HTTP:', error);
      res.status(500).json({ 
        error: 'Failed to get room',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
