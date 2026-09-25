import { NextResponse } from "next/server";
import { getViewerProfile } from "@/lib/auth/profile";
import { confirmProof } from "@/lib/forfeits/mutations";
import { forfeitErrorStatus } from "@/lib/forfeits/http";

type RouteContext = { params: Promise<{ id: string }> };

/** Winner confirms proof; the sweep job does the same after 72 hours. */
export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const viewer = await getViewerProfile();

  if (!viewer) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const result = await confirmProof(id, viewer.id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason },
      { status: forfeitErrorStatus(result.reason) },
    );
  }

  return NextResponse.json({ ok: true, status: result.value.status });
}
