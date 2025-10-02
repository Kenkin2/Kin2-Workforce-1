import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { usePWA } from "@/hooks/usePWA";
import { cn } from "@/lib/utils";
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
  WifiOff
} from 'lucide-react';

const primaryNavigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Jobs", href: "/jobs", icon: Briefcase, badge: "12" },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Timesheets", href: "/timesheets", icon: Clock, badge: "3" },
  { name: "Payments", href: "/payments", icon: CreditCard },
];

const secondaryNavigation = [
  { name: "Workers", href: "/workers", icon: Users },
  { name: "Clients", href: "/clients", icon: Building },
  { name: "Privacy", href: "/privacy", icon: Settings },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth() as { user: any };
  const { isOffline, showInstallBanner, installApp, dismissInstallBanner } = usePWA();

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    window.location.href = '/api/logout';
  };

  const isActive = (href: string) => {
    return location === href || (href !== "/" && location.startsWith(href));
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-users text-primary-foreground text-sm"></i>
            </div>
            <h1 className="text-lg font-semibold">Kin2</h1>
          </div>

          {/* Status indicators */}
          <div className="flex items-center space-x-2">
            {isOffline && (
              <div className="flex items-center text-orange-500" data-testid="offline-indicator">
                <WifiOff className="w-4 h-4 mr-1" />
                <span className="text-xs">Offline</span>
              </div>
            )}
            
            <Button variant="ghost" size="sm" data-testid="button-notifications">
              <Bell className="w-5 h-5" />
            </Button>

            {/* Mobile Menu Trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-mobile-menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <MobileMenuContent 
                  user={user}
                  location={location}
                  isActive={isActive}
                  onNavigate={() => setIsOpen(false)}
                  onLogout={() => {
                    setIsOpen(false);
                    setShowLogoutDialog(true);
                  }}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="md:hidden fixed top-16 left-4 right-4 z-40 bg-primary text-primary-foreground p-3 rounded-lg shadow-lg" data-testid="pwa-install-banner">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Install Kin2 Workforce</p>
              <p className="text-xs opacity-90">Get quick access and offline features</p>
            </div>
            <div className="flex space-x-2 ml-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={installApp}
                data-testid="button-install-pwa"
              >
                <Download className="w-4 h-4 mr-1" />
                Install
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissInstallBanner}
                data-testid="button-dismiss-install"
              >
                ×
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="grid grid-cols-5 gap-1 p-2">
          {primaryNavigation.slice(0, 5).map((item) => (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-lg transition-colors relative",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                data-testid={`bottom-nav-${item.name.toLowerCase()}`}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
                {item.badge && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
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
    </>
  );
}

function MobileMenuContent({ 
  user, 
  location, 
  isActive, 
  onNavigate,
  onLogout
}: {
  user: any;
  location: string;
  isActive: (href: string) => boolean;
  onNavigate: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* User Profile */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user?.profileImageUrl} alt="Profile" />
            <AvatarFallback>
              {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || 'S'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" data-testid="mobile-user-name">
              {user?.firstName || 'User'} {user?.lastName || 'Name'}
            </p>
            <p className="text-sm text-muted-foreground truncate" data-testid="mobile-user-role">
              {user?.role || 'Worker'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">Main Navigation</p>
          {primaryNavigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <div
                onClick={onNavigate}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg transition-colors",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                data-testid={`mobile-nav-${item.name.toLowerCase()}`}
              >
                <div className="flex items-center">
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                </div>
                {item.badge && (
                  <Badge variant="secondary" className="ml-2">
                    {item.badge}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 space-y-1 px-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">Management</p>
          {secondaryNavigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <div
                onClick={onNavigate}
                className={cn(
                  "flex items-center p-3 rounded-lg transition-colors",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                data-testid={`mobile-nav-${item.name.toLowerCase()}`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={onLogout}
          data-testid="button-logout"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}