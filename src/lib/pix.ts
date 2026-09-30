import {
  localCreatePixPledge,
  localDeletePixPledge,
  localListPixPledges,
} from "@/lib/pix-store";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import type { PixPledge } from "@/lib/types";

function mode(): "supabase" | "local" {
  if (isSupabaseConfigured()) return "supabase";
  if (process.env.VERCEL) {
    throw new Error(
      "Supabase não configurado. Confira as variáveis na Vercel (podem vir com prefixo CHA_MATIAS_: URL + SECRET_KEY ou SERVICE_ROLE_KEY).",
    );
  }
  return "local";
}

export async function listPixPledges(): Promise<PixPledge[]> {
  if (mode() === "local") return localListPixPledges();

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("pix_pledges")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PixPledge[];
}

export async function createPixPledge(name: string): Promise<PixPledge> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Informe seu nome");

  if (mode() === "local") return localCreatePixPledge(trimmed);

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("pix_pledges")
    .insert({ name: trimmed })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as PixPledge;
}

export async function deletePixPledge(id: string): Promise<boolean> {
  if (mode() === "local") return localDeletePixPledge(id);

  const supabase = getSupabaseAdmin()!;
  const { error, count } = await supabase
    .from("pix_pledges")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}
