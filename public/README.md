# public/

The web app served directly by Express. All files here are accessible at the root URL (`/`).

## Files

### `index.html`
Entry point for the single-page app.

- Loads Google Fonts: `Press Start 2P`, `Pixelify Sans`, `Space Mono`
- Defines the app layout:
  - **Header** — room label ("Living Room") and lamp name ("Floor Lamp")
  - **Lamp stage** — four stacked `<canvas>` elements that composite the lamp layers
  - **Controls panel** — colour swatches, brightness slider, power button
- Canvas stack (bottom → top):
  ```
  #cAmbient  — animated ambient halo
  #cBase     — lamp body image
  #cShade    — lamp shade image (clickable)
  #cGlow     — coloured glow overlay
  ```

---

### `index.css`
All styling for the app. No framework — plain CSS.

**Key sections:**
| Section | What it covers |
|---------|---------------|
| Reset & Root | CSS custom properties (`--bg`, `--gold`, `--text`, etc.), box-sizing reset |
| App shell | Full-height flex column layout, max-width 480px |
| Header | Pixel font labels, `h1` sizing |
| Lamp section | Centred stage container, `overflow: hidden` |
| Canvas rules | `position: absolute`, `translate(-50%,-50%)` centering, `image-rendering: pixelated`, z-index stacking |
| Shake animation | `@keyframes lamp-shake` — decaying oscillation applied to `#cShade` on click |
| Controls panel | Colour swatches, range slider with custom thumb, power button |

---

### `app.js`
All client-side logic. No framework or build step — runs directly in the browser.

**Key responsibilities:**

| Function | Description |
|----------|-------------|
| `getScale()` | Computes the integer pixel-art scale factor based on viewport size so the lamp fills ~50% of the narrower dimension |
| `tryInit()` | Gates rendering until all three images (`base`, `glow`, `shade`) have loaded |
| `drawBase()` | Renders `lamp_base_proper.png` onto `#cBase` and sizes the ambient canvas and stage |
| `drawShade()` | Renders `lamp_shade_proper.png` onto `#cShade` at the correct scale |
| `applyGlow()` | Samples the glow luminance mask pixel-by-pixel, tints it with the active colour, scales by intensity, and draws the result onto `#cGlow` using the current blend mode |
| `drawAmbientGlow()` | Draws an animated radial gradient on `#cAmbient` that pulses in time. Called every frame via `requestAnimationFrame` |
| `triggerShake()` | Adds the `lamp-shake` CSS class to `#cShade`, forcing it to restart the shake animation on every click |
| `updatePowerBtn()` | Syncs the power button label and style with the current `isOn` state |

**State variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `color` | string | Active colour key (`warm`, `cool`, `rose`, `forest`, `violet`) |
| `intensity` | number | Brightness `0–1`, driven by the slider |
| `isOn` | boolean | Whether the lamp is on |
| `blend` | string | Canvas mix-blend-mode for the glow layer |
| `maskData` | ImageData | Cached pixel data from `lamp_glow_proper.png` |

**Image paths:** all three assets load from `/assets/aldebaran/`.
