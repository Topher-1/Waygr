import { NextResponse } from "next/server";
import { parseGamesQuery } from "@/lib/games/query-bounds";
import { listGamesForCreate } from "@/lib/games/sync";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = parseGamesQuery(searchParams, new Date());

  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, reason: parsed.reason },
      { status: 400 },
    );
  }

  try {
    const games = await listGamesForCreate(parsed.params);
    return NextResponse.json({ ok: true, games });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "fetch_failed" },
      { status: 500 },
    );
  }
}
