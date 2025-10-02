import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { ThemeToggle } from "./theme-toggle";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, Monitor, Keyboard, Eye, Zap } from "lucide-react";

export function DarkModeGuide() {
  const { theme, isDark } = useTheme();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          Dark Mode Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <h3 className="font-medium">Current Theme</h3>
            <p className="text-sm text-muted-foreground">
              {theme === 'light' && 'Light mode - bright and classic'}
              {theme === 'dark' && 'Dark mode - easy on the eyes'}
              {theme === 'system' && 'System mode - follows your device settings'}
            </p>
          </div>
          <Badge variant={isDark ? "default" : "outline"} className="capitalize">
            {theme}
          </Badge>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3 p-3 border rounded-lg">
            <Eye className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">Reduced Eye Strain</h4>
              <p className="text-xs text-muted-foreground">Less blue light for extended use</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 border rounded-lg">
            <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">Battery Savings</h4>
              <p className="text-xs text-muted-foreground">OLED displays use less power</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 border rounded-lg">
            <Monitor className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">System Sync</h4>
              <p className="text-xs text-muted-foreground">Matches your device preference</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <h3 className="font-medium">Theme Controls</h3>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Header Toggle</h4>
              <p className="text-xs text-muted-foreground">Quick access from any page</p>
            </div>
            <ThemeToggle />
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Sidebar Controls</h4>
              <p className="text-xs text-muted-foreground">Full theme options with indicators</p>
            </div>
            <ThemeToggle variant="dropdown" />
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Keyboard Shortcut</h4>
              <p className="text-xs text-muted-foreground">Press Ctrl+Shift+T (Cmd+Shift+T on Mac)</p>
            </div>
            <div className="flex items-center space-x-1">
              <Keyboard className="h-4 w-4" />
              <Badge variant="outline" className="text-xs">
                Ctrl+Shift+T
              </Badge>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-medium text-sm mb-2">💡 Pro Tips</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• System theme automatically switches between light and dark based on your device settings</li>
            <li>• Dark mode is especially helpful during night hours and in low-light environments</li>
            <li>• Your theme preference is saved and will be remembered across sessions</li>
            <li>• All components and colors automatically adapt to your chosen theme</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}