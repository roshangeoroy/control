# demo/

This folder contains proof-of-concept files created to explore and validate the core rendering approach before building the main app.

## Purpose

The demo was used to understand:

- How **pixel art lamp assets** can be rendered at arbitrary scales without blurring (using `image-rendering: pixelated` and integer scale factors)
- How **blend modes** (`soft-light`, `screen`, `multiply`, etc.) affect the coloured glow layer sitting on top of the base image
- How a **luminance mask** (the glow PNG) can be sampled per-pixel to drive a tinted, intensity-controlled glow effect on a `<canvas>`
- How **ambient light** can be approximated with a radial gradient canvas animated in real time

## Files

| File | Description |
|------|-------------|
| `lamp_demo_v3.html` | Self-contained single-file prototype. All CSS, JS and canvas rendering logic lives inline. This is the file that proved the layered canvas approach was viable before it was split into the production `public/` structure. |

> **Not production code.** Nothing in this folder is referenced by the live app. It exists purely as a reference and can be opened directly in a browser as a standalone file.
