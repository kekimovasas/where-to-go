"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log("POSTHOG PROVIDER MOUNTED");

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    console.log("POSTHOG KEY", posthogKey);
    console.log("POSTHOG HOST", posthogHost);

    if (!posthogKey || !posthogHost) {
      return;
    }

    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      disable_session_recording: false
    });

    posthog.capture("test_event");
    posthog.capture("app_open");
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
