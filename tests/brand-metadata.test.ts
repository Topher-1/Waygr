import { inflateSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ORANGE = [255, 95, 31] as const;
const INK = [11, 11, 13] as const;

type Rgb = readonly [number, number, number];

type DecodedPng = {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
  interlace: number;
  bpp: number;
  data: Buffer;
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

/** Decode a non-interlaced 8-bit RGB or RGBA PNG. */
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
    throw new Error(
      `unsupported png bitDepth=${bitDepth} colorType=${colorType} interlace=${interlace}`,
    );
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

  return { width, height, bitDepth, colorType, interlace, bpp, data: out };
}

function pixel(img: DecodedPng, x: number, y: number): Rgb {
  const i = (y * img.width + x) * img.bpp;
  return [img.data[i] ?? 0, img.data[i + 1] ?? 0, img.data[i + 2] ?? 0];
}

function same(a: Rgb, b: readonly [number, number, number]): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

describe("brand link preview assets", () => {
  it("serves an opaque apple-touch icon and favicon", () => {
    const appDir = join(process.cwd(), "app");
    const apple = decodePng(readFileSync(join(appDir, "apple-icon.png")));
    expect(apple.width).toBe(180);
    expect(apple.height).toBe(180);
    expect(same(pixel(apple, 0, 0), ORANGE)).toBe(true);
    expect(same(pixel(apple, 179, 179), ORANGE)).toBe(true);
    expect(same(pixel(apple, 90, 90), INK)).toBe(true);
    if (apple.colorType === 6) {
      const i = (90 * apple.width + 90) * apple.bpp;
      expect(apple.data[i + 3]).toBe(255);
    }
    expect(readFileSync(join(appDir, "favicon.ico")).length).toBeGreaterThan(0);
  });

  it("homepage og:image is the brand card, not the sample challenge", () => {
    const appDir = join(process.cwd(), "app");
    const home = decodePng(readFileSync(join(appDir, "opengraph-image.png")));
    const template = readFileSync(
      join(process.cwd(), "docs/brand/template-link-preview-1200x630.png"),
    );

    expect(home.width).toBe(1200);
    expect(home.height).toBe(630);
    // Truecolor, no alpha channel. Every pixel is opaque.
    expect(home.colorType).toBe(2);
    expect(home.bitDepth).toBe(8);

    expect(readFileSync(join(appDir, "opengraph-image.png")).equals(template)).toBe(
      false,
    );

    // Left edge is the orange plate, so an iMessage left crop is the mark.
    expect(same(pixel(home, 0, 0), ORANGE)).toBe(true);
    expect(same(pixel(home, 40, 40), ORANGE)).toBe(true);
    expect(same(pixel(home, 40, 589), ORANGE)).toBe(true);
    expect(same(pixel(home, 629, 10), ORANGE)).toBe(true);
    // Center of the left square is the ink W.
    expect(same(pixel(home, 315, 315), INK)).toBe(true);

    // Right side is ink with the orange wordmark, not a matchup headline.
    expect(same(pixel(home, 1190, 20), INK)).toBe(true);
    expect(same(pixel(home, 1190, 610), INK)).toBe(true);

    let orange = 0;
    let minX = home.width;
    let maxX = 0;
    let minY = home.height;
    let maxY = 0;
    let cream = 0;
    for (let y = 0; y < home.height; y++) {
      for (let x = 640; x < home.width; x++) {
        const p = pixel(home, x, y);
        if (p[0] > 240 && p[1] > 230 && p[2] > 220) cream += 1;
        if (p[0] > 200 && p[1] > 70 && p[1] < 130 && p[2] < 60) {
          orange += 1;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    expect(cream).toBe(0);
    expect(orange).toBeGreaterThan(20_000);
    // Full word spans most of the right panel, including descender height.
    expect(maxX - minX).toBeGreaterThan(400);
    expect((maxY - minY) / (maxX - minX)).toBeGreaterThan(0.35);
  });

  it("keeps the challenge share card as the matchup layout", () => {
    const src = readFileSync(
      join(process.cwd(), "app/c/[slug]/opengraph-image.tsx"),
      "utf8",
    );
    expect(src).toContain("formatCall");
    expect(src).toContain("AvatarChip");
    expect(src).toContain("<Wordmark");
    expect(src).toContain("width: 1200");
    expect(src).toContain("height: 630");
    expect(src).not.toContain("CHIEFS");
  });

  it("keeps source brand pack PNGs for rebuild reference", () => {
    const brandDir = join(process.cwd(), "docs/brand");
    expect(
      readFileSync(join(brandDir, "icon-180.png")).length,
    ).toBeGreaterThan(0);
    expect(
      readFileSync(join(brandDir, "template-link-preview-1200x630.png")).length,
    ).toBeGreaterThan(0);
  });
});
