import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnhancedNotificationCenter } from "@/components/ui/enhanced-notification-center";
import GlobalSearch from "@/components/ui/global-search";
import { PWAInstall } from "@/components/ui/pwa-install";
import { Logo } from "@/components/ui/logo";
import { HelpCenter } from "@/components/ui/help-center";
import { GuidedTour } from "@/components/ui/guided-tour";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Menu, Plus, HelpCircle, Play } from "lucide-react";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showTour, setShowTour] = useState(false);

  return (
    <header className="bg-card border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Mobile menu button */}
        <button className="md:hidden text-muted-foreground hover:text-foreground" data-testid="button-mobile-menu">
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo and Page Title */}
        <div className="flex items-center">
          <Logo variant="emblem" size="sm" className="mr-3 md:hidden" />
          <h2 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">{title}</h2>
        </div>

        {/* Top Actions */}
        <div className="flex items-center space-x-4">
          {/* Enhanced Search */}
          <div className="hidden sm:block">
            <GlobalSearch />
          </div>

          {/* Enhanced Notifications */}
          <EnhancedNotificationCenter />

          {/* Help & Tour Buttons */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowTour(true)}
            data-testid="button-start-tour"
            title="Start Guided Tour"
          >
            <Play className="w-4 h-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowHelpCenter(true)}
            data-testid="button-help-center"
            title="Help Center"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>

          {/* Dark Mode Toggle */}
          <ThemeToggle />

          {/* Quick Actions */}
          <Button data-testid="button-quick-action">
            <Plus className="w-4 h-4 mr-2" />
            Post Job
          </Button>
        </div>
      </div>
      
      {/* PWA Install Prompt */}
      <PWAInstall />

      {/* Help Center Modal */}
      <HelpCenter 
        isOpen={showHelpCenter} 
        onClose={() => setShowHelpCenter(false)} 
      />

      {/* Guided Tour */}
      <GuidedTour 
        isOpen={showTour} 
        onClose={() => setShowTour(false)}
        tourType="welcome"
      />
    </header>
  );
}
