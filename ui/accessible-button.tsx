import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccessibleButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  ariaPressed?: boolean;
  tooltip?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    isLoading = false,
    loadingText = 'Loading',
    ariaLabel,
    ariaDescribedBy,
    ariaExpanded,
    ariaControls,
    ariaPressed,
    tooltip,
    disabled,
    className,
    ...props
  }, ref) => {
    const isDisabled = disabled || isLoading;

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-pressed={ariaPressed}
        title={tooltip}
        className={cn(
          // Enhanced focus styles
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          // High contrast mode support
          'contrast-more:border-2 contrast-more:border-foreground',
          className
        )}
        {...props}
      >
        {isLoading && (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            <span className="sr-only">{loadingText}...</span>
          </>
        )}
        {children}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

// Icon button with proper accessibility
interface AccessibleIconButtonProps extends AccessibleButtonProps {
  icon: React.ReactNode;
  label: string; // Required for icon buttons
}

export const AccessibleIconButton = forwardRef<HTMLButtonElement, AccessibleIconButtonProps>(
  ({ icon, label, children, ...props }, ref) => {
    return (
      <AccessibleButton
        ref={ref}
        ariaLabel={label}
        {...props}
      >
        <span aria-hidden="true">{icon}</span>
        {children && <span className="sr-only">{children}</span>}
      </AccessibleButton>
    );
  }
);

AccessibleIconButton.displayName = 'AccessibleIconButton';

// Toggle button with proper ARIA attributes
interface AccessibleToggleButtonProps extends AccessibleButtonProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  pressedLabel?: string;
  unpressedLabel?: string;
}

export const AccessibleToggleButton = forwardRef<HTMLButtonElement, AccessibleToggleButtonProps>(
  ({
    pressed,
    onPressedChange,
    pressedLabel = 'pressed',
    unpressedLabel = 'not pressed',
    children,
    onClick,
    ...props
  }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onPressedChange(!pressed);
      onClick?.(event);
    };

    return (
      <AccessibleButton
        ref={ref}
        role="switch"
        ariaPressed={pressed}
        ariaLabel={`${children}, ${pressed ? pressedLabel : unpressedLabel}`}
        onClick={handleClick}
        {...props}
      >
        {children}
        <span className="sr-only">
          {pressed ? pressedLabel : unpressedLabel}
        </span>
      </AccessibleButton>
    );
  }
);

AccessibleToggleButton.displayName = 'AccessibleToggleButton';