"use client";

import { ReactNode } from "react";
import { DeviceProvider } from "@/components/DeviceContext";
import { I18nProvider } from "@/components/I18nContext";
import { FloatingSocials } from "@/components/FloatingSocials";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <DeviceProvider>
      <I18nProvider>
        {children}
        <FloatingSocials />
      </I18nProvider>
    </DeviceProvider>
  );
}
