
import { CommandInput } from "@/components/ui/command";
import { debugLog } from "@/lib/debug";

interface ModelSearchInputProps {
  value: string;
  onValueChange: (value: string) => void;
}

const ModelSearchInput = ({ value, onValueChange }: ModelSearchInputProps) => {
  return (
    <CommandInput 
      placeholder="Search models..." 
      className="h-9" 
      value={value}
      onValueChange={(newValue) => {
        debugLog("ModelSearchInput", "Search query changed", { value: newValue });
        onValueChange(newValue);
      }}
    />
  );
};

export default ModelSearchInput;
