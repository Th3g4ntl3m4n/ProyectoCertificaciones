import { useEffect, useState } from "react";
import { toDateInputValue } from "./utils";

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, fallback));

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

export function getOrCreatePlanStart() {
  const key = "cybercert-v1-plan-start";
  const existing = localStorage.getItem(key);

  if (existing) {
    return JSON.parse(existing) as string;
  }

  const today = toDateInputValue(new Date());
  localStorage.setItem(key, JSON.stringify(today));
  return today;
}
