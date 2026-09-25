/**
 * Brand furniture shared by the link preview and the result cards.
 * Mirrors the Designer templates: one orange radial glow top-right only, and
 * the outlined wordmark (no font download).
 * @see docs/brand/MANIFEST.md
 */
import {
  WORDMARK_PATH,
  WORDMARK_VIEW_HEIGHT,
  WORDMARK_VIEW_WIDTH,
} from "@/lib/brand/marks";
import { tokens } from "@/lib/theme";

/** Outlined wordmark at a given pixel width; height follows the artboard. */
export function Wordmark({
  width,
  color = tokens.dark.orange,
}: {
  width: number;
  color?: string;
}) {
  const height = Math.round((width * WORDMARK_VIEW_HEIGHT) / WORDMARK_VIEW_WIDTH);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${WORDMARK_VIEW_WIDTH} ${WORDMARK_VIEW_HEIGHT}`}
      fill="none"
      role="img"
      aria-label="Waygr"
      style={{ overflow: "visible", display: "flex" }}
    >
      <path d={WORDMARK_PATH} fill={color} />
    </svg>
  );
}

/** Brand hex to rgba, so the glow stays on the orange token. */
function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** The single top-right orange glow the templates allow. */
export function glowStyle(width: number, height: number) {
  const orange = tokens.dark.orange;
  return {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width,
    height,
    background: `radial-gradient(55% 55% at 92% 8%, ${withAlpha(orange, 0.35)} 0%, ${withAlpha(orange, 0.08)} 55%, ${withAlpha(orange, 0)} 100%)`,
  };
}

/** Avatar chip. Orange = the person sharing, ink letter; blue = the other side. */
export function AvatarChip({
  initial,
  size,
  side,
}: {
  initial: string;
  size: number;
  side: "you" | "them";
}) {
  const background = side === "you" ? tokens.dark.orange : tokens.dark.blue;
  const color = side === "you" ? tokens.dark.onAccent : tokens.dark.text;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.42),
        fontWeight: 700,
      }}
    >
      {initial}
    </div>
  );
}

export const CARD_FONT_CONDENSED = "Barlow Condensed, Inter, system-ui, sans-serif";
export const CARD_FONT_LABEL = "Inter, system-ui, sans-serif";
