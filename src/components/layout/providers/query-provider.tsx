"use client"

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'; // For localStorage

import { queryClient } from "@/lib/query-client";
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import React from 'react';

export function QueryProvider({children} : {
    children: React.ReactNode
}) {
    const persister = createAsyncStoragePersister({
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    });
    return (
        <PersistQueryClientProvider 
            client={queryClient}
            onSuccess={() => queryClient.resumePausedMutations()}
            persistOptions={{ persister }}>
            {children}
            {/* Optional: Add devtools only in development */}
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false}/>}
        </PersistQueryClientProvider>
    );
}