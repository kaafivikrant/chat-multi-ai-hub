
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Message } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import GlassMorphicCard from "./ui-custom/GlassMorphicCard";

interface ChatMessageProps {
  message: Message;
  modelName?: string;
  isLastMessage?: boolean;
}

// Custom typing animation effect
const TypedContent = ({ content }: { content: string }) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    setDisplayedContent("");
    setIsTypingComplete(false);

    // Only animate for moderately sized messages
    const shouldAnimate = content.length < 500;
    
    if (!shouldAnimate) {
      setDisplayedContent(content);
      setIsTypingComplete(true);
      return;
    }

    const typingInterval = setInterval(() => {
      if (currentIndex < content.length) {
        setDisplayedContent(prev => prev + content[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTypingComplete(true);
      }
    }, 10); // Fast typing speed

    return () => clearInterval(typingInterval);
  }, [content]);

  // Replace newlines with br tags for proper display
  const formattedContent = displayedContent.split("\n").map((line, i) => (
    <span key={i}>
      {line}
      {i < displayedContent.split("\n").length - 1 && <br />}
    </span>
  ));

  return (
    <>
      {formattedContent}
      {!isTypingComplete && (
        <span className="inline-flex ml-1 opacity-70">▌</span>
      )}
    </>
  );
};

const ChatMessage = ({ message, modelName, isLastMessage = false }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const isError = message.status === "error";
  const isSending = message.status === "sending";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "mb-4 max-w-[85%] md:max-w-[75%]",
        isUser ? "ml-auto" : "mr-auto"
      )}
    >
      <GlassMorphicCard
        intensity={isUser ? "heavy" : "medium"}
        className={cn(
          "px-4 py-3",
          isUser 
            ? "bg-primary/10 dark:bg-primary/20 border-primary/20 dark:border-primary/30" 
            : "bg-white/60 dark:bg-gray-900/60 border-white/20 dark:border-gray-800/30",
          isError && "bg-destructive/10 border-destructive/20"
        )}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div 
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs",
                  isUser 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-accent text-accent-foreground"
                )}
              >
                {isUser ? "U" : "AI"}
              </div>
              <span className="text-sm font-medium">
                {isUser ? "You" : modelName || "Assistant"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          <div className={cn(
            "text-sm leading-relaxed",
            isError && "text-destructive"
          )}>
            {isSending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating response...</span>
              </div>
            ) : isLastMessage && !isUser && !isError ? (
              <TypedContent content={message.content} />
            ) : (
              message.content
            )}
          </div>
        </div>
      </GlassMorphicCard>
    </motion.div>
  );
};

export default ChatMessage;
