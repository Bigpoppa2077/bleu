"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Safely load JSON from localStorage
 */
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
    return fallback;
  }
}

/**
 * Safely save JSON to localStorage
 */
export function saveJSON<T>(key: string, value: T): boolean {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
    return false;
  }
}

/**
 * React hook for localStorage state - SSR safe for Next.js
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);
  const hydrationRef = useRef(false);

  // Load from localStorage only once on mount
  useEffect(() => {
    if (hydrationRef.current) return;
    hydrationRef.current = true;

    const loaded = loadJSON(key, initialValue);
    setState(loaded);
  }, [key, initialValue]);

  // Handle state updates
  const setStateWithStorage = (value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const newValue = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
      saveJSON(key, newValue);
      return newValue;
    });
  };

  return [state, setStateWithStorage];
}
