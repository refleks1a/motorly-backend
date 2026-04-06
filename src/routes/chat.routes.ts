import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';
import { aiService } from '../services/ai';

const router = Router();

// Public test endpoint (no authentication required)
router.post('/test-ai', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const response = await aiService.generateDiagnosis(message);
    res.json(response);
  } catch (error) {
    console.error('AI test error:', error);
    res.status(500).json({ error: 'AI service failed' });
  }
});

// All other chat routes require authentication
router.use(authenticate);

// Chat session routes
router.get('/sessions', ChatController.getChatSessions);
router.post('/sessions', ChatController.createChatSession);
router.get('/sessions/:id', ChatController.getChatSession);
router.delete('/sessions/:id', ChatController.deleteChatSession);

// Message routes
router.post('/sessions/:id/messages', ChatController.sendMessage);

// Vehicle-specific diagnosis history
router.get('/vehicles/:vehicleId/diagnosis-history', ChatController.getVehicleDiagnosisHistory);

export default router;
