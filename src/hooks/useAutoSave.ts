import { useEffect, useRef } from 'react';

/**
 * Custom hook for auto-saving form data with debounce
 * @param callback - Function to call when saving
 * @param data - Data to watch for changes
 * @param delay - Debounce delay in milliseconds (default: 500ms)
 */
export function useAutoSave<T>(
  callback: (data: T) => void,
  data: T,
  delay: number = 500
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip auto-save on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      callback(data);
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, callback]);
}
