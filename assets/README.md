# assets/

Static image assets for all devices. Each device gets its own subfolder named after the device ID.

## Structure

```
assets/
└── aldebaran/          # Device: Aldebaran
    ├── lamp_base_proper.png
    ├── lamp_shade_proper.png
    └── lamp_glow_proper.png
```

## Conventions

For lamps, each folder contains exactly **three PNG layers** that are composited at runtime on `<canvas>`:

| Layer | Filename pattern | Role |
|-------|-----------------|------|
| Base  | `lamp_base_proper.png`  | Full lamp body — rendered as-is, no blending |
| Shade | `lamp_shade_proper.png` | The lamp shade only — used as the **clickable hit region** |
| Glow  | `lamp_glow_proper.png`  | Luminance mask — white/grey pixels indicate where light is emitted. Sampled per-pixel to drive the coloured glow effect |

### Adding a new device

1. Create a subfolder: `assets/<device-id>/`
2. Place the required PNGs inside following the naming convention above.
3. Update `public/config/rooms.js` to register the new device in the `devices` array of the appropriate room.

## Asset Access

The Express server exposes this directory at `/assets/` — e.g., `/assets/aldebaran/lamp_base_proper.png`.
