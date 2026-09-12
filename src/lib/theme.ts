export type AccentKey =
  | "fern"
  | "blue"
  | "orange"
  | "violet"
  | "rose"
  | "teal"
  | "amber";

export const ACCENTS: { key: AccentKey; label: string; hue: number; swatch: string }[] = [
  { key: "fern", label: "Fern", hue: 135, swatch: "oklch(0.62 0.15 135)" },
  { key: "blue", label: "Blue", hue: 250, swatch: "oklch(0.62 0.15 250)" },
  { key: "orange", label: "Orange", hue: 55, swatch: "oklch(0.68 0.16 55)" },
  { key: "violet", label: "Violet", hue: 300, swatch: "oklch(0.62 0.16 300)" },
  { key: "rose", label: "Rose", hue: 15, swatch: "oklch(0.63 0.18 15)" },
  { key: "teal", label: "Teal", hue: 195, swatch: "oklch(0.65 0.11 195)" },
  { key: "amber", label: "Amber", hue: 85, swatch: "oklch(0.75 0.15 85)" },
];

export function accentHue(key: string) {
  return ACCENTS.find((accent) => accent.key === key)?.hue ?? 135;
}

export function applyAccent(key: string) {
  if (typeof document === "undefined") return;
  const hue = accentHue(key);
  const root = document.documentElement.style;
  root.setProperty("--primary", `oklch(0.53 0.15 ${hue})`);
  root.setProperty("--ring", `oklch(0.67 0.1 ${hue})`);
  root.setProperty("--location", `oklch(0.54 0.09 ${hue} / 23%)`);
  root.setProperty("--location-hover", `oklch(0.58 0.1 ${hue} / 34%)`);
  root.setProperty("--filter-active", `oklch(0.69 0.13 ${hue} / 45%)`);
  root.setProperty("--status", `oklch(0.86 0.06 ${hue})`);
  root.setProperty("--soft", `oklch(0.76 0.035 ${hue})`);
  root.setProperty("--subtle", `oklch(0.77 0.025 ${hue})`);
  root.setProperty("--foreground", `oklch(0.965 0.015 ${hue})`);
}
