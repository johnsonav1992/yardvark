/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/**
 * Wraps an async function in a try/catch block
 * @param fn - async function to wrap
 * @returns Promise<{ data: T | null; error: Error | null }>
 */
export const tryCatch = async <T>(
  fn: () => Promise<T>,
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
