import { DEFAULT_COLORS } from '../config/rooms.js';

const PAD         = 15;
const AMBIENT_DIV = 4;

// ─────────────────────────────────────────────────────────────────────────────
// LampController
//
// Default template for all lamps. Handles:
//   - DOM panel construction (4 stacked canvases)
//   - Image loading
//   - Pixel-art scaling
//   - Per-pixel glow rendering
//   - Animated ambient halo
//   - Shade click → toggle + shake
//   - Controls (colour swatches, brightness slider, power button)
//
// Override hooks (set on the lamp config object):
//   cfg.colors            → replace the entire colour palette
//   cfg.renderGlow(ctrl)  → replace glow computation
//   cfg.onShadeClick(ctrl)→ replace shade click behaviour
//
// ─────────────────────────────────────────────────────────────────────────────
export class LampController {
  constructor(cfg) {
    this.cfg       = cfg;
    this.colors    = cfg.colors || DEFAULT_COLORS;
    this.color     = cfg.defaultColor     || 'warm';
    this.intensity = cfg.defaultIntensity ?? 0.80;
    this.isOn      = true;
    this.blend     = 'soft-light';

    // Glow mask cache
    this.maskData = null;
    this.maxLum   = 1;
    this.maskCV   = null;
    this.maskCtx  = null;

    // Images
    this._imgBase  = null;
    this._imgShade = null;

    // rAF handle
    this._rafId = null;

    // DOM references (set after buildPanel / buildControls)
    this._panel    = null;
    this._controls = null;
    this._ids      = null;
  }

  // ── Build the stage DOM panel ─────────────────────────────────────────────
  buildPanel() {
    const id = this.cfg.id;
    const panel = document.createElement('div');
    panel.className  = 'lamp-panel';
    panel.dataset.id = id;
    panel.innerHTML  = `
      <div class="stage" id="stage-${id}">
        <div class="room-glow" id="roomGlow-${id}"></div>
        <canvas class="canvas-ambient" id="cAmbient-${id}"></canvas>
        <canvas class="canvas-base"    id="cBase-${id}"></canvas>
        <canvas class="canvas-shade"   id="cShade-${id}"></canvas>
        <canvas class="canvas-glow"    id="cGlow-${id}"></canvas>
      </div>`;

    this._panel = panel;
    this._ids   = {
      stage:    `stage-${id}`,
      roomGlow: `roomGlow-${id}`,
      cAmbient: `cAmbient-${id}`,
      cBase:    `cBase-${id}`,
      cShade:   `cShade-${id}`,
      cGlow:    `cGlow-${id}`,
    };
    return panel;
  }

  // ── Build the controls DOM ────────────────────────────────────────────────
  buildControls() {
    const id      = this.cfg.id;
    const swatches = Object.entries(this.colors).map(([key, c]) => {
      const active = key === this.color ? ' active' : '';
      return `<div class="swatch${active}" data-c="${key}"
                style="background:radial-gradient(circle at 38% 35%,${c.sl},${c.tc});--sg:${c.sg}"></div>`;
    }).join('');

    const el = document.createElement('div');
    el.className = 'lamp-controls';
    el.innerHTML = `
      <div class="control-row">
        <span class="lbl">Color</span>
        <div class="swatches-container">${swatches}</div>
      </div>
      <div class="control-row">
        <span class="lbl">Brightness</span>
        <div class="slider-wrapper">
          <input type="range" id="slider-${id}" min="0" max="100" value="${Math.round(this.intensity * 100)}">
          <span class="slider-value" id="sliderVal-${id}">${Math.round(this.intensity * 100)}%</span>
        </div>
      </div>
      <div class="control-row power-row">
        <button class="power-btn" id="powerBtn-${id}">Turn Off</button>
      </div>`;

    this._controls = el;
    return el;
  }

  // ── Load all three images ─────────────────────────────────────────────────
  load() {
    return new Promise((resolve, reject) => {
      const imgBase  = new Image();
      const imgGlow  = new Image();
      const imgShade = new Image();
      let done = 0;
      const check = () => { if (++done === 3) resolve(); };
      const fail  = src => reject(new Error(`Failed to load asset: ${src}`));

      imgBase.onload  = check;
      imgGlow.onload  = () => {
        this.maskCV        = document.createElement('canvas');
        this.maskCV.width  = imgGlow.naturalWidth;
        this.maskCV.height = imgGlow.naturalHeight;
        this.maskCtx       = this.maskCV.getContext('2d');
        this.maskCtx.drawImage(imgGlow, 0, 0);
        this._cacheMaskData();
        check();
      };
      imgShade.onload = check;

      imgBase.onerror  = () => fail(this.cfg.assets.base);
      imgGlow.onerror  = () => fail(this.cfg.assets.glow);
      imgShade.onerror = () => fail(this.cfg.assets.shade);

      imgBase.src  = this.cfg.assets.base;
      imgGlow.src  = this.cfg.assets.glow;
      imgShade.src = this.cfg.assets.shade;

      this._imgBase  = imgBase;
      this._imgShade = imgShade;
    });
  }

  // ── Init rendering and events (call after load + panel is in DOM) ─────────
  init() {
    this._drawBase();
    this._drawShade();
    this._applyGlow();
    this._bindControls();
    this._bindShadeClick();
    this._startLoop();
  }

  // ── Pause rAF (called when swiped away) ──────────────────────────────────
  pause() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  // ── Resume rAF (called when swiped into view) ─────────────────────────────
  resume() {
    if (this._rafId === null) this._startLoop();
  }

  // ── Redraw at new viewport size ───────────────────────────────────────────
  resize() {
    this._drawBase();
    this._drawShade();
    this._applyGlow();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────

  _getScale() {
    if (!this._imgBase?.naturalWidth) return 4;
    const targetPx = Math.min(window.innerWidth * 0.60, window.innerHeight * 0.38);
    return Math.max(2, Math.floor(targetPx / this._imgBase.naturalWidth));
  }

  _cacheMaskData() {
    this.maskData = this.maskCtx.getImageData(0, 0, this.maskCV.width, this.maskCV.height);
    const d = this.maskData.data;
    let mx = 0;
    for (let i = 0; i < d.length; i += 4) {
      const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
      if (lum > mx) mx = lum;
    }
    this.maxLum = mx || 1;
  }

  _drawBase() {
    const S  = this._getScale();
    const cv = document.getElementById(this._ids.cBase);
    cv.width  = this._imgBase.naturalWidth;
    cv.height = this._imgBase.naturalHeight;
    cv.style.width  = (cv.width  * S) + 'px';
    cv.style.height = (cv.height * S) + 'px';
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this._imgBase, 0, 0);

    const amb = document.getElementById(this._ids.cAmbient);
    amb.width        = Math.floor((cv.width  + 2 * PAD) / AMBIENT_DIV);
    amb.height       = Math.floor((cv.height + 2 * PAD) / AMBIENT_DIV);
    amb.style.width  = ((cv.width  + 2 * PAD) * S) + 'px';
    amb.style.height = ((cv.height + 2 * PAD) * S) + 'px';

    const stage = document.getElementById(this._ids.stage);
    stage.style.width  = ((cv.width  + 2 * PAD) * S) + 'px';
    stage.style.height = ((cv.height + 2 * PAD) * S) + 'px';
  }

  _drawShade() {
    const S  = this._getScale();
    const cv = document.getElementById(this._ids.cShade);
    cv.width  = this._imgShade.naturalWidth;
    cv.height = this._imgShade.naturalHeight;
    cv.style.width  = (cv.width  * S) + 'px';
    cv.style.height = (cv.height * S) + 'px';
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this._imgShade, 0, 0);
  }

  // Overridable via cfg.renderGlow(ctrl)
  _applyGlow() {
    if (this.cfg.renderGlow) return this.cfg.renderGlow(this);

    const S      = this._getScale();
    const glowCV = document.getElementById(this._ids.cGlow);
    const c      = this.colors[this.color];

    glowCV.style.mixBlendMode = this.blend;

    if (!this.isOn) {
      glowCV.style.opacity = 0;
      this._updatePowerBtn();
      return;
    }

    const W = this._imgBase.naturalWidth;
    const H = this._imgBase.naturalHeight;
    const MW = this.maskCV.width;
    const MH = this.maskCV.height;
    const mask = this.maskData.data;

    glowCV.width        = W;
    glowCV.height       = H;
    glowCV.style.width  = (W * S) + 'px';
    glowCV.style.height = (H * S) + 'px';

    const off  = document.createElement('canvas');
    off.width  = W;
    off.height = H;
    const octx = off.getContext('2d');
    const out  = octx.createImageData(W, H);
    const od   = out.data;

    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const mx = Math.min(Math.floor(px * MW / W), MW - 1);
        const my = Math.min(Math.floor(py * MH / H), MH - 1);
        const mi = (my * MW + mx) * 4;
        const lum = (mask[mi] * 0.299 + mask[mi + 1] * 0.587 + mask[mi + 2] * 0.114) / 255;
        if (lum < 0.01) continue;
        const lumN = lum / this.maxLum;
        const oi   = (py * W + px) * 4;
        od[oi]     = c.r;
        od[oi + 1] = c.g;
        od[oi + 2] = c.b;
        od[oi + 3] = Math.min(255, Math.pow(lumN, 0.5) * this.intensity * 255);
      }
    }
    octx.putImageData(out, 0, 0);

    const ctx = glowCV.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(off, 0, 0);
    glowCV.style.opacity = 0.5;

    // Sync slider thumb colour
    const slider = document.getElementById(`slider-${this.cfg.id}`);
    if (slider) slider.style.setProperty('--tc', c.tc);

    this._updatePowerBtn();
  }

  _drawAmbientGlow() {
    const cv   = document.getElementById(this._ids.cAmbient);
    const room = document.getElementById(this._ids.roomGlow);
    if (!cv || !room || !this.maskData) return;
    const ctx = cv.getContext('2d');

    if (!this.isOn) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      room.style.opacity = '0';
      return;
    }

    ctx.clearRect(0, 0, cv.width, cv.height);

    let sumX = 0, sumY = 0, count = 0;
    const d  = this.maskData.data;
    const MW = this.maskCV.width;
    for (let i = 0; i < d.length; i += 4) {
      const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
      if (lum > 0.05) {
        const idx = i / 4;
        sumX += idx % MW;
        sumY += Math.floor(idx / MW);
        count++;
      }
    }

    const cx = count > 0 ? sumX / count : MW / 2;
    const cy = count > 0 ? sumY / count : this.maskCV.height / 3;
    const ax = Math.floor(cx + PAD) / AMBIENT_DIV;
    const ay = Math.floor(cy + PAD) / AMBIENT_DIV;

    const time       = Date.now() * 0.004;
    const pulse      = Math.sin(time) * 0.07 + 1.0;
    const baseRadius = (Math.max(this.maskCV.width, this.maskCV.height) * 0.35) + (this.intensity * 30);
    const r          = (baseRadius * pulse) / AMBIENT_DIV;

    const c    = this.colors[this.color];
    const grad = ctx.createRadialGradient(ax, ay, 1, ax, ay, r);
    const ra   = 0.35 * this.intensity;
    grad.addColorStop(0,    `rgba(${c.room}, ${ra})`);
    grad.addColorStop(0.35, `rgba(${c.room}, ${(ra * 0.45).toFixed(3)})`);
    grad.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cv.width, cv.height);
  }

  _startLoop() {
    const tick = () => {
      this._drawAmbientGlow();
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  _updatePowerBtn() {
    const btn = document.getElementById(`powerBtn-${this.cfg.id}`);
    if (!btn) return;
    btn.textContent = this.isOn ? 'Turn Off' : 'Turn On';
    btn.classList.toggle('off', !this.isOn);
  }

  _triggerShake() {
    const shade = document.getElementById(this._ids.cShade);
    shade.classList.remove('lamp-shake');
    void shade.offsetWidth; // force reflow so animation restarts
    shade.classList.add('lamp-shake');
    shade.addEventListener('animationend', () => shade.classList.remove('lamp-shake'), { once: true });
  }

  // Overridable via cfg.onShadeClick(ctrl)
  _bindShadeClick() {
    const shade = document.getElementById(this._ids.cShade);
    shade.addEventListener('click', () => {
      if (this.cfg.onShadeClick) return this.cfg.onShadeClick(this);
      this.isOn = !this.isOn;
      this._triggerShake();
      this._applyGlow();
    });
  }

  _bindControls() {
    // Colour swatches
    this._controls.querySelectorAll('.swatch').forEach(s => {
      s.addEventListener('click', () => {
        this._controls.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
        s.classList.add('active');
        this.color = s.dataset.c;
        if (!this.isOn) this.isOn = true;
        this._applyGlow();
      });
    });

    // Brightness slider
    const slider    = document.getElementById(`slider-${this.cfg.id}`);
    const sliderVal = document.getElementById(`sliderVal-${this.cfg.id}`);
    slider.addEventListener('input', e => {
      this.intensity = e.target.value / 100;
      if (sliderVal) sliderVal.textContent = e.target.value + '%';
      if (!this.isOn) this.isOn = true;
      this._applyGlow();
    });

    // Power button
    document.getElementById(`powerBtn-${this.cfg.id}`)
      .addEventListener('click', () => { this.isOn = !this.isOn; this._applyGlow(); });
  }
}
