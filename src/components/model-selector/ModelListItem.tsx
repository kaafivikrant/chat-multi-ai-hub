
import { Check } from "lucide-react";
import { CommandItem } from "@/components/ui/command";
import { AIModel } from "@/lib/api";
import { cn } from "@/lib/utils";
import { debugLog } from "@/lib/debug";

interface ModelListItemProps {
  model: AIModel;
  isSelected: boolean;
  onSelect: () => void;
}

const ModelListItem = ({ model, isSelected, onSelect }: ModelListItemProps) => {
  debugLog("ModelListItem", `Rendering model: ${model.name}`, { id: model.id });
  
  return (
    <CommandItem
      key={model.id}
      value={model.id}
      onSelect={onSelect}
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
          isSelected ? "opacity-100" : "opacity-0"
        )}
      />
    </CommandItem>
  );
};

export default ModelListItem;
