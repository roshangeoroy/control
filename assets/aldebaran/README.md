# assets/aldebaran/

Pixel art lamp assets for **Aldebaran** — the first lamp in the control app.

## Files

| File | Size | Description |
|------|------|-------------|
| `lamp_base_proper.png` | 818 B | Full lamp body. Rendered on `#cBase` (z-index 2). Pixel art, no anti-aliasing. |
| `lamp_shade_proper.png` | 385 B | The shade portion of the lamp only. Rendered on `#cShade` (z-index 3). Acts as the **interactive click region** — clicking it toggles the lamp on/off and triggers the shake animation. |
| `lamp_glow_proper.png` | 513 B | Luminance mask. Rendered on `#cGlow` (z-index 4, topmost). White/bright pixels mark the light-emitting area of the shade. Sampled per-pixel at runtime to produce the tinted, intensity-scaled glow effect. |

## How the layers composite

```
#cGlow    (z:4)  — coloured glow, pointer-events: none
#cShade   (z:3)  — shade image, cursor: pointer (click target)
#cBase    (z:2)  — full lamp body, pointer-events: none
#cAmbient (z:1)  — animated radial gradient halo
```
