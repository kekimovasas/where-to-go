"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
};

type TelegramWebApp = {
  initDataUnsafe?: {
    user?: TelegramUser;
  };
  ready: () => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

let syncInFlight: Promise<void> | null = null;
let lastSyncStartedAt = 0;

function logSupabaseError(stage: string, error: unknown) {
  console.error("[Users] Error:", error);
  console.error(`[Users] Failed stage: ${stage}`);
}

async function syncTelegramUser() {
  console.log("[Users] Sync started");

  const telegramWebApp = window.Telegram?.WebApp;

  if (!telegramWebApp) {
    console.error("[Users] Error: Telegram Web App is unavailable");
    return;
  }

  telegramWebApp.ready();

  const telegramUser = telegramWebApp.initDataUnsafe?.user;
  console.log("[Users] Telegram user:", telegramUser);

  if (!telegramUser) {
    console.error("[Users] Error: Telegram user is unavailable");
    return;
  }

  const telegramId = String(telegramUser.id);
  const now = new Date().toISOString();
  console.log(`[Users] Telegram user received: ${telegramId}`);

  const lookupResponse = await supabase
    .from("users")
    .select("telegram_id, total_sessions")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  const { data: existingUser, error: selectError } = lookupResponse;

  console.log("[Users] Lookup response:", lookupResponse);
  console.log("[Users] Existing user:", existingUser);
  console.log(
    `[Users] User found by telegram_id ${telegramId}: ${existingUser ? "yes" : "no"}`
  );

  if (selectError) {
    logSupabaseError("user lookup", selectError);
    return;
  }

  if (!existingUser) {
    console.log(`[Users] Creating user: ${telegramId}`);

    const insertResponse = await supabase
      .from("users")
      .upsert(
        {
          telegram_id: telegramId,
          username: telegramUser.username ?? null,
          first_name: telegramUser.first_name ?? null,
          status: "active",
          first_seen_at: now,
          last_seen_at: now,
          total_sessions: 1,
          source: null,
          utm_source: null,
          utm_medium: null,
          utm_campaign: null
        },
        { onConflict: "telegram_id", ignoreDuplicates: false }
      )
      .select("telegram_id, total_sessions, first_seen_at, last_seen_at")
      .single();
    const { data: insertedUser, error: insertError } = insertResponse;

    console.log("[Users] Insert/upsert response:", insertResponse);

    if (insertError) {
      logSupabaseError("user creation", insertError);
      return;
    }

    if (!insertedUser) {
      console.error("[Users] Error: Supabase returned no user after creation");
      return;
    }

    console.log(`[Users] New user created: ${telegramId}`);
    return;
  }

  const totalSessions = Number(existingUser.total_sessions ?? 0) + 1;
  const updatePayload = {
    username: telegramUser.username ?? null,
    first_name: telegramUser.first_name ?? null,
    last_seen_at: now,
    total_sessions: totalSessions,
    updated_at: now
  };

  console.log("[Users] Updating user:", updatePayload);

  const updateResponse = await supabase
    .from("users")
    .update(updatePayload)
    .eq("telegram_id", telegramId)
    .select("telegram_id, total_sessions, first_seen_at, last_seen_at, updated_at")
    .maybeSingle();
  const { data: updatedUser, error: updateError } = updateResponse;

  console.log("[Users] Update response:", updateResponse);

  if (updateError) {
    logSupabaseError("user update", updateError);
    return;
  }

  if (!updatedUser) {
    console.error(
      "[Users] Error: Supabase update returned no row. Check the UPDATE RLS policy for public.users."
    );
    return;
  }

  console.log(`[Users] User updated: ${telegramId}`, {
    total_sessions: updatedUser.total_sessions,
    last_seen_at: updatedUser.last_seen_at
  });
}

function runUserSync() {
  const now = Date.now();

  if (syncInFlight || now - lastSyncStartedAt < 2000) {
    console.log("[Users] Sync skipped: already running or recently completed");
    return syncInFlight ?? Promise.resolve();
  }

  lastSyncStartedAt = now;
  syncInFlight = syncTelegramUser()
    .catch((error: unknown) => {
      logSupabaseError("unexpected sync failure", error);
    })
    .finally(() => {
      syncInFlight = null;
    });

  return syncInFlight;
}

export function TelegramUserSync() {
  useEffect(() => {
    void runUserSync();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        console.log("[Users] Mini App became visible, starting session sync");
        void runUserSync();
      }
    }

    function handleWindowFocus() {
      console.log("[Users] Mini App window focused, starting session sync");
      void runUserSync();
    }

    function handlePageShow() {
      console.log("[Users] Mini App page shown, starting session sync");
      void runUserSync();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return null;
}
