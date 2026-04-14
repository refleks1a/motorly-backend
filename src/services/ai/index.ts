import { SimulatedAIService } from './simulated.service';
import { AIResponse, AIContext } from './types';
import OpenAI from 'openai';

export class AIService {
  private static instance: AIService;
  private useRealAI: boolean = false;
  private simulatedService: SimulatedAIService;
  private openAIApiKey?: string;
  private anthropicApiKey?: string;
  private deepseekApiKey?: string;
  // @ts-ignore - Will be used when implementing real DeepSeek API integration
  private deepseekBaseUrl?: string;
  // @ts-ignore - Will be used when implementing real DeepSeek API integration
  private deepseekModel?: string;

  private constructor() {
    this.simulatedService = new SimulatedAIService();
    
    // Check for API keys in environment
    this.useRealAI = process.env.USE_REAL_AI === 'true';
    this.openAIApiKey = process.env.OPENAI_API_KEY;
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    this.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    this.deepseekBaseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
    this.deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    
    if (this.useRealAI && !this.openAIApiKey && !this.anthropicApiKey && !this.deepseekApiKey) {
      console.warn('Real AI enabled but no API keys found. Falling back to simulated AI.');
      this.useRealAI = false;
    }
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Generate AI response for car diagnosis
   */
  async generateDiagnosis(
    userMessage: string,
    context?: AIContext
  ): Promise<AIResponse> {
    if (this.useRealAI) {
      try {
        const hasImage = !!context?.imageUrl;

        // Dynamic Routing Strategy:
        // 1. If message has an image and OpenAI is configured -> Route to OpenAI (Vision)
        // 2. If it's text-only and DeepSeek is configured -> Route to DeepSeek (Cost-effective reasoning)
        if (hasImage && this.openAIApiKey) {
          console.log('Image detected: Routing AI request to OpenAI (Vision supported)');
          return await this.generateOpenAIResponse(userMessage, context);
        } else if (!hasImage && this.deepseekApiKey) {
          console.log('Text-only request: Routing AI request to DeepSeek');
          return await this.generateDeepSeekResponse(userMessage, context);
        } else if (this.openAIApiKey) {
          console.log('Fallback: Routing AI request to OpenAI');
          return await this.generateOpenAIResponse(userMessage, context);
        } else if (this.deepseekApiKey) {
          console.log('Fallback: Routing AI request to DeepSeek');
          return await this.generateDeepSeekResponse(userMessage, context);
        } else if (this.anthropicApiKey) {
          return await this.generateAnthropicResponse(userMessage, context);
        }
      } catch (error) {
        console.error('Real AI service failed, falling back to simulated:', error);
        return this.simulatedService.generateDiagnosis(userMessage, context);
      }
    }
    
    // Fall back to simulated response
    return this.simulatedService.generateDiagnosis(userMessage, context);
  }

  /**
   * Generate response using OpenAI GPT (with vision support)
   */
  private async generateOpenAIResponse(
    userMessage: string,
    context?: AIContext
  ): Promise<AIResponse> {
    if (!this.openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const openai = new OpenAI({ apiKey: this.openAIApiKey });
    const model = process.env.OPENAI_MODEL || 'gpt-4o';
    return await this.callOpenAICompatibleModel(openai, model, userMessage, context, true);
  }

  /**
   * Generate response using Anthropic Claude
   */
  private async generateAnthropicResponse(
    userMessage: string,
    context?: AIContext
  ): Promise<AIResponse> {
    const prompt = this.buildAIPrompt(userMessage, context);
    
    // In a real implementation, this would call the Anthropic API
    // For now, we'll simulate it
    console.log('Anthropic prompt:', prompt);
    
    return this.simulatedService.generateDiagnosis(userMessage, context);
  }

  /**
   * Generate response using DeepSeek (with vision support via OpenAI-compatible API)
   */
  private async generateDeepSeekResponse(
    userMessage: string,
    context?: AIContext
  ): Promise<AIResponse> {
    if (!this.deepseekApiKey) {
      throw new Error('DeepSeek API key is not configured');
    }

    const openai = new OpenAI({
      apiKey: this.deepseekApiKey,
      baseURL: this.deepseekBaseUrl,
    });

    const model = this.deepseekModel || 'deepseek-chat';
    return await this.callOpenAICompatibleModel(openai, model, userMessage, context, false);
  }

  /**
   * Shared logic for any OpenAI-compatible API (OpenAI, DeepSeek, etc.)
   * Supports vision: when context.imageUrl is present, sends the image as a
   * multimodal content array so the model can actually see it.
   */
  private async callOpenAICompatibleModel(
    client: OpenAI,
    model: string,
    userMessage: string,
    context?: AIContext,
    supportsVision: boolean = false
  ): Promise<AIResponse> {
    const systemPrompt = `You are a helpful automotive AI assistant. Your response must be in valid JSON format.
You must return a JSON object with this exact structure, with no markdown wrappers or additional text:
{
  "content": "A helpful conversational reply explaining the diagnosis...",
  "diagnosisResult": {
    "confidence": 0.85,
    "severity": "low",
    "potentialIssues": [
      {
        "name": "Issue Name",
        "description": "Short explanation",
        "estimatedCost": "$100 - $300",
        "urgency": "soon"
      }
    ],
    "recommendedActions": ["Do this", "Check that"]
  }
}

Do not include backticks or "json" tags. Just return the raw JSON object.`;

    // Build the text portion of the prompt (vehicle context, history, etc.)
    const textPrompt = this.buildAIPrompt(userMessage, context);

    // Build user message content — multimodal if image is present
    let userContent: OpenAI.Chat.ChatCompletionContentPart[] | string;

    if (context?.imageUrl && supportsVision) {
      userContent = [
        { type: 'text', text: textPrompt },
        {
          type: 'image_url',
          image_url: {
            url: context.imageUrl,
            detail: 'high',
          },
        },
      ];
    } else {
      let finalPrompt = textPrompt;
      if (context?.imageUrl && !supportsVision) {
          finalPrompt += `\n[Image URL provided but vision analysis is not supported by this AI model: ${context.imageUrl}]`;
      }
      userContent = finalPrompt;
    }

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
      });

      const messageContent = response.choices[0]?.message?.content;
      if (!messageContent) {
        throw new Error('Empty response from AI API');
      }

      let cleanContent = messageContent.trim();
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
      }
      cleanContent = cleanContent.trim();

      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(cleanContent);
      } catch (parseError) {
        console.warn('AI returned invalid JSON, wrapping in text fallback:', cleanContent);
        parsedResponse = {
          content: cleanContent,
          diagnosisResult: null
        };
      }

      return {
        content: parsedResponse.content || "I have analyzed your vehicle's issue, please review the diagnosis card.",
        diagnosisResult: parsedResponse.diagnosisResult,
      };
    } catch (error) {
      console.error(`AI API call failed (model: ${model}):`, error);
      throw error;
    }
  }

  /**
   * Build AI prompt with context
   */
  private buildAIPrompt(userMessage: string, context?: AIContext): string {
    let prompt = `You are an expert automotive mechanic AI assistant. Analyze the following car issue and provide a diagnosis.\n\n`;

    if (context?.vehicle) {
      const { make, model, year, mileage } = context.vehicle;
      prompt += `Vehicle: ${year} ${make} ${model} with ${mileage.toLocaleString()} miles\n`;
    }

    if (context?.maintenanceHistory && context.maintenanceHistory.length > 0) {
      prompt += `Recent maintenance:\n`;
      context.maintenanceHistory.forEach(record => {
        prompt += `- ${record.serviceType} at ${record.mileageAtService.toLocaleString()} miles on ${record.date}\n`;
      });
      prompt += '\n';
    }

    if (context?.recentMessages && context.recentMessages.length > 0) {
      prompt += `Recent conversation:\n`;
      context.recentMessages.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      prompt += '\n';
    }

    prompt += `Current issue: ${userMessage}\n\n`;

    if (context?.imageUrl) {
      prompt += `[User has attached an image of the vehicle issue for visual analysis]\n\n`;
    }

    prompt += `Please provide:\n1. A clear diagnosis explanation\n2. Likely causes (list 2-3 most probable)\n3. Recommended next steps\n4. Urgency level (low/medium/high)\n5. Estimated repair cost range if possible\n\n`;
    prompt += `Format the response in a helpful, structured way for a car owner.`;

    return prompt;
  }

  /**
   * Enable or disable real AI integration
   */
  setUseRealAI(useRealAI: boolean): void {
    this.useRealAI = useRealAI;
  }

  /**
   * Set OpenAI API key
   */
  setOpenAIApiKey(apiKey: string): void {
    this.openAIApiKey = apiKey;
    if (apiKey) {
      this.useRealAI = true;
    }
  }

  /**
   * Set Anthropic API key
   */
  setAnthropicApiKey(apiKey: string): void {
    this.anthropicApiKey = apiKey;
    if (apiKey && !this.openAIApiKey) {
      this.useRealAI = true;
    }
  }

  /**
   * Set DeepSeek API key
   */
  setDeepSeekApiKey(apiKey: string): void {
    this.deepseekApiKey = apiKey;
    if (apiKey && !this.openAIApiKey && !this.anthropicApiKey) {
      this.useRealAI = true;
    }
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();