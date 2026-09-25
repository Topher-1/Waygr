import { ImageResponse } from "next/og";
import { getChallengeBySlug } from "@/lib/challenges/queries";
import { formatCall, formatForfeit, formatMatchup } from "@/lib/challenges/format";
import { APP_NAME } from "@/lib/constants";
import {
  AvatarChip,
  CARD_FONT_CONDENSED,
  CARD_FONT_LABEL,
  Wordmark,
  glowStyle,
} from "@/lib/cards/marks";
import { copy } from "@/lib/copy";
import { tokens } from "@/lib/theme";

export const runtime = "edge";
export const alt = `${APP_NAME} challenge`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type OgProps = { params: Promise<{ slug: string }> };

/**
 * 1200 × 630 link preview: matchup, call, forfeit, both avatars
 * (BUILD · Routes and jobs). Layout from
 * docs/brand/template-link-preview-1200x630.svg — challenger in rival blue,
 * the person opening the link in orange.
 */
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
          }}
        >
          <Wordmark width={520} />
        </div>
      ),
      { ...size },
    );
  }

  const call = formatCall(challenge);
  const forfeit = formatForfeit(challenge);
  const matchup = formatMatchup(challenge);
  const creatorInitial =
    challenge.creator.displayName.trim().charAt(0).toUpperCase() || "?";
  const opponentInitial = challenge.opponent
    ? challenge.opponent.displayName.trim().charAt(0).toUpperCase()
    : "?";

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          background: tokens.dark.bg,
          color: tokens.dark.text,
          fontFamily: CARD_FONT_LABEL,
        }}
      >
        <div style={glowStyle(size.width, size.height)} />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: 2,
              color: tokens.dark.muted,
            }}
          >
            {matchup.toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: CARD_FONT_CONDENSED,
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {call.toUpperCase()}
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, color: tokens.dark.muted }}>
            {copy.challenge.challengedYou(challenge.creator.displayName).toUpperCase()}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Wordmark width={200} />
            <div style={{ fontSize: 28, color: tokens.dark.muted, maxWidth: 640 }}>
              {copy.challenge.previewForfeit(forfeit)}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <AvatarChip initial={creatorInitial} size={132} side="them" />
              <div style={{ fontSize: 22, fontWeight: 600, color: tokens.dark.blue }}>
                {challenge.creator.displayName}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <AvatarChip initial={opponentInitial} size={132} side="you" />
              <div style={{ fontSize: 22, fontWeight: 600, color: tokens.dark.orange }}>
                {challenge.opponent?.displayName ?? "You"}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
