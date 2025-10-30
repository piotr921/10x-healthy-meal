/**
 * OpenRouterService - A singleton service for interacting with the OpenRouter.ai API
 *
 * This service provides a structured interface for making chat completion requests
 * to the OpenRouter API with proper authentication, error handling, and type safety.
 */

import type { ChatCompletionParams } from './openrouter.types';
import { ModelPresets } from './openrouter.types';

// ============================================
// OpenRouterService Class
// ============================================

export class OpenRouterService {
  private static instance: OpenRouterService;
  private readonly apiKey: string;
  private readonly siteUrl: string;
  private readonly defaultModel: string;
  private readonly apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';

  /**
   * Private constructor to enforce singleton pattern
   * Validates required environment variables on initialization
   * @throws Error if OPENROUTER_API_KEY or SITE_URL are not configured
   */
  private constructor() {
    this.apiKey = import.meta.env.OPENROUTER_API_KEY;
    this.siteUrl = import.meta.env.SITE_URL;
    this.defaultModel = import.meta.env.OPENROUTER_DEFAULT_MODEL || ModelPresets.DEFAULT;

    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured in environment variables.');
    }
    if (!this.siteUrl) {
      throw new Error('Site URL is not configured in environment variables.');
    }
  }

  /**
   * Gets the singleton instance of OpenRouterService
   * Creates a new instance if one doesn't exist
   * @returns OpenRouterService instance
   */
  public static getInstance(): OpenRouterService {
    if (!OpenRouterService.instance) {
      OpenRouterService.instance = new OpenRouterService();
    }
    return OpenRouterService.instance;
  }

  /**
   * Sends a chat completion request to OpenRouter API
   * @param params - Chat completion parameters including model, messages, and response format
   * @returns Promise resolving to the parsed JSON response of type T
   * @throws Error if API call fails or response is malformed
   */
  public async getChatCompletion<T>(params: ChatCompletionParams): Promise<T> {
    try {
      const payload = this.buildRequestPayload(params);
      return await this.executeRequest<T>(payload);
    } catch (error) {
      // Re-throw errors with context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred during chat completion request');
    }
  }

  /**
   * Builds the request payload for OpenRouter API
   * @param params - Chat completion parameters
   * @returns Formatted request payload object
   */
  private buildRequestPayload(params: ChatCompletionParams): object {
    const payload: any = {
      model: params.model || this.defaultModel,
      messages: [
        { role: 'system', content: params.systemMessage },
        { role: 'user', content: params.userMessage },
      ],
      response_format: params.responseFormat,
    };

    if (params.temperature !== undefined) {
      payload.temperature = params.temperature;
    }
    if (params.maxTokens !== undefined) {
      payload.max_tokens = params.maxTokens;
    }

    return payload;
  }

  /**
   * Gets the currently configured default model
   * @returns The default model identifier
   */
  public getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Executes the HTTP request to OpenRouter API
   * @param payload - Request payload
   * @returns Promise resolving to the parsed response content
   * @throws Error if HTTP request fails or response is invalid
   */
  private async executeRequest<T>(payload: object): Promise<T> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.siteUrl,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Handle non-successful responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error?.message || errorData.error || 'API request failed';
        throw new Error(`OpenRouter API error (${response.status}): ${errorMessage}`);
      }

      // Parse response body
      const responseData = await response.json();

      // Validate response structure
      if (!responseData.choices || responseData.choices.length === 0) {
        throw new Error('Invalid API response: missing choices array');
      }

      const messageContent = responseData.choices[0]?.message?.content;
      if (!messageContent) {
        throw new Error('Invalid API response: missing message content');
      }

      // Parse and return the JSON content
      try {
        return JSON.parse(messageContent) as T;
      } catch (parseError) {
        throw new Error(`Failed to parse API response content: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to OpenRouter API');
      }
      // Re-throw other errors
      throw error;
    }
  }
}

