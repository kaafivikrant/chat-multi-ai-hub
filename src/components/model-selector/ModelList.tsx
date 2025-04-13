
import { CommandEmpty, CommandGroup, CommandList } from "@/components/ui/command";
import { AIModel } from "@/lib/api";
import ModelListItem from "./ModelListItem";
import { debugLog } from "@/lib/debug";

interface ModelListProps {
  models: AIModel[];
  searchQuery: string;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

const ModelList = ({ 
  models, 
  searchQuery, 
  selectedModelId, 
  onSelectModel 
}: ModelListProps) => {
  debugLog("ModelList", "Rendering model list", { 
    modelCount: models.length, 
    query: searchQuery || "(empty)" 
  });
  
  return (
    <CommandList>
      <CommandEmpty>
        {searchQuery ? "No models found." : "No models available."}
      </CommandEmpty>
      <CommandGroup heading="Available Models">
        {models.map((model) => (
          <ModelListItem
            key={model.id}
            model={model}
            isSelected={selectedModelId === model.id}
            onSelect={() => onSelectModel(model.id)}
          />
        ))}
      </CommandGroup>
    </CommandList>
  );
};

export default ModelList;
