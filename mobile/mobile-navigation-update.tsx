import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { usePWA } from "@/hooks/usePWA";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Briefcase, 
  Calendar, 
  Clock, 
  CreditCard, 
  Users, 
  Building, 
  Settings, 
  Menu,
  Bell,
  Download,
  Wifi,
  WifiOff,
  Smartphone,
  Zap,
  Star
} from 'lucide-react';

const primaryNavigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Jobs", href: "/jobs", icon: Briefcase, badge: "12" },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Timesheets", href: "/timesheets", icon: Clock, badge: "3" },
  { name: "Mobile+", href: "/mobile-enhanced", icon: Smartphone, highlight: true },
];

const secondaryNavigation = [
  { name: "Workers", href: "/workers", icon: Users },
  { name: "Clients", href: "/clients", icon: Building },
  { name: "Privacy", href: "/privacy", icon: Settings },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function EnhancedMobileNav() {
  const [location] = useLocation();
  const { user } = useAuth() as { user: any };
  const { isOffline } = usePWA();

  const isActive = (href: string) => {
    return location === href || (href !== "/" && location.startsWith(href));
  };

  return (
    <>
      {/* Enhanced Bottom Navigation with Mobile+ Feature */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="grid grid-cols-5 gap-1 p-2">
          {primaryNavigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-lg transition-colors relative",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  item.highlight && "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                )}
                data-testid={`bottom-nav-${item.name.toLowerCase().replace('+', '-plus')}`}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
                
                {item.badge && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs">
                    {item.badge}
                  </Badge>
                )}
                
                {item.highlight && (
                  <div className="absolute -top-1 -right-1">
                    <Star className="w-3 h-3 text-yellow-300 fill-current" />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
        
        {/* Enhanced Feature Indicator */}
        {location === '/mobile-enhanced' && (
          <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-t">
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">Enhanced Mobile Features Active</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}