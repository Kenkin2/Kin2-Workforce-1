import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/hooks/useTheme";
import { Palette, Sun, Moon, Monitor, Save, Coins, Info, History, Shield, Monitor as Devices, Download, Trash, LogOut } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { theme, isDark, setLightTheme, setDarkTheme, setSystemTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);


  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AppLayout 
      title="Settings"
      breadcrumbs={[{ label: "System", href: "/dashboard" }, { label: "Settings" }]}
    >
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Settings</h2>
          <p className="text-muted-foreground">Manage your account and platform preferences</p>
        </div>

        {/* Profile Settings */}
        <Card data-testid="card-profile-settings">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  defaultValue={user?.name?.split(' ')[0] || ""} 
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  defaultValue={user?.name?.split(' ').slice(1).join(' ') || ""} 
                  data-testid="input-last-name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                defaultValue={user?.email || ""} 
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input 
                id="role" 
                defaultValue="Worker" 
                disabled 
                className="bg-muted"
                data-testid="input-role"
              />
            </div>
            
            <Button data-testid="button-save-profile">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card data-testid="card-appearance-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance & Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Selection */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Theme Preference</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color scheme for improved readability and reduced eye strain
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Light Theme */}
                <div 
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'
                  }`}
                  onClick={setLightTheme}
                  data-testid="theme-option-light"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                      <Sun className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Light</h3>
                      <p className="text-sm text-muted-foreground">Classic bright theme</p>
                    </div>
                  </div>
                  {theme === 'light' && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </div>

                {/* Dark Theme */}
                <div 
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'
                  }`}
                  onClick={setDarkTheme}
                  data-testid="theme-option-dark"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <Moon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Dark</h3>
                      <p className="text-sm text-muted-foreground">Easy on the eyes</p>
                    </div>
                  </div>
                  {theme === 'dark' && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </div>

                {/* System Theme */}
                <div 
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    theme === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'
                  }`}
                  onClick={setSystemTheme}
                  data-testid="theme-option-system"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-full">
                      <Monitor className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">System</h3>
                      <p className="text-sm text-muted-foreground">Matches your device</p>
                    </div>
                  </div>
                  {theme === 'system' && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </div>
              </div>

              {/* Current Status */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium">Current Theme:</div>
                  <div className="flex items-center space-x-1">
                    {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <span className="text-sm capitalize">{isDark ? 'Dark' : 'Light'}</span>
                  </div>
                </div>
                <ThemeToggle variant="dropdown" />
              </div>
            </div>

            <Separator />

            {/* Benefits Section */}
            <div className="space-y-3">
              <h4 className="font-medium">Dark Mode Benefits</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Reduced eye strain during extended use</li>
                <li>• Better visibility in low-light environments</li>
                <li>• Improved battery life on OLED displays</li>
                <li>• Enhanced focus on content and data</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card data-testid="card-notification-settings">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch 
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                data-testid="switch-email-notifications"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications in your browser
                </p>
              </div>
              <Switch 
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
                data-testid="switch-push-notifications"
              />
            </div>
          </CardContent>
        </Card>

        {/* KarmaCoin Settings */}
        <Card data-testid="card-karma-settings">
          <CardHeader>
            <CardTitle>KarmaCoin Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-foreground">Current Balance</p>
                <p className="text-2xl font-bold text-primary" data-testid="text-karma-balance">
                  {Math.floor(Math.random() * 1000).toLocaleString()} KC
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6 text-secondary" />
              </div>
            </div>
            
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                Earn KarmaCoins by completing courses, submitting timesheets on time, and maintaining high performance ratings.
              </AlertDescription>
            </Alert>
            
            <Button variant="outline" className="mt-4" data-testid="button-karma-history">
              <History className="w-4 h-4 mr-2" />
              View Transaction History
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card data-testid="card-security-settings">
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
              <Button variant="outline" data-testid="button-setup-2fa">
                <Shield className="w-4 h-4 mr-2" />
                Enable 2FA
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Active Sessions</Label>
              <p className="text-sm text-muted-foreground">
                Manage your active sessions across devices
              </p>
              <Button variant="outline" data-testid="button-manage-sessions">
                <Devices className="w-4 h-4 mr-2" />
                Manage Sessions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card data-testid="card-privacy-settings">
          <CardHeader>
            <CardTitle>Data & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Data Export</Label>
              <p className="text-sm text-muted-foreground">
                Download a copy of your personal data
              </p>
              <Button variant="outline" data-testid="button-export-data">
                <Download className="w-4 h-4 mr-2" />
                Request Data Export
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label className="text-destructive">Account Deletion</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
              <Button variant="destructive" data-testid="button-delete-account">
                <Trash className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card data-testid="card-account-actions">
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Sign Out</p>
                <p className="text-sm text-muted-foreground">
                  Sign out of your account on this device
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
