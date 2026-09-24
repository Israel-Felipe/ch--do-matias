import {
  localCreateRsvp,
  localDeleteRsvp,
  localListRsvps,
} from "@/lib/rsvp-store";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import type { Rsvp, RsvpInput } from "@/lib/types";

function mode(): "supabase" | "local" {
  return isSupabaseConfigured() ? "supabase" : "local";
}

export async function listRsvps(): Promise<Rsvp[]> {
  if (mode() === "local") return localListRsvps();

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("rsvps")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Rsvp[];
}

export async function createRsvp(input: RsvpInput): Promise<Rsvp> {
  if (!input.name.trim()) throw new Error("Informe seu nome");

  if (mode() === "local") return localCreateRsvp(input);

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("rsvps")
    .insert({
      name: input.name.trim(),
      guests: Math.max(1, Math.min(20, Math.floor(input.guests ?? 1))),
      status: input.status,
      note: input.note?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Rsvp;
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
  };
}
