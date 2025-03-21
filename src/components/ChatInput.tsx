
import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
  placeholder?: string;
  className?: string;
}

const ChatInput = ({ 
  onSendMessage, 
  isProcessing = false, 
  placeholder = "Type a message...",
  className 
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200); // Max height of 200px
      textarea.style.height = `${newHeight}px`;
    };

    textarea.addEventListener('input', adjustHeight);
    adjustHeight(); // Initial adjustment

    return () => {
      textarea.removeEventListener('input', adjustHeight);
    };
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !isProcessing) {
      onSendMessage(message.trim());
      setMessage("");
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn(
      "flex items-end gap-2 w-full", 
      "bg-white/50 dark:bg-gray-900/50 backdrop-blur-md",
      "border border-white/20 dark:border-gray-800/30",
      "p-2 rounded-lg shadow-soft",
      className
    )}>
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isProcessing}
        className={cn(
          "min-h-[50px] max-h-[200px] resize-none",
          "bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0",
          "shadow-none"
        )}
      />
      
      <Button
        onClick={handleSubmit}
        disabled={!message.trim() || isProcessing}
        size="icon"
        className={cn(
          "shrink-0 h-10 w-10 rounded-full transition-all",
          !message.trim() ? "opacity-50" : "opacity-100"
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default ChatInput;
