import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHours(hours: number) {
  if (hours < 1 && hours > 0) {
    return `${Math.round(hours * 60)} min`;
  }

  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
