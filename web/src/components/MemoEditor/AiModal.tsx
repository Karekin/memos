import React, { useState } from "react";
import { Modal, Button, Input } from "@mui/joy";
import { LoaderIcon } from "lucide-react";

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: string) => Promise<void>;
}

const AiModal: React.FC<AiModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      await onSubmit(input);
      setInput("");
      onClose();
    } catch (error) {
      // 错误已经在 onSubmit 中处理
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg min-w-[300px]">
        <h2 className="text-xl font-medium mb-4">Ask AI</h2>
        <div className="space-y-4">
          <Input
            autoFocus
            multiline
            minRows={3}
            maxRows={5}
            placeholder="Enter your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
            disabled={isLoading}
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="plain" 
              color="neutral" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  Thinking...
                </>
              ) : (
                'Ask'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AiModal; 