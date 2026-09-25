"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, LogOut, Pencil, Plus, Trash2, Unlock, X } from "lucide-react";
import type { Gift, Rsvp, RsvpStatus } from "@/lib/types";
import { eventInfo } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type GiftDraft = {
  title: string;
  brand: string;
  notes: string;
  link: string;
  avg_price: string;
};

type RsvpDraft = {
  name: string;
  status: RsvpStatus;
  adults: string;
  children: string;
  bringing: boolean;
  bringing_what: string;
  note: string;
};

function giftToDraft(gift: Gift): GiftDraft {
  return {
    title: gift.title,
    brand: gift.brand ?? "",
    notes: gift.notes ?? "",
    link: gift.link ?? "",
    avg_price: gift.avg_price == null ? "" : String(gift.avg_price),
  };
}

function rsvpToDraft(rsvp: Rsvp): RsvpDraft {
  return {
    name: rsvp.name,
    status: rsvp.status,
    adults: String(rsvp.adults ?? rsvp.guests ?? 0),
    children: String(rsvp.children ?? 0),
    bringing: Boolean(rsvp.bringing),
    bringing_what: rsvp.bringing_what ?? "",
    note: rsvp.note ?? "",
  };
}

export function AdminPanel() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GiftDraft | null>(null);
  const [editingRsvpId, setEditingRsvpId] = useState<string | null>(null);
  const [rsvpDraft, setRsvpDraft] = useState<RsvpDraft | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadGifts = useCallback(async () => {
    setLoading(true);
    try {
      const [giftsRes, rsvpRes] = await Promise.all([
        fetch("/api/gifts", { cache: "no-store" }),
        fetch("/api/rsvps", { cache: "no-store" }),
      ]);
      const giftsData = await giftsRes.json();
      const rsvpData = await rsvpRes.json();
      if (!giftsRes.ok) throw new Error(giftsData.error || "Erro ao carregar");
      setGifts(giftsData.gifts as Gift[]);
      if (rsvpRes.ok) setRsvps((rsvpData.rsvps as Rsvp[]) || []);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/auth");
        const data = await res.json();
        setAuthed(Boolean(data.authenticated));
        if (data.authenticated) await loadGifts();
      } finally {
        setChecking(false);
      }
    })();
  }, [loadGifts]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAuthError(data.error || "Senha incorreta");
      return;
    }
    setAuthed(true);
    setPassword("");
    await loadGifts();
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthed(false);
    setGifts([]);
    setRsvps([]);
    setEditingId(null);
    setDraft(null);
    setEditingRsvpId(null);
    setRsvpDraft(null);
  }

  function startEditRsvp(rsvp: Rsvp) {
    setEditingRsvpId(rsvp.id);
    setRsvpDraft(rsvpToDraft(rsvp));
    setEditingId(null);
    setDraft(null);
    setMessage(null);
  }

  function cancelEditRsvp() {
    setEditingRsvpId(null);
    setRsvpDraft(null);
  }

  async function handleSaveRsvp(id: string) {
    if (!rsvpDraft) return;
    if (!rsvpDraft.name.trim()) {
      setMessage("Nome obrigatório");
      return;
    }

    const adults =
      rsvpDraft.status === "no" ? 0 : Number(rsvpDraft.adults) || 0;
    const children =
      rsvpDraft.status === "no" ? 0 : Number(rsvpDraft.children) || 0;

    if (rsvpDraft.status !== "no" && adults + children < 1) {
      setMessage("Informe ao menos 1 pessoa");
      return;
    }

    const bringing =
      rsvpDraft.status === "yes" ? rsvpDraft.bringing : false;
    if (bringing && !rsvpDraft.bringing_what.trim()) {
      setMessage("Informe o que vai levar");
      return;
    }

    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/rsvps/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rsvpDraft.name,
          status: rsvpDraft.status,
          adults,
          children,
          note: rsvpDraft.note.trim() || null,
          bringing,
          bringing_what: bringing ? rsvpDraft.bringing_what : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      setRsvps((prev) => prev.map((r) => (r.id === id ? data.rsvp : r)));
      setEditingRsvpId(null);
      setRsvpDraft(null);
      setMessage("Presença atualizada.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao salvar RSVP");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteRsvp(id: string) {
    if (!confirm("Remover esta confirmação?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/rsvps/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao remover");
      setRsvps((prev) => prev.filter((r) => r.id !== id));
      if (editingRsvpId === id) cancelEditRsvp();
      setMessage("Confirmação removida.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao remover RSVP");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setCreating(true);
    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          brand,
          notes,
          link,
          avg_price:
            avgPrice.trim() === "" ? null : Number(avgPrice.replace(",", ".")),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Não foi possível adicionar");
        return;
      }
      setTitle("");
      setBrand("");
      setNotes("");
      setLink("");
      setAvgPrice("");
      setCreateOpen(false);
      setMessage("Item adicionado.");
      await loadGifts();
    } finally {
      setCreating(false);
    }
  }

  function startEdit(gift: Gift) {
    setEditingId(gift.id);
    setDraft(giftToDraft(gift));
    setEditingRsvpId(null);
    setRsvpDraft(null);
    setMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function handleSaveEdit(id: string) {
    if (!draft) return;
    if (!draft.title.trim()) {
      setMessage("Título obrigatório");
      return;
    }
    const avg_price =
      draft.avg_price.trim() === ""
        ? null
        : Number(draft.avg_price.replace(",", "."));
    if (avg_price != null && Number.isNaN(avg_price)) {
      setMessage("Preço inválido");
      return;
    }

    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/gifts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          brand: draft.brand.trim() || null,
          notes: draft.notes.trim() || null,
          link: draft.link.trim() || null,
          avg_price,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      setGifts((prev) => prev.map((g) => (g.id === id ? data.gift : g)));
      setEditingId(null);
      setDraft(null);
      setMessage("Item atualizado.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRelease(id: string) {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/gifts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ release: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao liberar");
      setGifts((prev) => prev.map((g) => (g.id === id ? data.gift : g)));
      setMessage("Reserva liberada.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao liberar");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este item da lista?")) return;
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/gifts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao remover");
      setGifts((prev) => prev.filter((g) => g.id !== id));
      if (editingId === id) cancelEdit();
      setMessage("Item removido.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setBusyId(null);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center gap-2 text-ink-soft">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando...
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-[70svh] w-full max-w-md flex-col justify-center px-5 py-10">
        <h1 className="font-script text-4xl text-ink">Área da família</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Digite a senha para gerenciar a lista de sugestões.
        </p>
        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-password">Senha</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-2xl text-base"
              autoFocus
            />
          </div>
          {authError ? (
            <p className="text-sm text-destructive">{authError}</p>
          ) : null}
          <Button type="submit" className="h-12 w-full rounded-full text-base">
            Entrar
          </Button>
        </form>
        <Link href="/" className="mt-6 text-center text-sm text-ink-soft underline">
          Voltar ao site
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-script text-4xl text-ink sm:text-5xl">Admin</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Adicione, edite, remova ou libere reservas da lista.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-card px-4 text-sm font-medium text-ink"
          >
            Ver site
          </Link>
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-full"
            onClick={() => void handleLogout()}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      {message ? (
        <p className="mt-6 rounded-2xl bg-pond/60 px-4 py-3 text-sm text-ink">
          {message}
        </p>
      ) : null}

      <div className="mt-8">
        <h2 className="font-display text-lg text-ink">
          Presenças ({rsvps.length})
        </h2>
        {rsvps.some((r) => r.status === "yes") ? (
          <p className="mt-1 text-sm text-ink-soft">
            Confirmados:{" "}
            {rsvps
              .filter((r) => r.status === "yes")
              .reduce((sum, r) => sum + (r.adults ?? r.guests), 0)}{" "}
            adulto(s) ·{" "}
            {rsvps
              .filter((r) => r.status === "yes")
              .reduce((sum, r) => sum + (r.children ?? 0), 0)}{" "}
            criança(s)
          </p>
        ) : null}
        <ul className="mt-3 space-y-2">
          {rsvps.length === 0 ? (
            <li className="rounded-2xl bg-card/90 p-4 text-sm text-ink-soft ring-1 ring-border/60">
              Nenhuma confirmação ainda.
            </li>
          ) : (
            rsvps.map((rsvp) => {
              const editing = editingRsvpId === rsvp.id ? rsvpDraft : null;

              return (
              <li
                key={rsvp.id}
                className="rounded-2xl bg-card/90 p-4 ring-1 ring-border/60"
              >
                {editing ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`rsvp-name-${rsvp.id}`}>Nome</Label>
                      <Input
                        id={`rsvp-name-${rsvp.id}`}
                        value={editing.name}
                        onChange={(e) =>
                          setRsvpDraft((d) =>
                            d ? { ...d, name: e.target.value } : d,
                          )
                        }
                        className="h-11 rounded-2xl text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            { value: "yes" as const, label: "Vai" },
                            { value: "no" as const, label: "Não vai" },
                          ]
                        ).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              setRsvpDraft((d) => {
                                if (!d) return d;
                                const next = { ...d, status: opt.value };
                                if (opt.value !== "yes") {
                                  next.bringing = false;
                                  next.bringing_what = "";
                                }
                                if (opt.value === "no") {
                                  next.adults = "0";
                                  next.children = "0";
                                } else if (d.status === "no") {
                                  next.adults = "1";
                                  next.children = "0";
                                }
                                return next;
                              })
                            }
                            className={cn(
                              "min-h-11 rounded-2xl px-3 text-sm font-semibold transition",
                              editing.status === opt.value
                                ? "bg-ink text-cream"
                                : "bg-cream-deep/80 text-ink-soft ring-1 ring-border/60",
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {editing.status !== "no" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`rsvp-adults-${rsvp.id}`}>Adultos</Label>
                          <Input
                            id={`rsvp-adults-${rsvp.id}`}
                            type="number"
                            min={0}
                            max={20}
                            value={editing.adults}
                            onChange={(e) =>
                              setRsvpDraft((d) =>
                                d ? { ...d, adults: e.target.value } : d,
                              )
                            }
                            className="h-11 rounded-2xl text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`rsvp-children-${rsvp.id}`}>
                            Crianças (até {eventInfo.childMaxAge} anos)
                          </Label>
                          <Input
                            id={`rsvp-children-${rsvp.id}`}
                            type="number"
                            min={0}
                            max={20}
                            value={editing.children}
                            onChange={(e) =>
                              setRsvpDraft((d) =>
                                d ? { ...d, children: e.target.value } : d,
                              )
                            }
                            className="h-11 rounded-2xl text-base"
                          />
                        </div>
                      </div>
                    ) : null}

                    {editing.status === "yes" ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-cream-deep/50 px-3.5 py-3 ring-1 ring-border/50">
                          <Label
                            htmlFor={`rsvp-bringing-${rsvp.id}`}
                            className="cursor-pointer text-sm font-normal text-ink-soft"
                          >
                            Vai levar salgado, doce ou bebida
                          </Label>
                          <button
                            id={`rsvp-bringing-${rsvp.id}`}
                            type="button"
                            role="switch"
                            aria-checked={editing.bringing}
                            onClick={() =>
                              setRsvpDraft((d) => {
                                if (!d) return d;
                                const next = !d.bringing;
                                return {
                                  ...d,
                                  bringing: next,
                                  bringing_what: next ? d.bringing_what : "",
                                };
                              })
                            }
                            className={cn(
                              "relative h-6 w-10 shrink-0 rounded-full transition-colors",
                              editing.bringing ? "bg-sage" : "bg-border",
                            )}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                                editing.bringing && "translate-x-4",
                              )}
                            />
                          </button>
                        </div>
                        {editing.bringing ? (
                          <div className="space-y-2">
                            <Label htmlFor={`rsvp-bring-what-${rsvp.id}`}>
                              O que vai levar?
                            </Label>
                            <Input
                              id={`rsvp-bring-what-${rsvp.id}`}
                              value={editing.bringing_what}
                              onChange={(e) =>
                                setRsvpDraft((d) =>
                                  d
                                    ? { ...d, bringing_what: e.target.value }
                                    : d,
                                )
                              }
                              className="h-11 rounded-2xl text-base"
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor={`rsvp-note-${rsvp.id}`}>Recado</Label>
                      <Input
                        id={`rsvp-note-${rsvp.id}`}
                        value={editing.note}
                        onChange={(e) =>
                          setRsvpDraft((d) =>
                            d ? { ...d, note: e.target.value } : d,
                          )
                        }
                        className="h-11 rounded-2xl text-base"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className="h-11 rounded-full"
                        disabled={busyId === rsvp.id}
                        onClick={() => void handleSaveRsvp(rsvp.id)}
                      >
                        {busyId === rsvp.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Salvar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-full"
                        disabled={busyId === rsvp.id}
                        onClick={cancelEditRsvp}
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-display text-base text-ink">{rsvp.name}</p>
                      <p className="mt-1 text-sm text-ink-soft">
                        {rsvp.status === "yes"
                          ? "Vai"
                          : rsvp.status === "maybe"
                            ? "Talvez"
                            : "Não vai"}
                        {rsvp.status !== "no"
                          ? ` · ${rsvp.adults ?? rsvp.guests} adulto(s)` +
                            ` · ${rsvp.children ?? 0} criança(s)`
                          : null}
                        {rsvp.bringing && rsvp.bringing_what
                          ? ` · Leva: ${rsvp.bringing_what}`
                          : null}
                        {rsvp.note ? ` · ${rsvp.note}` : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-nowrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-full"
                        disabled={busyId === rsvp.id}
                        onClick={() => startEditRsvp(rsvp)}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="h-11 rounded-full"
                        disabled={busyId === rsvp.id}
                        onClick={() => void handleDeleteRsvp(rsvp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                  </div>
                )}
              </li>
              );
            })
          )}
        </ul>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg text-ink">
              Itens ({gifts.length})
            </h2>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-ink-soft" />
            ) : null}
          </div>
          <Button
            type="button"
            className="h-10 rounded-full"
            onClick={() => {
              setMessage(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Incluir novo item
          </Button>
        </div>
        <ul className="space-y-2">
          {gifts.map((gift) => {
            const editing = editingId === gift.id ? draft : null;

            return (
              <li
                key={gift.id}
                className="rounded-2xl bg-card/90 p-4 ring-1 ring-border/60"
              >
                {editing ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`edit-title-${gift.id}`}>Título</Label>
                      <Input
                        id={`edit-title-${gift.id}`}
                        value={editing.title}
                        onChange={(e) =>
                          setDraft((d) => (d ? { ...d, title: e.target.value } : d))
                        }
                        className="h-11 rounded-2xl text-base"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`edit-brand-${gift.id}`}>Marca</Label>
                        <Input
                          id={`edit-brand-${gift.id}`}
                          value={editing.brand}
                          onChange={(e) =>
                            setDraft((d) =>
                              d ? { ...d, brand: e.target.value } : d,
                            )
                          }
                          className="h-11 rounded-2xl text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`edit-price-${gift.id}`}>
                          Preço médio (R$)
                        </Label>
                        <Input
                          id={`edit-price-${gift.id}`}
                          inputMode="decimal"
                          value={editing.avg_price}
                          onChange={(e) =>
                            setDraft((d) =>
                              d ? { ...d, avg_price: e.target.value } : d,
                            )
                          }
                          className="h-11 rounded-2xl text-base"
                          placeholder="Ex.: 49,90"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`edit-notes-${gift.id}`}>Observação</Label>
                      <Input
                        id={`edit-notes-${gift.id}`}
                        value={editing.notes}
                        onChange={(e) =>
                          setDraft((d) =>
                            d ? { ...d, notes: e.target.value } : d,
                          )
                        }
                        className="h-11 rounded-2xl text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`edit-link-${gift.id}`}>
                        Link de referência
                      </Label>
                      <Input
                        id={`edit-link-${gift.id}`}
                        value={editing.link}
                        onChange={(e) =>
                          setDraft((d) =>
                            d ? { ...d, link: e.target.value } : d,
                          )
                        }
                        className="h-11 rounded-2xl text-base"
                        placeholder="https://..."
                      />
                    </div>
                    {gift.claimed_by ? (
                      <p className="text-sm text-ink-soft">
                        Reservado por <strong>{gift.claimed_by}</strong>
                      </p>
                    ) : (
                      <p className="text-sm text-sage">Disponível</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className="h-11 flex-1 rounded-full sm:flex-none"
                        disabled={busyId === gift.id}
                        onClick={() => void handleSaveEdit(gift.id)}
                      >
                        {busyId === gift.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Salvar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 flex-1 rounded-full sm:flex-none"
                        disabled={busyId === gift.id}
                        onClick={cancelEdit}
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-base text-ink">
                          {gift.title}
                        </p>
                        {gift.brand ? (
                          <Badge variant="secondary" className="rounded-full">
                            {gift.brand}
                          </Badge>
                        ) : null}
                      </div>
                      {gift.notes ? (
                        <p className="mt-1 text-xs text-ink-soft">{gift.notes}</p>
                      ) : null}
                      {gift.link ? (
                        <a
                          href={gift.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block max-w-[16rem] truncate text-xs text-copper underline-offset-2 hover:underline sm:max-w-xs"
                          title={gift.link}
                        >
                          {gift.link}
                        </a>
                      ) : null}
                      {gift.avg_price != null ? (
                        <p className="mt-1 text-xs text-ink-soft">
                          Preço médio: R${" "}
                          {Number(gift.avg_price).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      ) : null}
                      {gift.claimed_by ? (
                        <p className="mt-1 text-sm text-ink-soft">
                          Reservado por <strong>{gift.claimed_by}</strong>
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-sage">Disponível</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-nowrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-full"
                        disabled={busyId === gift.id}
                        onClick={() => startEdit(gift)}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      {gift.claimed_by ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 rounded-full"
                          disabled={busyId === gift.id}
                          onClick={() => void handleRelease(gift.id)}
                        >
                          <Unlock className="h-4 w-4" />
                          Liberar
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="destructive"
                        className="h-11 rounded-full"
                        disabled={busyId === gift.id}
                        onClick={() => void handleDelete(gift.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90svh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-3xl border-border bg-card p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-ink">
              Novo item
            </DialogTitle>
            <DialogDescription className="text-ink-soft">
              Preencha os dados da sugestão de presente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="mt-2 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-12 rounded-2xl text-base"
                placeholder="Ex.: Fraldas M"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="h-12 rounded-2xl text-base"
                  placeholder="Ex.: Mustela"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avgPrice">Preço médio (R$)</Label>
                <Input
                  id="avgPrice"
                  inputMode="decimal"
                  value={avgPrice}
                  onChange={(e) => setAvgPrice(e.target.value)}
                  className="h-12 rounded-2xl text-base"
                  placeholder="Ex.: 49,90"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observação</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-12 rounded-2xl text-base"
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link de referência</Label>
              <Input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="h-12 rounded-2xl text-base"
                placeholder="https://..."
              />
            </div>
            <Button
              type="submit"
              className="h-12 w-full rounded-full text-base"
              disabled={creating || !title.trim()}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Adicionar
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
