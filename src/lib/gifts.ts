import {
  localClaimGift,
  localCreateGift,
  localDeleteGift,
  localListGifts,
  localReleaseGift,
  localUpdateGift,
} from "@/lib/local-store";
import { seedGifts } from "@/lib/seed";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import type { Gift, GiftInput } from "@/lib/types";

export function getDataMode(): "supabase" | "local" {
  if (isSupabaseConfigured()) return "supabase";
  if (process.env.VERCEL) {
    throw new Error(
      "Supabase não configurado. Confira as variáveis na Vercel (podem vir com prefixo CHA_MATIAS_: URL + SECRET_KEY ou SERVICE_ROLE_KEY).",
    );
  }
  return "local";
}

export async function listGifts(): Promise<Gift[]> {
  if (getDataMode() === "local") return localListGifts();

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("gifts")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  if (data && data.length > 0) return data as Gift[];

  // Primeira carga: popula a lista do seed (como no modo local).
  const rows = seedGifts.map((g) => ({
    title: g.title,
    brand: g.brand,
    category: g.category,
    notes: g.notes,
    link: g.link,
    avg_price: g.avg_price,
    sort_order: g.sort_order,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("gifts")
    .insert(rows)
    .select("*")
    .order("sort_order", { ascending: true });

  if (insertError) throw new Error(insertError.message);
  return (inserted ?? []) as Gift[];
}

export async function createGift(input: GiftInput): Promise<Gift> {
  if (getDataMode() === "local") return localCreateGift(input);

  const supabase = getSupabaseAdmin()!;
  const { data: maxRow } = await supabase
    .from("gifts")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = input.sort_order ?? ((maxRow?.sort_order as number) ?? 0) + 1;

  const { data, error } = await supabase
    .from("gifts")
    .insert({
      title: input.title.trim(),
      brand: input.brand?.trim() || null,
      category: input.category?.trim() || null,
      notes: input.notes?.trim() || null,
      link: input.link?.trim() || null,
      avg_price:
        input.avg_price == null || Number.isNaN(Number(input.avg_price))
          ? null
          : Number(input.avg_price),
      sort_order,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Gift;
}

export async function updateGift(
  id: string,
  patch: Partial<
    Pick<Gift, "title" | "brand" | "category" | "notes" | "link" | "avg_price" | "sort_order">
  >,
): Promise<Gift | null> {
  if (getDataMode() === "local") return localUpdateGift(id, patch);

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("gifts")
    .update({
      ...patch,
      title: patch.title?.trim(),
      brand:
        patch.brand === undefined ? undefined : patch.brand?.trim() || null,
      category:
        patch.category === undefined
          ? undefined
          : patch.category?.trim() || null,
      notes:
        patch.notes === undefined ? undefined : patch.notes?.trim() || null,
      link:
        patch.link === undefined ? undefined : patch.link?.trim() || null,
      avg_price:
        patch.avg_price === undefined
          ? undefined
          : patch.avg_price == null || Number.isNaN(Number(patch.avg_price))
            ? null
            : Number(patch.avg_price),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Gift) ?? null;
}

export async function deleteGift(id: string): Promise<boolean> {
  if (getDataMode() === "local") return localDeleteGift(id);

  const supabase = getSupabaseAdmin()!;
  const { error, count } = await supabase
    .from("gifts")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function claimGift(
  id: string,
  name: string,
): Promise<{ gift: Gift | null; conflict: boolean }> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Informe seu nome");

  if (getDataMode() === "local") return localClaimGift(id, trimmed);

  const supabase = getSupabaseAdmin()!;
  const claimed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("gifts")
    .update({ claimed_by: trimmed, claimed_at })
    .eq("id", id)
    .is("claimed_by", null)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (data) return { gift: data as Gift, conflict: false };

  const { data: existing } = await supabase
    .from("gifts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { gift: null, conflict: false };
  return { gift: existing as Gift, conflict: true };
}

export async function releaseGift(
  id: string,
  name?: string,
): Promise<{ gift: Gift | null; mismatch: boolean }> {
  if (getDataMode() === "local") return localReleaseGift(id, name);

  const supabase = getSupabaseAdmin()!;

  if (name !== undefined) {
    const { data: existing } = await supabase
      .from("gifts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!existing) return { gift: null, mismatch: false };

    const expected = String(existing.claimed_by || "")
      .trim()
      .toLowerCase();
    const actual = name.trim().toLowerCase();
    if (!expected || expected !== actual) {
      return { gift: existing as Gift, mismatch: true };
    }
  }

  const { data, error } = await supabase
    .from("gifts")
    .update({ claimed_by: null, claimed_at: null })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return { gift: (data as Gift) ?? null, mismatch: false };
}
