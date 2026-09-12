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

export const getNews = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }) => {
    const country = (data.country || "US").toUpperCase();
    const gl = country;
    const base = `hl=en&gl=${gl}&ceid=${gl}:en`;

    let url: string;
    if (data.topic === "All") {
      url = `https://news.google.com/rss?${base}`;
    } else if (data.topic === "National") {
      url = `https://news.google.com/rss/headlines/section/topic/NATION?${base}`;
    } else if (data.topic === "Politics") {
      url = `https://news.google.com/rss/search?q=politics&${base}`;
    } else if (data.topic === "Weather") {
      const query = data.place ? `weather ${data.place}` : "weather forecast";
      url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&${base}`;
    } else {
      const query = data.place ? `${data.place} news` : "local news";
      url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&${base}`;
    }

    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; FernReader/1.0)" } });
    if (!res.ok) throw new Error("News feed unavailable");
    const xml = await res.text();

    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
    return items.slice(0, 9).map((item) => {
      const source = tag(item, "source");
      const title = tag(item, "title");
      return {
        title,
        link: tag(item, "link"),
        source: source || data.topic,
        age: ago(tag(item, "pubDate")),
        copy: decode(tag(item, "description")).slice(0, 180) || title,
      };
    });
  });
