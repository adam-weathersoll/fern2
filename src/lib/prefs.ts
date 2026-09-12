export type Units = "auto" | "metric" | "imperial";
export type Coords = { lat: number; lon: number };
export type BackgroundType = "image" | "video";

export type Prefs = {
  name: string;
  units: Units;
  coords: Coords | null;
  accent: string;
  backgroundPath: string | null;
  backgroundType: BackgroundType | null;
};

export const DEFAULT_PREFS: Prefs = {
  name: "",
  units: "auto",
  coords: null,
  accent: "fern",
  backgroundPath: null,
  backgroundType: null,
};

const STORAGE_KEY = "fern:prefs";

export function loadLocalPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    /* ignore */
  }
  return DEFAULT_PREFS;
}

export function saveLocalPrefs(prefs: Prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export type ProfileRow = {
  display_name: string;
  units: string;
  lat: number | null;
  lon: number | null;
  accent: string;
  background_url: string | null;
  background_type: string | null;
};

export function prefsFromProfile(row: ProfileRow): Prefs {
  return {
    name: row.display_name ?? "",
    units: (["auto", "metric", "imperial"].includes(row.units) ? row.units : "auto") as Units,
    coords: row.lat != null && row.lon != null ? { lat: row.lat, lon: row.lon } : null,
    accent: row.accent || "fern",
    backgroundPath: row.background_url,
    backgroundType: (row.background_type === "video" || row.background_type === "image"
      ? row.background_type
      : null) as BackgroundType | null,
  };
}

export function profileFromPrefs(prefs: Prefs) {
  return {
    display_name: prefs.name,
    units: prefs.units,
    lat: prefs.coords?.lat ?? null,
    lon: prefs.coords?.lon ?? null,
    accent: prefs.accent,
    background_url: prefs.backgroundPath,
    background_type: prefs.backgroundType,
  };
}
