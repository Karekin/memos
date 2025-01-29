import { request } from "../utils/request";
import { useAISettingsStore } from "@/store/v1/aiSettings";

export interface AskAIRequest {
  content: string;
  model?: string; // 可选的模型参数，如 'deepseek' 等
}

export interface AskAIResponse {
  answer: string;
}

export const askAI = async (params: AskAIRequest): Promise<AskAIResponse> => {
  const settings = useAISettingsStore.getState().settings;
  
  return request({
    url: "/api/ai/chat",
    method: "POST",
    data: {
      question: params.content,
      settings: settings
    },
  });
}; 