import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  topic: z.enum(["All", "Weather", "Politics", "Local", "National"]).default("All"),
  place: z.string().optional(),
  country: z.string().optional(),
});

function decode(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function tag(item: string, name: string) {
  const match = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return match?.[1] ? decode(match[1]) : "";
}

function ago(dateString: string) {
  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.max(1, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function hostname(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

type Story = { title: string; link: string; source: string; age: string; copy: string };

function parseFeed(xml: string, fallbackSource: string): Story[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/g) ?? xml.match(/<entry[\s\S]*?<\/entry>/g) ?? [];
  return items
    .map((item) => {
      const title = tag(item, "title");
      let link = tag(item, "link");
      if (!link) link = item.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? "";
      const source = tag(item, "source") || hostname(link) || fallbackSource;
      const copy = decode(tag(item, "description") || tag(item, "summary")).slice(0, 180);
      return {
        title,
        link,
        source,
        age: ago(tag(item, "pubDate") || tag(item, "updated") || tag(item, "published")),
        copy: copy || title,
      };
    })
    .filter((story) => story.title && story.link);
}

async function firstWorkingFeed(urls: string[], fallbackSource: string) {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          accept: "application/rss+xml, application/xml, text/xml, */*",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
        },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const stories = parseFeed(xml, fallbackSource);
      if (stories.length) return stories;
    } catch {
      /* try the next source */
    }
  }
  return [] as Story[];
}

function googleUrl(country: string, topic: string, query?: string) {
  const base = `hl=en&gl=${country}&ceid=${country}:en`;
  if (topic === "All") return `https://news.google.com/rss?${base}`;
  if (topic === "National") return `https://news.google.com/rss/headlines/section/topic/NATION?${base}`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query ?? topic)}&${base}`;
}

function bingUrl(query: string) {
  return `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=RSS`;
}

export const getNews = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }) => {
    const country = (data.country || "US").toUpperCase();
    const place = data.place;

    const query =
      data.topic === "Weather"
        ? place
          ? `weather ${place}`
          : "weather forecast"
        : data.topic === "Local"
          ? place
            ? `${place} news`
            : "local news"
          : data.topic === "Politics"
            ? "politics"
            : data.topic === "National"
              ? "national news"
              : "top stories";

    const candidates = [
      googleUrl(country, data.topic, query),
      bingUrl(query),
      ...(data.topic === "Politics"
        ? ["https://feeds.npr.org/1014/rss.xml"]
        : data.topic === "Weather"
          ? ["https://www.accuweather.com/en/rss", "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml"]
          : data.topic === "National"
            ? ["https://feeds.npr.org/1003/rss.xml"]
            : ["https://feeds.bbci.co.uk/news/rss.xml"]),
    ];

    const stories = await firstWorkingFeed(candidates, data.topic);
    if (!stories.length) throw new Error("News feed unavailable");
    return stories.slice(0, 9);
  });
