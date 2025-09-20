import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number | null) {
  // FIX: Initialize useRef with the callback to fix "Expected 1 arguments, but got 0" error
  // and ensure the ref is always populated.
  const savedCallback = useRef(callback);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      // The ref is initialized with a value and is always populated, so we can call it directly.
      savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
