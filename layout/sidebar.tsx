import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { Logo } from "@/components/ui/logo";
import { navigationGroups } from "@/config/navigation";
import { Gauge, LogOut, Coins, ChevronDown, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ThemeIndicator } from "@/components/ui/theme-indicator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth() as { user: any };
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationGroups.forEach(group => {
      initial[group.name] = group.defaultOpen ?? false;
    });
    return initial;
  });

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    window.location.href = '/api/logout';
  };

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-50">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-sidebar border-r border-sidebar-border h-full">
        {/* Logo and Brand */}
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <Logo variant="emblem" size="sm" className="mr-3" />
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">Kin2 Workforce</h1>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="mt-8 px-4">
          <div className="bg-sidebar-accent rounded-lg p-3">
            <div className="flex items-center">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.profileImageUrl || undefined} alt="User Profile" />
                <AvatarFallback>
                  {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate" data-testid="text-user-name">
                  {user?.firstName || 'User'} {user?.lastName || 'Name'}
                </p>
                <p className="text-xs text-sidebar-accent-foreground truncate" data-testid="text-user-role">
                  {user?.role || 'Worker'}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-3 text-sidebar-accent-foreground hover:text-sidebar-foreground"
              onClick={() => setShowLogoutDialog(true)}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Navigation Menu - Task-Based Groups */}
        <nav className="mt-8 flex-1 px-4 space-y-2 overflow-y-auto" role="navigation" aria-label="Main navigation">
          {navigationGroups.map((group) => (
            <Collapsible
              key={group.name}
              open={openGroups[group.name]}
              onOpenChange={() => toggleGroup(group.name)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-sidebar-accent-foreground hover:bg-sidebar-accent rounded-md transition-colors" data-testid={`nav-group-${group.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-center">
                  <group.icon className="mr-3 w-4 h-4" aria-hidden="true" />
                  <span>{group.name}</span>
                </div>
                {openGroups[group.name] ? (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-1">
                {group.items.map((item) => {
                  const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href}
                      className={cn(
                        "group flex items-center pl-10 pr-3 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg border-l-4 border-primary"
                          : "text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground hover:shadow-md"
                      )} 
                      aria-current={isActive ? "page" : undefined}
                      data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <item.icon className="mr-3 w-4 h-4" aria-hidden="true" />
                      {item.name}
                      {item.badge && (
                        <span className="ml-auto bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full" aria-label={`${item.badge} notifications`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}

          {user?.role === 'admin' && (
            <div className="pt-4 mt-4 border-t border-sidebar-border">
              <div className="px-3 mb-2">
                <span className="text-xs font-semibold text-sidebar-accent-foreground uppercase tracking-wider">
                  System Administration
                </span>
              </div>
              <Link 
                href="/admin"
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer",
                  location === "/admin"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg border-l-4 border-primary"
                    : "text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground hover:shadow-md"
                )} 
                aria-current={location === "/admin" ? "page" : undefined}
                data-testid="nav-admin-dashboard"
              >
                <Gauge className="mr-3 w-4 h-4" aria-hidden="true" />
                Admin Dashboard
              </Link>
            </div>
          )}
        </nav>

        {/* Theme Toggle & Footer */}
        <div className="p-4 mt-auto space-y-4">
          {/* Theme Toggle Section */}
          <div className="bg-sidebar-accent rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ThemeIndicator />
                <span className="text-sm font-medium text-sidebar-foreground">Theme</span>
              </div>
              <ThemeToggle variant="icon" className="h-8 w-8" />
            </div>
            <ThemeIndicator showLabel className="mt-2" />
          </div>

          {/* KarmaCoin Widget - Hidden: Backend not implemented */}
          {/* <div className="bg-gradient-to-br from-secondary to-primary p-4 rounded-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">KarmaCoins</span>
              <Coins className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold" data-testid="text-karma-coins-sidebar">
              {user?.karmaCoins?.toLocaleString() || "0"}
            </div>
            <div className="text-xs opacity-75">+127 this week</div>
          </div> */}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-logout">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout}
              data-testid="button-confirm-logout"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
