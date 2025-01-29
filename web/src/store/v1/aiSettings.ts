import { create } from 'zustand';

interface AISettings {
  apiProvider: string;
  timeout: number;
  maxTokens: number;
  temperature: number;
  maxContext: number;
  model: string;
  apiKey: string;
  proxy: string;
  apiBaseUrl: string;
  userAgent: string;
}

interface AISettingsStore {
  settings: AISettings;
  updateSettings: (settings: Partial<AISettings>) => void;
}

export const useAISettingsStore = create<AISettingsStore>((set) => ({
  settings: {
    apiProvider: 'OpenAI',
    timeout: 30,
    maxTokens: 0,
    temperature: 1.3,
    maxContext: 7,
    model: 'deepseek-chat',
    apiKey: '',
    proxy: '',
    apiBaseUrl: 'https://api.deepseek.com/v1/',
    userAgent: 'SiYuan/3.1.20 std/darwin',
  },
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
})); 