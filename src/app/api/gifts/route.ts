import { NextResponse } from "next/server";
import { getDataMode, listGifts, createGift } from "@/lib/gifts";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const gifts = await listGifts();
    return NextResponse.json({ gifts, mode: getDataMode() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      brand?: string | null;
      category?: string | null;
      notes?: string | null;
      link?: string | null;
      avg_price?: number | null;
    };

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
    }

    const gift = await createGift({
      title: body.title,
      brand: body.brand,
      category: body.category,
      notes: body.notes,
      link: body.link,
      avg_price: body.avg_price,
    });

    return NextResponse.json({ gift }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
