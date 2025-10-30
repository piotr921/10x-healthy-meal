/**
 * Type definitions for OpenRouter API integration
 * These types define the structure of requests and responses for the OpenRouter.ai API
 */

// ============================================
// AI Model Configuration
// ============================================

/**
 * The only supported AI model for this application
 * DeepSeek R1 - Free tier model with strong reasoning capabilities
 */
export const AI_MODEL = 'deepseek/deepseek-r1:free' as const;

// ============================================
// Type Definitions
// ============================================

/**
 * JSON Schema definition for structured responses
 */
export interface JsonSchema {
  name: string;
  strict?: boolean;
  schema: object;
}

/**
 * Response format configuration for OpenRouter API
 */
export interface ResponseFormat {
  type: 'json_schema';
  json_schema: JsonSchema;
}

/**
 * Parameters for chat completion requests
 */
export interface ChatCompletionParams {
  systemMessage: string;
  userMessage: string;
  responseFormat: ResponseFormat;
  temperature?: number;
  maxTokens?: number;
}

