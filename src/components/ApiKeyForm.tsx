
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Globe, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import GlassMorphicCard from "./ui-custom/GlassMorphicCard";
import { debugLog, debugError } from "@/lib/debug";

// Define the schema for the Ollama URL form
const ollamaUrlSchema = z.object({
  ollamaUrl: z
    .string()
    .min(1, "Ollama URL is required")
    .url("Must be a valid URL")
});

type OllamaUrlFormValues = z.infer<typeof ollamaUrlSchema>;

interface ApiKeyFormProps {
  onSaveApiKey: (url: string) => void;
  apiKeyExists: boolean;
}

const ApiKeyForm = ({ onSaveApiKey, apiKeyExists }: ApiKeyFormProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const form = useForm<OllamaUrlFormValues>({
    resolver: zodResolver(ollamaUrlSchema),
    defaultValues: {
      ollamaUrl: "http://localhost:11434",
    },
  });

  // Log validation errors when they occur
  useEffect(() => {
    if (form.formState.errors.ollamaUrl) {
      debugError("ApiKeyForm", "Ollama URL validation error", form.formState.errors.ollamaUrl);
    }
  }, [form.formState.errors.ollamaUrl]);

  useEffect(() => {
    debugLog("ApiKeyForm", "Component mounted", { apiKeyExists });
  }, [apiKeyExists]);

  const onSubmit = (data: OllamaUrlFormValues) => {
    debugLog("ApiKeyForm", "Form submitted", { 
      url: data.ollamaUrl
    });
    
    // Trim the URL to remove any accidental whitespace
    const trimmedUrl = data.ollamaUrl.trim();
    
    debugLog("ApiKeyForm", "Ollama URL trimmed", { 
      originalLength: data.ollamaUrl.length,
      trimmedLength: trimmedUrl.length,
      hadWhitespace: data.ollamaUrl.length !== trimmedUrl.length
    });
    
    onSaveApiKey(trimmedUrl);
    form.reset();
    setIsDialogOpen(false);
  };

  const handleOpenDialog = () => {
    debugLog("ApiKeyForm", "Opening Ollama URL dialog");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    debugLog("ApiKeyForm", "Closing Ollama URL dialog");
    setIsDialogOpen(false);
  };
  
  // If user already has an Ollama URL
  if (apiKeyExists) {
    return (
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 text-xs py-1 h-8 bg-white/50 dark:bg-gray-900/50 border-white/20 dark:border-gray-800/30"
          onClick={handleOpenDialog}
        >
          <Globe className="h-3.5 w-3.5" />
          Update Ollama URL
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update your Ollama Server URL</DialogTitle>
              <DialogDescription>
                Enter the URL where your Ollama server is running.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="ollamaUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ollama Server URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="http://localhost:11434" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This is where your local Ollama server is running.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">Save URL</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // If no Ollama URL exists yet
  return (
    <GlassMorphicCard className="p-6 max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Globe className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-medium">Ollama Server Required</h2>
      </div>
      
      <p className="text-center text-muted-foreground">
        To use the Multi-AI Chat Hub with Ollama, you need to provide the URL where your Ollama server is running.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="ollamaUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ollama Server URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="http://localhost:11434" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      debugLog("ApiKeyForm", "Ollama URL input changed", { 
                        value: e.target.value,
                        valid: e.target.value.startsWith("http") && e.target.value.length >= 8
                      });
                    }}
                  />
                </FormControl>
                <FormDescription>
                  The default is http://localhost:11434 for local Ollama instances.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full">
            Connect to Ollama
          </Button>
        </form>
      </Form>

      <div className="pt-2 text-sm text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
          <span className="font-medium">Don't have Ollama installed?</span>
        </div>
        <a 
          href="https://ollama.com/download" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary flex items-center justify-center gap-1 hover:underline"
          onClick={() => debugLog("ApiKeyForm", "Ollama download link clicked")}
        >
          Download Ollama
          <Link className="h-3 w-3" />
        </a>
      </div>
    </GlassMorphicCard>
  );
};

export default ApiKeyForm;
