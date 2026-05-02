import { SimulatedAIService } from './simulated.service';
import { AIResponse, AIContext } from './types';
import OpenAI from 'openai';
import { motorlyTools } from './tools/definitions';
import { executeToolCall } from './tools/executor';

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
   * Supports vision AND agentic tool calling.
   *
   * Tool-use loop:
   *   1. Send messages + tool definitions to the LLM.
   *   2. If the model calls one or more tools, execute them and append results.
   *   3. Call the LLM again with the updated message history.
   *   4. Repeat up to MAX_TOOL_ITERATIONS times, then force a final answer.
   */
  private async callOpenAICompatibleModel(
    client: OpenAI,
    model: string,
    userMessage: string,
    context?: AIContext,
    supportsVision: boolean = false
  ): Promise<AIResponse> {
    const MAX_TOOL_ITERATIONS = 5;

    const systemPrompt = `You are a helpful automotive AI assistant. Your FINAL response (after using any tools) must be in valid JSON format.
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
  },
  "clarificationQuestion": null,
  "suggestedReplies": []
}

IMPORTANT BREVITY RULES:
- Match your response length to the user's intent. Short conversational messages (e.g. "thanks", "that was helpful", "ok", "got it") must get short, direct replies — one sentence maximum. Never summarize the conversation unless explicitly asked.
- Never volunteer information the user did not ask for. Do not recap previous diagnoses or list action items unless the user asks.
- Only produce a detailed "diagnosisResult" when the user is actually asking about a vehicle problem. For general conversation, set "diagnosisResult" to null.

IMPORTANT CLARIFICATION RULES:
- If the user's message is too vague to diagnose (e.g. "my car has a problem", "something is wrong"), you MUST ask a clarifying question instead of guessing.
- When asking for clarification: set "content" to your question, set "clarificationQuestion" to the same question text, set "suggestedReplies" to 3-4 short tappable answer options (e.g. ["When braking", "While idling", "During acceleration", "All the time"]), and set "diagnosisResult" to null.
- When you have enough information to diagnose: set "clarificationQuestion" to null, set "suggestedReplies" to [], and populate "diagnosisResult" normally.
- Do not include backticks or "json" tags. Just return the raw JSON object.
You have access to tools to look up real vehicle data — use them when they would improve your diagnosis.`;

    // Build the text portion of the prompt (vehicle context, history, etc.)
    const textPrompt = this.buildAIPrompt(userMessage, context);

    // Build user message content — multimodal if image is present and model supports vision
    let userContent: OpenAI.Chat.ChatCompletionContentPart[] | string;
    if (context?.imageUrl && supportsVision) {
      userContent = [
        { type: 'text', text: textPrompt },
        {
          type: 'image_url',
          image_url: { url: context.imageUrl, detail: 'high' }
        }
      ];
    } else {
      let finalPrompt = textPrompt;
      if (context?.imageUrl && !supportsVision) {
        finalPrompt += `\n[Image URL provided but vision analysis is not supported by this model: ${context.imageUrl}]`;
      }
      userContent = finalPrompt;
    }

    // Build the message history for the tool-use loop
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ];

    // Tool execution context — used to scope DB queries to the current user
    const toolContext = {
      userId: context?.userId ?? '',
      vehicleId: context?.vehicleId
    };

    // ── Tool-use loop ──────────────────────────────────────────────────────
    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const isLastIteration = iteration === MAX_TOOL_ITERATIONS - 1;
      const shouldDisableTools = isLastIteration || context?.useAgent === false;

      try {
        const response = await client.chat.completions.create({
          model,
          messages,
          // Only provide tools if we are allowed to use them
          tools: context?.useAgent === false ? undefined : motorlyTools,
          tool_choice: shouldDisableTools ? 'none' : 'auto',
          response_format: { type: 'json_object' }
        });

        const choice = response.choices[0];
        const finishReason = choice?.finish_reason;
        const assistantMessage = choice?.message;

        if (!assistantMessage) {
          throw new Error('Empty response from AI API');
        }

        // Append the assistant's message (tool calls or final answer) to history
        messages.push(assistantMessage as OpenAI.Chat.ChatCompletionMessageParam);

        // ── Case 1: model wants to call tools ─────────────────────────────
        if (finishReason === 'tool_calls' && assistantMessage.tool_calls?.length) {
          console.log(`[AI Agent] Iteration ${iteration + 1}: executing ${assistantMessage.tool_calls.length} tool(s)`);

          // Execute all requested tool calls (can be parallel)
          // Filter to standard 'function' type calls — SDK union includes custom tool call types
          const functionToolCalls = assistantMessage.tool_calls.filter(
            (tc): tc is OpenAI.Chat.ChatCompletionMessageToolCall & { type: 'function'; function: { name: string; arguments: string } } =>
              tc.type === 'function'
          );

          const toolResults = await Promise.all(
            functionToolCalls.map(async (toolCall) => {
              let args: Record<string, any> = {};
              try {
                args = JSON.parse(toolCall.function.arguments);
              } catch {
                args = {};
              }
              const result = await executeToolCall(
                toolCall.function.name,
                args,
                toolContext
              );
              return { toolCallId: toolCall.id, name: toolCall.function.name, result };
            })
          );

          // Append each tool result as a 'tool' role message
          for (const { toolCallId, result } of toolResults) {
            messages.push({
              role: 'tool',
              tool_call_id: toolCallId,
              content: JSON.stringify(result)
            });
          }

          // Continue the loop — call the LLM again with tool results in context
          continue;
        }

        // ── Case 2: model has a final answer ──────────────────────────────
        if (finishReason === 'stop' || finishReason === 'length' || !assistantMessage.tool_calls) {
          const messageContent = assistantMessage.content;
          if (!messageContent) {
            throw new Error('Empty final response from AI API');
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
            console.warn('[AI Agent] Final response is not valid JSON, wrapping:', cleanContent.slice(0, 200));
            parsedResponse = { content: cleanContent, diagnosisResult: null };
          }

          return {
            content: parsedResponse.content ?? "I have analyzed your vehicle's issue. Please review the diagnosis.",
            diagnosisResult: parsedResponse.diagnosisResult ?? undefined,
            clarificationQuestion: parsedResponse.clarificationQuestion ?? undefined,
            suggestedReplies: Array.isArray(parsedResponse.suggestedReplies) && parsedResponse.suggestedReplies.length > 0
              ? parsedResponse.suggestedReplies
              : undefined,
          };
        }

        // Unexpected finish reason — break out
        console.warn(`[AI Agent] Unexpected finish_reason: ${finishReason}`);
        break;
      } catch (error) {
        console.error(`[AI Agent] Error in iteration ${iteration + 1} (model: ${model}):`, error);
        throw error;
      }
    }

    throw new Error('AI agent tool-use loop exhausted without producing a final answer.');
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