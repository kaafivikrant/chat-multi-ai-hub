
import { useState, useEffect, useCallback } from "react";
import { AIModel } from "@/lib/api";
import { debugLog } from "@/lib/debug";

export const useModelFiltering = (models: AIModel[], initialSearchQuery: string = "") => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  // Log what we're filtering in search
  useEffect(() => {
    if (searchQuery) {
      debugLog("useModelFiltering", "Filtering models by search query", { 
        query: searchQuery,
        modelCount: models.length
      });
    }
  }, [searchQuery, models]);

  // Filter models 
  const filteredModels = useCallback(() => {
    debugLog("useModelFiltering", "Filtering models");
    
    return models.filter(model => {
      const matchesSearch = searchQuery === "" || 
        model.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [models, searchQuery]);

  const filteredModelsList = filteredModels();
  
  // Log the filtered models
  useEffect(() => {    
    debugLog("useModelFiltering", "Models after filtering", { 
      totalFiltered: filteredModelsList.length,
      query: searchQuery || "(empty)"
    });
  }, [filteredModelsList, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredModels: filteredModelsList
  };
};
