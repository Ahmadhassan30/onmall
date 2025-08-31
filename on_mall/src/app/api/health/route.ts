import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Simple ping
    await prisma.$queryRawUnsafe("SELECT 1");
    return NextResponse.json({ ok: true, time: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
