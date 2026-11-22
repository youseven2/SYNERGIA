"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  recordDurationSeconds,
  recordSectionView,
  recordVisit,
} from "@/lib/analytics-store";

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (!window.sessionStorage.getItem("synergia_visit_counted")) {
        window.sessionStorage.setItem("synergia_visit_counted", "1");
        recordVisit();
      }
    } catch {
      recordVisit();
    }

    const timer = window.setInterval(() => {
      if (!document.hidden) {
        recordDurationSeconds(5);
      }
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (pathname === "/") {
      recordSectionView("Inicio");
    } else if (pathname.startsWith("/inscripcion")) {
      recordSectionView("Inscripción");
    } else if (pathname.startsWith("/sistema")) {
      recordSectionView("Sistema");
    }
  }, [pathname]);

  return null;
}
