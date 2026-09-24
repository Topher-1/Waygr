import { ImageResponse } from "next/og";
import { getChallengeBySlug } from "@/lib/challenges/queries";
import { formatCall, formatForfeit, formatMatchup } from "@/lib/challenges/format";
import { APP_NAME } from "@/lib/constants";
import { tokens } from "@/lib/theme";

export const runtime = "edge";
export const alt = "Waygr challenge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type OgProps = { params: Promise<{ slug: string }> };

export default async function OgImage({ params }: OgProps) {
  const { slug } = await params;

  let challenge;
  try {
    challenge = await getChallengeBySlug(slug);
  } catch {
    challenge = null;
  }

  if (!challenge) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: tokens.dark.bg,
            color: tokens.dark.text,
            fontSize: 48,
            fontWeight: 800,
          }}
        >
          {APP_NAME}
        </div>
      ),
      { ...size },
    );
  }

  const call = formatCall(challenge);
  const forfeit = formatForfeit(challenge);
  const matchup = formatMatchup(challenge);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: tokens.dark.bg,
          color: tokens.dark.text,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            fontStyle: "italic",
            color: tokens.dark.orange,
          }}
        >
          {APP_NAME}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 28, color: tokens.dark.muted }}>{matchup}</div>
          <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1 }}>
            {challenge.creator.displayName} says {call}.
          </div>
          <div style={{ fontSize: 32, color: tokens.dark.muted }}>
            Loser {forfeit}. You in?
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              background: tokens.dark.raised,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: tokens.dark.orange,
            }}
          >
            {challenge.creator.displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: 24, color: tokens.dark.muted }}>vs you</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
