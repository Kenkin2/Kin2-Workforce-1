import { useEffect } from 'react';
import { useTheme } from './useTheme';

export function useKeyboardShortcuts() {
  const { toggleTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+T (or Cmd+Shift+T on Mac) to toggle theme
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        toggleTheme();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleTheme]);
}

// Hook for general keyboard shortcuts that can be used across the app
export function useGlobalKeyboardShortcuts() {
  useKeyboardShortcuts();
}