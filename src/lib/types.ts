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
  /** Total de pessoas (adultos + crianças). Mantido para compatibilidade. */
  guests: number;
  adults: number;
  children: number;
  status: RsvpStatus;
  note: string | null;
  bringing: boolean;
  bringing_what: string | null;
  created_at: string;
};

export type RsvpInput = {
  name: string;
  guests?: number;
  adults?: number;
  children?: number;
  status: RsvpStatus;
  note?: string | null;
  bringing?: boolean;
  bringing_what?: string | null;
};

export type EventInfo = {
  title: string;
  babyName: string;
  subtitle: string;
  dateLabel: string;
  timeLabel: string;
  locationLabel: string;
  addressArea: string;
  addressStreet: string;
  mapsUrl: string;
  rsvpLabel: string;
  /** Idade máxima considerada criança no RSVP. */
  childMaxAge: number;
  intro: string;
  pixKey: string;
  verse: string;
  verseReference: string;
};
