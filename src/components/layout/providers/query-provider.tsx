"use client"

import { persistQueryClient, PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'; // For localStorage

import { queryClient } from "@/lib/query-client.js";
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import React, { useEffect } from 'react';


export function QueryProvider({children} : {
  children: React.ReactNode
}) {
  const persister = createAsyncStoragePersister({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  });
  useEffect(() => {
    // This code only runs on the client and AFTER the initial render (hydration)
    persistQueryClient({
      queryClient,
      persister,
      maxAge: 1000 * 60 * 60 * 24,
    });
  }, [persister]);
  return (
    <PersistQueryClientProvider 
      client={queryClient}
      onSuccess={() => {
        console.log('✅ Cache restored successfully');
        queryClient.resumePausedMutations()
          .then(() => console.log('✅ Mutations resumed successfully'))
          .catch((error) => console.error('❌ Error resuming mutations:', error));
      }}
      persistOptions={{ persister }}
    >
      {children}
      {/* Optional: Add devtools only in development */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false}/>}
    </PersistQueryClientProvider>
  );
}