"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LogOut, Plus, Trash2, Unlock } from "lucide-react";
import type { Gift, Rsvp } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
  const [busyId, setBusyId] = useState<string | null>(null);
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
  }

  async function handleDeleteRsvp(id: string) {
    if (!confirm("Remover esta confirmação?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/rsvps/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao remover");
      setRsvps((prev) => prev.filter((r) => r.id !== id));
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
    const res = await fetch("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, brand, notes, link }),
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
    setMessage("Item adicionado.");
    await loadGifts();
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
            Adicione, remova ou libere reservas da lista.
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

      <form
        onSubmit={handleCreate}
        className="mt-8 space-y-3 rounded-[1.5rem] bg-card/90 p-4 ring-1 ring-border/70 sm:p-5"
      >
        <h2 className="font-display text-lg text-ink">Novo item</h2>
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
            <Label htmlFor="notes">Observação</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-12 rounded-2xl text-base"
              placeholder="Opcional"
            />
          </div>
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
        <Button type="submit" className="h-12 w-full rounded-full text-base sm:w-auto">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </form>

      {message ? (
        <p className="mt-4 rounded-2xl bg-pond/60 px-4 py-3 text-sm text-ink">
          {message}
        </p>
      ) : null}

      <div className="mt-10">
        <h2 className="font-display text-lg text-ink">
          Presenças ({rsvps.length})
        </h2>
        <ul className="mt-3 space-y-2">
          {rsvps.length === 0 ? (
            <li className="rounded-2xl bg-card/90 p-4 text-sm text-ink-soft ring-1 ring-border/60">
              Nenhuma confirmação ainda.
            </li>
          ) : (
            rsvps.map((rsvp) => (
              <li
                key={rsvp.id}
                className="flex flex-col gap-3 rounded-2xl bg-card/90 p-4 ring-1 ring-border/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-display text-base text-ink">{rsvp.name}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {rsvp.status === "yes"
                      ? "Vai"
                      : rsvp.status === "maybe"
                        ? "Talvez"
                        : "Não vai"}
                    {rsvp.status !== "no" ? ` · ${rsvp.guests} pessoa(s)` : null}
                    {rsvp.note ? ` · ${rsvp.note}` : null}
                  </p>
                </div>
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
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg text-ink">Itens ({gifts.length})</h2>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-ink-soft" /> : null}
        </div>
        <ul className="space-y-2">
          {gifts.map((gift) => (
            <li
              key={gift.id}
              className="rounded-2xl bg-card/90 p-4 ring-1 ring-border/60"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-base text-ink">{gift.title}</p>
                    {gift.brand ? (
                      <Badge variant="secondary" className="rounded-full">
                        {gift.brand}
                      </Badge>
                    ) : null}
                  </div>
                  {gift.notes ? (
                    <p className="mt-1 text-xs text-ink-soft">{gift.notes}</p>
                  ) : null}
                  {gift.claimed_by ? (
                    <p className="mt-1 text-sm text-ink-soft">
                      Reservado por <strong>{gift.claimed_by}</strong>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-sage">Disponível</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {gift.claimed_by ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 flex-1 rounded-full sm:flex-none"
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
                    className="h-11 flex-1 rounded-full sm:flex-none"
                    disabled={busyId === gift.id}
                    onClick={() => void handleDelete(gift.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
