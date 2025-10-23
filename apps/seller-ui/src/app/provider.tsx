"use client";

import React, { useEffect } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { WebSocketProvider } from "@/context/web-socket-context";
import useSeller from "@/hook/useSeller";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // Cache persists for 24 hours
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : null,
});

const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <ReactQueryDevtools initialIsOpen={false} />
      <ProvidersWithWebSocket>{children}</ProvidersWithWebSocket>
    </PersistQueryClientProvider>
  );
};

const ProvidersWithWebSocket = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { seller } = useSeller();

  useEffect(() => {
    console.log("👀 Checking seller:", seller?.id);
    if (!seller?.id) return;
    console.log("🔌 Initializing WebSocket connection...");
  }, []);

  return <WebSocketProvider seller={seller}>{children}</WebSocketProvider>;
};

export default Provider;
