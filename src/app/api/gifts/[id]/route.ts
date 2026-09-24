import { NextResponse } from "next/server";
import { deleteGift, releaseGift, updateGift } from "@/lib/gifts";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      title?: string;
      brand?: string | null;
      category?: string | null;
      notes?: string | null;
      link?: string | null;
      sort_order?: number;
      release?: boolean;
    };

    if (body.release) {
      const result = await releaseGift(id);
      if (!result.gift) {
        return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
      }
      return NextResponse.json({ gift: result.gift });
    }

    const gift = await updateGift(id, {
      title: body.title,
      brand: body.brand,
      category: body.category,
      notes: body.notes,
      link: body.link,
      sort_order: body.sort_order,
    });

    if (!gift) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ gift });
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
    const ok = await deleteGift(id);
    if (!ok) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao remover";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
