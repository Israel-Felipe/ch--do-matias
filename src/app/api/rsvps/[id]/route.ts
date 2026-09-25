import { NextResponse } from "next/server";
import { deleteRsvp, updateRsvp } from "@/lib/rsvps";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import type { RsvpStatus } from "@/lib/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      name?: string;
      adults?: number;
      children?: number;
      status?: RsvpStatus;
      note?: string | null;
      bringing?: boolean;
      bringing_what?: string | null;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Informe o nome" }, { status: 400 });
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
        { error: "Conte o que vai levar" },
        { status: 400 },
      );
    }

    const rsvp = await updateRsvp(id, {
      name: body.name,
      adults: body.adults,
      children: body.children,
      status,
      note: body.note,
      bringing,
      bringing_what: bringing ? body.bringing_what : null,
    });

    if (!rsvp) {
      return NextResponse.json({ error: "RSVP não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ rsvp });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const ok = await deleteRsvp(id);
    if (!ok) {
      return NextResponse.json({ error: "RSVP não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao remover";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
