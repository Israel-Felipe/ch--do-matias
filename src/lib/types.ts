export type Gift = {
  id: string;
  title: string;
  brand: string | null;
  category: string | null;
  notes: string | null;
  link: string | null;
  /** Preço médio estimado em BRL (opcional). */
  avg_price: number | null;
  claimed_by: string | null;
  claimed_at: string | null;
  sort_order: number;
  created_at: string;
};

export type GiftInput = {
  title: string;
  brand?: string | null;
  category?: string | null;
  notes?: string | null;
  link?: string | null;
  avg_price?: number | null;
  sort_order?: number;
};

export type RsvpStatus = "yes" | "no" | "maybe";

export type Rsvp = {
  id: string;
  name: string;
  guests: number;
  status: RsvpStatus;
  note: string | null;
  created_at: string;
};

export type RsvpInput = {
  name: string;
  guests?: number;
  status: RsvpStatus;
  note?: string | null;
};

export type EventInfo = {
  title: string;
  babyName: string;
  subtitle: string;
  dateLabel: string;
  timeLabel: string;
  locationLabel: string;
  addressLabel: string;
  mapsUrl: string;
  rsvpLabel: string;
  intro: string;
  pixKey: string;
  verse: string;
  verseReference: string;
};
