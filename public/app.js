// ── Config ────────────────────────────────────────────────────────────────────
const COLORS = {
  warm:   { r: 255, g: 180, b: 60,  room: '255,170,50',  tc: '#e89010' },
  cool:   { r: 80,  g: 190, b: 255, room: '80,190,255',  tc: '#50a8f0' },
  rose:   { r: 255, g: 70,  b: 160, room: '255,70,160',  tc: '#f050a0' },
  forest: { r: 60,  g: 220, b: 90,  room: '60,210,80',   tc: '#28b048' },
  violet: { r: 160, g: 50,  b: 255, room: '150,50,240',  tc: '#7828e0' },
};

// SCALE is computed dynamically — see getScale()
// Target: lamp fills ~50% of the narrower screen dimension, integer steps only
const PAD         = 15;  // padding around base image for ambient glow
const AMBIENT_DIV = 4;   // lower = finer glow blocks

// ── Dynamic scale ─────────────────────────────────────────────────────────────
// Called on load and on resize. Returns integer pixel-art scale so the lamp
// comfortably fits inside the lamp section (roughly top 38% of viewport).
function getScale() {
  if (!imgBase.naturalWidth) return 4; // fallback before image loads
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // target size: 60% of viewport width OR 38% of viewport height, whichever is smaller
  const targetPx = Math.min(vw * 0.60, vh * 0.38);
  // integer scale, minimum 2
  return Math.max(2, Math.floor(targetPx / imgBase.naturalWidth));
}

// ── State ─────────────────────────────────────────────────────────────────────
let color     = 'warm';
let intensity = 0.80;
let isOn      = true;
let blend     = 'soft-light';
let maskData  = null;
let maxLum    = 1;
let maskCV    = null;
let maskCtx   = null;

// ── Image Loading ─────────────────────────────────────────────────────────────
const imgBase  = new Image();
const imgGlow  = new Image();
const imgShade = new Image();
let baseOK  = false;
let glowOK  = false;
let shadeOK = false;

imgBase.onload = () => {
  baseOK = true;
  log(`base loaded: ${imgBase.naturalWidth}×${imgBase.naturalHeight}`);
  tryInit();
};

imgGlow.onload = () => {
  glowOK = true;
  maskCV        = document.createElement('canvas');
  maskCV.width  = imgGlow.naturalWidth;
  maskCV.height = imgGlow.naturalHeight;
  maskCtx       = maskCV.getContext('2d');
  maskCtx.drawImage(imgGlow, 0, 0);
  cacheMaskData();
  tryInit();
};

imgShade.onload = () => {
  shadeOK = true;
  log(`shade loaded: ${imgShade.naturalWidth}×${imgShade.naturalHeight}`);
  tryInit();
};

imgBase.onerror  = () => log('ERROR: lamp_base_proper.png failed to load', 'err');
imgGlow.onerror  = () => log('ERROR: lamp_glow_proper.png failed to load', 'err');
imgShade.onerror = () => log('ERROR: lamp_shade_proper.png failed to load', 'err');

imgBase.src  = '/assets/aldebaran/lamp_base_proper.png';
imgGlow.src  = '/assets/aldebaran/lamp_glow_proper.png';
imgShade.src = '/assets/aldebaran/lamp_shade_proper.png';

// ── Helpers ───────────────────────────────────────────────────────────────────
function log(msg, cls = 'ok') {
  const d = document.getElementById('dbg');
  if (!d) return;
  const s  = document.createElement('span');
  s.className   = cls;
  s.textContent = '› ' + msg;
  d.appendChild(document.createElement('br'));
  d.appendChild(s);
  d.scrollTop = d.scrollHeight;
}

function cacheMaskData() {
  maskData = maskCtx.getImageData(0, 0, maskCV.width, maskCV.height);
  const d  = maskData.data;
  let mx   = 0;
  let bright = 0;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
    if (lum > mx) mx = lum;
    if (lum > 0.04) bright++;
  }
  maxLum = mx || 1;
  log(`glow cached: ${maskCV.width}×${maskCV.height} maxLum:${maxLum.toFixed(3)} brightPx:${bright}`);
  if (bright === 0) log('⚠ No bright pixels in glow mask!', 'warn');
}

function tryInit() {
  if (!baseOK || !glowOK || !shadeOK) return;
  drawBase();
  drawShade();
  applyGlow();
  if (!window.animationRunning) {
    window.animationRunning = true;
    tick();
  }
}

// ── Draw Base ─────────────────────────────────────────────────────────────────
function drawBase() {
  const SCALE = getScale();

  const cv  = document.getElementById('cBase');
  cv.width  = imgBase.naturalWidth;
  cv.height = imgBase.naturalHeight;
  cv.style.width  = (cv.width  * SCALE) + 'px';
  cv.style.height = (cv.height * SCALE) + 'px';

  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(imgBase, 0, 0);

  // ambient canvas
  const cAmbient        = document.getElementById('cAmbient');
  cAmbient.width        = Math.floor((cv.width  + 2 * PAD) / AMBIENT_DIV);
  cAmbient.height       = Math.floor((cv.height + 2 * PAD) / AMBIENT_DIV);
  cAmbient.style.width  = ((cv.width  + 2 * PAD) * SCALE) + 'px';
  cAmbient.style.height = ((cv.height + 2 * PAD) * SCALE) + 'px';

  const stage        = document.getElementById('stage');
  stage.style.width  = ((cv.width  + 2 * PAD) * SCALE) + 'px';
  stage.style.height = ((cv.height + 2 * PAD) * SCALE) + 'px';
}

// ── Draw Shade (clickable hit-area) ───────────────────────────────────────────
function drawShade() {
  const SCALE = getScale();
  const cv    = document.getElementById('cShade');
  cv.width    = imgShade.naturalWidth;
  cv.height   = imgShade.naturalHeight;
  cv.style.width  = (cv.width  * SCALE) + 'px';
  cv.style.height = (cv.height * SCALE) + 'px';

  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(imgShade, 0, 0);
}

// ── Apply Glow ────────────────────────────────────────────────────────────────
function applyGlow() {
  const SCALE  = getScale();
  const glowCV = document.getElementById('cGlow');
  const cfg    = COLORS[color];

  glowCV.style.mixBlendMode = blend;

  if (!isOn) {
    glowCV.style.opacity = 0;
    updatePowerBtn();
    return;
  }

  const W  = imgBase.naturalWidth;
  const H  = imgBase.naturalHeight;
  const MW = maskCV.width;
  const MH = maskCV.height;
  const mask = maskData.data;

  glowCV.width        = W;
  glowCV.height       = H;
  glowCV.style.width  = (W * SCALE) + 'px';
  glowCV.style.height = (H * SCALE) + 'px';

  const off  = document.createElement('canvas');
  off.width  = W;
  off.height = H;
  const octx = off.getContext('2d');
  const out  = octx.createImageData(W, H);
  const od   = out.data;

  let painted = 0;
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const mx = Math.min(Math.floor(px * MW / W), MW - 1);
      const my = Math.min(Math.floor(py * MH / H), MH - 1);
      const mi = (my * MW + mx) * 4;
      const lum = (mask[mi] * 0.299 + mask[mi + 1] * 0.587 + mask[mi + 2] * 0.114) / 255;
      if (lum < 0.01) continue;
      const lumN = lum / maxLum;
      const oi   = (py * W + px) * 4;
      od[oi]     = cfg.r;
      od[oi + 1] = cfg.g;
      od[oi + 2] = cfg.b;
      od[oi + 3] = Math.min(255, Math.pow(lumN, 0.5) * intensity * 255);
      painted++;
    }
  }
  octx.putImageData(out, 0, 0);

  const ctx = glowCV.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(off, 0, 0);
  glowCV.style.opacity = 1;

  document.getElementById('slider').style.setProperty('--tc', cfg.tc);
  log(`glow: ${painted}px | scale:${SCALE} blend:${blend} int:${intensity.toFixed(2)}`);

  updatePowerBtn();
}

// ── Ambient Glow (retro pulsing) ──────────────────────────────────────────────
function drawAmbientGlow() {
  const cv   = document.getElementById('cAmbient');
  const room = document.getElementById('roomGlow');
  if (!cv || !room || !maskData) return;
  const ctx  = cv.getContext('2d');

  if (!isOn) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    room.style.opacity = '0';
    return;
  }

  room.style.opacity = '0';
  ctx.clearRect(0, 0, cv.width, cv.height);

  let sumX = 0, sumY = 0, count = 0;
  const d  = maskData.data;
  const MW = maskCV.width;
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
  const cy = count > 0 ? sumY / count : maskCV.height / 3;

  const ax = Math.floor(cx + PAD) / AMBIENT_DIV;
  const ay = Math.floor(cy + PAD) / AMBIENT_DIV;

  const time       = Date.now() * 0.004;
  const pulse      = Math.sin(time) * 0.07 + 1.0;
  const baseRadius = (Math.max(maskCV.width, maskCV.height) * 0.35) + (intensity * 30);
  const r          = (baseRadius * pulse) / AMBIENT_DIV;

  const cfg  = COLORS[color];
  const grad = ctx.createRadialGradient(ax, ay, 1, ax, ay, r);
  const ra   = 0.35 * intensity;
  grad.addColorStop(0,    `rgba(${cfg.room}, ${ra})`);
  grad.addColorStop(0.35, `rgba(${cfg.room}, ${(ra * 0.45).toFixed(3)})`);
  grad.addColorStop(1,    'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cv.width, cv.height);
}

function tick() {
  drawAmbientGlow();
  requestAnimationFrame(tick);
}

// ── Power button visual state ─────────────────────────────────────────────────
function updatePowerBtn() {
  const btn = document.getElementById('powerBtn');
  if (!btn) return;
  if (isOn) {
    btn.textContent = 'Turn Off';
    btn.classList.remove('off');
  } else {
    btn.textContent = 'Turn On';
    btn.classList.add('off');
  }
}

// ── Shake animation helper ────────────────────────────────────────────────────
function triggerShake() {
  const shade = document.getElementById('cShade');
  shade.classList.remove('lamp-shake');
  // Force reflow so re-adding the class restarts the animation
  void shade.offsetWidth;
  shade.classList.add('lamp-shake');
  shade.addEventListener('animationend', () => shade.classList.remove('lamp-shake'), { once: true });
}

// ── Resize handler ────────────────────────────────────────────────────────────
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!baseOK || !glowOK || !shadeOK) return;
    drawBase();
    drawShade();
    applyGlow();
    log(`resize → scale:${getScale()}`);
  }, 150); // debounced
});

// ── Events ────────────────────────────────────────────────────────────────────

// Clicking the lamp shade toggles power + triggers shake
document.getElementById('cShade').addEventListener('click', () => {
  isOn = !isOn;
  triggerShake();
  applyGlow();
});

// Color swatches
document.querySelectorAll('.swatch').forEach(s => {
  s.addEventListener('click', () => {
    document.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
    s.classList.add('active');
    color = s.dataset.c;
    if (!isOn) { isOn = true; }
    applyGlow();
  });
});

// Intensity slider
const slider    = document.getElementById('slider');
const sliderVal = document.getElementById('sliderVal');
slider.addEventListener('input', e => {
  intensity = e.target.value / 100;
  if (sliderVal) sliderVal.textContent = e.target.value + '%';
  if (!isOn) { isOn = true; }
  applyGlow();
});

// Power button
document.getElementById('powerBtn').addEventListener('click', () => {
  isOn = !isOn;
  applyGlow();
});
