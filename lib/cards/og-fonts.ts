/**
 * Latin subsets of Inter and Barlow Condensed for Satori.
 * next/og does not see the app's next/font faces.
 * Licenses: OFL-Inter.txt, OFL-Barlow.txt in ./fonts.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type CardOgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 600 | 700 | 800;
  style: "normal";
};

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

async function readFont(file: string): Promise<ArrayBuffer> {
  const bytes = await readFile(file);
  return toArrayBuffer(bytes);
}

export async function loadChallengeCardFonts(): Promise<CardOgFont[]> {
  const [inter600, inter700, barlow800] = await Promise.all([
    readFont(join(process.cwd(), "lib/cards/fonts/Inter-SemiBold-latin.ttf")),
    readFont(join(process.cwd(), "lib/cards/fonts/Inter-Bold-latin.ttf")),
    readFont(join(process.cwd(), "lib/cards/fonts/BarlowCondensed-ExtraBold-latin.ttf")),
  ]);

  return [
    { name: "Inter", data: inter600, weight: 600, style: "normal" },
    { name: "Inter", data: inter700, weight: 700, style: "normal" },
    { name: "Barlow Condensed", data: barlow800, weight: 800, style: "normal" },
  ];
}
