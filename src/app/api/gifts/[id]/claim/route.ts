import { NextResponse } from "next/server";
import { claimGift } from "@/lib/gifts";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const { id } = await context.params;

  try {
    const body = (await request.json()) as { name?: string };
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Informe seu nome para reservar" },
        { status: 400 },
      );
    }

    const result = await claimGift(id, body.name);

    if (!result.gift) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    if (result.conflict) {
      return NextResponse.json(
        {
          error: "Este item já foi reservado",
          gift: result.gift,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ gift: result.gift });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao reservar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
