import { httpClient } from '../../core/HttpClient';

export type AIProvider = 'ollama' | 'openai' | 'gemini';

export interface OllamaConfig {
  host: string;
  model: string;
}

export interface OpenAIConfig {
  api_key: string;
  model: string;
  base_url?: string;
}

export interface GeminiConfig {
  api_key: string;
  model: string;
}

export interface AIConfig {
  provider: AIProvider;
  ollama: OllamaConfig;
  openai: OpenAIConfig;
  gemini: GeminiConfig;
  prompt_override: string;
}

export const aiConfigService = {
  getConfig: async (): Promise<AIConfig> => {
    return httpClient.get<AIConfig>('/ai/config');
  },

  saveConfig: async (updates: Partial<AIConfig>): Promise<{ message: string }> => {
    return httpClient.post<{ message: string }>('/ai/config', updates);
  },
};
