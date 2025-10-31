# OpenRouter Service Implementation Guide

This document provides a comprehensive plan for implementing the `OpenRouterService`, a TypeScript class designed to interact with the OpenRouter.ai API for chat completions.

## 1. Service Description

The `OpenRouterService` will act as a dedicated interface between the HealthyMeal application and the OpenRouter.ai API. Its primary responsibility is to abstract the complexity of making API calls for chat completions. It will handle request construction, authentication, secure API key management, and structured error handling, providing a simple and robust method for other parts of the application (like the `RecipeService`) to leverage LLM capabilities.

The service will be implemented as a singleton to ensure a single, efficient connection and configuration point for all OpenRouter interactions.

## 2. Constructor

The service will use a private constructor and a static `getInstance()` method to implement the singleton pattern. This prevents multiple instances and ensures that API credentials are initialized only once.

```typescript
// src/lib/services/openrouter.service.ts

class OpenRouterService {
  private static instance: OpenRouterService;
  private apiKey: string;
  private siteUrl: string;

  private constructor() {
    // Private constructor to prevent direct instantiation.
    this.apiKey = import.meta.env.OPENROUTER_API_KEY;
    this.siteUrl = import.meta.env.SITE_URL;

    if (!this.apiKey) {
      throw new Error("OpenRouter API key is not configured in environment variables.");
    }
    if (!this.siteUrl) {
        throw new Error("Site URL is not configured in environment variables.");
    }
  }

  public static getInstance(): OpenRouterService {
    if (!OpenRouterService.instance) {
      OpenRouterService.instance = new OpenRouterService();
    }
    return OpenRouterService.instance;
  }

  // ... methods
}
```

## 3. Public Methods and Fields

### `public async getChatCompletion<T>(params: ChatCompletionParams): Promise<T>`

This is the primary public method for the service. It sends a request to the OpenRouter API and returns a structured, typed response.

-   **`params`** (`ChatCompletionParams`): An object containing all necessary parameters for the API call.
    -   `model`: `string` - The name of the model to use (e.g., `"anthropic/claude-3.5-sonnet"`).
    -   `systemMessage`: `string` - The system prompt to guide the model's behavior.
    -   `userMessage`: `string` - The user's input or prompt.
    -   `responseFormat`: `ResponseFormat` - The schema for the expected JSON response.
    -   `temperature` (optional): `number` - Controls the randomness of the output.
    -   `maxTokens` (optional): `number` - The maximum number of tokens to generate.
-   **Returns**: `Promise<T>` - A promise that resolves to the parsed JSON content from the API response, typed according to the schema provided in `responseFormat`.

**Type Definitions:**

```typescript
// src/lib/services/openrouter.service.ts (or a shared types file)

export interface JsonSchema {
  name: string;
  strict?: boolean;
  schema: object;
}

export interface ResponseFormat {
  type: 'json_schema';
  json_schema: JsonSchema;
}

export interface ChatCompletionParams {
  model: string;
  systemMessage: string;
  userMessage: string;
  responseFormat: ResponseFormat;
  temperature?: number;
  maxTokens?: number;
}
```

## 4. Private Methods and Fields

### `private buildRequestPayload(params: ChatCompletionParams): object`

This helper method constructs the JSON payload for the OpenRouter API request.

-   **Functionality**:
    1.  Assembles the `messages` array with `system` and `user` roles.
    2.  Merges the `model`, `response_format`, and any other optional parameters (`temperature`, `max_tokens`) into a single request object.
    3.  Maps `maxTokens` to `max_tokens` and `responseFormat` to `response_format` to match the API's expected field names.

### `private async executeRequest<T>(payload: object): Promise<T>`

This method handles the actual `fetch` call to the API endpoint.

-   **Functionality**:
    1.  Sets the required HTTP headers:
        -   `Authorization`: `Bearer ${this.apiKey}`
        -   `HTTP-Referer`: `${this.siteUrl}`
        -   `Content-Type`: `application/json`
    2.  Sends the POST request to `https://openrouter.ai/api/v1/chat/completions`.
    3.  Checks the HTTP response status and throws a `ServiceUnavailableError` for non-200 responses.
    4.  Parses the JSON response body.
    5.  Extracts, parses, and returns the `content` from the first `choice`.

## 5. Error Handling

The service will implement robust error handling to manage API-specific issues, network failures, and invalid configurations.

1.  **Configuration Error**: The constructor will throw an `Error` if the `OPENROUTER_API_KEY` or `SITE_URL` environment variables are missing, preventing the service from being used in an invalid state.
2.  **API Errors (e.g., 4xx, 5xx)**: The `executeRequest` method will check `response.ok`. If the status indicates an error, it will parse the error details from the API response and throw a custom `ServiceUnavailableError` containing the status code and error message. This allows calling services to handle API failures gracefully.
3.  **Network Errors**: A `try...catch` block around the `fetch` call will catch network-related errors (e.g., DNS issues, timeouts) and re-throw them as a `ServiceUnavailableError` with a generic message.
4.  **Response Parsing Errors**: If the API returns a malformed JSON response or the `choices` array is empty, the service will throw an `Error` indicating a contract violation with the API.

## 6. Security Considerations

1.  **API Key Management**: The `OPENROUTER_API_KEY` must be stored exclusively in environment variables (`.env` file, ignored by Git) and accessed only on the server-side (`import.meta.env`). It must never be exposed to the client.
2.  **Input Sanitization**: While the service itself does not perform sanitization, the calling services (e.g., `RecipeService`) are responsible for ensuring that user-provided input passed to `userMessage` is sanitized to prevent prompt injection attacks.
3.  **HTTPS**: All communication with the OpenRouter API will be over HTTPS, enforced by the API endpoint URL.

## 7. Step-by-Step Implementation Plan

1.  **Create the Service File**:
    -   Create a new file at `src/lib/services/openrouter.service.ts`.

2.  **Define Environment Variables**:
    -   Add the following to your `.env` file (and `.env.example`):
        ```
        OPENROUTER_API_KEY="your_api_key_here"
        SITE_URL="http://localhost:4321" # Or your production domain
        ```

3.  **Implement the Singleton Pattern**:
    -   Define the `OpenRouterService` class.
    -   Add the `private static instance`, `private constructor`, and `public static getInstance` method as described in Section 2.
    -   In the constructor, load and validate the presence of `OPENROUTER_API_KEY` and `SITE_URL`.

4.  **Define Public Types**:
    -   Add the `JsonSchema`, `ResponseFormat`, and `ChatCompletionParams` interfaces inside the service file or a shared types file.

5.  **Implement the `getChatCompletion` Method**:
    -   This public method will orchestrate the private helpers.
    -   It should call `buildRequestPayload` to create the request body.
    -   It should then pass the result to `executeRequest` to get the final, parsed response.
    -   Wrap the calls in a `try...catch` block to handle potential errors gracefully.

6.  **Implement the `buildRequestPayload` Method**:
    -   This private method takes `ChatCompletionParams` and returns the final payload object.
    -   **Example Implementation**:
        ```typescript
        private buildRequestPayload(params: ChatCompletionParams): object {
          const payload: any = {
            model: params.model,
            messages: [
              { role: 'system', content: params.systemMessage },
              { role: 'user', content: params.userMessage },
            ],
            response_format: params.responseFormat,
          };

          if (params.temperature) {
            payload.temperature = params.temperature;
          }
          if (params.maxTokens) {
            payload.max_tokens = params.maxTokens;
          }

          return payload;
        }
        ```

7.  **Implement the `executeRequest` Method**:
    -   This private, async method will contain the `fetch` logic.
    -   Set the headers as specified in Section 4.
    -   Perform the `POST` request.
    -   Implement error handling for non-successful HTTP status codes.
    -   Parse the response and return `JSON.parse(response.choices[0].message.content)`.

8.  **Integrate with a Calling Service (Example)**:
    -   In another service, such as `RecipeService`, obtain an instance of the `OpenRouterService` and use it.
    -   **Example Usage**:
        ```typescript
        // In a hypothetical recipe analysis function
        import { OpenRouterService, ResponseFormat } from './openrouter.service';

        interface RecipeAnalysis {
          isHealthy: boolean;
          suggestions: string[];
        }

        const analysisSchema = {
            type: 'object',
            properties: {
                isHealthy: { type: 'boolean' },
                suggestions: { type: 'array', items: { type: 'string' } },
            },
            required: ['isHealthy', 'suggestions'],
        };

        const responseFormat: ResponseFormat = {
          type: 'json_schema',
          json_schema: {
            name: 'recipe_analysis',
            strict: true,
            schema: analysisSchema,
          },
        };

        try {
          const openRouter = OpenRouterService.getInstance();
          const analysisResult = await openRouter.getChatCompletion<RecipeAnalysis>({
            model: 'anthropic/claude-3.5-sonnet',
            systemMessage: 'Analyze the following recipe for healthiness...',
            userMessage: 'Recipe: ...',
            responseFormat: responseFormat,
          });
          // Now `analysisResult` is a fully typed `RecipeAnalysis` object.
          console.log(analysisResult.isHealthy);
        } catch (error) {
          // Handle ServiceUnavailableError or other errors
          console.error("Failed to analyze recipe:", error);
        }
        ```
This plan provides a clear path to creating a reusable, secure, and robust service for all OpenRouter.ai interactions within the application.

