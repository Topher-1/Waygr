# Icon plate — opaque `#FF5F1F`

Fleet share harden: icon rasters use a **full-bleed** orange plate `#FF5F1F` (255, 95, 31). Corner alphas are **255** so dark surfaces never show through rounded-rect transparency.

- Applies to `icon-*.png`, `favicon.ico`, and `app/apple-icon.png` / `app/favicon.ico`.
- Same W geometry as prior pack; **plate only** — no wordmark or descender changes (see #26).
- SVG `icon.svg` unchanged (vector); PNGs are the share/PWA source of truth for opacity.

Verify: sample any corner → `RGBA(255, 95, 31, 255)`.
