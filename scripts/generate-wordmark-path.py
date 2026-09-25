#!/usr/bin/env python3
"""Regenerate outlined Waygr wordmark path with full descenders (Barlow Condensed EB Italic)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FONT_PATH = Path("/tmp/fonts/BarlowCondensed-ExtraBoldItalic.ttf")
TEXT = "Waygr"
TRACKING = -0.01
PAIR_KERNS = {("W", "a"): -8, ("a", "y"): -8, ("y", "g"): -32, ("g", "r"): -8}
PADDING = 36


def fmt_num(match: re.Match[str]) -> str:
    value = float(match.group(0))
    return f"{int(value)}.0" if value == int(value) else f"{value:.1f}"


def build_path(font_path: Path) -> tuple[str, float, float]:
    font = TTFont(font_path)
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()
    glyph_names = [cmap[ord(ch)] for ch in TEXT]

    bounds = BoundsPen(glyph_set)
    x = 0.0
    for index, gname in enumerate(glyph_names):
        glyph_set[gname].draw(TransformPen(bounds, (1, 0, 0, 1, x, 0)))
        advance = glyph_set[gname].width
        kern = PAIR_KERNS.get((TEXT[index - 1], TEXT[index]), 0) if index else 0
        x += advance + advance * TRACKING + kern

    min_x, min_y, max_x, max_y = bounds.bounds
    shift_x = PADDING - min_x
    shift_y = PADDING - min_y

    path_pen = SVGPathPen(glyph_set)
    x = 0.0
    for index, gname in enumerate(glyph_names):
        glyph_set[gname].draw(
            TransformPen(path_pen, (1, 0, 0, 1, x + shift_x, shift_y)),
        )
        advance = glyph_set[gname].width
        kern = PAIR_KERNS.get((TEXT[index - 1], TEXT[index]), 0) if index else 0
        x += advance + advance * TRACKING + kern

    path = re.sub(r"-?\d+\.?\d*", fmt_num, path_pen.getCommands())
    width = round((max_x - min_x) + 2 * PADDING, 2)
    height = round((max_y - min_y) + 2 * PADDING, 2)
    return path, width, height


def main() -> None:
    if not FONT_PATH.exists():
        print(f"Font not found: {FONT_PATH}", file=sys.stderr)
        sys.exit(1)

    path, width, height = build_path(FONT_PATH)
    print(f"width={width} height={height} path_len={len(path)}")


if __name__ == "__main__":
    main()
