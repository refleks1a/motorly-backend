import { Request, Response } from 'express';
import { prisma } from '../index';
import { 
  ChatMessage,
  DiagnosisResult,
  ChatSession,
  CreateChatSessionRequest,
  SendMessageRequest
} from '../types';
import { aiService } from '../services/ai';
import { uploadImageToS3 } from '../services/s3.service';

export class ChatController {
  // Get all chat sessions for the authenticated user
  static async getChatSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const chatSessions = await prisma.chatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          vehicleId: true,
          createdAt: true,
          updatedAt: true,
          vehicle: {
            select: {
              make: true,
              model: true,
              year: true
            }
          }
        }
      });

      const formattedSessions: ChatSession[] = chatSessions.map(session => ({
        id: session.id,
        title: session.title,
        vehicleId: session.vehicleId || undefined,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        vehicle: session.vehicle ? {
          make: session.vehicle.make,
          model: session.vehicle.model,
          year: session.vehicle.year
        } : undefined
      }));

      res.status(200).json(formattedSessions);
    } catch (error) {
      console.error('Get chat sessions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get a single chat session with messages
  static async getChatSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const sessionId = req.params.id as string;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if session exists and belongs to user
      const session = await prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              content: true,
              role: true,
              createdAt: true,
              imageUrl: true,
              diagnosisResult: true
            }
          },
          vehicle: {
            select: {
              make: true,
              model: true,
              year: true,
              mileage: true
            }
          }
        }
      });

      if (!session) {
        res.status(404).json({ error: 'Chat session not found' });
        return;
      }

      const formattedMessages: ChatMessage[] = session.messages.map(message => ({
        id: message.id,
        content: message.content,
        role: message.role as 'user' | 'assistant',
        createdAt: message.createdAt.toISOString(),
        imageUrl: message.imageUrl,
        diagnosisResult: message.diagnosisResult ? JSON.parse(message.diagnosisResult) as DiagnosisResult : undefined
      }));

      const formattedSession: ChatSession = {
        id: session.id,
        title: session.title,
        vehicleId: session.vehicleId || undefined,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        vehicle: session.vehicle ? {
          make: session.vehicle.make,
          model: session.vehicle.model,
          year: session.vehicle.year,
          mileage: session.vehicle.mileage
        } : undefined,
        messages: formattedMessages
      };

      res.status(200).json(formattedSession);
    } catch (error) {
      console.error('Get chat session error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create a new chat session
  static async createChatSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { vehicleId, initialMessage }: CreateChatSessionRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Validate vehicle exists and belongs to user if vehicleId is provided
      if (vehicleId) {
        const vehicle = await prisma.vehicle.findFirst({
          where: {
            id: vehicleId,
            userId
          }
        });

        if (!vehicle) {
          res.status(404).json({ error: 'Vehicle not found' });
          return;
        }
      }

      // Create initial title based on vehicle or generic
      let title = 'New Diagnosis Chat';
      if (vehicleId) {
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: vehicleId },
          select: { make: true, model: true, year: true }
        });
        if (vehicle) {
          title = `${vehicle.year} ${vehicle.make} ${vehicle.model} Diagnosis`;
        }
      }

      // Create chat session
      const chatSession = await prisma.chatSession.create({
        data: {
          userId,
          vehicleId: vehicleId || null,
          title
        },
        select: {
          id: true,
          title: true,
          vehicleId: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const formattedSession: ChatSession = {
        id: chatSession.id,
        title: chatSession.title,
        vehicleId: chatSession.vehicleId || undefined,
        createdAt: chatSession.createdAt.toISOString(),
        updatedAt: chatSession.updatedAt.toISOString()
      };

      // If initial message is provided, create it
      if (initialMessage) {
        // Create user message
        const userMessage = await prisma.chatMessage.create({
          data: {
            sessionId: chatSession.id,
            content: initialMessage,
            role: 'user'
          },
          select: {
            id: true,
            content: true,
            role: true,
            createdAt: true
          }
        });

        // Generate AI response with context
        const aiResponse = await ChatController.generateAIResponse(initialMessage, vehicleId, userId);
        
        // Create AI message in database
        const aiMessage = await prisma.chatMessage.create({
          data: {
            sessionId: chatSession.id,
            content: aiResponse.content,
            role: 'assistant',
            diagnosisResult: aiResponse.diagnosisResult ? JSON.stringify(aiResponse.diagnosisResult) : null
          },
          select: {
            id: true,
            content: true,
            role: true,
            createdAt: true,
            diagnosisResult: true
          }
        });

        formattedSession.messages = [
          {
            id: userMessage.id,
            content: userMessage.content,
            role: userMessage.role as 'user',
            createdAt: userMessage.createdAt.toISOString()
          },
          {
            id: aiMessage.id,
            content: aiMessage.content,
            role: aiMessage.role as 'assistant',
            createdAt: aiMessage.createdAt.toISOString(),
            diagnosisResult: aiMessage.diagnosisResult ? JSON.parse(aiMessage.diagnosisResult) as DiagnosisResult : undefined
          }
        ];
      }

      res.status(201).json(formattedSession);
    } catch (error) {
      console.error('Create chat session error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Send a message in a chat session
  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const sessionId = req.params.id as string;
      const { content, useAgent }: SendMessageRequest & { useAgent?: any } = req.body;
      const file = req.file;

      // Handle multipart form data where booleans might be strings
      let isUseAgent = true;
      if (useAgent !== undefined) {
        isUseAgent = useAgent === 'false' || useAgent === false ? false : true;
      }


      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      if (!content || content.trim() === '') {
        res.status(400).json({ error: 'Message content is required' });
        return;
      }

      // Check if session exists and belongs to user
      const session = await prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId
        }
      });

      if (!session) {
        res.status(404).json({ error: 'Chat session not found' });
        return;
      }

      let imageUrl: string | null = null;
      if (file) {
        try {
          imageUrl = await uploadImageToS3(file.buffer, file.mimetype, file.originalname);
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          res.status(500).json({ error: 'Failed to upload image' });
          return;
        }
      }

      // Create user message
      const userMessage = await prisma.chatMessage.create({
        data: {
          sessionId,
          content: content.trim(),
          role: 'user',
          imageUrl
        },
        select: {
          id: true,
          content: true,
          role: true,
          createdAt: true,
          imageUrl: true
        }
      });

      // Generate AI response with context
      const aiResponse = await ChatController.generateAIResponse(content.trim(), session.vehicleId, userId, sessionId, imageUrl, isUseAgent);

      // Create AI message
      const aiMessage = await prisma.chatMessage.create({
        data: {
          sessionId,
          content: aiResponse.content,
          role: 'assistant',
          diagnosisResult: aiResponse.diagnosisResult ? JSON.stringify(aiResponse.diagnosisResult) : null
        },
        select: {
          id: true,
          content: true,
          role: true,
          createdAt: true,
          diagnosisResult: true
        }
      });

      // Update session timestamp
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() }
      });

      const formattedUserMessage: ChatMessage = {
        id: userMessage.id,
        content: userMessage.content,
        // @ts-ignore
        imageUrl: userMessage.imageUrl,
        role: userMessage.role as 'user',
        createdAt: userMessage.createdAt.toISOString()
      };

      const formattedAiMessage: ChatMessage = {
        id: aiMessage.id,
        content: aiMessage.content,
        role: aiMessage.role as 'assistant',
        createdAt: aiMessage.createdAt.toISOString(),
        diagnosisResult: aiMessage.diagnosisResult ? JSON.parse(aiMessage.diagnosisResult) as DiagnosisResult : undefined,
        suggestedReplies: aiResponse.suggestedReplies,
      };

      res.status(201).json({
        userMessage: formattedUserMessage,
        aiMessage: formattedAiMessage
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete a chat session
  static async deleteChatSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const sessionId = req.params.id as string;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if session exists and belongs to user
      const session = await prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId
        }
      });

      if (!session) {
        res.status(404).json({ error: 'Chat session not found' });
        return;
      }

      // Delete the session's messages first since onDelete: Cascade is not set in Prisma schema
      await prisma.chatMessage.deleteMany({
        where: { sessionId: sessionId }
      });

      // Then delete the actual session
      await prisma.chatSession.delete({
        where: { id: sessionId }
      });

      res.status(200).json({ message: 'Chat session deleted successfully' });
    } catch (error) {
      console.error('Delete chat session error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Generate AI response using the AI service
  private static async generateAIResponse(
    userMessage: string,
    vehicleId?: string | null,
    userId?: string,
    sessionId?: string,
    imageUrl?: string | null,
    useAgent?: boolean
  ): Promise<{ content: string; diagnosisResult?: DiagnosisResult; suggestedReplies?: string[] }> {
    try {
      // Build context for AI
      const context: any = {};
      if (useAgent !== undefined) {
        context.useAgent = useAgent;
      }

      // Thread user + vehicle IDs so agentic tools can scope DB queries safely
      if (userId) context.userId = userId;
      if (vehicleId) context.vehicleId = vehicleId;

      if (imageUrl) {
        context.imageUrl = imageUrl;
      }

      // Add vehicle context if available (basic details for prompt building)
      if (vehicleId && userId) {
        const vehicle = await prisma.vehicle.findFirst({
          where: {
            id: vehicleId,
            userId
          },
          select: {
            make: true,
            model: true,
            year: true,
            mileage: true
          }
        });

        if (vehicle) {
          context.vehicle = {
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            mileage: vehicle.mileage
          };
        }
      }

      // Add recent conversation history if sessionId is provided
      if (sessionId) {
        const recentMessages = await prisma.chatMessage.findMany({
          where: {
            sessionId,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            content: true,
            role: true,
            createdAt: true
          }
        });

        if (recentMessages.length > 0) {
          context.recentMessages = recentMessages.reverse().map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.createdAt.toISOString()
          }));
        }
      }

      // Use AI service to generate response
      const aiResponse = await aiService.generateDiagnosis(userMessage, context);
      
      return {
        content: aiResponse.content,
        diagnosisResult: aiResponse.diagnosisResult,
        suggestedReplies: aiResponse.suggestedReplies,
      };
    } catch (error) {
      console.error('AI service error, falling back to basic response:', error);
      
      // Fallback to basic response
      return {
        content: "I understand you're describing a car issue. To provide more accurate diagnosis, please provide:\n\n1. **Specific symptoms** (noises, vibrations, warning lights)\n2. **When it occurs** (during acceleration, braking, at idle)\n3. **Vehicle details** (make, model, year, mileage)\n4. **Recent maintenance** or repairs\n\nThe more details you provide, the better I can help diagnose the issue.",
        diagnosisResult: {
          confidence: 0.3,
          severity: 'low',
          potentialIssues: [],
          recommendedActions: [
            'Provide more specific symptoms',
            'Note when the issue occurs',
            'Share vehicle maintenance history'
          ]
        }
      };
    }
  }

  // Get diagnosis history for a vehicle
  static async getVehicleDiagnosisHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const vehicleId = req.params.vehicleId as string;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Check if vehicle exists and belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId
        }
      });

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Get chat sessions for this vehicle
      const chatSessions = await prisma.chatSession.findMany({
        where: {
          vehicleId,
          userId
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            where: {
              role: 'assistant',
              diagnosisResult: { not: null }
            },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              createdAt: true,
              diagnosisResult: true
            }
          }
        }
      });

      // Extract diagnosis results
      const diagnosisHistory = chatSessions.flatMap(session => 
        session.messages.map(message => ({
          sessionId: session.id,
          sessionTitle: session.title,
          messageId: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          diagnosisResult: message.diagnosisResult ? JSON.parse(message.diagnosisResult) as DiagnosisResult : undefined
        }))
      );

      res.status(200).json(diagnosisHistory);
    } catch (error) {
      console.error('Get diagnosis history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}