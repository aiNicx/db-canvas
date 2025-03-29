// errorHandling.ts
import { toast } from 'sonner';

interface ErrorOptions<T = unknown> {
  silent?: boolean;
  fallback?: T;
  context?: string;
}

export const handleError = <T = unknown>(error: unknown, message: string, options: ErrorOptions<T> = {}): T => {
  const { silent = false, fallback = null, context = '' } = options;

  console.error(`Error in ${context}:`, error);

  if (!silent) {
    toast.error(message);
  }

  return fallback;
};

export const handleAsyncError = async <T>(
  promise: Promise<T>,
  message: string,
  options: ErrorOptions<T> = {}
): Promise<T | undefined> => {
  try {
    return await promise;
  } catch (error) {
    return handleError(error, message, options) as T | undefined;
  }
};
