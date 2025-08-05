type TryCatchResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: Error };

/**
 * Wraps an async function in a try/catch block for easier error handling.
 * @param fn - async function to wrap
 * @returns Promise with result object containing success status, data, and error
 */
export const tryCatch = async <T>(
  fn: () => Promise<T>,
): Promise<TryCatchResult<T>> => {
  try {
    const data = await fn();
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: error as Error };
  }
};
