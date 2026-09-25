import { NextResponse } from "next/server";
import { getViewerProfile } from "@/lib/auth/profile";
import { rejectProof } from "@/lib/forfeits/mutations";
import { forfeitErrorStatus } from "@/lib/forfeits/http";

/** Winner rejects proof: back to owed, auto-confirm clock stops. */
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const viewer = await getViewerProfile();

  if (!viewer) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const result = await rejectProof(id, viewer.id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason },
      { status: forfeitErrorStatus(result.reason) },
    );
  }

  return NextResponse.json({ ok: true, status: result.value.status });
}
