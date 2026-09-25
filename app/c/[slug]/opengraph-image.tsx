import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import type { ChallengeLanding } from "@/lib/challenges/types";
import { getChallengeBySlug } from "@/lib/challenges/queries";
import {
  clampOgText,
  formatCall,
  formatForfeit,
  formatOgMatchup,
} from "@/lib/challenges/format";
import { APP_NAME } from "@/lib/constants";
import { loadChallengeCardFonts } from "@/lib/cards/og-fonts";
import {
  AvatarChip,
  CARD_FONT_CONDENSED,
  CARD_FONT_LABEL,
  Wordmark,
  glowStyle,
} from "@/lib/cards/marks";
import { copy } from "@/lib/copy";
import { tokens } from "@/lib/theme";

export const runtime = "nodejs";
export const alt = `${APP_NAME} challenge`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type OgProps = { params: Promise<{ slug: string }> };

/** Inset so the eyebrow clears an iMessage bubble corner. */
const PAD_X = 68;
const PAD_TOP = 80;

/**
 * 1200 × 630 link preview: matchup, call, forfeit, both avatars
 * (BUILD · Routes and jobs). Layout from
 * docs/brand/template-link-preview-1200x630.svg — challenger in rival blue,
 * the person opening the link in orange.
 * Null renders the wordmark.
 */
export function challengeOgCard(
  challenge: ChallengeLanding | null,
): ReactElement {
  if (!challenge) {
    return (
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
    );
  }

  const call = formatCall(challenge);
  const forfeit = formatForfeit(challenge);
  const matchup = formatOgMatchup(challenge);
  const creatorName = clampOgText(challenge.creator.displayName, 16);
  const creatorInitial = creatorName.charAt(0).toUpperCase() || "?";
  const opponentName = challenge.opponent
    ? clampOgText(challenge.opponent.displayName, 16)
    : "You";
  const opponentInitial = challenge.opponent
    ? opponentName.charAt(0).toUpperCase() || "?"
    : "?";
  const stake = clampOgText(copy.challenge.previewForfeit(forfeit), 120);
  const challenged = copy.challenge
    .challengedYou(clampOgText(challenge.creator.displayName, 24))
    .toUpperCase();

  return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingTop: PAD_TOP,
          paddingRight: PAD_X,
          paddingBottom: 56,
          paddingLeft: PAD_X,
          background: tokens.dark.bg,
          color: tokens.dark.text,
          fontFamily: CARD_FONT_LABEL,
        }}
      >
        <div style={glowStyle(size.width, size.height)} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 56,
              whiteSpace: "nowrap",
              fontSize: 40,
              fontWeight: 600,
              lineHeight: 1,
              color: tokens.dark.muted,
            }}
          >
            {matchup}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 108,
              marginTop: 8,
              fontFamily: CARD_FONT_CONDENSED,
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {call.toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 40,
              marginTop: 10,
              fontSize: 26,
              fontWeight: 600,
              lineHeight: 1,
              color: tokens.dark.muted,
            }}
          >
            {challenged}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Wordmark width={200} />
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 600,
                lineHeight: 1.35,
                color: tokens.dark.muted,
                maxWidth: 620,
              }}
            >
              {stake}
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  width: 160,
                  fontSize: 22,
                  fontWeight: 600,
                  color: tokens.dark.blue,
                }}
              >
                {creatorName}
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  width: 160,
                  fontSize: 22,
                  fontWeight: 600,
                  color: tokens.dark.orange,
                }}
              >
                {opponentName}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

export default async function OgImage({ params }: OgProps) {
  const { slug } = await params;
  const fonts = await loadChallengeCardFonts();

  let challenge;
  try {
    challenge = await getChallengeBySlug(slug);
  } catch {
    challenge = null;
  }

  return new ImageResponse(challengeOgCard(challenge), { ...size, fonts });
}
