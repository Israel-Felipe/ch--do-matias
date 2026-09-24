import { NextResponse } from "next/server";
import { releaseGift } from "@/lib/gifts";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const { id } = await context.params;

  try {
    const body = (await request.json()) as { name?: string };
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Digite o mesmo nome usado na reserva" },
        { status: 400 },
      );
    }

    const result = await releaseGift(id, body.name);

    if (!result.gift) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    if (result.mismatch) {
      return NextResponse.json(
        {
          error:
            "O nome não confere com quem reservou. Use o mesmo nome da reserva.",
          gift: result.gift,
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ gift: result.gift });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao liberar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
