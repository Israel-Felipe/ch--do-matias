import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listGifts, updateGift } from "@/lib/gifts";
import { resolveLinkImage } from "@/lib/link-preview";

export const runtime = "nodejs";

/** Preenche image_url dos itens que têm link e ainda não têm imagem. */
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const gifts = await listGifts();
    const pending = gifts.filter((g) => g.link && !g.image_url);

    let filled = 0;
    let failed = 0;

    for (const gift of pending) {
      const image = await resolveLinkImage(gift.link!);
      if (!image) {
        failed += 1;
        continue;
      }
      try {
        await updateGift(gift.id, { image_url: image });
        filled += 1;
      } catch {
        failed += 1;
      }
      // Evita estourar rate limit de serviços externos.
      await new Promise((r) => setTimeout(r, 400));
    }

    return NextResponse.json({
      total: pending.length,
      filled,
      failed,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao preencher imagens";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
