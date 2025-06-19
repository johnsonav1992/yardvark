/**
 * Capitalizes the first letter of a string.
 *
 * @param text - The string to capitalize
 * @returns A new string with the first letter capitalized
 *
 * @example
 * ```typescript
 * capitalize('hello'); // returns 'Hello'
 * capitalize('world'); // returns 'World'
 * ```
 */
export const capitalize = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};
