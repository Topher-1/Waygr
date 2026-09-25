import { NextResponse } from "next/server";
import { getViewerProfile } from "@/lib/auth/profile";
import { createProofUpload, submitProof } from "@/lib/forfeits/mutations";
import { forfeitErrorStatus } from "@/lib/forfeits/http";

type RouteContext = { params: Promise<{ id: string }> };

type ProofBody =
  | { action: "sign"; contentType?: unknown; size?: unknown }
  | { action: "submit"; path?: unknown };

/**
 * Custom proof upload (BUILD · Routes and jobs). Two steps on one route:
 * `sign` returns a signed upload URL for the private bucket so the file never
 * passes through the app, then `submit` moves the forfeit to proof_submitted.
 */
export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const viewer = await getViewerProfile();

  if (!viewer) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  let body: ProofBody;
  try {
    body = (await request.json()) as ProofBody;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  if (body.action === "sign") {
    if (typeof body.contentType !== "string" || typeof body.size !== "number") {
      return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
    }

    const result = await createProofUpload(id, viewer.id, {
      contentType: body.contentType,
      size: body.size,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, reason: result.reason },
        { status: forfeitErrorStatus(result.reason) },
      );
    }

    return NextResponse.json({ ok: true, ...result.value });
  }

  if (body.action === "submit") {
    if (typeof body.path !== "string") {
      return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
    }

    const result = await submitProof(id, viewer.id, body.path);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, reason: result.reason },
        { status: forfeitErrorStatus(result.reason) },
      );
    }

    return NextResponse.json({ ok: true, status: result.value.status });
  }

  return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
}
