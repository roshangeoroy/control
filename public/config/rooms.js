// ── Default color palette ─────────────────────────────────────────────────────
// Shared across all lamps. Override per-lamp via cfg.colors.
export const DEFAULT_COLORS = {
  warm:   { r: 153, g: 23,  b: 0,   w: 26,  room: '153,23,0',   tc: '#991700', sl: '#fce3de', sg: 'rgba(153,23,0,0.5)' },
  cool:   { r: 81,  g: 84,  b: 255, w: 0,   room: '81,84,255',  tc: '#5154ff', sl: '#e0e1ff', sg: 'rgba(81,84,255,0.5)' },
  rose:   { r: 252, g: 13,  b: 0,   w: 0,   room: '252,13,0',   tc: '#fc0d00', sl: '#ffdcdb', sg: 'rgba(252,13,0,0.5)' },
  forest: { r: 32,  g: 153, b: 11,  w: 0,   room: '32,153,11',  tc: '#20990b', sl: '#e0fce1', sg: 'rgba(32,153,11,0.5)' },
  violet: { r: 80, g: 30, b: 150, w: 0, room: '80,30,150', tc: '#501e96', sl: '#d0c0ff', sg: 'rgba(80,30,150,0.5)' }
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
        entity_id: 'light.wiz_rgbw_tunable_cb1eb0',
      },
      // ── Dummy lamp for swipe testing ───────────────────────────────────────
      {
        type:  'lamp',
        id:    'chara',
        name:  'Chara',
        assets: {
          base:  '/assets/chara/chara_rod.png',
          shade: '/assets/chara/chara_shade.png',
          glow:  '/assets/chara/chara_glow.png',
        },
        entity_id: 'light.wiz_rgbw_tunable_e33f0e',
      },
    ],
  },
};
