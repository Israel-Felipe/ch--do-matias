import { NextResponse } from "next/server";
import { deleteRsvp } from "@/lib/rsvps";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

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
