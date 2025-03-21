
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Link, AlertCircle } from "lucide-react";
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

// Define the schema for the API key form
const apiKeySchema = z.object({
  apiKey: z
    .string()
    .min(8, "API key is too short")
    .refine((val) => val.startsWith("sk-"), {
      message: "OpenRouter API keys typically start with 'sk-'",
    }),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

interface ApiKeyFormProps {
  onSaveApiKey: (apiKey: string) => void;
  apiKeyExists: boolean;
}

const ApiKeyForm = ({ onSaveApiKey, apiKeyExists }: ApiKeyFormProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: "",
    },
  });

  useEffect(() => {
    debugLog("ApiKeyForm", "Component mounted", { apiKeyExists });
  }, [apiKeyExists]);

  const onSubmit = (data: ApiKeyFormValues) => {
    debugLog("ApiKeyForm", "Form submitted", { 
      keyLength: data.apiKey.length,
      keyStart: data.apiKey.substring(0, 5) + "..."
    });
    
    // Trim the API key to remove any accidental whitespace
    const trimmedKey = data.apiKey.trim();
    
    debugLog("ApiKeyForm", "API key trimmed", { 
      originalLength: data.apiKey.length,
      trimmedLength: trimmedKey.length,
      hadWhitespace: data.apiKey.length !== trimmedKey.length
    });
    
    onSaveApiKey(trimmedKey);
    form.reset();
    setIsDialogOpen(false);
  };

  const handleOpenDialog = () => {
    debugLog("ApiKeyForm", "Opening API key dialog");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    debugLog("ApiKeyForm", "Closing API key dialog");
    setIsDialogOpen(false);
  };

  // Log validation errors
  useEffect(() => {
    const subscription = form.formState.subscribe(state => {
      if (state.errors.apiKey) {
        debugError("ApiKeyForm", "API key validation error", state.errors.apiKey);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.formState]);
  
  // If user already has an API key
  if (apiKeyExists) {
    return (
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 text-xs py-1 h-8 bg-white/50 dark:bg-gray-900/50 border-white/20 dark:border-gray-800/30"
          onClick={handleOpenDialog}
        >
          <KeyRound className="h-3.5 w-3.5" />
          Update API Key
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update your OpenRouter API Key</DialogTitle>
              <DialogDescription>
                Enter a new API key to replace your existing one.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OpenRouter API Key</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="sk-or-..." 
                          {...field} 
                          type="password" 
                        />
                      </FormControl>
                      <FormDescription>
                        Your API key is stored locally and never sent to our servers.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">Save API Key</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // If no API key exists yet
  return (
    <GlassMorphicCard className="p-6 max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-center gap-2 mb-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-medium">API Key Required</h2>
      </div>
      
      <p className="text-center text-muted-foreground">
        To use the Multi-AI Chat Hub, you need an OpenRouter API key to connect to various AI models.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>OpenRouter API Key</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="sk-or-..." 
                    {...field} 
                    type="password" 
                    onChange={(e) => {
                      field.onChange(e);
                      debugLog("ApiKeyForm", "API key input changed", { 
                        length: e.target.value.length,
                        valid: e.target.value.startsWith("sk-") && e.target.value.length >= 8
                      });
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Your API key is stored locally in your browser.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full">
            Save API Key
          </Button>
        </form>
      </Form>

      <div className="pt-2 text-sm text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
          <span className="font-medium">Don't have an API key?</span>
        </div>
        <a 
          href="https://openrouter.ai/keys" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary flex items-center justify-center gap-1 hover:underline"
          onClick={() => debugLog("ApiKeyForm", "OpenRouter keys link clicked")}
        >
          Get your free OpenRouter API key
          <Link className="h-3 w-3" />
        </a>
      </div>
    </GlassMorphicCard>
  );
};

export default ApiKeyForm;
