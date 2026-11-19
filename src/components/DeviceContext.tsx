"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";
export type Orientation = "portrait" | "landscape";

export interface DeviceInfo {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  viewportWidth: number;
  orientation: Orientation;
}

const DEFAULT_DEVICE: DeviceInfo = {
  deviceType: "desktop",
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  viewportWidth: 1280,
  orientation: "landscape",
};

const DeviceContext = createContext<DeviceInfo>(DEFAULT_DEVICE);

function detectDevice(): DeviceInfo {
  if (typeof window === "undefined") return DEFAULT_DEVICE;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const orientation: Orientation = height >= width ? "portrait" : "landscape";
  const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";

  const isTabletUA =
    /ipad|tablet|playbook|silk|(android(?!.*mobi))/.test(ua) ||
    (navigator.maxTouchPoints > 1 && /macintosh/.test(ua));
  const isMobileUA =
    /iphone|ipod|android.*mobile|windows phone|blackberry|iemobile|opera mini/.test(
      ua
    );

  let deviceType: DeviceType = "desktop";
  if (width < 768 || (isMobileUA && width < 900)) {
    deviceType = "mobile";
  } else if (width <= 1024 || (isTabletUA && width <= 1280)) {
    deviceType = "tablet";
  } else {
    deviceType = "desktop";
  }

  return {
    deviceType,
    isMobile: deviceType === "mobile",
    isTablet: deviceType === "tablet",
    isDesktop: deviceType === "desktop",
    viewportWidth: width,
    orientation,
  };
}

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [device, setDevice] = useState<DeviceInfo>(DEFAULT_DEVICE);

  useEffect(() => {
    const update = () => {
      const info = detectDevice();
      setDevice(info);
      document.documentElement.setAttribute("data-device", info.deviceType);
    };

    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return (
    <DeviceContext.Provider value={device}>{children}</DeviceContext.Provider>
  );
}

export function useDevice(): DeviceInfo {
  return useContext(DeviceContext);
}
