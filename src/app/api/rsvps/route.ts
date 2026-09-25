import { NextResponse } from "next/server";
import { createRsvp, listRsvps, summarizeRsvps } from "@/lib/rsvps";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import type { RsvpStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rsvps = await listRsvps();
    const summary = summarizeRsvps(rsvps);
    const admin = await isAdminAuthenticated();
    return NextResponse.json({
      summary,
      // Nomes completos só para a família logada; convidados veem só totais.
      rsvps: admin ? rsvps : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      guests?: number;
      adults?: number;
      children?: number;
      status?: RsvpStatus;
      note?: string | null;
      bringing?: boolean;
      bringing_what?: string | null;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Informe seu nome" }, { status: 400 });
    }

    const status = body.status ?? "yes";
    if (!["yes", "no", "maybe"].includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    if (status !== "no") {
      const adults = Math.floor(Number(body.adults));
      const children = Math.floor(Number(body.children));
      if (
        Number.isNaN(adults) ||
        Number.isNaN(children) ||
        adults < 0 ||
        children < 0
      ) {
        return NextResponse.json(
          { error: "Informe a quantidade de adultos e crianças" },
          { status: 400 },
        );
      }
      if (adults + children < 1) {
        return NextResponse.json(
          { error: "Informe ao menos 1 pessoa" },
          { status: 400 },
        );
      }
    }

    const bringing = status === "yes" && Boolean(body.bringing);
    if (bringing && !body.bringing_what?.trim()) {
      return NextResponse.json(
        { error: "Conte o que você pode levar" },
        { status: 400 },
      );
    }

    const rsvp = await createRsvp({
      name: body.name,
      adults: body.adults,
      children: body.children,
      guests: body.guests,
      status,
      note: body.note,
      bringing,
      bringing_what: bringing ? body.bringing_what : null,
    });

    const rsvps = await listRsvps();
    return NextResponse.json(
      { rsvp, summary: summarizeRsvps(rsvps) },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao confirmar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
