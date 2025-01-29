import { askAI } from "../../services/ai";

export const Editor: React.FC<EditorProps> = () => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAskAI = async (question: string) => {
    try {
      setIsLoading(true);
      const response = await askAI({
        content: question,
        model: "deepseek" // 或其他模型
      });
      
      // 将AI回答添加到编辑器内容中
      setContent(prev => prev + "\n\nAI Response:\n" + response.answer);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      // 可以添加错误提示
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="editor-container">
      {/* ... existing code ... */}
      <div className="editor-toolbar">
        <button 
          onClick={() => handleAskAI(content)}
          disabled={isLoading}
          className="ai-button"
        >
          {isLoading ? "Thinking..." : "Ask AI"}
        </button>
        {/* ... other toolbar items ... */}
      </div>
      {/* ... existing code ... */}
    </div>
  );
}; 