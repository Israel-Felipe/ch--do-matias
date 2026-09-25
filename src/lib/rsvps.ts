import {
  localCreateRsvp,
  localDeleteRsvp,
  localListRsvps,
  localUpdateRsvp,
} from "@/lib/rsvp-store";
import { normalizeGuestCounts } from "@/lib/rsvp-counts";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import type { Rsvp, RsvpInput } from "@/lib/types";

function mode(): "supabase" | "local" {
  if (isSupabaseConfigured()) return "supabase";
  if (process.env.VERCEL) {
    throw new Error(
      "Supabase não configurado. Confira as variáveis na Vercel (podem vir com prefixo CHA_MATIAS_: URL + SECRET_KEY ou SERVICE_ROLE_KEY).",
    );
  }
  return "local";
}

function buildRsvpPayload(input: RsvpInput) {
  const counts = normalizeGuestCounts(input);
  const bringing = input.status === "yes" ? Boolean(input.bringing) : false;
  return {
    name: input.name.trim(),
    guests: counts.guests,
    adults: counts.adults,
    children: counts.children,
    status: input.status,
    note: input.note?.trim() || null,
    bringing,
    bringing_what: bringing ? input.bringing_what?.trim() || null : null,
  };
}

export async function listRsvps(): Promise<Rsvp[]> {
  if (mode() === "local") return localListRsvps();

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("rsvps")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as Rsvp[]).map((r) => ({
    ...r,
    adults: r.adults ?? r.guests ?? 0,
    children: r.children ?? 0,
  }));
}

export async function createRsvp(input: RsvpInput): Promise<Rsvp> {
  if (!input.name.trim()) throw new Error("Informe seu nome");

  if (mode() === "local") return localCreateRsvp(input);

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("rsvps")
    .insert(buildRsvpPayload(input))
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Rsvp;
}

export async function updateRsvp(
  id: string,
  input: RsvpInput,
): Promise<Rsvp | null> {
  if (!input.name.trim()) throw new Error("Informe seu nome");

  if (mode() === "local") return localUpdateRsvp(id, input);

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("rsvps")
    .update(buildRsvpPayload(input))
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Rsvp) ?? null;
}

export async function deleteRsvp(id: string): Promise<boolean> {
  if (mode() === "local") return localDeleteRsvp(id);

  const supabase = getSupabaseAdmin()!;
  const { error, count } = await supabase
    .from("rsvps")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export function summarizeRsvps(rsvps: Rsvp[]) {
  const yes = rsvps.filter((r) => r.status === "yes");
  const maybe = rsvps.filter((r) => r.status === "maybe");
  const no = rsvps.filter((r) => r.status === "no");
  return {
    yesCount: yes.length,
    maybeCount: maybe.length,
    noCount: no.length,
    guestsComing: yes.reduce((sum, r) => sum + r.guests, 0),
    adultsComing: yes.reduce((sum, r) => sum + (r.adults ?? r.guests), 0),
    childrenComing: yes.reduce((sum, r) => sum + (r.children ?? 0), 0),
  };
}
