import React, { useState } from "react";
import { Modal, Button, Input } from "@mui/joy";

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: string) => void;
}

const AiModal: React.FC<AiModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    onSubmit(input);
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="p-4">
        <h2>Ask AI</h2>
        <Input
          placeholder="Enter your question or upload an image"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button onClick={handleSubmit}>Submit</Button>
      </div>
    </Modal>
  );
};

export default AiModal; 