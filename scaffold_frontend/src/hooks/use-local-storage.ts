import { useEffect, useState } from 'react';

export const useLocalStorage = <T>(
  key: string,
  initialValue?: T
): [T | undefined, (value: T | undefined) => void, (key: string) => void] => {
  const [storedValue, setStoredValue] = useState(initialValue);

  useEffect(() => {
    // Retrieve from localStorage
    const item = window.localStorage.getItem(key);
    if (item) {
      setStoredValue(JSON.parse(item));
    }
  }, [key]);

  const setValue = (value: T | undefined) => {
    // Save state
    setStoredValue(value);
    // Save to localStorage
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  const clearValue = (key: string) => {
    setStoredValue(undefined);
    window.localStorage.removeItem(key);
  };
  return [storedValue, setValue, clearValue];
};
