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

let userSyncPromise: Promise<void> | null = null;

async function syncTelegramUser() {
  const telegramWebApp = window.Telegram?.WebApp;

  if (!telegramWebApp) {
    console.error("[Users] Error: Telegram Web App is unavailable");
    return;
  }

  telegramWebApp.ready();

  const telegramUser = telegramWebApp.initDataUnsafe?.user;

  if (!telegramUser) {
    console.error("[Users] Error: Telegram user is unavailable");
    return;
  }

  const telegramId = String(telegramUser.id);
  const now = new Date().toISOString();
  const { data: existingUser, error: selectError } = await supabase
    .from("users")
    .select("telegram_id, total_sessions")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (selectError) {
    console.error(`[Users] Error: ${selectError.message}`);
    return;
  }

  if (!existingUser) {
    const { error: insertError } = await supabase
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
      );

    if (insertError) {
      console.error(`[Users] Error: ${insertError.message}`);
      return;
    }

    console.log(`[Users] New user created: ${telegramId}`);
    return;
  }

  const totalSessions = Number(existingUser.total_sessions ?? 0) + 1;
  const { error: updateError } = await supabase
    .from("users")
    .update({
      username: telegramUser.username ?? null,
      first_name: telegramUser.first_name ?? null,
      last_seen_at: now,
      total_sessions: totalSessions,
      updated_at: now
    })
    .eq("telegram_id", telegramId);

  if (updateError) {
    console.error(`[Users] Error: ${updateError.message}`);
    return;
  }

  console.log(`[Users] User updated: ${telegramId}`);
}

export function TelegramUserSync() {
  useEffect(() => {
    userSyncPromise ??= syncTelegramUser().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Users] Error: ${message}`);
    });
  }, []);

  return null;
}
