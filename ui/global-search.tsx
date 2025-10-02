import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "job" | "worker" | "timesheet" | "client";
  url: string;
  metadata?: Record<string, any>;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [, navigate] = useLocation();

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query]);

  // Real API search with debouncing
  const { data: searchData, isLoading: isSearching } = useQuery<{ results: SearchResult[] }>({
    queryKey: ['/api/search', { q: debouncedQuery }],
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30000, // Cache results for 30 seconds
  });

  const searchResults: SearchResult[] = searchData?.results || [];
  const showLoading = query !== debouncedQuery || isSearching;

  const getResultIcon = (type: string) => {
    switch (type) {
      case "job": return "fas fa-briefcase text-primary";
      case "worker": return "fas fa-user text-secondary";
      case "client": return "fas fa-building text-blue-500";
      case "timesheet": return "fas fa-clock text-accent";
      default: return "fas fa-search text-muted-foreground";
    }
  };

  const getResultBadge = (type: string) => {
    switch (type) {
      case "job": return { text: "Job", variant: "default" as const };
      case "worker": return { text: "Worker", variant: "secondary" as const };
      case "client": return { text: "Client", variant: "outline" as const };
      case "timesheet": return { text: "Timesheet", variant: "outline" as const };
      default: return { text: "Result", variant: "outline" as const };
    }
  };

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="relative w-64 justify-start text-muted-foreground"
          data-testid="button-global-search"
        >
          <i className="fas fa-search mr-2"></i>
          Search everything...
          <Badge variant="outline" className="ml-auto text-xs">
            ⌘K
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center space-x-2">
            <i className="fas fa-search"></i>
            <span>Search</span>
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Input
            placeholder="Search jobs, workers, clients, timesheets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
            autoFocus
            data-testid="input-global-search"
          />
        </div>
        <ScrollArea className="max-h-96">
          <div className="px-4 pb-4">
            {showLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : searchResults.length === 0 && query ? (
              <div className="text-center py-8">
                <i className="fas fa-search text-4xl text-muted-foreground mb-3"></i>
                <p className="text-muted-foreground">No results found for "{query}"</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try different keywords or check spelling
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-keyboard text-4xl text-muted-foreground mb-3"></i>
                <p className="text-muted-foreground">Start typing to search</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Search across jobs, workers, clients, and timesheets
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((result) => {
                  const badge = getResultBadge(result.type);
                  return (
                    <Card 
                      key={result.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors border-border/50"
                      onClick={() => {
                        setOpen(false);
                        navigate(result.url);
                      }}
                      data-testid={`search-result-${result.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            <i className={getResultIcon(result.type)}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-foreground truncate">
                                {result.title}
                              </h3>
                              <Badge variant={badge.variant} className="text-xs">
                                {badge.text}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {result.subtitle}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}