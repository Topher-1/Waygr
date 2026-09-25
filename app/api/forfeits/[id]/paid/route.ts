import { NextResponse } from "next/server";
import { getViewerProfile } from "@/lib/auth/profile";
import { markForfeitPaid } from "@/lib/forfeits/mutations";
import { forfeitErrorStatus } from "@/lib/forfeits/http";

type RouteContext = { params: Promise<{ id: string }> };

/** Concession: called once the share sheet resolves (BUILD · Routes and jobs). */
export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const viewer = await getViewerProfile();

  if (!viewer) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const result = await markForfeitPaid(id, viewer.id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason },
      { status: forfeitErrorStatus(result.reason) },
    );
  }

  return NextResponse.json({ ok: true, status: result.value.status });
}
