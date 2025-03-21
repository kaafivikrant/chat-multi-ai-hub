
import { useEffect, useRef } from "react";
import { useChat } from "@/context/ChatContext";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ModelSelector from "@/components/ModelSelector";
import ApiKeyForm from "@/components/ApiKeyForm";
import GlassMorphicCard from "@/components/ui-custom/GlassMorphicCard";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import { debugLog } from "@/lib/debug";

const Index = () => {
  const { 
    apiKey,
    setUserApiKey,
    hasApiKey,
    availableModels, 
    selectedModelId, 
    isLoadingModels, 
    selectModel, 
    getSelectedModel,
    messages, 
    isProcessing, 
    sendMessage, 
    createNewSession
  } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedModel = getSelectedModel();

  // Log component state
  useEffect(() => {
    debugLog("Index", "Component state", {
      hasApiKey,
      availableModelsCount: availableModels.length,
      selectedModelId,
      isLoadingModels,
      messagesCount: messages.length
    });
  }, [hasApiKey, availableModels.length, selectedModelId, isLoadingModels, messages.length]);

  // Log the models we have available
  useEffect(() => {
    if (availableModels.length > 0) {
      debugLog("Index", "Available models:", availableModels.map(m => ({
        id: m.id,
        name: m.name,
        provider: m.providerName || m.provider
      })));
    } else if (!isLoadingModels && hasApiKey) {
      debugLog("Index", "No models available even though we have an API key");
    }
  }, [availableModels, isLoadingModels, hasApiKey]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // If no API key is set, show the API key form
  if (!hasApiKey) {
    debugLog("Index", "Rendering API key form (no API key exists)");
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-accent/40">
        {/* Subtle background pattern */}
        <div 
          className="fixed inset-0 z-0 opacity-20" 
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(0, 0, 0, 0.1) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(0, 0, 0, 0.1) 2%, transparent 0%)`,
            backgroundSize: "100px 100px",
          }}
        />
        
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-md bg-white/50 dark:bg-gray-900/50 border-b border-white/20 dark:border-gray-800/30 px-4 py-3 shadow-soft">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="font-medium text-lg">Multi-AI Chat Hub</h1>
            </div>
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <ApiKeyForm 
              onSaveApiKey={(key) => {
                debugLog("Index", "API key saved", { keyLength: key.length });
                setUserApiKey(key);
              }}
              apiKeyExists={false}
            />
          </div>
        </main>
      </div>
    );
  }

  debugLog("Index", "Rendering main chat interface", {
    modelsLoaded: availableModels.length > 0,
    selectedModel: selectedModel?.name || "None"
  });

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-accent/40">
      {/* Subtle background pattern */}
      <div 
        className="fixed inset-0 z-0 opacity-20" 
        style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(0, 0, 0, 0.1) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(0, 0, 0, 0.1) 2%, transparent 0%)`,
          backgroundSize: "100px 100px",
        }}
      />
      
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/50 dark:bg-gray-900/50 border-b border-white/20 dark:border-gray-800/30 px-4 py-3 shadow-soft">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="font-medium text-lg">Multi-AI Chat Hub</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <ApiKeyForm 
              onSaveApiKey={(key) => {
                debugLog("Index", "API key updated", { keyLength: key.length });
                setUserApiKey(key);
              }}
              apiKeyExists={true}
            />
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 bg-white/50 dark:bg-gray-900/50 border-white/20 dark:border-gray-800/30"
              onClick={() => {
                debugLog("Index", "Creating new chat session");
                createNewSession().then(id => {
                  debugLog("Index", "New chat session created", { id });
                  window.location.href = `/chat/${id}`;
                });
              }}
            >
              <Plus className="h-4 w-4" />
              <span>New Chat</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 relative z-10">
        {/* Content wrapper */}
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center px-4">
              <GlassMorphicCard className="p-8 max-w-md w-full space-y-6 animate-fade-in">
                <h2 className="text-2xl font-medium">Welcome to Multi-AI Chat Hub</h2>
                <p className="text-muted-foreground">
                  Select an AI model and start a conversation to experience different AI personalities and capabilities.
                </p>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Select AI Model</h3>
                    <ModelSelector
                      models={availableModels}
                      selectedModelId={selectedModelId}
                      onSelectModel={(modelId) => {
                        debugLog("Index", "Model selected from welcome screen", { modelId });
                        selectModel(modelId);
                      }}
                      isLoading={isLoadingModels}
                      className="w-full"
                    />
                  </div>
                  
                  <Button 
                    onClick={() => {
                      debugLog("Index", "Starting conversation with default message");
                      sendMessage("Hello! Tell me about what makes you unique as an AI model.");
                    }}
                    className="w-full"
                    disabled={isLoadingModels || isProcessing}
                  >
                    {isLoadingModels ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Start Conversation
                  </Button>
                </div>
              </GlassMorphicCard>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Model selector for ongoing conversations */}
              <div className="sticky top-[72px] z-20 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-800/30 rounded-lg px-4 py-3 shadow-soft mb-6 animate-slide-down">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <h3 className="text-sm font-medium whitespace-nowrap">Current AI Model:</h3>
                  <div className="flex-1">
                    <ModelSelector
                      models={availableModels}
                      selectedModelId={selectedModelId}
                      onSelectModel={(modelId) => {
                        debugLog("Index", "Model selected during conversation", { 
                          modelId, 
                          previousModelId: selectedModelId
                        });
                        selectModel(modelId);
                      }}
                      isLoading={isLoadingModels}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              {/* Chat messages */}
              <div className="space-y-4 py-4 pb-24">
                {messages.map((message, index) => (
                  <ChatMessage 
                    key={message.id}
                    message={message}
                    modelName={message.role === "assistant" ? selectedModel?.name : undefined}
                    isLastMessage={index === messages.length - 1}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Chat input fixed at bottom */}
      <div className="fixed bottom-0 left-0 w-full p-4 z-20">
        <div className="max-w-3xl mx-auto">
          <ChatInput 
            onSendMessage={(content) => {
              debugLog("Index", "Sending message", { 
                contentLength: content.length,
                modelId: selectedModelId
              });
              sendMessage(content);
            }} 
            isProcessing={isProcessing}
            className="animate-slide-up"
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
