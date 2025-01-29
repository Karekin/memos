import { request } from "../utils/request";

export interface AskAIRequest {
  content: string;
  model?: string; // 可选的模型参数，如 'deepseek' 等
}

export interface AskAIResponse {
  answer: string;
}

export const askAI = async (params: AskAIRequest): Promise<AskAIResponse> => {
  return request({
    url: "/api/ai/chat",
    method: "POST",
    data: {
      question: params.content,
      model: params.model
    },
  });
}; 