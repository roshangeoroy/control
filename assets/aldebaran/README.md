# assets/aldebaran/

Pixel art lamp assets for **Aldebaran** — the first lamp in the control app.

## Files

| File | Description |
|------|-------------|
| `lamp_base_proper.png` | Full lamp body. Rendered on `.canvas-base` (z-index 2). |
| `lamp_shade_proper.png` | The shade portion only. Rendered on `.canvas-shade` (z-index 3). Acts as the **interactive click region** — clicking it toggles power and triggers the shake animation. |
| `lamp_glow_proper.png` | Luminance mask. Rendered on `.canvas-glow` (z-index 4, topmost). White/bright pixels mark the light-emitting area. Sampled per-pixel at runtime to produce the tinted glow effect. |

## Compositing Stack

The `LampController` composites these layers inside a `.lamp-panel` within the carousel:

```
.canvas-glow    (z:4) — coloured glow, pointer-events: none
.canvas-shade   (z:3) — shade image, cursor: pointer (click target)
.canvas-base    (z:2) — full lamp body, pointer-events: none
.canvas-ambient (z:1) — animated radial gradient halo
```
