# Waygr brand asset pack

Production assets for Designer. Quiet delivery.

## Hex tokens used (locked)

| Token | Hex | Use in this pack |
|-------|-----|------------------|
| ink / bg dark | `#0B0B0D` | Template backgrounds, icon W, wordmark-dark, on-accent avatar letter |
| text light-on-dark | `#F5F3EF` | Headlines, names, rematch CTA, blue-avatar letter |
| orange (brand) | `#FF5F1F` | Wordmark light/on-dark, icon fill, CALLED IT., glow, your side |
| blue rival | `#4D8DFF` | Their-side avatar/label |
| muted dark | `#A1A1AA` | Score labels, forfeit, rivalry |
| border dark | `#2E2E36` | Dividers on result/story cards |
| on-accent | `#0B0B0D` | Letter on orange avatar (never white on orange) |
| surface / raised | `#16161A` / `#202026` | Reserved tokens (not painted in share templates) |
| light bg / light text | `#FAFAF7` / `#121214` | Documented; share templates are dark-first |
| green / rose | `#34D17D` / `#FF4D6D` | Not used in these assets |

## Font

- Wordmark / CALLED IT. / icon W: `/usr/share/fonts/truetype/sand-box/google/Barlow Condensed/BarlowCondensed-ExtraBoldItalic.ttf`
- Condensed headlines (non-italic): `.../BarlowCondensed-ExtraBold.ttf`
- Labels: `/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf`

Wordmark + icon SVGs are **outlined path data** (fontTools → pathops). No Google Fonts CDN required to render.

## Notes / judgment calls

1. **yg pair**: extra −32 font units beyond −1% tracking; W–a / a–y / g–r also tightened slightly.
2. **Descenders cut**: y/g path-intersect clipped at y = −10 (font units) so they share one clean baseline.
3. **Icon corner radius**: **18%** (`rx=184` @ 1024) — square per brief, subtle radius for iOS, under 22% max.
4. **Icon at 29px**: W fills ~70% of the square; see `_inspect-icon-29-scaled.png` (29→290 nearest-neighbor).
5. **Glow**: one orange radial glow, **top-right only**, on the three share PNG templates (and SVG masters). Nowhere else.
6. **wordmark-light.svg** = orange `#FF5F1F` (cream/light and orange-on-ink). **wordmark-dark.svg** = ink for orange fills. **wordmark-on-dark.svg** = same orange paths as light (transparent for dark UI).
7. Sample copy avoids gambling UI words (call / covered / rematch / social forfeit).
8. Template SVG masters keep editable `<text>` plus outlined wordmark; PNGs are production raster.
9. Rebuild: `/workspace/waygr/.venv/bin/python /workspace/waygr/brand/_build_assets.py`

## Files

- `MANIFEST.md`
- `_inspect-icon-29-scaled.png`
- `icon-1024.png`
- `icon-128.png`
- `icon-144.png`
- `icon-152.png`
- `icon-180.png`
- `icon-192.png`
- `icon-29.png`
- `icon-32.png`
- `icon-48.png`
- `icon-512.png`
- `icon-72.png`
- `icon-96.png`
- `icon.svg`
- `template-link-preview-1200x630.png`
- `template-link-preview-1200x630.svg`
- `template-result-card-1080x1350.png`
- `template-result-card-1080x1350.svg`
- `template-story-card-1080x1920.png`
- `template-story-card-1080x1920.svg`
- `wordmark-dark.svg`
- `wordmark-light.svg`
- `wordmark-on-dark.svg`
