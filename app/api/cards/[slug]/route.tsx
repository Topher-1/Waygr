import { ImageResponse } from "next/og";
import { getChallengeBySlug } from "@/lib/challenges/queries";
import { getRivalryForChallenge } from "@/lib/rivalry/queries";
import {
  buildCardContent,
  CARD_SIZES,
  parseCardFormat,
  parseCardType,
} from "@/lib/cards/content";
import {
  AvatarChip,
  CARD_FONT_CONDENSED,
  CARD_FONT_LABEL,
  Wordmark,
  glowStyle,
} from "@/lib/cards/marks";
import { tokens } from "@/lib/theme";

export const runtime = "edge";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * Result cards as PNG, 1080 × 1350 or 1080 × 1920
 * (BUILD · `GET /api/cards/[slug]?type=&format=`).
 * Layout follows docs/brand/template-result-card-1080x1350.svg.
 */
export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const type = parseCardType(url.searchParams.get("type"));
  const format = parseCardFormat(url.searchParams.get("format"));
  const { width, height } = CARD_SIZES[format];

  let challenge;
  try {
    challenge = await getChallengeBySlug(slug);
  } catch {
    challenge = null;
  }

  if (!challenge) {
    return new Response("Not found", { status: 404 });
  }

  const rivalry = await getRivalryForChallenge(challenge).catch(() => null);
  const content = buildCardContent(challenge, type, format, rivalry);

  // Story cards get the same blocks, pushed apart on the taller canvas.
  const headlineSize = format === "story" ? 250 : 230;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width,
          height,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: tokens.dark.bg,
          color: tokens.dark.text,
          fontFamily: CARD_FONT_LABEL,
        }}
      >
        <div style={glowStyle(width, height)} />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 2,
            color: tokens.dark.muted,
          }}
        >
          {content.scoreLine}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            textAlign: "center",
            fontFamily: CARD_FONT_CONDENSED,
            fontSize: headlineSize,
            fontWeight: 800,
            fontStyle: "italic",
            lineHeight: 1,
            color: tokens.dark.orange,
          }}
        >
          {content.headline.toUpperCase()}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <AvatarChip initial={content.subjectInitial} size={96} side="you" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 36, fontWeight: 600 }}>
                {content.subjectName}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 500,
                  color: tokens.dark.orange,
                }}
              >
                {content.subjectCall}
              </div>
            </div>
          </div>

          <div
            style={{
              width: width - 128,
              height: 2,
              background: tokens.dark.border,
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {content.forfeitLine ? (
              <div style={{ fontSize: 26, color: tokens.dark.muted }}>
                {content.forfeitLine}
              </div>
            ) : null}
            {content.rivalryLine ? (
              <div style={{ fontSize: 26, color: tokens.dark.muted }}>
                {content.rivalryLine}
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <Wordmark width={220} />
          <div style={{ fontSize: 26, fontWeight: 600, color: tokens.dark.text }}>
            {content.footer}
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
