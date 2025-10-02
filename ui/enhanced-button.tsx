import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface EnhancedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  "data-testid"?: string;
}

export function EnhancedButton({ 
  children, 
  onClick, 
  variant = "default", 
  size = "default",
  className,
  disabled,
  loading,
  icon,
  "data-testid": testId,
  ...props 
}: EnhancedButtonProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    if (loading || disabled) return;
    
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
    
    if (onClick) {
      onClick();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "transition-all duration-300 transform active:scale-95 hover:shadow-lg focus:ring-2 focus:ring-primary focus:ring-offset-2",
        variant === "default" && "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover:shadow-xl hover:-translate-y-1",
        isClicked && "scale-95",
        loading && "opacity-70 cursor-not-allowed animate-pulse",
        className
      )}
      onClick={handleClick}
      disabled={disabled || loading}
      data-testid={testId}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span className="animate-pulse">Loading...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {icon && <i className={cn(icon, "text-sm transition-transform group-hover:scale-110")}></i>}
          {children}
        </div>
      )}
    </Button>
  );
}