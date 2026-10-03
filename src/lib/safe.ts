import { unstable_rethrow } from 'next/navigation';

/** Runs an API call for a server component and returns null instead of throwing. */
export async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    // Let Next.js internals through, such as the signal that opts a route into dynamic rendering.
    unstable_rethrow(err);
    console.error(err);
    return null;
  }
}
