"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

const POSTHOG_PROXY_PATH = "/pvd";
const POSTHOG_UI_HOST = "https://us.posthog.com";

function PostHogPageView({ isInitialized }: { isInitialized: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastCapturedUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!isInitialized || !pathname) {
      return;
    }

    const query = searchParams.toString();
    const currentUrl = `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;

    if (lastCapturedUrl.current === currentUrl) {
      return;
    }

    lastCapturedUrl.current = currentUrl;
    posthog.capture("$pageview", {
      $current_url: currentUrl,
      $pathname: pathname
    });
  }, [isInitialized, pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const appOpenCaptured = useRef(false);

  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

    if (!posthogKey) {
      return;
    }

    if (!posthog.__loaded) {
      posthog.init(posthogKey, {
        api_host: POSTHOG_PROXY_PATH,
        ui_host: POSTHOG_UI_HOST,
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: true,
        disable_session_recording: false,
        loaded: (client) => {
          setIsInitialized(true);

          if (!appOpenCaptured.current) {
            appOpenCaptured.current = true;
            client.capture("app_open");
          }
        }
      });
    } else {
      setIsInitialized(true);

      if (!appOpenCaptured.current) {
        appOpenCaptured.current = true;
        posthog.capture("app_open");
      }
    }
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView isInitialized={isInitialized} />
      </Suspense>
      {children}
    </PHProvider>
  );
}
