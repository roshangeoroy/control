# public/

The web app served directly by Express. All files here are accessible at the root URL (`/`).

## Architecture

The app uses a modular, class-based architecture to support multiple devices (e.g., multiple lamps) in a single room via a carousel.

### File Structure
- `index.html`: Minimal shell. No hardcoded device markup.
- `index.css`: Styles for the carousel, dots, and class-based canvas rules.
- `app.js`: Orchestrator. Loads room config, manages the carousel, and handles swipe/drag navigation.
- `config/`:
  - `rooms.js`: Device registry and room configuration (the single source of truth).
- `devices/`:
  - `lamp.js`: `LampController` class. One instance per lamp configuration entry.

---

### Device Registry (`config/rooms.js`)

A plain JS object. Adding a new device (e.g., a lamp) is as simple as adding an entry to the `devices` array.

```javascript
export const ROOMS = {
  'roshans-room': {
    label: "Roshan's Room",
    devices: [
      {
        type: 'lamp',
        id: 'aldebaran',
        name: 'Aldebaran',
        assets: {
          base:  '/assets/aldebaran/lamp_base_proper.png',
          shade: '/assets/aldebaran/lamp_shade_proper.png',
          glow:  '/assets/aldebaran/lamp_glow_proper.png',
        },
        // Optional overrides: defaultColor, defaultIntensity, colors, etc.
      },
    ],
  },
};
```

---

### Lamp Controller (`devices/lamp.js`)

A class where each instance manages its own state and DOM elements for a specific lamp.

| Method | Description |
|--------|-------------|
| `buildPanel()` | Creates the stage DOM (4 stacked canvases) — injected into the carousel track. |
| `buildControls()` | Creates the controls DOM — injected into the controls panel. |
| `load()` | Returns a Promise that resolves when all assets are loaded. |
| `init()` | Initialises the canvases and binds event listeners. |
| `pause()` | Stops the animation loop (called when the lamp is swiped away). |
| `resume()` | Restarts the animation loop (called when the lamp is swiped into view). |
| `resize()` | Redraws the lamp at the new scale. |

---

### Carousel & Navigation

- **Layout**: All device panels are contained within a `.device-track` (flex row).
- **Movement**: Sliding is handled via `transform: translateX(-N * 100%)` with a CSS transition.
- **Interactions**: Interactive "follow-your-finger" swipe and mouse drag mechanics. Includes rubber-band resistance at boundaries and threshold-based snapping (20% width).
- **Optimisation**: Inactive lamp animation loops are paused to save CPU/battery.
- **Feedback**: Dot indicators at the bottom show the current carousel position.

---

### Canvas Layers

Each device panel uses the following class-based canvas stack (bottom → top):

| Class | z-index | Role | Events |
|-------|---------|------|--------|
| `.canvas-ambient` | 1 | Animated radial halo | none |
| `.canvas-base` | 2 | Lamp body image | none |
| `.canvas-shade` | 3 | Lamp shade image | **click target** |
| `.canvas-glow` | 4 | Coloured glow overlay | none |

*Note: IDs like `cShade-aldebaran` are still assigned for JS to look up specific canvases within the controller.*
