
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { 
  AIModel, 
  Message, 
  ChatSession, 
  fetchAvailableModels, 
  sendMessageToAI, 
  storeChatSession, 
  getChatSessions, 
  getChatSessionById,
  deleteChatSession,
  getPreferredModel,
  setPreferredModel,
  getApiKey,
  setApiKey,
  removeApiKey
} from "@/lib/api";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";

interface ChatContextType {
  // API Key
  apiKey: string | null;
  setUserApiKey: (key: string) => void;
  removeUserApiKey: () => void;
  hasApiKey: boolean;
  
  // Models
  availableModels: AIModel[];
  selectedModelId: string;
  isLoadingModels: boolean;
  refreshModels: () => Promise<void>;
  selectModel: (modelId: string) => void;
  getSelectedModel: () => AIModel | undefined;
  
  // Chat sessions
  currentSession: ChatSession | null;
  chatSessions: ChatSession[];
  createNewSession: () => Promise<string>;
  loadSession: (sessionId: string) => Promise<boolean>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  
  // Messages
  messages: Message[];
  isProcessing: boolean;
  sendMessage: (content: string) => Promise<void>;
}

export const ChatContext = createContext<ChatContextType | null>(null);

export const DEFAULT_MODEL_ID = "openai/gpt-3.5-turbo";

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  
  // API Key state
  const [apiKey, setApiKey] = useState<string | null>(getApiKey());
  
  // Models state
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>(getPreferredModel() || DEFAULT_MODEL_ID);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  
  // Chat sessions state
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  
  // Messages state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Set API key
  const setUserApiKey = useCallback((key: string) => {
    setApiKey(key);
    toast.success("API key saved successfully");
    
    // Refresh models immediately after setting the API key
    refreshModels();
  }, []);
  
  // Remove API key
  const removeUserApiKey = useCallback(() => {
    removeApiKey();
    setApiKey(null);
    setAvailableModels([]);
    toast.info("API key removed");
  }, []);

  // Check if API key exists
  const hasApiKey = Boolean(apiKey);

  // Fetch available models
  const refreshModels = useCallback(async () => {
    if (!hasApiKey) {
      setIsLoadingModels(false);
      return;
    }
    
    setIsLoadingModels(true);
    try {
      const models = await fetchAvailableModels();
      
      if (models.length > 0) {
        setAvailableModels(models);
        
        // If current selected model is not in the list, reset to default
        if (!models.some(model => model.id === selectedModelId)) {
          const preferredModel = getPreferredModel();
          // Use preferred model if it exists in the models list
          if (preferredModel && models.some(model => model.id === preferredModel)) {
            setSelectedModelId(preferredModel);
          } else {
            // Otherwise default to OpenAI model if available, or first model in the list
            const openAiModel = models.find(model => model.id.includes("openai"));
            setSelectedModelId(openAiModel?.id || models[0].id);
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing models:", error);
      toast.error("Failed to fetch available AI models");
    } finally {
      setIsLoadingModels(false);
    }
  }, [selectedModelId, hasApiKey]);

  // Select a different model
  const selectModel = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
    setPreferredModel(modelId);
    
    // Update current session if it exists
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        modelId,
        updatedAt: Date.now()
      };
      setCurrentSession(updatedSession);
      storeChatSession(updatedSession);
    }
  }, [currentSession]);

  // Get the selected model object
  const getSelectedModel = useCallback(() => {
    return availableModels.find(model => model.id === selectedModelId);
  }, [availableModels, selectedModelId]);

  // Create a new chat session
  const createNewSession = useCallback(async () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: "New Conversation",
      messages: [],
      modelId: selectedModelId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    setCurrentSession(newSession);
    setMessages([]);
    storeChatSession(newSession);
    
    // Update sessions list
    const allSessions = getChatSessions();
    setChatSessions(allSessions);
    
    return newSession.id;
  }, [selectedModelId]);

  // Load an existing chat session
  const loadSession = useCallback(async (sessionId: string) => {
    const session = getChatSessionById(sessionId);
    
    if (session) {
      setCurrentSession(session);
      setMessages(session.messages);
      setSelectedModelId(session.modelId);
      return true;
    } else {
      toast.error("Chat session not found");
      return false;
    }
  }, []);

  // Delete a chat session
  const deleteSession = useCallback(async (sessionId: string) => {
    const success = deleteChatSession(sessionId);
    
    if (success) {
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
        navigate("/");
      }
      
      // Update sessions list
      const allSessions = getChatSessions();
      setChatSessions(allSessions);
      return true;
    } else {
      toast.error("Failed to delete chat session");
      return false;
    }
  }, [currentSession, navigate]);

  // Send a message to the selected AI model
  const sendMessage = useCallback(async (content: string) => {
    if (!hasApiKey) {
      toast.error("Please set your OpenRouter API key first");
      return;
    }
    
    // Create user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };
    
    // Create AI message placeholder
    const aiMessagePlaceholder: Message = {
      id: `ai_${Date.now()}`,
      role: "assistant",
      content: "",
      modelId: selectedModelId,
      timestamp: Date.now(),
      status: "sending",
    };
    
    // Update messages UI immediately
    const updatedMessages = [...messages, userMessage, aiMessagePlaceholder];
    setMessages(updatedMessages);
    setIsProcessing(true);
    
    try {
      // Send the message to the AI
      const messageHistory = [...messages, userMessage];
      
      // Update session with user message before sending to API
      let sessionToUpdate = currentSession;
      
      if (!sessionToUpdate) {
        // Create a new session if needed
        const sessionId = await createNewSession();
        sessionToUpdate = getChatSessionById(sessionId) || {
          id: sessionId,
          title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
          messages: [],
          modelId: selectedModelId,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      }
      
      // Update session with user message
      sessionToUpdate = {
        ...sessionToUpdate,
        messages: [...(sessionToUpdate.messages || []), userMessage],
        updatedAt: Date.now(),
        // Update title for new sessions
        title: sessionToUpdate.messages.length === 0 
          ? content.slice(0, 30) + (content.length > 30 ? "..." : "") 
          : sessionToUpdate.title
      };
      
      setCurrentSession(sessionToUpdate);
      storeChatSession(sessionToUpdate);
      
      // Actually send message to AI
      const aiResponse = await sendMessageToAI(selectedModelId, messageHistory);
      
      // Replace placeholder with actual response
      const finalMessages = updatedMessages.map(msg => 
        msg.id === aiMessagePlaceholder.id ? aiResponse : msg
      );
      
      setMessages(finalMessages);
      
      // Update session with AI response
      const finalSession = {
        ...sessionToUpdate,
        messages: finalMessages,
        updatedAt: Date.now()
      };
      
      setCurrentSession(finalSession);
      storeChatSession(finalSession);
      
      // Update sessions list
      setChatSessions(getChatSessions());
      
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Update placeholder with error
      const errorMessage = {
        ...aiMessagePlaceholder,
        content: "Failed to get a response. Please try again or select a different model.",
        status: "error" as const
      };
      
      const finalMessages = updatedMessages.map(msg => 
        msg.id === aiMessagePlaceholder.id ? errorMessage : msg
      );
      
      setMessages(finalMessages);
      
      // Still update the session
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          messages: finalMessages,
          updatedAt: Date.now()
        };
        
        setCurrentSession(updatedSession);
        storeChatSession(updatedSession);
      }
      
    } finally {
      setIsProcessing(false);
    }
  }, [messages, selectedModelId, currentSession, createNewSession, hasApiKey]);

  // Load sessions on initial mount
  useEffect(() => {
    const allSessions = getChatSessions();
    setChatSessions(allSessions);
  }, []);

  // Fetch available models on initial mount and when API key changes
  useEffect(() => {
    if (hasApiKey) {
      refreshModels();
      
      // Set up periodic refresh (every 5 minutes)
      const refreshInterval = setInterval(() => {
        refreshModels();
      }, 5 * 60 * 1000);
      
      return () => clearInterval(refreshInterval);
    }
  }, [refreshModels, hasApiKey]);

  // Load session if sessionId is present in URL
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  const contextValue: ChatContextType = {
    apiKey,
    setUserApiKey,
    removeUserApiKey,
    hasApiKey,
    
    availableModels,
    selectedModelId,
    isLoadingModels,
    refreshModels,
    selectModel,
    getSelectedModel,
    
    currentSession,
    chatSessions,
    createNewSession,
    loadSession,
    deleteSession,
    
    messages,
    isProcessing,
    sendMessage,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
