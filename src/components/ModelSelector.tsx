
import { useState, useEffect, useCallback } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { AIModel } from "@/lib/api";
import { cn } from "@/lib/utils";
import { debugLog } from "@/lib/debug";

interface ModelSelectorProps {
  models: AIModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  isLoading?: boolean;
  className?: string;
}

const ModelSelector = ({ 
  models, 
  selectedModelId, 
  onSelectModel, 
  isLoading = false,
  className
}: ModelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Log received models
  useEffect(() => {
    debugLog("ModelSelector", "Received models", { 
      count: models.length, 
      selectedId: selectedModelId,
      modelIds: models.map(m => m.id)
    });
  }, [models, selectedModelId]);

  // Find the selected model from the list of models
  useEffect(() => {
    const model = models.find(m => m.id === selectedModelId);
    debugLog("ModelSelector", "Finding selected model", { 
      selectedId: selectedModelId, 
      found: !!model,
      modelName: model?.name
    });
    setSelectedModel(model || null);
  }, [selectedModelId, models]);

  const handleSelectModel = useCallback((modelId: string) => {
    debugLog("ModelSelector", "Model selected", { modelId });
    onSelectModel(modelId);
    setOpen(false);
  }, [onSelectModel]);

  // Log what we're filtering in search
  useEffect(() => {
    if (searchQuery) {
      debugLog("ModelSelector", "Filtering models by search query", { 
        query: searchQuery,
        modelCount: models.length
      });
    }
  }, [searchQuery, models]);

  // Group models by provider
  const groupedModels = useCallback(() => {
    debugLog("ModelSelector", "Grouping models by provider");
    
    return Object.entries(
      models.reduce<Record<string, AIModel[]>>((acc, model) => {
        // Check if the model matches search query (case-insensitive)
        const matchesSearch = searchQuery === "" || 
          model.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (model.providerName || model.provider).toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return acc;
        
        if (!acc[model.providerName || model.provider]) {
          acc[model.providerName || model.provider] = [];
        }
        acc[model.providerName || model.provider].push(model);
        return acc;
      }, {})
    );
  }, [models, searchQuery]);

  const groupedModelsList = groupedModels();
  
  // Log the filtered models
  useEffect(() => {
    const totalModelsAfterFiltering = groupedModelsList.reduce(
      (total, [_, models]) => total + models.length, 
      0
    );
    
    debugLog("ModelSelector", "Models after filtering", { 
      totalFiltered: totalModelsAfterFiltering,
      providerGroups: groupedModelsList.length,
      query: searchQuery || "(empty)"
    });
  }, [groupedModelsList, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between px-3 py-5 h-auto transition-all",
            "bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm",
            "border-white/20 dark:border-gray-800/30 text-left",
            "shadow-soft hover:shadow-medium",
            className
          )}
          disabled={isLoading}
          onClick={() => debugLog("ModelSelector", "Popover trigger clicked")}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading models...</span>
            </div>
          ) : selectedModel ? (
            <div className="flex items-center gap-2">
              {selectedModel.iconUrl && (
                <img 
                  src={selectedModel.iconUrl} 
                  alt={selectedModel.provider}
                  className="w-5 h-5 object-contain opacity-80"
                />
              )}
              <div className="flex flex-col">
                <span className="font-medium">{selectedModel.name}</span>
                <span className="text-xs text-muted-foreground">{selectedModel.providerName}</span>
              </div>
            </div>
          ) : (
            <span>Select a model</span>
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 shadow-medium border-white/20 dark:border-gray-800/30 backdrop-blur-sm">
        <Command className="bg-transparent">
          <CommandInput 
            placeholder="Search models..." 
            className="h-9" 
            value={searchQuery}
            onValueChange={(value) => {
              debugLog("ModelSelector", "Search query changed", { value });
              setSearchQuery(value);
            }}
          />
          <CommandList>
            <CommandEmpty>
              {searchQuery ? "No models found." : "No models available."}
            </CommandEmpty>
            {groupedModelsList.map(([provider, providerModels]) => {
              // Call debugLog here but don't use its return value in JSX
              debugLog("ModelSelector", `Rendering provider group: ${provider}`, { 
                modelCount: providerModels.length,
                models: providerModels.map(m => m.name)
              });
              
              return (
                <CommandGroup heading={provider} key={provider}>
                  {providerModels.map((model) => (
                    <CommandItem
                      key={model.id}
                      value={model.id}
                      onSelect={() => handleSelectModel(model.id)}
                      className="flex items-start py-2 gap-2"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {model.iconUrl && (
                          <img 
                            src={model.iconUrl} 
                            alt={model.provider}
                            className="w-5 h-5 object-contain opacity-80 mt-0.5"
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.contextLength && `${Math.round(model.contextLength / 1000)}K ctx`}
                            {model.pricing?.prompt && ` · ${model.pricing.prompt}`}
                          </span>
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "w-4 h-4 mt-1",
                          selectedModelId === model.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ModelSelector;
