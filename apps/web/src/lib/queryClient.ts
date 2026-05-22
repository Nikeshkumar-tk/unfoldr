import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Auth-gated APIs benefit from sane defaults: don't refetch on every
      // window focus (annoying for forms), but do refetch on reconnect so
      // a flaky network doesn't leave the UI stale.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 30_000,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
