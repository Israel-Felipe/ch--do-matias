"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { Check, Loader2 } from "lucide-react";
import { eventInfo } from "@/lib/seed";
import type { RsvpStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const statusOptions: { value: RsvpStatus; label: string }[] = [
  { value: "yes", label: "Sim, vou!" },
  { value: "no", label: "Não posso" },
];

export function RsvpSection() {
  const [name, setName] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [status, setStatus] = useState<RsvpStatus>("yes");
  const [bringing, setBringing] = useState(false);
  const [bringingWhat, setBringingWhat] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function selectStatus(next: RsvpStatus) {
    setStatus(next);
    if (next !== "yes") {
      setBringing(false);
      setBringingWhat("");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          adults: status === "no" ? 0 : Number(adults) || 0,
          children: status === "no" ? 0 : Number(children) || 0,
          status,
          note,
          bringing: status === "yes" ? bringing : false,
          bringing_what: status === "yes" && bringing ? bringingWhat : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível confirmar");
      setDone(true);
      setName("");
      setAdults("1");
      setChildren("0");
      setStatus("yes");
      setBringing(false);
      setBringingWhat("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="presenca"
      className="scroll-mt-4 px-4 py-14 sm:px-8 sm:py-16"
    >
      <div className="mx-auto w-full max-w-xl">
        <div className="text-center">
          <Image
            src="/images/abelha.png"
            alt=""
            width={100}
            height={100}
            className="mx-auto mb-2 h-11 w-auto"
          />
          <h2 className="font-script text-4xl text-copper sm:text-5xl">
            Confirmar presença
          </h2>
          <p className="mt-2 text-sm text-ink-soft sm:text-base">
            {eventInfo.rsvpLabel}. Conta pra gente se vem celebrar o Matias!
          </p>
        </div>

        {done ? (
          <div
            role="status"
            className="mt-8 flex items-start gap-3 rounded-[1.5rem] bg-sage-soft/50 px-4 py-4 text-sm text-ink"
          >
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
            <div>
              <p className="font-semibold">Recebemos sua confirmação. Obrigado!</p>
              <button
                type="button"
                className="mt-2 font-bold text-copper underline-offset-2 hover:underline"
                onClick={() => setDone(false)}
              >
                Confirmar outra pessoa
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rsvp-name">Seu nome</Label>
              <Input
                id="rsvp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 rounded-2xl border-border/70 bg-card/80 text-base"
                placeholder="Ex.: Família Silva"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label>Você vem?</Label>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => selectStatus(opt.value)}
                    className={cn(
                      "min-h-12 rounded-2xl px-3 text-sm font-semibold transition",
                      status === opt.value
                        ? "bg-ink text-cream"
                        : "bg-card/80 text-ink-soft ring-1 ring-border/70",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {status !== "no" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="rsvp-adults">Adultos</Label>
                  <Input
                    id="rsvp-adults"
                    type="number"
                    min={0}
                    max={20}
                    value={adults}
                    onChange={(e) => setAdults(e.target.value)}
                    required
                    className="h-12 rounded-2xl border-border/70 bg-card/80 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rsvp-children">
                    Crianças (até {eventInfo.childMaxAge} anos)
                  </Label>
                  <Input
                    id="rsvp-children"
                    type="number"
                    min={0}
                    max={20}
                    value={children}
                    onChange={(e) => setChildren(e.target.value)}
                    required
                    className="h-12 rounded-2xl border-border/70 bg-card/80 text-base"
                  />
                </div>
              </div>
            ) : null}

            {status === "yes" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-card/60 px-3.5 py-3 ring-1 ring-border/50">
                  <Label
                    htmlFor="rsvp-bringing"
                    className="cursor-pointer text-sm font-normal leading-snug text-ink-soft"
                  >
                    Posso levar salgado, doce ou bebida
                  </Label>
                  <button
                    id="rsvp-bringing"
                    type="button"
                    role="switch"
                    aria-checked={bringing}
                    onClick={() => {
                      const next = !bringing;
                      setBringing(next);
                      if (!next) setBringingWhat("");
                    }}
                    className={cn(
                      "relative h-6 w-10 shrink-0 rounded-full transition-colors",
                      bringing ? "bg-sage" : "bg-border",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        bringing && "translate-x-4",
                      )}
                    />
                  </button>
                </div>

                {bringing ? (
                  <div className="space-y-2">
                    <Label htmlFor="rsvp-bringing-what">O que você pode levar?</Label>
                    <Input
                      id="rsvp-bringing-what"
                      value={bringingWhat}
                      onChange={(e) => setBringingWhat(e.target.value)}
                      required
                      className="h-12 rounded-2xl border-border/70 bg-card/80 text-base"
                      placeholder="Ex.: coxinha, bolo, refrigerante..."
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="rsvp-note">Recado (opcional)</Label>
              <Input
                id="rsvp-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-12 rounded-2xl border-border/70 bg-card/80 text-base"
                placeholder="Ex.: Chego um pouco mais tarde"
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button
              type="submit"
              className="h-12 w-full rounded-full text-base"
              disabled={submitting || !name.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar confirmação"
              )}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
