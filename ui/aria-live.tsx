import { useEffect, useRef } from 'react';

interface AriaLiveProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

export function AriaLive({
  message,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions',
  className = ''
}: AriaLiveProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure the live region is announced by briefly clearing and setting content
    if (regionRef.current && message) {
      regionRef.current.textContent = '';
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      }, 100);
    }
  }, [message]);

  return (
    <div
      ref={regionRef}
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  );
}

// Component for announcements that should interrupt screen reader
export function AriaAlert({
  message,
  className = ''
}: {
  message: string;
  className?: string;
}) {
  return (
    <AriaLive
      message={message}
      politeness="assertive"
      className={className}
    />
  );
}

// Component for status updates that shouldn't interrupt
export function AriaStatus({
  message,
  className = ''
}: {
  message: string;
  className?: string;
}) {
  return (
    <AriaLive
      message={message}
      politeness="polite"
      className={className}
    />
  );
}