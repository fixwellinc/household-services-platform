import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { useGestureSupport } from '@/hooks/use-gesture-support';

// Test component that uses the gesture hook
const TestComponent: React.FC<{
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
}> = (props) => {
  const { gestureHandlers, isLongPressing } = useGestureSupport(props);
  
  return (
    <div
      data-testid="gesture-area"
      {...gestureHandlers}
      style={{ width: 200, height: 200, background: isLongPressing ? 'red' : 'blue' }}
    >
      Gesture Test Area
      {isLongPressing && <span data-testid="long-press-indicator">Long Pressing</span>}
    </div>
  );
};

describe('useGestureSupport', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('detects swipe left gesture', () => {
    const onSwipeLeft = jest.fn();
    const { getByTestId } = render(<TestComponent onSwipeLeft={onSwipeLeft} />);
    
    const gestureArea = getByTestId('gesture-area');
    
    // Simulate swipe left (start right, end left)
    fireEvent.touchStart(gestureArea, {
      touches: [{ clientX: 150, clientY: 100 }],
    });
    
    fireEvent.touchMove(gestureArea, {
      touches: [{ clientX: 50, clientY: 100 }],
    });
    
    fireEvent.touchEnd(gestureArea);
    
    expect(onSwipeLeft).toHaveBeenCalled();
  });

  it('detects swipe right gesture', () => {
    const onSwipeRight = jest.fn();
    const { getByTestId } = render(<TestComponent onSwipeRight={onSwipeRight} />);
    
    const gestureArea = getByTestId('gesture-area');
    
    // Simulate swipe right (start left, end right)
    fireEvent.touchStart(gestureArea, {
      touches: [{ clientX: 50, clientY: 100 }],
    });
    
    fireEvent.touchMove(gestureArea, {
      touches: [{ clientX: 150, clientY: 100 }],
    });
    
    fireEvent.touchEnd(gestureArea);
    
    expect(onSwipeRight).toHaveBeenCalled();
  });

  it('detects swipe up gesture', () => {
    const onSwipeUp = jest.fn();
    const { getByTestId } = render(<TestComponent onSwipeUp={onSwipeUp} />);
    
    const gestureArea = getByTestId('gesture-area');
    
    // Simulate swipe up (start bottom, end top)
    fireEvent.touchStart(gestureArea, {
      touches: [{ clientX: 100, clientY: 150 }],
    });
    
    fireEvent.touchMove(gestureArea, {
      touches: [{ clientX: 100, clientY: 50 }],
    });
    
    fireEvent.touchEnd(gestureArea);
    
    expect(onSwipeUp).toHaveBeenCalled();
  });

  it('detects swipe down gesture', () => {
    const onSwipeDown = jest.fn();
    const { getByTestId } = render(<TestComponent onSwipeDown={onSwipeDown} />);
    
    const gestureArea = getByTestId('gesture-area');
    
    // Simulate swipe down (start top, end bottom)
    fireEvent.touchStart(gestureArea, {
      touches: [{ clientX: 100, clientY: 50 }],
    });
    
    fireEvent.touchMove(gestureArea, {
      touches: [{ clientX: 100, clientY: 150 }],
    });
    
    fireEvent.touchEnd(gestureArea);
    
    expect(onSwipeDown).toHaveBeenCalled();
  });

  it('detects tap gesture', () => {
    const onTap = jest.fn();
    const { getByTestId } = render(<TestComponent onTap={onTap} />);
    
    const gestureArea = getByTestId('gesture-area');
    
    // Simulate tap (touch start and end without movement)
    fireEvent.touchStart(gestureArea, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    fireEvent.touchEnd(gestureArea);
    
    expect(onTap).toHaveBeenCalled();
  });

  it('detects double tap gesture', async () => {
    const onDoubleTap = jest.fn();
    const { getByTestId } = render(<TestComponent onDoubleTap={onDoubleTap} />);
    
    const gestureArea = getByTestId('gesture-area');
    
    // First tap
    fireEvent.touchStart(gestureArea, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchEnd(gestureArea);
    
    // Advance time slightly but within double tap delay
    jest.advanceTimersByTime(100);
    
    // Second tap
    fireEvent.touchStart(gestureArea, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    fireEvent.touchEnd(gestureArea);
    
    expect(onDoubleTap).toHaveBeenCalled();
  });

  it('detects long press gesture', async () => {
    const onLongPress = jest.fn();
    const { getByTestId } = render(<TestComponent onLongPress={onLongPress} />);
    
    const gestureArea = getByTestId('gesture-area');
    
    // Start touch
    fireEvent.touchStart(gestureArea, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    // Advance time to trigger long press
    jest.advanceTimersByTime(500);
    
    expect(onLongPress).toHaveBeenCalled();
    
    // Check visual indicator
    await waitFor(() => {
      expect(getByTestId('long-press-indicator')).toBeInTheDocument();
    });
  });

  it('cancels long press on movement', () => {
    const onLongPress = jest.fn();
    const { getByTestId } = render(<TestComponent onLongPress={onLongPress} />);
    
    const gestureArea = getByTestId('gesture-area');
    
    // Start touch
    fireEvent.touchStart(gestureArea, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    // Move finger (should cancel long press)
    fireEvent.touchMove(gestureArea, {
      touches: [{ clientX: 120, clientY: 100 }],
    });
    
    // Advance time
    jest.advanceTimersByTime(500);
    
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('detects pinch gesture', () => {
    const onPinch = jest.fn();
    const { getByTestId } = render(<TestComponent onPinch={onPinch} />);
    
    const gestureArea = getByTestId('gesture-area');
    
    // Start with two fingers
    fireEvent.touchStart(gestureArea, {
      touches: [
        { clientX: 80, clientY: 100 },
        { clientX: 120, clientY: 100 },
      ],
    });
    
    // Move fingers apart (zoom in)
    fireEvent.touchMove(gestureArea, {
      touches: [
        { clientX: 60, clientY: 100 },
        { clientX: 140, clientY: 100 },
      ],
    });
    
    expect(onPinch).toHaveBeenCalledWith(expect.any(Number));
  });

  it('ignores small movements below swipe threshold', () => {
    const onSwipeLeft = jest.fn();
    const { getByTestId } = render(<TestComponent onSwipeLeft={onSwipeLeft} />);
    
    const gestureArea = getByTestId('gesture-area');
    
    // Small movement below threshold
    fireEvent.touchStart(gestureArea, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    fireEvent.touchMove(gestureArea, {
      touches: [{ clientX: 80, clientY: 100 }],
    });
    
    fireEvent.touchEnd(gestureArea);
    
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('prioritizes horizontal swipes over vertical when both exceed threshold', () => {
    const onSwipeLeft = jest.fn();
    const onSwipeUp = jest.fn();
    const { getByTestId } = render(
      <TestComponent onSwipeLeft={onSwipeLeft} onSwipeUp={onSwipeUp} />
    );
    
    const gestureArea = getByTestId('gesture-area');
    
    // Diagonal movement with more horizontal component
    fireEvent.touchStart(gestureArea, {
      touches: [{ clientX: 150, clientY: 120 }],
    });
    
    fireEvent.touchMove(gestureArea, {
      touches: [{ clientX: 50, clientY: 80 }],
    });
    
    fireEvent.touchEnd(gestureArea);
    
    expect(onSwipeLeft).toHaveBeenCalled();
    expect(onSwipeUp).not.toHaveBeenCalled();
  });

  it('handles touch end without movement as tap', () => {
    const onTap = jest.fn();
    const onSwipeLeft = jest.fn();
    const { getByTestId } = render(
      <TestComponent onTap={onTap} onSwipeLeft={onSwipeLeft} />
    );
    
    const gestureArea = getByTestId('gesture-area');
    
    // Touch without any move event
    fireEvent.touchStart(gestureArea, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    fireEvent.touchEnd(gestureArea);
    
    expect(onTap).toHaveBeenCalled();
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });
});