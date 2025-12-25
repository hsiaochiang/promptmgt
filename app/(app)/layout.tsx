"use client";

import React from "react";
import { AppShell } from "./components/app-shell";
import { MockAppProvider } from "./providers/mock-app";

type Props = { children: React.ReactNode };

export default function AppLayout({ children }: Props) {
  return (
    <MockAppProvider>
      <AppShell>{children}</AppShell>
    </MockAppProvider>
  );
}
