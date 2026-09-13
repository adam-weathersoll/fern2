import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  ArrowUpRight,
  CalendarDays,
  Compass,
  Droplets,
  ExternalLink,
  LocateFixed,
  Search,
  SlidersHorizontal,
  Sparkles,
  Wind,
} from "lucide-react";
import { type FormEvent, type MouseEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getWeather } from "@/lib/weather.functions";
import { getNews } from "@/lib/news.functions";
import fernAsset from "@/assets/Fern_logo.png.asset.json";
import stormAsset from "@/assets/loopingstorm.gif.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fern — A calmer place to start" },
      { name: "description", content: "A calm personal start page with live weather, your local time, search, and the latest stories." },
      { property: "og:title", content: "Fern — A calmer place to start" },
      { property: "og:description", content: "A calm personal start page with live weather, your local time, search, and the latest stories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Units = "auto" | "metric" | "imperial";
type Coords = { lat: number; lon: number };
type Prefs = { name: string; units: Units; coords: Coords | null };
type FernWindow = Window & {
  fernAPI?: { openNewTab: (url: string) => void };
};

const STORAGE_KEY = "fern:prefs";
const FILTERS = ["All", "Weather", "Politics", "Local", "National"] as const;

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { name: "", units: "auto", coords: null, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    /* ignore */
  }
  return { name: "", units: "auto", coords: null };
}

function Index() {
  const [now, setNow] = useState<Date | null>(null);
  const [prefs, setPrefs] = useState<Prefs>({ name: "", units: "auto", coords: null });
  const [ready, setReady] = useState(false);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchWeather = useServerFn(getWeather);
  const fetchNews = useServerFn(getNews);

  useEffect(() => {
    setPrefs(loadPrefs());
    setReady(true);
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const savePrefs = (next: Prefs) => {
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const weather = useQuery({
    queryKey: ["weather", prefs.coords?.lat, prefs.coords?.lon, prefs.units],
    enabled: ready && !!prefs.coords,
    staleTime: 5 * 60_000,
    queryFn: () => {
      if (!prefs.coords) throw new Error("Location is required for weather");
      return fetchWeather({
        data: { lat: prefs.coords.lat, lon: prefs.coords.lon, units: prefs.units },
      });
    },
  });

  const news = useQuery({
    queryKey: ["news", activeFilter, weather.data?.place ?? "", weather.data?.countryCode ?? ""],
    enabled: ready,
    staleTime: 5 * 60_000,
    queryFn: () =>
      fetchNews({
        data: {
          topic: activeFilter,
          place: weather.data?.place,
          country: weather.data?.countryCode || undefined,
        },
      }),
  });

  const openInNewTab = (url: string) => {
    const fernAPI = (window as FernWindow).fernAPI;
    if (fernAPI) {
      fernAPI.openNewTab(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openExternalLink = (event: MouseEvent<HTMLAnchorElement>, url: string) => {
    if (!(window as FernWindow).fernAPI) return;
    event.preventDefault();
    openInNewTab(url);
  };

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      openInNewTab(targetUrl);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Location unavailable on this device");
      return;
    }
    setLocationStatus("Finding you…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus(null);
        savePrefs({
          ...prefs,
          coords: {
            lat: Number(position.coords.latitude.toFixed(3)),
            lon: Number(position.coords.longitude.toFixed(3)),
          },
        });
      },
      () => setLocationStatus("Location permission denied"),
      { timeout: 10000 },
    );
  };

  const hour = now?.getHours() ?? 13;
  const base = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const greeting = prefs.name ? `${base}, ${prefs.name}.` : `${base}.`;
  const date = now?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) ?? "";
  const time = now?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) ?? "--:--";
  const zone = now ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

  const stories = news.data ?? [];

  return (
    <main className="relative min-h-screen overflow-hidden bg-background font-sans text-foreground">
      <img className="fixed inset-0 h-full w-full object-cover" src={stormAsset.url} alt="Storm clouds glowing over a rural road at sunset" />
      <div className="fixed inset-0 bg-scene-overlay" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-[1320px] px-6 pb-10 pt-7 md:px-10 lg:px-0">
        <header className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 text-base font-bold" aria-label="Fern home">
            <img src={fernAsset.url} alt="" className="h-7 w-7 object-contain" />
            <span>fern</span>
          </a>
          <div className="flex items-center gap-2">
            <Button variant="glass" size="icon" aria-label="Notifications"><Bell /></Button>
            <Button variant="glass" size="sm" onClick={() => setPersonalizeOpen(true)}>
              <SlidersHorizontal /> Personalize
            </Button>
          </div>
        </header>

        <section className="mx-auto mt-24 max-w-[680px] text-center md:mt-28">
          <p className="flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-subtle"><Sparkles className="h-3 w-3" /> A calmer place to start</p>
          <h1 className="mt-4 text-5xl font-semibold leading-none tracking-normal md:text-[64px]">{greeting}</h1>
          <p className="mt-4 flex min-h-5 items-center justify-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> {date}</p>
          <form onSubmit={search} className="group mx-auto mt-9 flex h-14 w-full max-w-[640px] items-center gap-2 rounded-2xl border border-border bg-search px-2.5 shadow-2xl backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-300 ease-out focus-within:-translate-y-0.5 focus-within:border-ring focus-within:shadow-search">
            <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground transition-colors duration-300 group-focus-within:text-foreground" />
            <input
              name="query"
              aria-label="Search the web"
              autoComplete="off"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-full min-w-0 flex-1 bg-transparent px-1 text-center text-sm outline-none transition-[color,opacity] duration-300 placeholder:text-muted-foreground focus:text-foreground"
              placeholder="Search the web"
            />
            <Button
              type="submit"
              variant="glass"
              size="icon"
              aria-label="Open search in a new tab"
              disabled={!searchQuery.trim()}
              className="h-9 w-9 shrink-0 rounded-lg transition-[opacity,transform,background-color] duration-300 enabled:hover:scale-105"
            >
              <ArrowUpRight className="transition-transform duration-300 group-focus-within:-translate-y-0.5 group-focus-within:translate-x-0.5" />
            </Button>
          </form>
        </section>

        <section className="mt-11 grid gap-3 md:grid-cols-[1.02fr_1.3fr_.78fr]">
          <article className="glass-panel flex min-h-56 flex-col p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Local weather</p>
                <h2 className="mt-3 text-base font-medium">
                  {weather.data ? weather.data.place : prefs.coords ? "Loading…" : "Make it yours"}
                </h2>
              </div>
              <Compass className="h-8 w-8 text-muted-foreground" />
            </div>

            {weather.data ? (
              <>
                <div className="mt-4 flex items-end gap-3">
                  <p className="text-4xl font-light">{weather.data.temperature}{weather.data.tempUnit}</p>
                  <p className="pb-1.5 text-sm text-soft">{weather.data.summary}</p>
                </div>
                <p className="mt-auto flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>H {weather.data.high}° · L {weather.data.low}°</span>
                  <span className="flex items-center gap-1"><Wind className="h-3.5 w-3.5" /> {weather.data.wind} {weather.data.windUnit}</span>
                  <span className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5" /> {weather.data.humidity}%</span>
                </p>
                <Button variant="location" size="sm" className="mt-3 self-start" onClick={requestLocation}>
                  <LocateFixed /> Refresh location
                </Button>
              </>
            ) : (
              <>
                <p className="mt-auto text-sm text-soft">
                  {weather.isError
                    ? "Weather couldn't be loaded right now."
                    : locationStatus ?? "See what the day looks like where you are."}
                </p>
                <Button variant="location" size="sm" className="mt-3 self-start" onClick={requestLocation}>
                  <LocateFixed /> Use my location
                </Button>
              </>
            )}
          </article>

          <article className="glass-panel relative flex min-h-56 flex-col p-6">
            <span className="absolute right-6 top-6 h-2 w-2 rounded-full bg-status shadow-status" />
            <p className="eyebrow">Right now</p>
            <h2 className="mt-3 text-base font-medium">A little room to think</h2>
            <blockquote className="mt-auto text-xl font-light md:text-2xl">“The best way out is always through.”</blockquote>
            <p className="mt-6 text-xs text-muted-foreground">Robert Frost <span className="ml-3 inline-block w-7 border-t border-border align-middle" /></p>
          </article>

          <article className="glass-panel flex min-h-56 flex-col p-6">
            <p className="eyebrow">Your time</p>
            <p className="mt-auto text-4xl font-light tracking-normal md:text-[44px]">{time}</p>
            <p className="mt-8 text-[10px] uppercase text-muted-foreground">{zone}</p>
          </article>
        </section>

        <section className="mt-16">
          <div className="flex items-end justify-between">
            <div><p className="eyebrow">Stay in the loop</p><h2 className="mt-3 text-3xl font-light">New articles</h2></div>
            <a href="https://news.google.com/" target="_blank" rel="noopener noreferrer" onClick={(event) => openExternalLink(event, "https://news.google.com/")} className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">Open news <ExternalLink className="h-3 w-3" /></a>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {FILTERS.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "filterActive" : "filter"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </Button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {news.isPending &&
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="news-card min-h-36 animate-pulse p-5" />
              ))}
            {news.isError && (
              <p className="text-sm text-soft">Stories couldn't be loaded right now.</p>
            )}
            {stories.map((story) => (
              <a
                key={story.link}
                href={story.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => openExternalLink(event, story.link)}
                className="news-card block min-h-36 p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex justify-between gap-3">
                  <p className="eyebrow truncate">{story.source}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{story.age}</span>
                </div>
                <h3 className="mt-7 text-base font-medium leading-snug">{story.title}</h3>
                <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{story.copy}</p>
              </a>
            ))}
          </div>
        </section>
      </div>

      <Dialog open={personalizeOpen} onOpenChange={setPersonalizeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Personalize</DialogTitle>
            <DialogDescription>Your name, units, and location stay on this device.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fern-name">Your name</Label>
              <Input
                id="fern-name"
                value={prefs.name}
                placeholder="e.g. Adam"
                onChange={(event) => savePrefs({ ...prefs, name: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Units</Label>
              <div className="flex gap-2">
                {(["auto", "metric", "imperial"] as Units[]).map((unit) => (
                  <Button
                    key={unit}
                    variant={prefs.units === unit ? "filterActive" : "filter"}
                    size="sm"
                    onClick={() => savePrefs({ ...prefs, units: unit })}
                  >
                    {unit === "auto" ? "Match my country" : unit === "metric" ? "°C · km/h" : "°F · mph"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <p className="text-xs text-muted-foreground">
                {weather.data ? weather.data.place : prefs.coords ? "Saved" : "Not set yet"}
              </p>
              <div className="flex gap-2">
                <Button variant="location" size="sm" onClick={requestLocation}>
                  <LocateFixed /> Use my location
                </Button>
                {prefs.coords && (
                  <Button variant="filter" size="sm" onClick={() => savePrefs({ ...prefs, coords: null })}>
                    Clear
                  </Button>
                )}
              </div>
              {locationStatus && <p className="text-xs text-soft">{locationStatus}</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
