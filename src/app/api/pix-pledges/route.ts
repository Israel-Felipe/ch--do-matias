import { NextResponse } from "next/server";
import { createPixPledge, listPixPledges } from "@/lib/pix";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pledges = await listPixPledges();
    const admin = await isAdminAuthenticated();
    return NextResponse.json({
      count: pledges.length,
      pledges: admin ? pledges : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string };
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Informe seu nome" }, { status: 400 });
    }

    const pledge = await createPixPledge(body.name);
    const pledges = await listPixPledges();
    return NextResponse.json(
      { pledge, count: pledges.length },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao registrar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
