import { ReactNode, useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import MobileMenu from "@/components/ui/mobile-menu";
import NotificationCenter from "@/components/ui/notification-center";
import GlobalSearch from "@/components/ui/global-search";
import AIChat from "@/components/ai/ai-chat";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useGlobalKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function AppLayout({ children, title, breadcrumbs }: AppLayoutProps) {
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  
  // Enable global keyboard shortcuts (including Ctrl+Shift+T for theme toggle)
  useGlobalKeyboardShortcuts();

  return (
    <div className="flex min-h-screen bg-background" role="application" aria-label="Kin2 Workforce Platform">
      <Sidebar />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <header className="border-b border-border bg-gradient-to-r from-background via-background to-background/95 backdrop-blur-sm sticky top-0 z-40 shadow-sm" role="banner">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            <div className="flex items-center space-x-4">
              <MobileMenu />
              <div className="flex flex-col">
                <h1 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent focus-ring animate-slideIn" tabIndex={0} aria-level={1}>{title}</h1>
                {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4" role="toolbar" aria-label="Navigation tools">
              <div className="hidden sm:block">
                <GlobalSearch />
              </div>
              <ThemeToggle data-testid="button-theme-toggle" />
              <NotificationCenter />
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-6 overflow-auto mobile-scroll-container animate-fadeIn bg-gradient-to-br from-background to-background/95" role="main" aria-live="polite">
          {children}
        </main>
      </div>
      
      {/* AI Chat Assistant */}
      <AIChat 
        isMinimized={isChatMinimized} 
        onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)} 
      />
    </div>
  );
}
