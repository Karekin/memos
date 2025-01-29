import { useState } from "react";
import { cn } from "@/utils/utils";

interface AIState {
  loading: boolean;
  answer: string;
  error: string;
}

export const AIChatBox: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [aiState, setAIState] = useState<AIState>({
    loading: false,
    answer: "",
    error: "",
  });

  const handleSubmit = async () => {
    if (!question.trim()) {
      return;
    }

    console.log("Starting request...");
    setAIState(prev => ({ ...prev, loading: true, error: "" }));

    try {
      console.log("Preparing to send request to:", '/api/ai/chat');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log("Received response data:", data);
      
      if (data.error) {
        setAIState(prev => ({
          ...prev,
          loading: false,
          error: data.error,
        }));
        return;
      }

      setAIState(prev => ({
        ...prev,
        loading: false,
        answer: data.answer,
      }));
    } catch (error) {
      console.error("Request failed:", error);
      setAIState(prev => ({
        ...prev,
        loading: false,
        error: typeof error === 'string' ? error : error instanceof Error ? error.message : "请求失败，请稍后重试",
      }));
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="请输入您的问题..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={handleSubmit}
          disabled={aiState.loading}
          className={cn(
            "px-4 py-2 rounded-md text-white",
            aiState.loading 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-500 hover:bg-blue-600"
          )}
        >
          {aiState.loading ? "请求中..." : "提交"}
        </button>
      </div>

      {aiState.error && (
        <div className="mt-2 text-red-500">
          {aiState.error}
        </div>
      )}

      {aiState.answer && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md">
          {aiState.answer}
        </div>
      )}
    </div>
  );
};

export default AIChatBox; 