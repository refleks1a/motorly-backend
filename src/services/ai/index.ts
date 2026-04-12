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
        // Try OpenAI first, then DeepSeek, then Anthropic
        if (this.openAIApiKey) {
          return await this.generateOpenAIResponse(userMessage, context);
        } else if (this.deepseekApiKey) {
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
   * Generate response using OpenAI GPT
   */
  private async generateOpenAIResponse(
    userMessage: string,
    context?: AIContext
  ): Promise<AIResponse> {
    const prompt = this.buildAIPrompt(userMessage, context);
    
    // In a real implementation, this would call the OpenAI API
    // For now, we'll simulate it and return a more sophisticated response
    console.log('OpenAI prompt:', prompt);
    
    // Use simulated service with enhanced context
    return this.simulatedService.generateDiagnosis(userMessage, context);
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
   * Generate response using DeepSeek
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

    const prompt = this.buildAIPrompt(userMessage, context);
    const systemPrompt = `You are a helpful automotive AI assistant. Your response must be in valid JSON format.
You must return a JSON object with this exact structure, with no markdown wrappers or additional text:
{
  "content": "A helpful conversational reply explaining the diagnosis...",
  "diagnosisResult": {
    "confidence": 0.85,
    "severity": "low", // must be exactly "low", "medium", or "high"
    "potentialIssues": [
      {
        "name": "Issue Name",
        "description": "Short explanation",
        "estimatedCost": "$100 - $300",
        "urgency": "soon" // must be "immediate", "soon", or "later"
      }
    ],
    "recommendedActions": ["Do this", "Check that"]
  }
}

Do not include backticks or "json" tags. Just return the raw JSON object.`;

    try {
      const response = await openai.chat.completions.create({
        model: this.deepseekModel || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      });

      const messageContent = response.choices[0]?.message?.content;
      if (!messageContent) {
        throw new Error('Empty response from DeepSeek API');
      }

      let cleanContent = messageContent.trim();
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
      }
      cleanContent = cleanContent.trim();

      const parsedResponse = JSON.parse(cleanContent);
      
      // Ensure the returned structure is correct, fallback content if necessary
      return {
        content: parsedResponse.content || "I have analyzed your vehicle's issue, please review the diagnosis card.",
        diagnosisResult: parsedResponse.diagnosisResult
      };

    } catch (error) {
      console.error('DeepSeek API call failed:', error);
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