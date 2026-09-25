import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ImageResponse } from "next/og";
import type { ChallengeLanding } from "@/lib/challenges/types";
import { challengeOgCard } from "@/app/c/[slug]/opengraph-image";
import { tokens } from "@/lib/theme";

type Rgb = readonly [number, number, number];

type DecodedPng = {
  width: number;
  height: number;
  data: Buffer;
  bpp: number;
};

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePng(buf: Buffer): DecodedPng {
  let offset = 8;
  const idats: Buffer[] = [];
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;

  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8] ?? 0;
      colorType = data[9] ?? 0;
      interlace = data[12] ?? 0;
    } else if (type === "IDAT") {
      idats.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }

  const bpp = colorType === 2 ? 3 : colorType === 6 ? 4 : 0;
  if (bpp === 0 || bitDepth !== 8 || interlace !== 0) {
    throw new Error(`unsupported png ${bitDepth} ${colorType} ${interlace}`);
  }

  const raw = inflateSync(Buffer.concat(idats));
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  let src = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[src++] ?? 0;
    const row = y * stride;
    const prev = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const value = raw[src++] ?? 0;
      const left = x >= bpp ? (out[row + x - bpp] ?? 0) : 0;
      const up = y > 0 ? (out[prev + x] ?? 0) : 0;
      const upLeft = x >= bpp && y > 0 ? (out[prev + x - bpp] ?? 0) : 0;
      let decoded = value;
      if (filter === 1) decoded = (value + left) & 255;
      else if (filter === 2) decoded = (value + up) & 255;
      else if (filter === 3) decoded = (value + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) decoded = (value + paeth(left, up, upLeft)) & 255;
      else if (filter !== 0) throw new Error(`bad png filter ${filter}`);
      out[row + x] = decoded;
    }
  }

  return { width, height, data: out, bpp };
}

function pixel(img: DecodedPng, x: number, y: number): Rgb {
  const i = (y * img.width + x) * img.bpp;
  return [img.data[i] ?? 0, img.data[i + 1] ?? 0, img.data[i + 2] ?? 0];
}

function near(a: Rgb, b: Rgb, tol = 18): boolean {
  return (
    Math.abs(a[0] - b[0]) <= tol &&
    Math.abs(a[1] - b[1]) <= tol &&
    Math.abs(a[2] - b[2]) <= tol
  );
}

function hex(value: string): Rgb {
  const h = value.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

const BG = hex(tokens.dark.bg);
const TEXT = hex(tokens.dark.text);
const MUTED = hex(tokens.dark.muted);
const ORANGE = hex(tokens.dark.orange);
const BLUE = hex(tokens.dark.blue);

function loadFonts() {
  const dir = join(process.cwd(), "lib/cards/fonts");
  const file = (name: string): ArrayBuffer => {
    const buf = readFileSync(join(dir, name));
    return buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    ) as ArrayBuffer;
  };
  return [
    {
      name: "Inter",
      data: file("Inter-SemiBold-latin.ttf"),
      weight: 600 as const,
      style: "normal" as const,
    },
    {
      name: "Inter",
      data: file("Inter-Bold-latin.ttf"),
      weight: 700 as const,
      style: "normal" as const,
    },
    {
      name: "Barlow Condensed",
      data: file("BarlowCondensed-ExtraBold-latin.ttf"),
      weight: 800 as const,
      style: "normal" as const,
    },
  ];
}

function landing(): ChallengeLanding {
  return {
    id: "1",
    slug: "sample",
    state: "open",
    market: "winner",
    creatorPick: "home",
    line: null,
    quarter: null,
    forfeitKind: "custom",
    forfeitText: "a beer + garlic bread + a jersey swap for the week",
    outcome: null,
    acceptedAt: null,
    settledAt: null,
    creator: {
      id: "c",
      handle: "totallykewl4u",
      displayName: "totallykewl4u",
      avatarUrl: null,
    },
    opponent: null,
    game: {
      id: "g",
      league: "nfl",
      startsAt: "2026-09-27T17:00:00.000Z",
      status: "scheduled",
      period: null,
      clock: null,
      homeScore: 0,
      awayScore: 0,
      periodScores: [],
      updatedAt: "2026-09-27T17:00:00.000Z",
      awayTeam: {
        code: "nfl:CAR",
        abbr: "CAR",
        name: "Panthers",
        primaryColor: ORANGE.join(","),
        secondaryColor: BG.join(","),
      },
      homeTeam: {
        code: "nfl:CLE",
        abbr: "CLE",
        name: "Browns",
        primaryColor: BLUE.join(","),
        secondaryColor: BG.join(","),
      },
    },
  };
}

describe("challenge OG image", () => {
  it("draws a readable matchup inside the safe inset", async () => {
    const fonts = loadFonts();
    const response = new ImageResponse(challengeOgCard(landing()), {
      width: 1200,
      height: 630,
      fonts,
    });
    const png = Buffer.from(await response.arrayBuffer());
    const img = decodePng(png);
    expect(img.width).toBe(1200);
    expect(img.height).toBe(630);

    let topMuted = 0;
    let matchupMuted = 0;
    let matchupMinX = img.width;
    let matchupMinY = img.height;
    let cream = 0;
    let creamMaxX = 0;
    let stake = 0;
    let stakeMaxY = 0;
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < 720; x++) {
        const p = pixel(img, x, y);
        if (!near(p, MUTED, 24)) continue;
        if (y < 80) topMuted += 1;
        if (y >= 90 && y <= 140) {
          matchupMuted += 1;
          if (x < matchupMinX) matchupMinX = x;
          if (y < matchupMinY) matchupMinY = y;
        }
        if (y >= 500) {
          stake += 1;
          if (y > stakeMaxY) stakeMaxY = y;
        }
      }
      for (let x = 0; x < 1100; x++) {
        if (y >= 150 && y <= 270 && near(pixel(img, x, y), TEXT, 24)) {
          cream += 1;
          if (x > creamMaxX) creamMaxX = x;
        }
      }
    }

    // Eyebrow sits inside the inset, not on the canvas edge.
    expect(topMuted).toBe(0);
    expect(matchupMuted).toBeGreaterThan(400);
    expect(matchupMinX).toBeGreaterThanOrEqual(60);
    expect(matchupMinY).toBeGreaterThanOrEqual(85);
    // Call is on the card and does not run off the right edge.
    expect(cream).toBeGreaterThan(1000);
    expect(creamMaxX).toBeLessThan(1000);
    // Stake is fully on the canvas, descenders included.
    expect(stake).toBeGreaterThan(200);
    expect(stakeMaxY).toBeLessThan(600);

    let blue = 0;
    let orange = 0;
    for (let y = 300; y < 600; y++) {
      for (let x = 700; x < 1180; x++) {
        const p = pixel(img, x, y);
        if (near(p, BLUE, 24)) blue += 1;
        if (near(p, ORANGE, 24)) orange += 1;
      }
    }
    expect(blue).toBeGreaterThan(500);
    expect(orange).toBeGreaterThan(500);
  }, 20000);
});
