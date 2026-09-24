"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Gift, Loader2, Search } from "lucide-react";
import type { Gift as GiftType } from "@/lib/types";
import { eventInfo } from "@/lib/seed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn, formatAvgPrice } from "@/lib/utils";

type Filter = "all" | "available" | "claimed";
type DialogMode = "claim" | "release";

function PixNotice() {
  const [copied, setCopied] = useState(false);

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(eventInfo.pixKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-[1.5rem] bg-gradient-to-br from-copper/15 via-butter/25 to-sage-soft/40 px-5 py-6 text-center ring-1 ring-copper/30 sm:px-7 sm:py-7">
      <p className="font-display text-xl leading-snug text-ink sm:text-2xl">
        Essa lista não te atendeu?
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft sm:text-base">
        Você também pode presentear via PIX
      </p>
      <button
        type="button"
        onClick={() => void copyPix()}
        className="mx-auto mt-5 flex w-full max-w-xs flex-col items-center gap-1 rounded-2xl bg-white/90 px-4 py-3.5 shadow-[0_10px_28px_-18px_rgba(94,75,60,0.55)] ring-1 ring-copper/20 transition hover:bg-white active:scale-[0.99]"
      >
        <span className="text-[0.65rem] font-bold tracking-[0.22em] text-copper uppercase">
          Chave PIX (CPF)
        </span>
        <span className="font-body text-xl font-bold tracking-wide text-ink sm:text-2xl">
          {eventInfo.pixKey}
        </span>
        <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-sage" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Toque para copiar
            </>
          )}
        </span>
      </button>
    </div>
  );
}

export function GiftList() {
  const [gifts, setGifts] = useState<GiftType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [selected, setSelected] = useState<GiftType | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>("claim");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  async function loadGifts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gifts", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível carregar");
      setGifts(data.gifts as GiftType[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGifts();
  }, []);

  const counts = useMemo(() => {
    const available = gifts.filter((g) => !g.claimed_by).length;
    return {
      all: gifts.length,
      available,
      claimed: gifts.length - available,
    };
  }, [gifts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minRaw = priceMin.trim().replace(",", ".");
    const maxRaw = priceMax.trim().replace(",", ".");
    const min = minRaw === "" ? null : Number(minRaw);
    const max = maxRaw === "" ? null : Number(maxRaw);
    const hasMin = min != null && !Number.isNaN(min);
    const hasMax = max != null && !Number.isNaN(max);

    return gifts.filter((g) => {
      if (filter === "available" && g.claimed_by) return false;
      if (filter === "claimed" && !g.claimed_by) return false;

      if (hasMin || hasMax) {
        if (g.avg_price == null) return false;
        if (hasMin && g.avg_price < min!) return false;
        if (hasMax && g.avg_price > max!) return false;
      }

      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        (g.brand?.toLowerCase().includes(q) ?? false) ||
        (g.notes?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [gifts, filter, query, priceMin, priceMax]);

  const pricePreset = useMemo(() => {
    const min = priceMin.trim();
    const max = priceMax.trim();
    if (min === "" && max === "") return "any";
    if (min === "" && max === "50") return "to50";
    if (min === "50" && max === "100") return "50to100";
    if (min === "100" && max === "200") return "100to200";
    if (min === "200" && max === "") return "from200";
    return "custom";
  }, [priceMin, priceMax]);

  function applyPricePreset(key: string) {
    if (key === "any") {
      setPriceMin("");
      setPriceMax("");
    } else if (key === "to50") {
      setPriceMin("");
      setPriceMax("50");
    } else if (key === "50to100") {
      setPriceMin("50");
      setPriceMax("100");
    } else if (key === "100to200") {
      setPriceMin("100");
      setPriceMax("200");
    } else if (key === "from200") {
      setPriceMin("200");
      setPriceMax("");
    }
  }

  function openClaim(gift: GiftType) {
    setDialogMode("claim");
    setSelected(gift);
    setDialogError(null);
    setName("");
  }

  function openRelease(gift: GiftType) {
    setDialogMode("release");
    setSelected(gift);
    setDialogError(null);
    setName("");
  }

  async function handleClaim() {
    if (!selected || !name.trim()) return;
    setBusy(true);
    setDialogError(null);
    try {
      const res = await fetch(`/api/gifts/${selected.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.gift) {
          setGifts((prev) =>
            prev.map((g) => (g.id === data.gift.id ? data.gift : g)),
          );
        }
        throw new Error(data.error || "Não foi possível reservar");
      }
      setGifts((prev) =>
        prev.map((g) => (g.id === data.gift.id ? data.gift : g)),
      );
      setFlash(
        `Pronto, ${name.trim()}! Sua reserva foi registrada. Se reservou errado, toque em “Desfazer” no item e digite o mesmo nome.`,
      );
      setSelected(null);
      setName("");
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : "Erro ao reservar");
    } finally {
      setBusy(false);
    }
  }

  async function handleRelease() {
    if (!selected || !name.trim()) return;
    setBusy(true);
    setDialogError(null);
    try {
      const res = await fetch(`/api/gifts/${selected.id}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível desfazer");
      }
      setGifts((prev) =>
        prev.map((g) => (g.id === data.gift.id ? data.gift : g)),
      );
      setFlash("Reserva desfeita. O item voltou a ficar disponível.");
      setSelected(null);
      setName("");
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : "Erro ao desfazer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="lista" className="scroll-mt-4 px-4 pb-16 pt-6 sm:px-8 sm:pb-20">
      <div className="mx-auto w-full max-w-3xl">
        <div className="text-center">
          <h2 className="font-script text-4xl text-copper sm:text-5xl">
            Sugestões de presentes
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-soft sm:text-base">
            {eventInfo.intro}
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar item ou marca..."
              className="h-12 rounded-2xl border-border/80 bg-card/90 pl-10 text-base shadow-none"
              aria-label="Buscar item"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(
              [
                ["all", "Todos", counts.all],
                ["available", "Disponíveis", counts.available],
                ["claimed", "Reservados", counts.claimed],
              ] as const
            ).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition",
                  filter === key
                    ? "bg-ink text-cream"
                    : "bg-card/90 text-ink-soft ring-1 ring-border/70",
                )}
              >
                {label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs",
                    filter === key ? "bg-cream/15" : "bg-muted",
                  )}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-card/90 p-3 ring-1 ring-border/70 sm:p-3.5">
            <p className="mb-2 text-[0.65rem] font-bold tracking-[0.18em] text-ink-soft uppercase">
              Filtrar por preço
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(
                [
                  ["any", "Qualquer"],
                  ["to50", "Até R$ 50"],
                  ["50to100", "R$ 50–100"],
                  ["100to200", "R$ 100–200"],
                  ["from200", "Acima de R$ 200"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPricePreset(key)}
                  className={cn(
                    "inline-flex min-h-10 shrink-0 items-center rounded-full px-3.5 text-sm font-semibold transition",
                    pricePreset === key
                      ? "bg-copper text-white"
                      : "bg-cream-deep/80 text-ink-soft ring-1 ring-border/60",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="price-min" className="text-xs text-ink-soft">
                  De (R$)
                </Label>
                <Input
                  id="price-min"
                  inputMode="decimal"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="ex.: 50"
                  className="h-11 rounded-2xl border-border/80 bg-white/80 text-base shadow-none"
                  aria-label="Preço mínimo"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="price-max" className="text-xs text-ink-soft">
                  Até (R$)
                </Label>
                <Input
                  id="price-max"
                  inputMode="decimal"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="ex.: 100"
                  className="h-11 rounded-2xl border-border/80 bg-white/80 text-base shadow-none"
                  aria-label="Preço máximo"
                />
              </div>
            </div>
          </div>
        </div>

        {flash ? (
          <div
            role="status"
            className="mt-5 flex items-start gap-3 rounded-2xl bg-sage-soft/60 px-4 py-3 text-sm text-ink ring-1 ring-sage/40"
          >
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
            <p>{flash}</p>
          </div>
        ) : null}

        <div className="grid-notebook mt-6 overflow-hidden rounded-[1.6rem] ring-1 ring-border/70">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 bg-card/50 text-ink-soft">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando sugestões...
            </div>
          ) : error ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 bg-card/50 px-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button type="button" onClick={() => void loadGifts()}>
                Tentar de novo
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 bg-card/50 px-6 text-center text-ink-soft">
              <Gift className="h-6 w-6" />
              <p className="text-sm">Nenhum item encontrado com esse filtro.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50 bg-card/55 backdrop-blur-[2px]">
              {filtered.map((gift) => {
                const claimed = Boolean(gift.claimed_by);
                return (
                  <li key={gift.id}>
                    <div className="flex w-full items-start gap-3 px-4 py-4 text-left">
                      <button
                        type="button"
                        disabled={claimed}
                        onClick={() => openClaim(gift)}
                        className={cn(
                          "flex min-w-0 flex-1 items-start gap-3 text-left",
                          claimed ? "cursor-default" : "active:opacity-80",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                            claimed ? "bg-muted text-ink-soft" : "bg-pond text-ink",
                          )}
                        >
                          {claimed ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Gift className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-display text-base leading-snug text-ink">
                            {gift.title}
                          </span>
                          {gift.brand ? (
                            <span className="mt-0.5 block text-xs font-semibold text-ink-soft">
                              {gift.brand}
                            </span>
                          ) : null}
                          {formatAvgPrice(gift.avg_price) ? (
                            <span className="mt-0.5 block text-xs text-ink-soft">
                              Preço médio ≈ {formatAvgPrice(gift.avg_price)}
                            </span>
                          ) : null}
                          {gift.notes ? (
                            <span className="mt-0.5 block text-xs text-ink-soft">
                              {gift.notes}
                            </span>
                          ) : null}
                          {claimed ? (
                            <span className="mt-1 block text-xs text-ink-soft">
                              Reservado por{" "}
                              <span className="font-bold text-ink">
                                {gift.claimed_by}
                              </span>
                            </span>
                          ) : (
                            <span className="mt-1 block text-xs font-semibold text-copper">
                              Toque para reservar
                            </span>
                          )}
                        </span>
                      </button>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[0.65rem] uppercase tracking-wide",
                            claimed
                              ? "bg-sage-soft/70 text-ink"
                              : "bg-cream-deep text-ink ring-1 ring-border/60",
                          )}
                        >
                          {claimed ? "Feito" : "Livre"}
                        </Badge>
                        {gift.link ? (
                          <a
                            href={gift.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-9 items-center gap-1 rounded-full bg-card px-2.5 text-[0.7rem] font-bold text-ink-soft ring-1 ring-border/80"
                          >
                            Link
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                        {claimed ? (
                          <button
                            type="button"
                            onClick={() => openRelease(gift)}
                            className="inline-flex min-h-9 items-center rounded-full px-2.5 text-[0.7rem] font-bold text-copper underline-offset-2 hover:underline"
                          >
                            Desfazer
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-8">
          <PixNotice />
        </div>
      </div>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90svh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-3xl border-border bg-card p-5 sm:p-6">
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="font-display text-xl text-ink">
              {dialogMode === "claim" ? "Reservar presente" : "Desfazer reserva"}
            </DialogTitle>
            <DialogDescription className="text-sm text-ink-soft">
              {dialogMode === "claim" ? (
                <>
                  Você está reservando{" "}
                  <span className="font-semibold text-ink">{selected?.title}</span>
                  {selected?.brand ? <> ({selected.brand})</> : null}. Seu nome
                  ficará visível para os outros convidados.
                </>
              ) : (
                <>
                  Para liberar{" "}
                  <span className="font-semibold text-ink">{selected?.title}</span>,
                  digite o mesmo nome de quem reservou
                  {selected?.claimed_by ? (
                    <>
                      {" "}
                      (<span className="font-semibold text-ink">{selected.claimed_by}</span>)
                    </>
                  ) : null}
                  .
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {dialogMode === "claim" && selected?.link ? (
            <a
              href={selected.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-copper underline-offset-4 hover:underline"
            >
              Ver link de referência
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <div className="space-y-2 py-2">
            <Label htmlFor="guest-name" className="text-ink">
              {dialogMode === "claim" ? "Seu nome" : "Nome da reserva"}
            </Label>
            <Input
              id="guest-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Ana Clara"
              className="h-12 rounded-2xl text-base"
              autoComplete="name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (dialogMode === "claim") void handleClaim();
                  else void handleRelease();
                }
              }}
            />
            {dialogError ? (
              <p className="text-sm text-destructive">{dialogError}</p>
            ) : null}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              className="h-12 w-full rounded-full text-base"
              disabled={!name.trim() || busy}
              onClick={() =>
                dialogMode === "claim" ? void handleClaim() : void handleRelease()
              }
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aguarde...
                </>
              ) : dialogMode === "claim" ? (
                "Confirmar reserva"
              ) : (
                "Liberar item"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full rounded-full"
              onClick={() => setSelected(null)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
