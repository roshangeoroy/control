// ── Default color palette ─────────────────────────────────────────────────────
// Shared across all lamps. Override per-lamp via cfg.colors.
export const DEFAULT_COLORS = {
  warm:   { r: 255, g: 180, b: 60,  room: '255,170,50',  tc: '#e89010', sl: '#fff8d0', sg: 'rgba(232,144,16,0.5)'  },
  cool:   { r: 80,  g: 190, b: 255, room: '80,190,255',  tc: '#50a8f0', sl: '#daf2ff', sg: 'rgba(80,168,240,0.5)'  },
  rose:   { r: 255, g: 70,  b: 160, room: '255,70,160',  tc: '#f050a0', sl: '#ffe0ee', sg: 'rgba(240,80,160,0.5)'  },
  forest: { r: 60,  g: 220, b: 90,  room: '60,210,80',   tc: '#28b048', sl: '#c8ffd8', sg: 'rgba(40,176,72,0.5)'   },
  violet: { r: 160, g: 50,  b: 255, room: '150,50,240',  tc: '#7828e0', sl: '#e8d0ff', sg: 'rgba(120,40,224,0.5)'  },
};

// ── Room registry ─────────────────────────────────────────────────────────────
// Add new rooms/devices here.
//
// Lamp config shape:
//   type              'lamp'  (required)
//   id                unique string, used for DOM IDs and asset paths (required)
//   name              display name shown in header (required)
//   assets.base       path to base PNG (required)
//   assets.shade      path to shade PNG — the clickable region (required)
//   assets.glow       path to luminance mask PNG (required)
//   defaultColor      key from colors palette, default 'warm' (optional)
//   defaultIntensity  0–1, default 0.80 (optional)
//   colors            override the full color palette for this lamp (optional)
//   renderGlow(ctrl)  fully replaces the per-pixel glow computation (optional)
//   onShadeClick(ctrl) fully replaces shade click behaviour (optional)
//
export const ROOMS = {
  'roshans-room': {
    label: "Roshan's Room",
    devices: [
      {
        type:  'lamp',
        id:    'aldebaran',
        name:  'Aldebaran',
        assets: {
          base:  '/assets/aldebaran/lamp_base_proper.png',
          shade: '/assets/aldebaran/lamp_shade_proper.png',
          glow:  '/assets/aldebaran/lamp_glow_proper.png',
        },
      },
      // ── Dummy lamp for swipe testing ───────────────────────────────────────
      {
        type:  'lamp',
        id:    'aldebaran-2',
        name:  'Desk Lamp',
        assets: {
          base:  '/assets/aldebaran/lamp_base_proper.png',
          shade: '/assets/aldebaran/lamp_shade_proper.png',
          glow:  '/assets/aldebaran/lamp_glow_proper.png',
        },
        defaultColor: 'violet',
      },
    ],
  },
};
