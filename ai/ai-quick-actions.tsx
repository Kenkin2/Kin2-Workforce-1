import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, MessageSquare, Calendar, Users, TrendingUp, Zap } from "lucide-react";
import { Link } from "wouter";

const quickActions = [
  {
    id: "schedule-optimization",
    title: "Optimize My Schedule",
    description: "AI analyzes worker availability and suggests optimal shift assignments",
    icon: Calendar,
    color: "bg-blue-500",
    href: "/ai#smart-scheduling"
  },
  {
    id: "find-workers",
    title: "Find Best Workers",
    description: "Match job requirements with worker skills using AI scoring",
    icon: Users,
    color: "bg-green-500",
    href: "/ai#job-matching"
  },
  {
    id: "performance-insights",
    title: "Performance Analytics",
    description: "Get AI-powered insights on workforce efficiency and trends",
    icon: TrendingUp,
    color: "bg-purple-500",
    href: "/ai#insights"
  },
  {
    id: "automation-suggestions",
    title: "Automation Opportunities",
    description: "Discover tasks that can be automated to save time",
    icon: Zap,
    color: "bg-orange-500",
    href: "/ai#automation"
  }
];

export default function AIQuickActions() {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Quick Actions
          <Badge variant="secondary" className="ml-auto">New</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Link key={action.id} href={action.href}>
                <div
                  className="p-4 rounded-lg border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-muted/30 to-muted/10 cursor-pointer transition-all duration-200 hover:shadow-md group"
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                  data-testid={`ai-action-${action.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {action.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI Chat Assistant</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Your AI assistant is available in the bottom-right corner for real-time workforce management guidance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}