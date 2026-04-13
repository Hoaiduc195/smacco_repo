import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook for debounced values
 * @param {*} value - The value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default 500ms)
 * @returns {*} The debounced value
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
