# assets/

Static image assets for all lamps. Each lamp gets its own subfolder named after the lamp.

## Structure

```
assets/
└── aldebaran/          # Lamp: Aldebaran
    ├── lamp_base_proper.png
    ├── lamp_shade_proper.png
    └── lamp_glow_proper.png
```

## Conventions

Each lamp folder contains exactly **three PNG layers** that are composited at runtime on `<canvas>`:

| Layer | Filename pattern | Role |
|-------|-----------------|------|
| Base  | `lamp_base_proper.png`  | Full lamp body — rendered as-is, no blending |
| Shade | `lamp_shade_proper.png` | The lamp shade only — used as the **clickable hit region** |
| Glow  | `lamp_glow_proper.png`  | Luminance mask — white/grey pixels indicate where light is emitted. Sampled per-pixel to drive the coloured glow effect |

### Adding a new lamp

1. Create a subfolder: `assets/<lamp-name>/`
2. Place the three PNGs inside following the naming convention above
3. Update `public/app.js` to point `imgBase.src`, `imgShade.src`, and `imgGlow.src` at the new paths

## Asset served at

The Express server exposes this directory at `/assets/` — e.g. `/assets/aldebaran/lamp_base_proper.png`.
