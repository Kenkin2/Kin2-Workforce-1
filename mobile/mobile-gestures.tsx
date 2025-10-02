import { useState, useRef, useEffect, ReactNode } from 'react';
import { useHapticFeedback } from '@/hooks/useMobileFeatures';

interface GestureState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  isActive: boolean;
  velocity: number;
  direction: 'up' | 'down' | 'left' | 'right' | null;
}

interface SwipeGestureProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

interface PinchGestureProps {
  children: ReactNode;
  onPinchStart?: () => void;
  onPinch?: (scale: number) => void;
  onPinchEnd?: (scale: number) => void;
  className?: string;
}

interface LongPressProps {
  children: ReactNode;
  onLongPress: () => void;
  delay?: number;
  className?: string;
}

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
  className?: string;
}

export function SwipeGesture({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = ''
}: SwipeGestureProps) {
  const [gestureState, setGestureState] = useState<GestureState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    isActive: false,
    velocity: 0,
    direction: null,
  });

  const { lightTap } = useHapticFeedback();
  const elementRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setGestureState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      isActive: true,
      velocity: 0,
      direction: null,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!gestureState.isActive) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - gestureState.startX;
    const deltaY = touch.clientY - gestureState.startY;

    setGestureState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
    }));
  };

  const handleTouchEnd = () => {
    if (!gestureState.isActive) return;

    const absDeltaX = Math.abs(gestureState.deltaX);
    const absDeltaY = Math.abs(gestureState.deltaY);

    if (absDeltaX > threshold || absDeltaY > threshold) {
      lightTap();

      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (gestureState.deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (gestureState.deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    setGestureState(prev => ({ ...prev, isActive: false }));
  };

  return (
    <div
      ref={elementRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {children}
    </div>
  );
}

export function PinchGesture({
  children,
  onPinchStart,
  onPinch,
  onPinchEnd,
  className = ''
}: PinchGestureProps) {
  const [isPinching, setIsPinching] = useState(false);
  const [initialDistance, setInitialDistance] = useState(0);
  const [currentScale, setCurrentScale] = useState(1);
  const { lightTap } = useHapticFeedback();

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialDistance(distance);
      setIsPinching(true);
      onPinchStart?.();
      lightTap();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPinching && e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      const scale = distance / initialDistance;
      setCurrentScale(scale);
      onPinch?.(scale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPinching && e.touches.length < 2) {
      setIsPinching(false);
      onPinchEnd?.(currentScale);
      setCurrentScale(1);
    }
  };

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      {children}
    </div>
  );
}

export function LongPress({
  children,
  onLongPress,
  delay = 800,
  className = ''
}: LongPressProps) {
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { longPress } = useHapticFeedback();

  const handleStart = () => {
    setIsPressed(true);
    timeoutRef.current = setTimeout(() => {
      longPress();
      onLongPress();
    }, delay);
  };

  const handleEnd = () => {
    setIsPressed(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`${className} ${isPressed ? 'scale-95 opacity-80' : ''} transition-transform`}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      {children}
    </div>
  );
}

export function PullToRefresh({
  children,
  onRefresh,
  refreshThreshold = 80,
  className = ''
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { success } = useHapticFeedback();

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY && containerRef.current?.scrollTop === 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY);
      setPullDistance(distance);

      // Prevent default scrolling when pulling down
      if (distance > 0) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > refreshThreshold && !isRefreshing) {
      setIsRefreshing(true);
      success();
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setStartY(0);
      }
    } else {
      setPullDistance(0);
      setStartY(0);
    }
  };

  const refreshProgress = Math.min(pullDistance / refreshThreshold, 1);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 bg-primary/10 transition-all duration-200"
          style={{ 
            height: Math.max(pullDistance * 0.8, isRefreshing ? 60 : 0),
            transform: `translateY(${isRefreshing ? 0 : -20}px)`
          }}
        >
          <div className="flex items-center space-x-2 text-primary">
            {isRefreshing ? (
              <>
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Refreshing...</span>
              </>
            ) : (
              <>
                <div 
                  className="w-5 h-5 border-2 border-primary rounded-full transition-transform"
                  style={{ 
                    transform: `rotate(${refreshProgress * 180}deg)`,
                    borderTopColor: refreshProgress >= 1 ? 'transparent' : 'currentColor'
                  }}
                />
                <span className="text-sm font-medium">
                  {refreshProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: `translateY(${Math.min(pullDistance * 0.5, 40)}px)`,
          transition: isRefreshing ? 'transform 0.2s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function DoubleTap({
  children,
  onDoubleTap,
  delay = 300,
  className = ''
}: {
  children: ReactNode;
  onDoubleTap: () => void;
  delay?: number;
  className?: string;
}) {
  const [lastTap, setLastTap] = useState(0);
  const { doubleTap } = useHapticFeedback();

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < delay) {
      doubleTap();
      onDoubleTap();
    }
    setLastTap(now);
  };

  return (
    <div
      className={className}
      onClick={handleTap}
    >
      {children}
    </div>
  );
}