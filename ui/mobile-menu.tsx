import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mobileNavigation } from "@/config/navigation";
import { Menu, Coins, Users } from "lucide-react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth() as { user: any };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="md:hidden p-2"
          data-testid="button-mobile-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 overflow-hidden">
        <div className="flex flex-col h-full max-h-screen">
          <SheetHeader className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-primary-foreground" />
              </div>
              <SheetTitle className="text-left">Kin2 Workforce</SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* User Profile */}
            <div className="p-6 border-b">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt="User Profile" />
                  <AvatarFallback>
                    {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {user?.firstName || 'User'} {user?.lastName || 'Name'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user?.role || 'Worker'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1">
              {mobileNavigation.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.name} href={item.href} onClick={() => setOpen(false)}>
                    <div className={cn(
                      "flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer btn-touch nav-touch",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-md active:scale-95"
                    )} role="button" tabIndex={0} aria-label={`Navigate to ${item.name}`}>
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </div>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
              
            </nav>
          </div>

          {/* KarmaCoin Widget */}
          <div className="p-4 border-t">
            <div className="bg-gradient-to-br from-secondary to-primary p-4 rounded-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">KarmaCoins</span>
                <Coins className="h-5 w-5" />
              </div>
              <div className="text-xl font-bold">
                {user?.karmaCoins?.toLocaleString() || "0"}
              </div>
              <div className="text-xs opacity-75">+127 this week</div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}