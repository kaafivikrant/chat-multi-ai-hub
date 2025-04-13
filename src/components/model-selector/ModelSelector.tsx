
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command } from "@/components/ui/command";
import { AIModel } from "@/lib/api";
import { cn } from "@/lib/utils";
import { debugLog } from "@/lib/debug";
import { useModelFiltering } from "./useModelFiltering";
import ModelSearchInput from "./ModelSearchInput";
import ModelList from "./ModelList";
import SelectedModelDisplay from "./SelectedModelDisplay";

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
  
  const { searchQuery, setSearchQuery, filteredModels } = useModelFiltering(models);

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

  const handleSelectModel = (modelId: string) => {
    debugLog("ModelSelector", "Model selected", { modelId });
    onSelectModel(modelId);
    setOpen(false);
  };

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
          onClick={() => { debugLog("ModelSelector", "Popover trigger clicked"); }}
        >
          <SelectedModelDisplay model={selectedModel} isLoading={isLoading} />
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 shadow-medium border-white/20 dark:border-gray-800/30 backdrop-blur-sm">
        <Command className="bg-transparent">
          <ModelSearchInput 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <ModelList 
            models={filteredModels} 
            searchQuery={searchQuery}
            selectedModelId={selectedModelId}
            onSelectModel={handleSelectModel}
          />
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ModelSelector;
