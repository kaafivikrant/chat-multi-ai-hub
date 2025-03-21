
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

// API key management
export function getApiKey(): string | null {
  const apiKey = localStorage.getItem("openrouter_api_key");
  debugLog("API", "Retrieved API key from storage", apiKey ? "API key exists" : "No API key found");
  return apiKey;
}

export function setApiKey(apiKey: string): void {
  debugLog("API", "Setting API key in storage", { keyLength: apiKey.length });
  localStorage.setItem("openrouter_api_key", apiKey);
}

export function removeApiKey(): void {
  debugLog("API", "Removing API key from storage");
  localStorage.removeItem("openrouter_api_key");
}

// OpenRouter API interaction
const OPENROUTER_API_URL = "https://openrouter.ai/api";

// Function to fetch available models from OpenRouter
export async function fetchAvailableModels(): Promise<AIModel[]> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    debugWarn("API", "No API key found for OpenRouter");
    return [];
  }
  
  try {
    debugLog("API", "Fetching models from OpenRouter", { apiUrl: `${OPENROUTER_API_URL}/v1/models` });
    
    const response = await fetch(`${OPENROUTER_API_URL}/v1/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    debugLog("API", "OpenRouter models response status", { status: response.status, ok: response.ok });

    if (!response.ok) {
      const errorData = await response.json();
      debugError("API", "Failed to fetch models from OpenRouter", errorData);
      throw new Error(`Failed to fetch models: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    debugLog("API", "Successfully fetched models data", { 
      modelCount: data.data?.length || 0,
      firstModel: data.data?.length > 0 ? data.data[0].id : null
    });
    
    // Transform the response into our AIModel format
    const transformedModels = data.data.map((model: any) => ({
      id: model.id,
      name: model.name.split("/").pop().replace(/-/g, " "),
      description: model.description,
      provider: model.id.split("/")[0],
      providerName: getProviderName(model.id.split("/")[0]),
      iconUrl: getProviderIcon(model.id.split("/")[0]),
      contextLength: model.context_length,
      pricing: {
        prompt: `$${model.pricing?.prompt?.toFixed(6) || "0.000000"}/1K tokens`,
        completion: `$${model.pricing?.completion?.toFixed(6) || "0.000000"}/1K tokens`
      }
    }));

    debugLog("API", "Transformed models data", { 
      modelCount: transformedModels.length,
      modelIds: transformedModels.map(m => m.id)
    });
    
    return transformedModels;
  } catch (error) {
    debugError("API", "Error fetching models from OpenRouter", error);
    console.error("Error fetching models:", error);
    toast.error("Failed to fetch AI models. Please check your API key.");
    return [];
  }
}

// Function to send a message to the AI model
export async function sendMessageToAI(modelId: string, messages: Message[]): Promise<Message> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    debugWarn("API", "No API key found when sending message to AI");
    return {
      id: `error_${Date.now()}`,
      role: "assistant",
      content: "No API key found. Please add your OpenRouter API key in the settings.",
      modelId: modelId,
      timestamp: Date.now(),
      status: "error",
    };
  }
  
  try {
    // Format messages for the API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    debugLog("API", "Sending message to AI", { 
      modelId, 
      messageCount: messages.length,
      endpoint: `${OPENROUTER_API_URL}/v1/chat/completions`
    });

    const response = await fetch(`${OPENROUTER_API_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Multi-AI Chat Hub",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: formattedMessages,
      }),
    });

    debugLog("API", "AI response status", { status: response.status, ok: response.ok });

    if (!response.ok) {
      const errorData = await response.json();
      debugError("API", "AI response error", errorData);
      throw new Error(`AI response error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    debugLog("API", "Received AI response", { 
      responseId: data.id,
      model: data.model,
      responseLength: data.choices?.[0]?.message?.content?.length || 0
    });

    return {
      id: data.id || `msg_${Date.now()}`,
      role: "assistant",
      content: data.choices[0].message.content,
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
      content: "I'm sorry, I encountered an error while processing your request. Please try again or select a different AI model.",
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

// Helper functions for provider information
function getProviderName(providerId: string): string {
  const providers: Record<string, string> = {
    "openai": "OpenAI",
    "anthropic": "Anthropic",
    "meta": "Meta AI",
    "google": "Google",
    "mistral": "Mistral AI",
    "cohere": "Cohere",
    "perplexity": "Perplexity",
    "groq": "Groq",
  };
  
  return providers[providerId] || providerId;
}

function getProviderIcon(providerId: string): string {
  // Return placeholder URLs - in a real app, you'd use actual provider logos
  const placeholders: Record<string, string> = {
    "openai": "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    "anthropic": "https://upload.wikimedia.org/wikipedia/commons/7/7f/Anthropic_logo.svg",
    "google": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
    "meta": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg",
    "mistral": "https://mistral.ai/images/logo-white.svg",
  };
  
  return placeholders[providerId] || `https://avatar.vercel.sh/${providerId}.svg`;
}
