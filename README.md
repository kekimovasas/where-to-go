# Where To Go

MVP Telegram Mini App для поиска мероприятий.

## Stack

- Next.js
- TypeScript
- Tailwind CSS

## Screens

- Главная с логотипом, поиском и категориями
- Список мероприятий с фильтрацией
- Карточка мероприятия

## Run

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`.

## Environment

Создайте `.env.local` для локального запуска:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-project-key
```

PostHog traffic is sent through the first-party `/pvd` proxy. The current
project key belongs to PostHog US Cloud, so the proxy targets
`us.i.posthog.com` and `us-assets.i.posthog.com`.

Для Vercel добавьте эти же переменные в Project Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`

PostHog подключен через клиентский провайдер. Автосбор событий, Session Replay и Heatmaps готовы на стороне приложения; включите нужные продукты в настройках проекта PostHog.

## Deploy To Vercel

Проект не требует `vercel.json`: Vercel автоматически определяет Next.js.

Build command:

```bash
npm run build
```

Install command:

```bash
npm install
```
