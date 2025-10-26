/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Truncates a string to a specified length and adds an ellipsis
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};


export function convertToBoolean(value: any): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const lowercased = value.toLowerCase()
    return lowercased === "true" || lowercased === "ya" || lowercased === "y" || lowercased === "1"
  }
  if (typeof value === "number") return value === 1
  return false
}

