"use client";

import { createContext, useContext } from "react";

const AppUrlContext = createContext<string>("https://app.tradeaihub.com");

export function AppUrlProvider({
  appUrl,
  children,
}: {
  appUrl: string;
  children: React.ReactNode;
}) {
  return (
    <AppUrlContext.Provider value={appUrl}>{children}</AppUrlContext.Provider>
  );
}

export function useAppUrl() {
  return useContext(AppUrlContext);
}
