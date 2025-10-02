import { forwardRef, HTMLAttributes } from 'react';
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

// Enhanced form field with accessibility features
interface AccessibleFormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function AccessibleFormField({
  label,
  error,
  hint,
  required = false,
  children,
  className,
  ...props
}: AccessibleFormFieldProps) {
  const fieldId = `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-2', className)} {...props}>
      <Label 
        htmlFor={fieldId}
        className={cn(
          'text-sm font-medium',
          required && 'after:content-["*"] after:ml-1 after:text-destructive',
          error && 'text-destructive'
        )}
      >
        {label}
        {required && (
          <span className="sr-only">(required)</span>
        )}
      </Label>
      
      {hint && (
        <p 
          id={hintId}
          className="text-xs text-muted-foreground flex items-start gap-1"
        >
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
          {hint}
        </p>
      )}
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby': describedBy,
          'aria-invalid': !!error,
          'aria-required': required,
        })}
      </div>
      
      {error && (
        <p 
          id={errorId}
          role="alert"
          className="text-xs text-destructive flex items-start gap-1"
        >
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

// Enhanced input with accessibility features
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  success?: boolean;
  showRequiredIndicator?: boolean;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({
    label,
    error,
    hint,
    success = false,
    showRequiredIndicator = false,
    required,
    className,
    ...props
  }, ref) => {
    if (label) {
      return (
        <AccessibleFormField
          label={label}
          error={error}
          hint={hint}
          required={required}
        >
          <Input
            ref={ref}
            className={cn(
              error && 'border-destructive focus:border-destructive',
              success && 'border-green-500 focus:border-green-500',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              className
            )}
            {...props}
          />
        </AccessibleFormField>
      );
    }

    return (
      <Input
        ref={ref}
        className={cn(
          error && 'border-destructive focus:border-destructive',
          success && 'border-green-500 focus:border-green-500',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          className
        )}
        aria-invalid={!!error}
        aria-required={required}
        {...props}
      />
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

// Enhanced textarea with accessibility features
interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  success?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
}

export const AccessibleTextarea = forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({
    label,
    error,
    hint,
    success = false,
    maxLength,
    showCharacterCount = false,
    value = '',
    required,
    className,
    ...props
  }, ref) => {
    const charCount = String(value).length;
    const charCountId = showCharacterCount ? `char-count-${Math.random().toString(36).substr(2, 9)}` : undefined;

    const textarea = (
      <div className="relative">
        <Textarea
          ref={ref}
          value={value}
          maxLength={maxLength}
          className={cn(
            error && 'border-destructive focus:border-destructive',
            success && 'border-green-500 focus:border-green-500',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            showCharacterCount && 'pb-8',
            className
          )}
          aria-describedby={charCountId}
          aria-invalid={!!error}
          aria-required={required}
          {...props}
        />
        {showCharacterCount && (
          <div 
            id={charCountId}
            className="absolute bottom-2 right-2 text-xs text-muted-foreground"
            aria-live="polite"
          >
            {charCount}{maxLength && `/${maxLength}`}
          </div>
        )}
      </div>
    );

    if (label) {
      return (
        <AccessibleFormField
          label={label}
          error={error}
          hint={hint}
          required={required}
        >
          {textarea}
        </AccessibleFormField>
      );
    }

    return textarea;
  }
);

AccessibleTextarea.displayName = 'AccessibleTextarea';

// Success message component
export function SuccessMessage({ 
  message, 
  className 
}: { 
  message: string; 
  className?: string; 
}) {
  return (
    <p 
      role="status" 
      className={cn('text-xs text-green-600 flex items-start gap-1', className)}
    >
      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}