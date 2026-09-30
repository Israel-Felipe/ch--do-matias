import { NextResponse } from "next/server";
import { listGifts, updateGift } from "@/lib/gifts";
import { resolveLinkImage } from "@/lib/link-preview";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** Resolve e cacheia a imagem do produto a partir do link de referência. */
export async function GET(_request: Request, context: Ctx) {
  const { id } = await context.params;

  try {
    const gifts = await listGifts();
    const gift = gifts.find((g) => g.id === id);
    if (!gift) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }

    if (gift.image_url) {
      return NextResponse.json({ image_url: gift.image_url, cached: true });
    }

    if (!gift.link) {
      return NextResponse.json({ image_url: null }, { status: 404 });
    }

    const image = await resolveLinkImage(gift.link);
    if (!image) {
      return NextResponse.json({ image_url: null }, { status: 404 });
    }

    try {
      await updateGift(id, { image_url: image });
    } catch {
      // Se a coluna ainda não existir no banco, ainda devolvemos a imagem.
    }

    return NextResponse.json({ image_url: image, cached: false });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao buscar imagem";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
