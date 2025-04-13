
import { Loader2 } from "lucide-react";
import { AIModel } from "@/lib/api";

interface SelectedModelDisplayProps {
  model: AIModel | null;
  isLoading: boolean;
}

const SelectedModelDisplay = ({ model, isLoading }: SelectedModelDisplayProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading models...</span>
      </div>
    );
  }
  
  if (model) {
    return (
      <div className="flex items-center gap-2">
        {model.iconUrl && (
          <img 
            src={model.iconUrl} 
            alt={model.provider}
            className="w-5 h-5 object-contain opacity-80"
          />
        )}
        <div className="flex flex-col">
          <span className="font-medium">{model.name}</span>
          <span className="text-xs text-muted-foreground">{model.providerName || "Ollama"}</span>
        </div>
      </div>
    );
  }
  
  return <span>Select a model</span>;
};

export default SelectedModelDisplay;
