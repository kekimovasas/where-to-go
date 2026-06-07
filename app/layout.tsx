import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Where To Go",
  description: "Telegram Mini App for discovering city events"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fbf8f4"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <PostHogProvider>
          {children}
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
