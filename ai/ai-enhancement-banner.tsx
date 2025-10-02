import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Zap, ArrowRight } from "lucide-react";

export default function AIEnhancementBanner() {
  return (
    <Card className="bg-gradient-to-r from-primary/5 via-blue-500/5 to-purple-500/5 border-primary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-transparent opacity-30" />
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-foreground">360° AI Assistant</h3>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Enhanced
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Your AI workforce consultant now features conversation memory, context awareness, and advanced automation recommendations for intelligent business management.
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <Zap className="w-5 h-5 text-orange-500" />
              <span className="text-xs text-muted-foreground">Smart Automation</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Brain className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-muted-foreground">Context Memory</span>
            </div>
            <Link href="/ai">
              <Button className="ml-4" data-testid="button-try-ai">
                Try AI Intelligence
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Mobile CTA */}
        <div className="md:hidden mt-4 flex justify-center">
          <Link href="/ai">
            <Button className="w-full" data-testid="button-try-ai-mobile">
              Explore AI Intelligence
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}