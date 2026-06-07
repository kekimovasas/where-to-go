"use client";

import Image from "next/image";
import {
  Armchair,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  Drama,
  ExternalLink,
  Flower2,
  GalleryHorizontalEnd,
  Home,
  Landmark,
  MapPin,
  Music2,
  Share2,
  Sparkles,
  Utensils,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Tab = "home" | "events" | "places" | "collections";
type Category =
  | "Музыка"
  | "Гастро"
  | "Театр"
  | "Выставки"
  | "Экскурсии"
  | "Спорт"
  | "Лекции";

type DateFilter =
  | "Все даты"
  | "Сегодня"
  | "Завтра"
  | "Выходные"
  | "Эта неделя"
  | "Следующая неделя"
  | "Выбрать даты";

type DateRange = {
  from: string;
  to: string;
};

type EventItem = {
  id: string;
  title: string;
  category: Category;
  date: string;
  time: string;
  placeId?: string;
  place: string;
  address: string;
  price: string;
  tag: string;
  description: string;
  startsAt: string;
  tint: string;
  position: string;
  imageUrl?: string;
  ticketUrl?: string;
  placeDetails?: PlaceItem;
};

type PlaceItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  address: string;
  imageUrl?: string;
  website?: string;
  phone?: string;
  workingHours?: string;
  tint: string;
  position: string;
};

type CollectionItem = {
  id: number;
  title: string;
  caption: string;
  count: string;
  tint: string;
  position: string;
};

type SupabaseEventRow = Record<string, unknown>;
type SupabasePlaceRow = Record<string, unknown>;

const eventCategories: Category[] = [
  "Музыка",
  "Гастро",
  "Театр",
  "Выставки",
  "Экскурсии",
  "Спорт",
  "Лекции"
];

const eventCategoryFilters: Array<{ name: Category | "Все"; icon: typeof Music2 }> = [
  { name: "Все", icon: Sparkles },
  { name: "Музыка", icon: Music2 },
  { name: "Гастро", icon: Utensils },
  { name: "Театр", icon: Drama },
  { name: "Выставки", icon: GalleryHorizontalEnd },
  { name: "Экскурсии", icon: Landmark },
  { name: "Спорт", icon: Armchair },
  { name: "Лекции", icon: BriefcaseBusiness }
];

const dateFilters: DateFilter[] = [
  "Все даты",
  "Сегодня",
  "Завтра",
  "Выходные",
  "Эта неделя",
  "Следующая неделя",
  "Выбрать даты"
];

const collections: CollectionItem[] = [
  {
    id: 1,
    title: "10 лучших летних веранд Тюмени",
    caption: "Редакция Where To Go",
    count: "10 мест",
    tint: "rgba(48, 39, 25, 0.46)",
    position: "50% 46%"
  },
  {
    id: 2,
    title: "Куда сходить на свидание",
    caption: "Маршруты для красивого вечера",
    count: "8 мест",
    tint: "rgba(207, 123, 134, 0.34)",
    position: "48% 30%"
  },
  {
    id: 3,
    title: "Бесплатные события этой недели",
    caption: "Выставки, прогулки и лекции",
    count: "12 событий",
    tint: "rgba(104, 129, 88, 0.32)",
    position: "42% 44%"
  },
  {
    id: 4,
    title: "Что делать в Тюмени в дождь",
    caption: "Теплые места и спокойные планы",
    count: "7 идей",
    tint: "rgba(62, 78, 92, 0.34)",
    position: "55% 54%"
  }
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [eventsCategory, setEventsCategory] = useState<Category | "Все">("Все");
  const [eventsDateFilter, setEventsDateFilter] = useState<DateFilter>("Все даты");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: "",
    to: ""
  });
  const [placeCategory, setPlaceCategory] = useState<string | "Все">("Все");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceItem | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);
  const [placesError, setPlacesError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      setIsLoadingEvents(true);
      setEventsError(null);

      const response = await fetch("/api/events", { cache: "no-store" });
      const payload = (await response.json()) as {
        data?: SupabaseEventRow[];
        error?: string;
      };

      if (!isMounted) {
        return;
      }

      if (!response.ok || payload.error) {
        setEventsError(payload.error ?? "Не удалось загрузить события");
        setEvents([]);
      } else {
        setEvents((payload.data ?? []).map(mapEventRow));
      }

      setIsLoadingEvents(false);
    }

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPlaces() {
      setIsLoadingPlaces(true);
      setPlacesError(null);

      const response = await fetch("/api/places", { cache: "no-store" });
      const payload = (await response.json()) as {
        data?: SupabasePlaceRow[];
        error?: string;
      };

      if (!isMounted) {
        return;
      }

      if (!response.ok || payload.error) {
        setPlacesError(payload.error ?? "Не удалось загрузить локации");
        setPlaces([]);
      } else {
        setPlaces((payload.data ?? []).map(mapPlaceRow));
      }

      setIsLoadingPlaces(false);
    }

    loadPlaces();

    return () => {
      isMounted = false;
    };
  }, []);

  const enrichedEvents = useMemo(() => {
    const placesById = new Map(places.map((place) => [place.id, place]));

    return events.map((event) => {
      const placeDetails = event.placeId ? placesById.get(event.placeId) : undefined;

      if (!placeDetails) {
        return event;
      }

      return {
        ...event,
        place: placeDetails.title,
        address: placeDetails.address,
        placeDetails
      };
    });
  }, [events, places]);

  const todayEvents = useMemo(() => {
    return enrichedEvents.filter((event) => isSameLocalDay(event.startsAt, new Date()));
  }, [enrichedEvents]);

  const weekendEvents = useMemo(() => {
    return enrichedEvents.filter((event) => isInNearestWeekend(event.startsAt));
  }, [enrichedEvents]);

  const filteredEventsForSection = useMemo(() => {
    return enrichedEvents.filter((event) => {
      const matchesCategory =
        eventsCategory === "Все" || event.category === eventsCategory;
      const matchesDate = matchesDateFilter(
        event.startsAt,
        eventsDateFilter,
        customDateRange
      );

      return matchesCategory && matchesDate;
    });
  }, [customDateRange, enrichedEvents, eventsCategory, eventsDateFilter]);

  const filteredPlaces = useMemo(() => {
    return places.filter(
      (place) => placeCategory === "Все" || place.category === placeCategory
    );
  }, [placeCategory, places]);

  function openEventsWithDateFilter(filter: DateFilter) {
    setEventsCategory("Все");
    setEventsDateFilter(filter);
    setActiveTab("events");
  }

  if (selectedEvent) {
    const selectedEventPlace =
      selectedEvent.placeDetails ??
      places.find((place) => selectedEvent.placeId && place.id === selectedEvent.placeId);
    const selectedEventView = selectedEventPlace
      ? {
          ...selectedEvent,
          place: selectedEventPlace.title,
          address: selectedEventPlace.address,
          placeDetails: selectedEventPlace
        }
      : selectedEvent;

    return (
      <PhoneShell>
        <AppHeader onBack={() => setSelectedEvent(null)} action="share" />
        <main className="mini-scroll h-[calc(100svh-58px)] overflow-y-auto bg-white pb-8">
          <section className="relative h-[255px]">
            <EventImage event={selectedEventView} priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/10 to-transparent" />
            <span className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase text-white backdrop-blur">
              {selectedEventView.tag}
            </span>
          </section>

          <section className="-mt-6 rounded-t-lg bg-white px-4 pb-6 pt-10">
            <h1 className="text-[22px] font-bold leading-tight text-[#171313]">
              {selectedEventView.title}
            </h1>

            <div className="mt-5 grid gap-3 text-[13px] font-medium text-[#4a4141]">
              <InfoRow icon={CalendarDays}>
                {selectedEventView.date}, {selectedEventView.time}
              </InfoRow>
              <LocationInfoRow
                placeName={selectedEventView.place}
                place={selectedEventPlace}
                onOpenPlace={(place) => {
                  setSelectedEvent(null);
                  setSelectedPlace(place);
                }}
              />
            </div>

            <div className="mt-6 flex items-center gap-3">
              <p className="min-w-[70px] text-[16px] font-bold text-[#171313]">
                {selectedEventView.price}
              </p>
              <button
                disabled={!selectedEventView.ticketUrl}
                onClick={() => {
                  if (selectedEventView.ticketUrl) {
                    window.open(selectedEventView.ticketUrl, "_blank", "noopener,noreferrer");
                  }
                }}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#ec7891] text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(236,120,145,0.28)] disabled:bg-[#dbc9c8] disabled:shadow-none"
              >
                Подробнее
                <ExternalLink size={15} />
              </button>
            </div>

            <ContentBlock title="О событии">
              {selectedEventView.description}
            </ContentBlock>
          </section>
        </main>
      </PhoneShell>
    );
  }

  if (selectedPlace) {
    const relatedEvents = enrichedEvents.filter(
      (event) => event.placeId && event.placeId === selectedPlace.id
    );

    return (
      <PhoneShell>
        <AppHeader onBack={() => setSelectedPlace(null)} action="share" />
        <PlaceDetailScreen
          place={selectedPlace}
          events={relatedEvents}
          onOpenEvent={(event) => {
            setSelectedPlace(null);
            setSelectedEvent(event);
          }}
        />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <AppHeader />
      <main className="mini-scroll h-[calc(100svh-122px)] overflow-y-auto pb-5">
        {activeTab === "home" ? (
          <HomeScreen
            todayEvents={todayEvents}
            weekendEvents={weekendEvents}
            places={places}
            isLoadingPlaces={isLoadingPlaces}
            placesError={placesError}
            isLoading={isLoadingEvents}
            error={eventsError}
            onOpenEvent={setSelectedEvent}
            onOpenPlace={setSelectedPlace}
            onSeeTodayEvents={() => openEventsWithDateFilter("Сегодня")}
            onSeeWeekendEvents={() => openEventsWithDateFilter("Выходные")}
            onSeePlaces={() => setActiveTab("places")}
          />
        ) : null}

        {activeTab === "events" ? (
          <EventsScreen
            allEvents={enrichedEvents}
            events={filteredEventsForSection}
            isLoading={isLoadingEvents}
            error={eventsError}
            activeCategory={eventsCategory}
            setActiveCategory={setEventsCategory}
            activeDateFilter={eventsDateFilter}
            setActiveDateFilter={setEventsDateFilter}
            customDateRange={customDateRange}
            setCustomDateRange={setCustomDateRange}
            onOpenEvent={setSelectedEvent}
          />
        ) : null}

        {activeTab === "places" ? (
          <PlacesScreen
            places={filteredPlaces}
            allPlaces={places}
            isLoading={isLoadingPlaces}
            error={placesError}
            activeCategory={placeCategory}
            setActiveCategory={setPlaceCategory}
            onOpenPlace={setSelectedPlace}
          />
        ) : null}

        {activeTab === "collections" ? (
          <CollectionsScreen collections={collections} />
        ) : null}
      </main>
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </PhoneShell>
  );
}

function mapEventRow(row: SupabaseEventRow, index: number): EventItem {
  const title = readString(row, ["title", "name", "event_title"], "Без названия");
  const category = normalizeCategory(readString(row, ["category", "type"], "Музыка"));
  const startsAt = readString(row, ["event_date", "date", "start_date", "starts_at"], "");

  return {
    id: readString(row, ["id", "uuid"], String(index)),
    title,
    category,
    date: formatDate(startsAt),
    time: formatTime(readString(row, ["time", "event_time", "start_time", "starts_at", "event_date"], "")),
    placeId: readString(row, ["place_id"], ""),
    place: readString(row, ["location"], ""),
    address: "",
    price: readString(row, ["price", "ticket_price"], "Цена уточняется"),
    tag: readString(row, ["tag", "label"], category.toLowerCase()),
    description: readString(row, ["description", "about", "text"], "Описание скоро появится."),
    startsAt,
    tint: pickTint(index),
    position: pickPosition(index),
    imageUrl: normalizeImageUrl(readString(row, ["image_url", "cover_url", "photo_url"], "")),
    ticketUrl: readString(row, ["ticket_url", "more_url"], "")
  };
}

function mapPlaceRow(row: SupabasePlaceRow, index: number): PlaceItem {
  return {
    id: readString(row, ["id", "uuid"], String(index)),
    title: readString(row, ["title", "name"], "Локация без названия"),
    category: readString(row, ["category"], "Локации"),
    description: readString(row, ["description", "caption"], "Описание скоро появится."),
    address: readString(row, ["address", "location"], ""),
    imageUrl: normalizeImageUrl(readString(row, ["image_url", "cover_url"], "")),
    website: readString(row, ["website", "url"], ""),
    phone: readString(row, ["phone"], ""),
    workingHours: readString(row, ["working_hours"], ""),
    tint: pickTint(index + 1),
    position: pickPosition(index + 1)
  };
}

function readString(
  row: SupabaseEventRow,
  keys: string[],
  fallback: string
): string {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return fallback;
}

function normalizeCategory(value: string): Category {
  const category = eventCategories.find(
    (item) => item.toLowerCase() === value.toLowerCase()
  );

  return category ?? "Музыка";
}

function parseEventDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameLocalDay(value: string, target: Date): boolean {
  const date = parseEventDate(value);

  if (!date) {
    return false;
  }

  return startOfLocalDay(date).getTime() === startOfLocalDay(target).getTime();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
}

function nearestWeekendRange(reference = new Date()): { saturday: Date; sunday: Date } {
  const today = startOfLocalDay(reference);
  const day = today.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7;
  const saturday = addDays(today, daysUntilSaturday);

  return {
    saturday,
    sunday: addDays(saturday, 1)
  };
}

function isInNearestWeekend(value: string): boolean {
  const date = parseEventDate(value);

  if (!date) {
    return false;
  }

  const eventDay = startOfLocalDay(date).getTime();
  const { saturday, sunday } = nearestWeekendRange();

  return (
    eventDay === saturday.getTime() ||
    eventDay === sunday.getTime()
  );
}

function isInThisWeek(value: string): boolean {
  const date = parseEventDate(value);

  if (!date) {
    return false;
  }

  const today = startOfLocalDay(new Date());
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = addDays(today, -mondayOffset);
  const nextMonday = addDays(monday, 7);
  const eventTime = startOfLocalDay(date).getTime();

  return eventTime >= monday.getTime() && eventTime < nextMonday.getTime();
}

function isInNextWeek(value: string): boolean {
  const date = parseEventDate(value);

  if (!date) {
    return false;
  }

  const today = startOfLocalDay(new Date());
  const mondayOffset = (today.getDay() + 6) % 7;
  const thisMonday = addDays(today, -mondayOffset);
  const nextMonday = addDays(thisMonday, 7);
  const followingMonday = addDays(nextMonday, 7);
  const eventTime = startOfLocalDay(date).getTime();

  return eventTime >= nextMonday.getTime() && eventTime < followingMonday.getTime();
}

function isInCustomDateRange(value: string, range: DateRange): boolean {
  const date = parseEventDate(value);

  if (!date || !range.from) {
    return false;
  }

  const eventTime = startOfLocalDay(date).getTime();
  const from = startOfLocalDay(new Date(`${range.from}T00:00:00`));
  const to = range.to
    ? startOfLocalDay(new Date(`${range.to}T00:00:00`))
    : from;

  const start = Math.min(from.getTime(), to.getTime());
  const end = Math.max(from.getTime(), to.getTime());

  return eventTime >= start && eventTime <= end;
}

function matchesDateFilter(
  value: string,
  filter: DateFilter,
  customRange: DateRange
): boolean {
  if (filter === "Все даты") {
    return true;
  }

  if (filter === "Сегодня") {
    return isSameLocalDay(value, new Date());
  }

  if (filter === "Завтра") {
    return isSameLocalDay(value, addDays(new Date(), 1));
  }

  if (filter === "Выходные") {
    return isInNearestWeekend(value);
  }

  if (filter === "Эта неделя") {
    return isInThisWeek(value);
  }

  if (filter === "Следующая неделя") {
    return isInNextWeek(value);
  }

  return isInCustomDateRange(value, customRange);
}

function formatDate(value: string): string {
  if (!value) {
    return "Дата уточняется";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long"
  }).format(date);
}

function formatTime(value: string): string {
  if (!value) {
    return "Время уточняется";
  }

  if (/^\d{1,2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function normalizeImageUrl(value: string): string {
  return value.replace(/\$0$/, "");
}

function pickTint(index: number): string {
  const tints = [
    "rgba(24, 12, 9, 0.42)",
    "rgba(82, 51, 28, 0.38)",
    "rgba(201, 120, 129, 0.35)",
    "rgba(57, 39, 64, 0.42)",
    "rgba(93, 111, 94, 0.38)"
  ];

  return tints[index % tints.length];
}

function pickPosition(index: number): string {
  const positions = ["45% 50%", "52% 42%", "48% 64%", "58% 50%", "42% 40%"];

  return positions[index % positions.length];
}

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f2ec] px-0 text-[#171313] sm:px-4 sm:py-6">
      <div className="mx-auto min-h-screen w-full max-w-[390px] overflow-hidden bg-[#fffdfb] shadow-[0_22px_80px_rgba(34,26,23,0.14)] sm:min-h-[820px] sm:rounded-[34px] sm:border-[10px] sm:border-black">
        {children}
      </div>
    </div>
  );
}

function AppHeader({
  onBack,
  action = "close"
}: {
  onBack?: () => void;
  action?: "close" | "share";
}) {
  return (
    <header className="flex h-[58px] items-center justify-between border-b border-[#f3e8e6] bg-white px-4">
      <button
        aria-label={onBack ? "Назад" : "Пустая область"}
        onClick={onBack}
        className="grid size-8 place-items-center text-[#171313]"
      >
        {onBack ? <ChevronLeft size={21} /> : null}
      </button>
      <div className="text-center">
        <p className="text-[13px] font-extrabold leading-none">Where To Go</p>
        <p className="mt-1 text-[9px] font-medium text-[#9c9290]">
          мини-приложение
        </p>
      </div>
      <button
        aria-label={action === "share" ? "Поделиться" : "Закрыть"}
        className="grid size-8 place-items-center text-[#171313]"
      >
        {action === "share" ? <Share2 size={18} /> : <X size={20} />}
      </button>
    </header>
  );
}

function HomeScreen({
  todayEvents,
  weekendEvents,
  places,
  isLoadingPlaces,
  placesError,
  isLoading,
  error,
  onOpenEvent,
  onOpenPlace,
  onSeeTodayEvents,
  onSeeWeekendEvents,
  onSeePlaces
}: {
  todayEvents: EventItem[];
  weekendEvents: EventItem[];
  places: PlaceItem[];
  isLoadingPlaces: boolean;
  placesError: string | null;
  isLoading: boolean;
  error: string | null;
  onOpenEvent: (event: EventItem) => void;
  onOpenPlace: (place: PlaceItem) => void;
  onSeeTodayEvents: () => void;
  onSeeWeekendEvents: () => void;
  onSeePlaces: () => void;
}) {
  return (
    <section>
      <div className="bg-gradient-to-b from-[#fff0ed] to-[#fffdfb] px-4 pb-5 pt-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="max-w-[210px] text-[30px] font-extrabold leading-[1.05]">
            Куда сегодня сходим?
          </h1>
          <div className="shrink-0 text-right">
            <AuthorAvatar />
            <p className="mt-2 text-[10px] font-bold leading-[1.25] text-[#6e625f]">
              Городское медиа
              <br />
              <span className="font-semibold text-[#a88b86]">
                от Ксюши из Сибири
              </span>
            </p>
          </div>
        </div>
        <p className="mt-2 text-[13px] font-medium text-[#7d7370]">
          Лучшие события и локации Тюмени
        </p>
      </div>

      <section className="px-4 pb-6 pt-1">
        <article className="relative overflow-hidden rounded-lg bg-[#211716] p-5 text-white shadow-[0_18px_42px_rgba(54,34,31,0.16)]">
          <div className="absolute -right-8 -top-10 size-28 rounded-full bg-[#ec7891]/35" />
          <div className="absolute bottom-0 right-6 h-16 w-24 rounded-t-full bg-white/10" />
          <p className="text-[10px] font-bold uppercase text-[#f7c8d1]">
            место для партнера
          </p>
          <h2 className="mt-2 max-w-[230px] text-[18px] font-extrabold leading-tight">
            Баннер для подборки недели, рекламы или события дня
          </h2>
          <p className="mt-2 max-w-[250px] text-[12px] font-medium leading-5 text-white/72">
            Временный блок в стиле приложения. Позже сюда можно подключить редакционные размещения.
          </p>
        </article>
      </section>

      <SectionHeader title="Сегодня в Тюмени" action="Смотреть все" onAction={onSeeTodayEvents} />
      <EventRail
        events={todayEvents.slice(0, 4)}
        isLoading={isLoading}
        error={error}
        emptyText="На сегодня событий пока нет."
        onOpenEvent={onOpenEvent}
      />

      <SectionHeader title="Ближайшие выходные" action="Смотреть все" onAction={onSeeWeekendEvents} />
      <EventRail
        events={weekendEvents}
        isLoading={isLoading}
        error={error}
        emptyText="На ближайшие выходные событий пока нет."
        onOpenEvent={onOpenEvent}
      />

      <SectionHeader title="Локации" action="Смотреть все" onAction={onSeePlaces} />
      <PlaceList
        places={places}
        isLoading={isLoadingPlaces}
        error={placesError}
        onOpenPlace={onOpenPlace}
        limit={4}
      />
    </section>
  );
}

function AuthorAvatar() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="ml-auto size-14 rounded-full bg-gradient-to-br from-white via-[#f6d7d1] to-[#e48699] p-[2px] shadow-[0_14px_30px_rgba(49,34,31,0.16)]">
      <div className="grid size-full place-items-center overflow-hidden rounded-full bg-[#171313] text-[17px] font-extrabold text-white">
        {!imageFailed ? (
          <img
            src="/author-avatar.jpg"
            alt="Ксюша из Сибири"
            className="size-full object-cover"
            style={{ objectPosition: "50% 36%" }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          "К"
        )}
      </div>
    </div>
  );
}

function EventsScreen({
  allEvents,
  events,
  isLoading,
  error,
  activeCategory,
  setActiveCategory,
  activeDateFilter,
  setActiveDateFilter,
  customDateRange,
  setCustomDateRange,
  onOpenEvent
}: {
  allEvents: EventItem[];
  events: EventItem[];
  isLoading: boolean;
  error: string | null;
  activeCategory: Category | "Все";
  setActiveCategory: (category: Category | "Все") => void;
  activeDateFilter: DateFilter;
  setActiveDateFilter: (filter: DateFilter) => void;
  customDateRange: DateRange;
  setCustomDateRange: (range: DateRange) => void;
  onOpenEvent: (event: EventItem) => void;
}) {
  const popularEvent = allEvents[0];

  return (
    <section className="px-4 pb-5 pt-4">
      <h1 className="text-[22px] font-extrabold">Популярное</h1>
      <div className="mt-3">
        {isLoading ? <WideSkeleton /> : null}
        {!isLoading && error ? <StateMessage text={`Не удалось загрузить события: ${error}`} /> : null}
        {!isLoading && !error && popularEvent ? (
          <FeaturedEventCard event={popularEvent} onClick={() => onOpenEvent(popularEvent)} />
        ) : null}
        {!isLoading && !error && allEvents.length === 0 ? (
          <StateMessage text="В базе пока нет мероприятий." />
        ) : null}
      </div>

      <h2 className="mt-6 text-[17px] font-extrabold">Категории</h2>
      <div className="mini-scroll -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {eventCategoryFilters.map(({ name, icon: Icon }) => {
          const active = activeCategory === name;

          return (
            <button
              key={name}
              onClick={() => setActiveCategory(name)}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-[12px] font-bold ${
                active
                  ? "border-[#ef8fa3] bg-[#fff3f5] text-[#cc5974]"
                  : "border-transparent bg-white text-[#6f6461]"
              }`}
            >
              <Icon size={15} />
              {name}
            </button>
          );
        })}
      </div>

      <h2 className="mt-5 text-[17px] font-extrabold">Дата</h2>
      <div className="mini-scroll -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {dateFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveDateFilter(filter)}
            className={`h-10 shrink-0 rounded-lg border px-3 text-[12px] font-bold ${
              activeDateFilter === filter
                ? "border-[#ef8fa3] bg-[#fff3f5] text-[#cc5974]"
                : "border-transparent bg-white text-[#6f6461]"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {activeDateFilter === "Выбрать даты" ? (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-[#f1dfdc] bg-white p-3">
          <label className="grid gap-1 text-[10px] font-bold uppercase text-[#a0908d]">
            Начало
            <input
              type="date"
              value={customDateRange.from}
              onChange={(event) => {
                setCustomDateRange({
                  from: event.currentTarget.value,
                  to: customDateRange.to
                });
              }}
              onInput={(event) => {
                setCustomDateRange({
                  from: event.currentTarget.value,
                  to: customDateRange.to
                });
              }}
              className="h-10 rounded-lg border border-[#ead9d6] bg-[#fffdfb] px-2 text-[12px] font-semibold text-[#302b2a] outline-none"
            />
          </label>
          <label className="grid gap-1 text-[10px] font-bold uppercase text-[#a0908d]">
            Конец
            <input
              type="date"
              value={customDateRange.to}
              onChange={(event) => {
                setCustomDateRange({
                  from: customDateRange.from,
                  to: event.currentTarget.value
                });
              }}
              onInput={(event) => {
                setCustomDateRange({
                  from: customDateRange.from,
                  to: event.currentTarget.value
                });
              }}
              className="h-10 rounded-lg border border-[#ead9d6] bg-[#fffdfb] px-2 text-[12px] font-semibold text-[#302b2a] outline-none"
            />
          </label>
          <p className="col-span-2 text-[11px] font-medium leading-4 text-[#8a7b78]">
            Можно выбрать одну дату или диапазон дат.
          </p>
        </div>
      ) : null}

      <h2 className="mt-6 text-[19px] font-extrabold">События</h2>
      <div className="mt-3 grid gap-3">
        {events.map((event) => (
          <ListEventCard key={event.id} event={event} onClick={() => onOpenEvent(event)} />
        ))}
        {!isLoading && !error && events.length === 0 ? (
          <StateMessage text="По выбранным фильтрам событий нет." />
        ) : null}
      </div>
    </section>
  );
}

function PlacesScreen({
  places,
  allPlaces,
  isLoading,
  error,
  activeCategory,
  setActiveCategory,
  onOpenPlace
}: {
  places: PlaceItem[];
  allPlaces: PlaceItem[];
  isLoading: boolean;
  error: string | null;
  activeCategory: string | "Все";
  setActiveCategory: (category: string | "Все") => void;
  onOpenPlace: (place: PlaceItem) => void;
}) {
  const filters = ["Все", ...Array.from(new Set(allPlaces.map((place) => place.category)))];

  return (
    <section className="px-4 pb-5 pt-4">
      <SectionTitle title="Локации" />
      {filters.length > 1 ? (
        <div className="mini-scroll mt-4 flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveCategory(filter)}
              className={`h-9 shrink-0 rounded-lg border px-3 text-[12px] font-semibold ${
                activeCategory === filter
                  ? "border-[#ef8fa3] bg-[#fff3f5] text-[#cc5974]"
                  : "border-transparent bg-white text-[#7e7471]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-2">
        <PlaceList
          places={places}
          isLoading={isLoading}
          error={error}
          onOpenPlace={onOpenPlace}
        />
      </div>
    </section>
  );
}

function PlaceDetailScreen({
  place,
  events,
  onOpenEvent
}: {
  place: PlaceItem;
  events: EventItem[];
  onOpenEvent: (event: EventItem) => void;
}) {
  return (
    <main className="mini-scroll h-[calc(100svh-58px)] overflow-y-auto bg-[#fffdfb] pb-8">
      <section className="relative h-[238px]">
        <PlaceImage place={place} priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/68 via-black/12 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase text-white backdrop-blur">
          {place.category}
        </span>
        <div className="absolute inset-x-4 bottom-5 text-white">
          <h1 className="text-[25px] font-extrabold leading-tight">{place.title}</h1>
          {place.address ? (
            <p className="mt-2 flex items-start gap-2 text-[12px] font-semibold text-white/82">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              <span>{place.address}</span>
            </p>
          ) : null}
        </div>
      </section>

      <section className="px-4 pt-5">
        <ContentBlock title="О локации">
          {place.description || "Описание скоро появится."}
        </ContentBlock>

        <div className="mt-5 grid gap-2">
          {place.workingHours ? (
            <DetailPill label="Время работы" value={place.workingHours} />
          ) : null}
          {place.phone ? <DetailPill label="Телефон" value={place.phone} /> : null}
          {place.website ? (
            <a
              href={place.website}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#ec7891] text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(236,120,145,0.24)]"
            >
              Сайт локации
              <ExternalLink size={15} />
            </a>
          ) : null}
        </div>

        <section className="mt-7">
          <h2 className="text-[17px] font-extrabold text-[#171313]">
            Ближайшие мероприятия в этой локации
          </h2>
          <div className="mt-3 grid gap-3">
            {events.map((event) => (
              <ListEventCard
                key={event.id}
                event={event}
                onClick={() => onOpenEvent(event)}
              />
            ))}
            {events.length === 0 ? (
              <StateMessage text="Пока нет связанных событий. Когда в events появится place_id этой локации, они отобразятся здесь." />
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}

function CollectionsScreen({ collections }: { collections: CollectionItem[] }) {
  return (
    <section className="px-4 pb-5 pt-4">
      <SectionTitle title="Подборки" />
      <div className="mt-4 grid gap-3">
        <LargeCollectionCard collection={collections[0]} />
        {collections.slice(1).map((collection) => (
          <CollectionRow key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h1 className="text-[22px] font-extrabold">{title}</h1>;
}

function SectionHeader({
  title,
  action,
  onAction
}: {
  title: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between px-4 pt-2">
      <h2 className="text-[15px] font-extrabold">{title}</h2>
      <button onClick={onAction} className="text-[11px] font-semibold text-[#4d4542]">
        {action}
      </button>
    </div>
  );
}

function EventRail({
  events,
  isLoading,
  error,
  emptyText = "В базе пока нет мероприятий для этого блока.",
  onOpenEvent
}: {
  events: EventItem[];
  isLoading: boolean;
  error: string | null;
  emptyText?: string;
  onOpenEvent: (event: EventItem) => void;
}) {
  if (isLoading) {
    return (
      <div className="mini-scroll flex gap-3 overflow-x-auto px-4 pb-5">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pb-5">
        <StateMessage text={`Не удалось загрузить события: ${error}`} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="px-4 pb-5">
        <StateMessage text={emptyText} />
      </div>
    );
  }

  return (
    <div className="mini-scroll flex gap-3 overflow-x-auto px-4 pb-5">
      {events.map((event) => (
        <CompactEventCard
          key={event.id}
          event={event}
          onClick={() => onOpenEvent(event)}
        />
      ))}
    </div>
  );
}

function PlaceList({
  places,
  isLoading,
  error,
  onOpenPlace,
  limit
}: {
  places: PlaceItem[];
  isLoading: boolean;
  error: string | null;
  onOpenPlace: (place: PlaceItem) => void;
  limit?: number;
}) {
  const visiblePlaces = typeof limit === "number" ? places.slice(0, limit) : places;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 px-4 pb-5">
        <PlaceSkeleton />
        <PlaceSkeleton />
        <PlaceSkeleton />
        <PlaceSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pb-5">
        <StateMessage text={`Не удалось загрузить локации: ${error}`} />
      </div>
    );
  }

  if (visiblePlaces.length === 0) {
    return (
      <div className="px-4 pb-5">
        <StateMessage text="Локаций пока нет. Таблица places подключена и готова к данным." />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 px-4 pb-5">
      {visiblePlaces.map((place) => (
        <PlaceCard key={place.id} place={place} onClick={() => onOpenPlace(place)} />
      ))}
    </div>
  );
}

function StateMessage({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-[#f1dfdc] bg-white p-4 text-[12px] font-semibold leading-5 text-[#827674]">
      {text}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="w-[116px] shrink-0">
      <div className="h-[120px] animate-pulse rounded-lg bg-[#f0e5e1]" />
      <div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-[#f0e5e1]" />
      <div className="mt-2 h-3 w-16 animate-pulse rounded-full bg-[#f5ece9]" />
    </div>
  );
}

function WideSkeleton() {
  return <div className="h-[132px] animate-pulse rounded-lg bg-[#f0e5e1]" />;
}

function PlaceSkeleton() {
  return (
    <div className="min-w-0">
      <div className="aspect-square animate-pulse rounded-[18px] bg-[#f0e5e1]" />
      <div className="mt-3 h-3 w-24 animate-pulse rounded-full bg-[#f0e5e1]" />
      <div className="mt-2 h-3 w-20 animate-pulse rounded-full bg-[#f5ece9]" />
    </div>
  );
}

function EventImage({
  event,
  priority = false
}: {
  event: EventItem;
  priority?: boolean;
}) {
  if (event.imageUrl) {
    return (
      <>
        <img
          src={event.imageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
          style={{ objectPosition: event.position }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: event.tint }} />
      </>
    );
  }

  return (
    <>
      <Image
        src="/where-to-go-hero.png"
        alt=""
        fill
        priority={priority}
        className="object-cover"
        style={{ objectPosition: event.position }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: event.tint }} />
    </>
  );
}

function PlaceImage({
  place,
  priority = false
}: {
  place: PlaceItem;
  priority?: boolean;
}) {
  if (place.imageUrl) {
    return (
      <>
        <img
          src={place.imageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
          style={{ objectPosition: place.position }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: place.tint }} />
      </>
    );
  }

  return (
    <>
      <Image
        src="/where-to-go-hero.png"
        alt=""
        fill
        priority={priority}
        className="object-cover"
        style={{ objectPosition: place.position }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: place.tint }} />
    </>
  );
}

function CompactEventCard({
  event,
  onClick
}: {
  event: EventItem;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-[116px] shrink-0 text-left">
      <div className="relative h-[120px] overflow-hidden rounded-lg bg-[#e8ddd6]">
        <EventImage event={event} />
        <span className="absolute left-2 top-2 rounded-full bg-white/80 px-2 py-1 text-[8px] font-bold uppercase text-[#a76070]">
          {event.tag}
        </span>
      </div>
      <h3 className="mt-2 line-clamp-2 text-[12px] font-extrabold leading-tight">
        {event.title}
      </h3>
      <p className="mt-1 text-[11px] font-medium text-[#766c69]">
        {event.date}, {event.time}
      </p>
    </button>
  );
}

function FeaturedEventCard({
  event,
  onClick
}: {
  event: EventItem;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="relative h-[132px] w-full overflow-hidden rounded-lg text-left text-white">
      <EventImage event={event} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/8 to-transparent" />
      <span className="absolute left-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-[9px] font-bold uppercase backdrop-blur">
        {event.tag}
      </span>
      <div className="absolute inset-x-3 bottom-3">
        <h3 className="text-[18px] font-extrabold leading-tight">{event.title}</h3>
        <p className="mt-1 text-[11px] font-semibold text-white/82">
          {event.date}, {event.time} · {event.place}
        </p>
      </div>
    </button>
  );
}

function ListEventCard({
  event,
  onClick
}: {
  event: EventItem;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="grid grid-cols-[82px_1fr] gap-3 rounded-lg bg-white p-2 text-left shadow-[0_10px_24px_rgba(64,45,42,0.06)]">
      <div className="relative h-[82px] overflow-hidden rounded-lg">
        <EventImage event={event} />
      </div>
      <div className="min-w-0 py-1">
        <p className="text-[10px] font-bold uppercase text-[#d76b84]">{event.category}</p>
        <h3 className="mt-1 line-clamp-2 text-[14px] font-extrabold leading-tight">
          {event.title}
        </h3>
        <p className="mt-2 truncate text-[12px] font-medium text-[#7c726f]">
          {event.date}, {event.time} · {event.place}
        </p>
      </div>
    </button>
  );
}

function PlaceCard({ place, onClick }: { place: PlaceItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group min-w-0 text-left"
    >
      <div className="relative aspect-square overflow-hidden rounded-[18px] bg-[#ece1dc] shadow-[0_16px_34px_rgba(51,35,31,0.12)] ring-1 ring-black/[0.03]">
        <PlaceImage place={place} />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/24 to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
      </div>
      <div className="px-1 pt-3">
        <h3 className="line-clamp-2 text-[14px] font-extrabold leading-tight text-[#1d1716]">
          {place.title}
        </h3>
        {place.address ? (
          <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-[#8a7b78]">
            {place.address}
          </p>
        ) : null}
      </div>
    </button>
  );
}

function LargeCollectionCard({ collection }: { collection: CollectionItem }) {
  return (
    <article className="relative h-[132px] overflow-hidden rounded-lg text-white">
      <CollectionImage collection={collection} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <span className="absolute left-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-[9px] font-bold uppercase backdrop-blur">
        подборка
      </span>
      <div className="absolute inset-x-3 bottom-3">
        <h2 className="text-[18px] font-extrabold leading-tight">{collection.title}</h2>
        <p className="mt-1 text-[11px] font-semibold text-white/82">
          {collection.caption}
        </p>
      </div>
    </article>
  );
}

function CollectionRow({ collection }: { collection: CollectionItem }) {
  return (
    <article className="grid grid-cols-[76px_1fr] gap-3 rounded-lg bg-white p-2 shadow-[0_10px_24px_rgba(64,45,42,0.06)]">
      <div className="relative h-[70px] overflow-hidden rounded-lg">
        <CollectionImage collection={collection} />
      </div>
      <div className="min-w-0 py-1">
        <h3 className="line-clamp-2 text-[14px] font-extrabold leading-tight">
          {collection.title}
        </h3>
        <p className="mt-2 text-[12px] font-medium text-[#7c726f]">
          {collection.count}
        </p>
      </div>
    </article>
  );
}

function CollectionImage({ collection }: { collection: CollectionItem }) {
  return (
    <>
      <Image
        src="/where-to-go-hero.png"
        alt=""
        fill
        className="object-cover"
        style={{ objectPosition: collection.position }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: collection.tint }} />
    </>
  );
}

function InfoRow({
  icon: Icon,
  children
}: {
  icon: typeof CalendarDays;
  children: React.ReactNode;
}) {
  return (
    <p className="flex items-start gap-2">
      <Icon size={16} className="mt-0.5 shrink-0 text-[#8c7773]" />
      <span>{children}</span>
    </p>
  );
}

function LocationInfoRow({
  placeName,
  place,
  onOpenPlace
}: {
  placeName: string;
  place?: PlaceItem;
  onOpenPlace: (place: PlaceItem) => void;
}) {
  const label = placeName || "Локация уточняется";

  if (!place) {
    return (
      <InfoRow icon={MapPin}>
        {label}
      </InfoRow>
    );
  }

  return (
    <button
      onClick={() => onOpenPlace(place)}
      className="flex items-start gap-2 text-left text-[#4a4141]"
    >
      <MapPin size={16} className="mt-0.5 shrink-0 text-[#8c7773]" />
      <span>
        <span className="font-bold text-[#cc5974]">{place.title}</span>
        {place.address ? (
          <span className="mt-0.5 block text-[12px] font-medium text-[#7c726f]">
            {place.address}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#f1dfdc] bg-white px-3 py-2">
      <p className="text-[10px] font-bold uppercase text-[#a0908d]">{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-[#302b2a]">{value}</p>
    </div>
  );
}

function ContentBlock({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <h2 className="text-[15px] font-extrabold text-[#171313]">{title}</h2>
      <div className="mt-3 text-[13px] font-medium leading-5 text-[#3d3432]">
        {children}
      </div>
    </section>
  );
}

function BottomNav({
  activeTab,
  onChange
}: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}) {
  const items: Array<{ tab: Tab; label: string; icon: typeof Home }> = [
    { tab: "home", label: "Главная", icon: Home },
    { tab: "events", label: "События", icon: CalendarDays },
    { tab: "places", label: "Локации", icon: MapPin },
    { tab: "collections", label: "Подборки", icon: Flower2 }
  ];

  return (
    <nav className="grid h-16 grid-cols-4 border-t border-[#f2e8e5] bg-white px-2">
      {items.map(({ tab, label, icon: Icon }) => {
        const active = activeTab === tab;

        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${
              active ? "text-[#e36f88]" : "text-[#9f9491]"
            }`}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 2} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
