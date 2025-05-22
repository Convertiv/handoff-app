import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Filters out null values
 * @param value
 * @returns
 */
export const filterOutNull = <T>(value: T): value is NonNullable<T> => value !== null;
