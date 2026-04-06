import { SimulatedAIService } from './simulated.service';
import { AIResponse, AIContext } from './types';

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
    this.deepseekBaseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
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
    const prompt = this.buildAIPrompt(userMessage, context);
    
    // In a real implementation, this would call the DeepSeek API
    // For now, we'll simulate it
    console.log('DeepSeek prompt:', prompt);
    
    return this.simulatedService.generateDiagnosis(userMessage, context);
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