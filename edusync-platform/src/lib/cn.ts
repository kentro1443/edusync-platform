import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names safely, resolving conflicting utility
 * classes (e.g. "p-2 p-4" -> "p-4") while preserving conditional logic.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}