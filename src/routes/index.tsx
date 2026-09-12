import { createFileRoute } from "@tanstack/react-router";
import { Bell, CalendarDays, Compass, ExternalLink, LocateFixed, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import fernAsset from "@/assets/Fern_logo.png.asset.json";
import stormAsset from "@/assets/loopingstorm.gif.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fern — A calmer place to start" },
      { name: "description", content: "A calm personal start page with weather, time, search, and the latest stories." },
      { property: "og:title", content: "Fern — A calmer place to start" },
      { property: "og:description", content: "A calm personal start page with weather, time, search, and the latest stories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const stories = [
  {
    label: "Weather",
    age: "1d ago",
    title: "Oregon Ducks vs. Oklahoma State Weather Forecast Takes Another Turn - si.com",
    copy: "Oregon Ducks vs. Oklahoma State Weather Forecast Takes Another Turn — Sports Illustrated",
  },
  {
    label: "Weather",
    age: "1d ago",
    title: "Winter outlook 2026-27: Where snow could be abundant - The Weather Channel",
    copy: "The Weather Channel looks ahead to the areas most likely to see a snowier winter.",
  },
  {
    label: "Weather",
    age: "5 hr ago",
    title: "Rain is on the way for the weekend in Maryland - WBAL-TV",
    copy: "Rain is on the way for the weekend across Maryland, with cooler conditions following.",
  },
];

function Index() {
  const [now, setNow] = useState<Date | null>(null);
  const [locationText, setLocationText] = useState("Make it yours");
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = String(data.get("query") ?? "").trim();
    if (query) window.location.assign(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationText("Location unavailable");
      return;
    }
    setLocationText("Finding you…");
    navigator.geolocation.getCurrentPosition(
      () => setLocationText("Location found"),
      () => setLocationText("Location unavailable"),
    );
  };

  const greeting = !now ? "Good afternoon." : now.getHours() < 12 ? "Good morning." : now.getHours() < 18 ? "Good afternoon." : "Good evening.";
  const date = now?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) ?? "Saturday, September 12";
  const time = now?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) ?? "01:42 PM";
  const zone = now ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";

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
            <Button variant="glass" size="sm"><SlidersHorizontal /> Personalize</Button>
          </div>
        </header>

        <section className="mx-auto mt-24 max-w-[680px] text-center md:mt-28">
          <p className="flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-subtle"><Sparkles className="h-3 w-3" /> A calmer place to start</p>
          <h1 className="mt-4 text-5xl font-semibold leading-none tracking-normal md:text-[64px]">{greeting}</h1>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> {date}</p>
          <form onSubmit={search} className="mt-9 flex h-14 items-center gap-3 rounded-2xl border border-border bg-search px-4 shadow-2xl backdrop-blur-xl">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input name="query" aria-label="Search the web" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Search the web" />
            <kbd className="grid h-7 w-7 place-items-center rounded-md border border-border text-xs text-muted-foreground">↵</kbd>
          </form>
        </section>

        <section className="mt-11 grid gap-3 md:grid-cols-[1.02fr_1.3fr_.78fr]">
          <article className="glass-panel flex min-h-56 flex-col p-6">
            <div className="flex items-start justify-between">
              <div><p className="eyebrow">Local weather</p><h2 className="mt-3 text-base font-medium">{locationText}</h2></div>
              <Compass className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-auto text-sm text-soft">See what the day looks like where you are.</p>
            <Button variant="location" size="sm" className="mt-3 self-start" onClick={requestLocation}><LocateFixed /> Use my location</Button>
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
            <a href="https://news.google.com/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">Open news <ExternalLink className="h-3 w-3" /></a>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {["All", "Weather", "Politics", "Local", "National"].map((filter) => (
              <Button key={filter} variant={activeFilter === filter ? "filterActive" : "filter"} size="sm" onClick={() => setActiveFilter(filter)}>{filter}</Button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {stories.map((story) => (
              <article key={story.title} className="news-card min-h-36 p-5">
                <div className="flex justify-between"><p className="eyebrow">{story.label}</p><span className="text-[10px] text-muted-foreground">{story.age}</span></div>
                <h3 className="mt-7 text-base font-medium leading-snug">{story.title}</h3>
                <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{story.copy}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
