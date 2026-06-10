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

type DebugStep =
  | "telegram_user_received"
  | "select_started"
  | "select_success"
  | "select_error"
  | "insert_started"
  | "insert_success"
  | "insert_error"
  | "update_started"
  | "update_success"
  | "update_error"
  | "early_return";

function serializeError(error: unknown) {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null
    };
  }

  if (typeof error === "object") {
    return error;
  }

  return { message: String(error) };
}

async function writeDebugLog({
  telegramId,
  step,
  payload = null,
  error = null
}: {
  telegramId: string | null;
  step: DebugStep;
  payload?: unknown;
  error?: unknown;
}) {
  try {
    const debugResponse = await supabase.from("users_debug_logs").insert({
      telegram_id: telegramId,
      step,
      payload,
      error: serializeError(error)
    });

    if (debugResponse.error) {
      console.error("[Users] Debug log write failed:", debugResponse.error);
    }
  } catch (debugError) {
    console.error("[Users] Debug log request failed:", debugError);
  }
}

function logSupabaseError(stage: string, error: unknown) {
  console.error("[Users] Error:", error);
  console.error(`[Users] Failed stage: ${stage}`);
}

function logReturn(reason: string) {
  console.log(`[Users] Return: ${reason}`);
}

async function syncTelegramUser() {
  console.log("[Users] Sync started");

  const telegramWebApp = window.Telegram?.WebApp;

  if (!telegramWebApp) {
    console.error("[Users] Error: Telegram Web App is unavailable");
    await writeDebugLog({
      telegramId: null,
      step: "early_return",
      payload: { reason: "Telegram Web App is unavailable" }
    });
    logReturn("Telegram Web App is unavailable");
    return;
  }

  telegramWebApp.ready();

  const telegramUser = telegramWebApp.initDataUnsafe?.user;
  console.log("[Users] Telegram user:", telegramUser);

  if (!telegramUser) {
    console.error("[Users] Error: Telegram user is unavailable");
    await writeDebugLog({
      telegramId: null,
      step: "early_return",
      payload: { reason: "Telegram user is unavailable" }
    });
    logReturn("Telegram user is unavailable");
    return;
  }

  const telegramId = String(telegramUser.id);
  const now = new Date().toISOString();
  console.log(`[Users] Telegram user received: ${telegramId}`);

  await writeDebugLog({
    telegramId,
    step: "telegram_user_received",
    payload: {
      username: telegramUser.username ?? null,
      first_name: telegramUser.first_name ?? null,
      sync_started_at: now
    }
  });

  await writeDebugLog({
    telegramId,
    step: "select_started",
    payload: { filter: { telegram_id: telegramId } }
  });

  const lookupResponse = await supabase
    .from("users")
    .select("telegram_id, total_sessions")
    .eq("telegram_id", telegramId)
    .maybeSingle();
  const { data: existingUser, error: selectError } = lookupResponse;

  console.log("[Users] Lookup response:", lookupResponse);
  console.log("[Users] Existing user:", existingUser);
  console.log(
    "[Users] Current total_sessions:",
    existingUser?.total_sessions ?? null
  );
  console.log(
    `[Users] User found by telegram_id ${telegramId}: ${existingUser ? "yes" : "no"}`
  );

  if (selectError) {
    await writeDebugLog({
      telegramId,
      step: "select_error",
      payload: { response: lookupResponse },
      error: selectError
    });
    logSupabaseError("user lookup", selectError);
    await writeDebugLog({
      telegramId,
      step: "early_return",
      payload: { reason: "user lookup failed" },
      error: selectError
    });
    logReturn("user lookup failed");
    return;
  }

  await writeDebugLog({
    telegramId,
    step: "select_success",
    payload: {
      existing_user: existingUser,
      current_total_sessions: existingUser?.total_sessions ?? null,
      user_found: Boolean(existingUser),
      response: lookupResponse
    }
  });

  if (!existingUser) {
    console.log(`[Users] Creating user: ${telegramId}`);

    const insertPayload = {
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
    };

    await writeDebugLog({
      telegramId,
      step: "insert_started",
      payload: insertPayload
    });

    const insertResponse = await supabase
      .from("users")
      .upsert(insertPayload, {
        onConflict: "telegram_id",
        ignoreDuplicates: false
      })
      .select("telegram_id, total_sessions, first_seen_at, last_seen_at")
      .single();
    const { data: insertedUser, error: insertError } = insertResponse;

    console.log("[Users] Insert/upsert response:", insertResponse);

    if (insertError) {
      await writeDebugLog({
        telegramId,
        step: "insert_error",
        payload: { request: insertPayload, response: insertResponse },
        error: insertError
      });
      logSupabaseError("user creation", insertError);
      await writeDebugLog({
        telegramId,
        step: "early_return",
        payload: { reason: "user creation failed" },
        error: insertError
      });
      logReturn("user creation failed");
      return;
    }

    if (!insertedUser) {
      console.error("[Users] Error: Supabase returned no user after creation");
      await writeDebugLog({
        telegramId,
        step: "early_return",
        payload: {
          reason: "user creation returned no row",
          request: insertPayload,
          response: insertResponse
        }
      });
      logReturn("user creation returned no row");
      return;
    }

    await writeDebugLog({
      telegramId,
      step: "insert_success",
      payload: { request: insertPayload, response: insertResponse }
    });
    console.log(`[Users] New user created: ${telegramId}`);
    await writeDebugLog({
      telegramId,
      step: "early_return",
      payload: { reason: "new user creation completed" }
    });
    logReturn("new user creation completed");
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

  await writeDebugLog({
    telegramId,
    step: "update_started",
    payload: {
      current_total_sessions: existingUser.total_sessions ?? null,
      next_total_sessions: totalSessions,
      update_payload: updatePayload,
      filter: { telegram_id: telegramId }
    }
  });

  const updateResponse = await supabase
    .from("users")
    .update(updatePayload, { count: "exact" })
    .eq("telegram_id", telegramId)
    .select("telegram_id, total_sessions, first_seen_at, last_seen_at, updated_at");
  const {
    data: updatedUsers,
    error: updateError,
    count: updatedRowsCount
  } = updateResponse;
  const updatedUser = updatedUsers?.[0] ?? null;
  const affectedRows =
    updatedRowsCount ?? (Array.isArray(updatedUsers) ? updatedUsers.length : 0);

  console.log("[Users] Update response:", updateResponse);
  console.log("[Users] Updated rows count:", affectedRows);

  if (updateError) {
    await writeDebugLog({
      telegramId,
      step: "update_error",
      payload: {
        request: updatePayload,
        response: updateResponse,
        updated_rows_count: affectedRows
      },
      error: updateError
    });
    logSupabaseError("user update", updateError);
    await writeDebugLog({
      telegramId,
      step: "early_return",
      payload: { reason: "user update failed" },
      error: updateError
    });
    logReturn("user update failed");
    return;
  }

  if (!updatedUser) {
    console.error(
      "[Users] Error: Supabase update returned no row. Check the UPDATE RLS policy for public.users."
    );
    await writeDebugLog({
      telegramId,
      step: "update_error",
      payload: {
        reason: "Supabase update returned no row",
        request: updatePayload,
        response: updateResponse,
        updated_rows_count: affectedRows
      }
    });
    await writeDebugLog({
      telegramId,
      step: "early_return",
      payload: { reason: "user update affected no visible rows" }
    });
    logReturn("user update affected no visible rows");
    return;
  }

  await writeDebugLog({
    telegramId,
    step: "update_success",
    payload: {
      request: updatePayload,
      response: updateResponse,
      updated_user: updatedUser,
      updated_rows_count: affectedRows
    }
  });

  console.log(`[Users] User updated: ${telegramId}`, {
    total_sessions: updatedUser.total_sessions,
    last_seen_at: updatedUser.last_seen_at
  });
  logReturn("user update completed");
}

function runUserSync() {
  const now = Date.now();

  if (syncInFlight || now - lastSyncStartedAt < 2000) {
    console.log("[Users] Sync skipped: already running or recently completed");
    logReturn("sync already running or recently completed");
    return syncInFlight ?? Promise.resolve();
  }

  lastSyncStartedAt = now;
  syncInFlight = syncTelegramUser()
    .catch((error: unknown) => {
      logSupabaseError("unexpected sync failure", error);
      void writeDebugLog({
        telegramId: null,
        step: "early_return",
        payload: { reason: "unexpected sync failure" },
        error
      });
    })
    .finally(() => {
      console.log("[Users] Sync promise completed");
      syncInFlight = null;
    });

  console.log("[Users] Returning active sync promise");
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
