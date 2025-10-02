import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    testId?: string;
  };
  className?: string;
  variant?: "default" | "compact";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "text-center",
        isCompact ? "py-6" : "py-12",
        className
      )}
      role="status"
      aria-label={title}
      data-testid="empty-state"
    >
      <Icon
        className={cn(
          "text-muted-foreground mb-4 mx-auto",
          isCompact ? "w-12 h-12" : "w-16 h-16"
        )}
        aria-hidden="true"
      />
      <h3
        className={cn(
          "font-semibold text-foreground mb-2",
          isCompact ? "text-base" : "text-lg"
        )}
        data-testid="empty-state-title"
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-muted-foreground",
            isCompact ? "text-sm" : "mb-4"
          )}
          data-testid="empty-state-description"
        >
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          data-testid={action.testId || "empty-state-action"}
          className={isCompact ? "mt-3" : "mt-4"}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
