import { QueryClient } from '@tanstack/react-query';

/** Shared TanStack Query client: GPF capabilities are static for a session. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, refetchOnWindowFocus: false, retry: 1 },
    },
  });
}
