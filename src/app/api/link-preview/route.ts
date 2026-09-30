import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { resolveLinkImage } from "@/lib/link-preview";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { url?: string };
    const raw = body.url?.trim();
    if (!raw) {
      return NextResponse.json({ error: "Informe o link" }, { status: 400 });
    }

    try {
      new URL(raw);
    } catch {
      return NextResponse.json({ error: "Link inválido" }, { status: 400 });
    }

    const image = await resolveLinkImage(raw);

    if (!image) {
      return NextResponse.json(
        {
          error:
            "Não achamos imagem nesse link. Cole a URL da imagem manualmente (botão direito na foto do produto → copiar endereço da imagem).",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ image_url: image });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao buscar imagem";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
