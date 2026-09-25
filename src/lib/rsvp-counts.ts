import type { RsvpInput } from "@/lib/types";

function clampCount(value: number | undefined, fallback: number) {
  if (value == null || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(20, Math.floor(value)));
}

/** Normaliza adultos/crianças e mantém guests = soma. */
export function normalizeGuestCounts(input: RsvpInput): {
  adults: number;
  children: number;
  guests: number;
} {
  if (input.status === "no") {
    return { adults: 0, children: 0, guests: 0 };
  }

  let adults = clampCount(input.adults, NaN);
  let children = clampCount(input.children, NaN);

  if (Number.isNaN(adults) && Number.isNaN(children)) {
    const total = clampCount(input.guests, 1) || 1;
    adults = total;
    children = 0;
  } else {
    if (Number.isNaN(adults)) adults = 1;
    if (Number.isNaN(children)) children = 0;
  }

  if (adults + children < 1) adults = 1;

  return {
    adults,
    children,
    guests: adults + children,
  };
}
