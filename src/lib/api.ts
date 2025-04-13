
import { toast } from "sonner";
import { debugLog, debugError, debugWarn } from "./debug";

export interface AIModel {
  id: string;
  name: string;
  description?: string;
  provider: string;
  providerName?: string;
  iconUrl?: string;
  contextLength?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  modelId?: string;
  timestamp: number;
  status?: "sending" | "complete" | "error";
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  createdAt: number;
  updatedAt: number;
}

// API URL management
export function getOllamaUrl(): string {
  const url = localStorage.getItem("ollama_url") || "http://localhost:11434";
  debugLog("API", "Retrieved Ollama URL from storage", { url });
  return url;
}

export function setOllamaUrl(url: string): void {
  debugLog("API", "Setting Ollama URL in storage", { url });
  localStorage.setItem("ollama_url", url);
}

// For backward compatibility - these will be removed in future versions
export function getApiKey(): string | null {
  return null;
}

export function setApiKey(apiKey: string): void {
  debugWarn("API", "Setting API key is deprecated. Using Ollama URL instead.");
}

export function removeApiKey(): void {
  debugWarn("API", "Removing API key is deprecated. Using Ollama URL instead.");
}

// Ollama API interaction
export const DEFAULT_MODEL_ID = "llama3";

// Function to fetch available models from Ollama
export async function fetchAvailableModels(): Promise<AIModel[]> {
  const ollamaUrl = getOllamaUrl();
  
  try {
    debugLog("API", "Fetching models from Ollama", { apiUrl: `${ollamaUrl}/api/tags` });
    
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    debugLog("API", "Ollama models response status", { status: response.status, ok: response.ok });

    if (!response.ok) {
      const errorText = await response.text();
      debugError("API", "Failed to fetch models from Ollama", errorText);
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    debugLog("API", "Successfully fetched models data", { 
      modelCount: data.models?.length || 0,
      firstModel: data.models?.length > 0 ? data.models[0].name : null
    });
    
    // Transform the response into our AIModel format
    const transformedModels = data.models?.map((model: any) => ({
      id: model.name,
      name: model.name,
      description: `Ollama model: ${model.name}`,
      provider: "ollama",
      providerName: "Ollama",
      iconUrl: getProviderIcon("ollama"),
      contextLength: model.details?.context_length || 4096,
      pricing: {
        prompt: "Local",
        completion: "Local"
      }
    })) || [];

    debugLog("API", "Transformed models data", { 
      modelCount: transformedModels.length,
      modelIds: transformedModels.map(m => m.id)
    });
    
    return transformedModels;
  } catch (error) {
    debugError("API", "Error fetching models from Ollama", error);
    console.error("Error fetching models:", error);
    toast.error("Failed to fetch AI models. Please check your Ollama server URL and make sure Ollama is running.");
    return [];
  }
}

// Function to send a message to the AI model
export async function sendMessageToAI(modelId: string, messages: Message[]): Promise<Message> {
  const ollamaUrl = getOllamaUrl();
  
  try {
    // Format messages for the API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    debugLog("API", "Sending message to AI", { 
      modelId, 
      messageCount: messages.length,
      endpoint: `${ollamaUrl}/api/chat`
    });

    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: formattedMessages,
        stream: false
      }),
    });

    debugLog("API", "AI response status", { status: response.status, ok: response.ok });

    if (!response.ok) {
      const errorText = await response.text();
      debugError("API", "AI response error", errorText);
      throw new Error(`AI response error: ${response.statusText}`);
    }

    const data = await response.json();
    debugLog("API", "Received AI response", { 
      model: data.model,
      responseLength: data.message?.content?.length || 0
    });

    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: data.message?.content || "No response content",
      modelId: modelId,
      timestamp: Date.now(),
      status: "complete",
    };
  } catch (error) {
    debugError("API", "Error sending message to AI", error);
    console.error("Error sending message to AI:", error);
    toast.error("Failed to get AI response. Please try again.");
    return {
      id: `error_${Date.now()}`,
      role: "assistant",
      content: "I'm sorry, I encountered an error while processing your request. Please make sure your Ollama server is running and try again.",
      modelId: modelId,
      timestamp: Date.now(),
      status: "error",
    };
  }
}

// Store chat session in localStorage
export function storeChatSession(session: ChatSession): void {
  try {
    debugLog("Storage", "Storing chat session", { sessionId: session.id, messageCount: session.messages.length });
    const sessions = getChatSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    localStorage.setItem("chat_sessions", JSON.stringify(sessions));
    debugLog("Storage", "Chat session stored successfully", { sessionCount: sessions.length });
  } catch (error) {
    debugError("Storage", "Error storing chat session", error);
    console.error("Error storing chat session:", error);
    toast.error("Failed to save chat session");
  }
}

// Get all chat sessions from localStorage
export function getChatSessions(): ChatSession[] {
  try {
    const sessionsString = localStorage.getItem("chat_sessions");
    const sessions = sessionsString ? JSON.parse(sessionsString) : [];
    debugLog("Storage", "Retrieved chat sessions", { sessionCount: sessions.length });
    return sessions;
  } catch (error) {
    debugError("Storage", "Error retrieving chat sessions", error);
    console.error("Error retrieving chat sessions:", error);
    return [];
  }
}

// Get a specific chat session by ID
export function getChatSessionById(sessionId: string): ChatSession | null {
  try {
    debugLog("Storage", "Retrieving chat session by ID", { sessionId });
    const sessions = getChatSessions();
    const session = sessions.find(session => session.id === sessionId) || null;
    debugLog("Storage", "Chat session retrieval result", { found: session !== null });
    return session;
  } catch (error) {
    debugError("Storage", "Error retrieving chat session", error);
    console.error("Error retrieving chat session:", error);
    return null;
  }
}

// Delete a chat session
export function deleteChatSession(sessionId: string): boolean {
  try {
    debugLog("Storage", "Deleting chat session", { sessionId });
    const sessions = getChatSessions();
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    localStorage.setItem("chat_sessions", JSON.stringify(updatedSessions));
    debugLog("Storage", "Chat session deleted successfully", { 
      originalCount: sessions.length, 
      newCount: updatedSessions.length
    });
    return true;
  } catch (error) {
    debugError("Storage", "Error deleting chat session", error);
    console.error("Error deleting chat session:", error);
    return false;
  }
}

// Set the user's preferred model
export function setPreferredModel(modelId: string): void {
  debugLog("Storage", "Setting preferred model", { modelId });
  localStorage.setItem("preferred_model_id", modelId);
}

// Get the user's preferred model
export function getPreferredModel(): string | null {
  const modelId = localStorage.getItem("preferred_model_id");
  debugLog("Storage", "Retrieved preferred model", { modelId });
  return modelId;
}

// Helper function for provider information
function getProviderIcon(providerId: string): string {
  if (providerId === "ollama") {
    return "https://ollama.com/public/ollama.png";
  }
  
  return `https://avatar.vercel.sh/${providerId}.svg`;
}
