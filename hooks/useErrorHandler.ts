import { useCallback } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface ErrorHandlerOptions {
  showToast?: boolean;
  level?: 'info' | 'warning' | 'error' | 'critical';
  context?: string;
}

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback((
    error: Error | string,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      level = 'error',
      context = 'Application'
    } = options;

    const errorMessage = typeof error === 'string' ? error : error.message;
    const isNetworkError = errorMessage.toLowerCase().includes('network');
    const isValidationError = errorMessage.toLowerCase().includes('validation');
    const isAuthError = errorMessage.toLowerCase().includes('unauthorized') || 
                       errorMessage.toLowerCase().includes('forbidden');

    // Log error for debugging
    console.error(`[${context}] Error:`, error);

    if (showToast) {
      let title = 'Error';
      let description = errorMessage;
      let variant: 'default' | 'destructive' = 'destructive';

      // Customize messages based on error type
      if (isNetworkError) {
        title = 'Connection Problem';
        description = 'Please check your internet connection and try again.';
      } else if (isValidationError) {
        title = 'Validation Error';
        description = 'Please check your input and try again.';
        variant = 'default';
      } else if (isAuthError) {
        title = 'Access Denied';
        description = 'You need to log in to access this feature.';
      } else if (level === 'warning') {
        title = 'Warning';
        variant = 'default';
      } else if (level === 'info') {
        title = 'Information';
        variant = 'default';
      }

      toast({
        title,
        description,
        variant,
        duration: level === 'critical' ? 10000 : 5000,
      });
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production' && level === 'critical') {
      // Integration point for error monitoring services
      console.error('Critical error logged:', {
        error: errorMessage,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }

    return {
      isNetworkError,
      isValidationError,
      isAuthError,
      message: errorMessage
    };
  }, [toast]);

  const handleAsyncError = useCallback(async (
    asyncFn: () => Promise<any>,
    options: ErrorHandlerOptions = {}
  ) => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, options);
      throw error; // Re-throw to allow caller to handle if needed
    }
  }, [handleError]);

  const handleFormError = useCallback((
    error: Error | string,
    fieldName?: string
  ) => {
    const errorDetails = handleError(error, {
      showToast: false,
      context: 'Form Validation'
    });

    // Return structured error for form handling
    return {
      ...errorDetails,
      fieldName,
      userMessage: errorDetails.isValidationError 
        ? `Please check the ${fieldName || 'form'} and try again.`
        : 'An error occurred while processing your request.'
    };
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
    handleFormError
  };
}

// Hook for API error handling
export function useApiErrorHandler() {
  const { handleError } = useErrorHandler();
  const [, setLocation] = useLocation();

  const handleApiError = useCallback((error: any, context = 'API') => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      if (status === 401) {
        handleError('Your session has expired. Please log in again.', {
          level: 'warning',
          context
        });
        // Redirect to login
        setTimeout(() => {
          setLocation('/auth');
        }, 2000);
      } else if (status === 403) {
        handleError('You don\'t have permission to perform this action.', {
          level: 'warning',
          context
        });
      } else if (status === 404) {
        handleError('The requested resource was not found.', {
          level: 'warning',
          context
        });
      } else if (status >= 500) {
        handleError('Server error. Please try again later.', {
          level: 'error',
          context
        });
      } else {
        handleError(message, { context });
      }
    } else if (error.request) {
      // Network error
      handleError('Network error. Please check your connection.', {
        level: 'error',
        context
      });
    } else {
      // Other error
      handleError(error.message || 'An unexpected error occurred.', {
        context
      });
    }
  }, [handleError, setLocation]);

  return { handleApiError };
}