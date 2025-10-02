import { useEffect, useRef, useState, useCallback } from 'react';

// Hook for managing focus
export function useFocus<T extends HTMLElement = HTMLElement>() {
  const elementRef = useRef<T>(null);

  const focus = useCallback(() => {
    elementRef.current?.focus();
  }, []);

  const blur = useCallback(() => {
    elementRef.current?.blur();
  }, []);

  return { elementRef, focus, blur };
}

// Hook for keyboard navigation
export function useKeyboardNavigation(
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          if (onEnter && event.target instanceof HTMLElement) {
            // Only trigger if not in an input that handles Enter
            if (!['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
              event.preventDefault();
              onEnter();
            }
          }
          break;
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'ArrowUp':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('up');
          }
          break;
        case 'ArrowDown':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('down');
          }
          break;
        case 'ArrowLeft':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('left');
          }
          break;
        case 'ArrowRight':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('right');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEnter, onEscape, onArrowKeys]);
}

// Hook for managing ARIA live regions
export function useAriaLiveRegion() {
  const [message, setMessage] = useState('');
  const [polite, setPolite] = useState<'polite' | 'assertive'>('polite');

  const announce = useCallback((text: string, priority: 'polite' | 'assertive' = 'polite') => {
    setMessage(''); // Clear first to ensure screen readers notice the change
    setTimeout(() => {
      setMessage(text);
      setPolite(priority);
    }, 100);
  }, []);

  const clear = useCallback(() => {
    setMessage('');
  }, []);

  return { message, polite, announce, clear };
}

// Hook for focus trap (for modals, dialogs)
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first element when trap activates
    firstElement?.focus();

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isActive]);

  return containerRef;
}

// Hook for screen reader detection
export function useScreenReader() {
  const [isScreenReader, setIsScreenReader] = useState(false);

  useEffect(() => {
    // Check for screen reader indicators
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    
    const win = window as any;
    const hasScreenReader = 
      'speechSynthesis' in win ||
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      (typeof win.matchMedia === 'function' ? win.matchMedia('(prefers-reduced-motion: reduce)').matches : false);

    setIsScreenReader(hasScreenReader);
  }, []);

  return isScreenReader;
}

// Hook for managing reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (event: MediaQueryListEvent) => {
        setPrefersReducedMotion(event.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

// Hook for managing high contrast preference
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    // Check if matchMedia is supported
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)');
      setPrefersHighContrast(mediaQuery.matches);

      const handleChange = (event: MediaQueryListEvent) => {
        setPrefersHighContrast(event.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  return prefersHighContrast;
}