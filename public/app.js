import { ROOMS }          from './config/rooms.js';
import { LampController } from './devices/lamp.js';

// ── Room ──────────────────────────────────────────────────────────────────────
const ROOM_ID = 'roshans-room';
const room    = ROOMS[ROOM_ID];

// ── Device type → controller map ──────────────────────────────────────────────
// Add new device types here as you build them.
const DEVICE_CONTROLLERS = {
  lamp: LampController,
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const roomLabelEl  = document.getElementById('roomLabel');
const deviceNameEl = document.getElementById('deviceName');
const deviceTrack  = document.getElementById('deviceTrack');
const dotsEl       = document.getElementById('carouselDots');
const controlsEl   = document.getElementById('controlsPanel');

roomLabelEl.textContent = room.label;

// ── Instantiate controllers ───────────────────────────────────────────────────
const controllers = room.devices.map(cfg => {
  const Ctrl = DEVICE_CONTROLLERS[cfg.type];
  if (!Ctrl) throw new Error(`Unknown device type: "${cfg.type}"`);
  return new Ctrl(cfg);
});

// ── Build carousel panels + controls + dots ───────────────────────────────────
controllers.forEach((ctrl, i) => {
  // Stage panel
  deviceTrack.appendChild(ctrl.buildPanel());

  // Controls (hidden by default except first)
  const controls = ctrl.buildControls();
  if (i !== 0) controls.style.display = 'none';
  controlsEl.appendChild(controls);

  // Dot indicator
  const dot = document.createElement('div');
  dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
  dotsEl.appendChild(dot);
});

// ── Load all images then init ─────────────────────────────────────────────────
let currentIndex = 0;

Promise.all(controllers.map(c => c.load()))
  .then(() => {
    controllers.forEach(c => c.init());
    // Pause all except the first
    controllers.forEach((c, i) => { if (i !== 0) c.pause(); });
    _syncHeader(0);
  })
  .catch(err => console.error('[control] Load error:', err));

// ── Navigation ────────────────────────────────────────────────────────────────
function goTo(index) {
  if (index < 0 || index >= controllers.length || index === currentIndex) return;

  controllers[currentIndex].pause();
  currentIndex = index;
  controllers[currentIndex].resume();

  // Slide
  deviceTrack.style.transform = `translateX(-${index * 100}%)`;

  // Show/hide controls
  controlsEl.querySelectorAll('.lamp-controls').forEach((el, i) => {
    el.style.display = i === index ? '' : 'none';
  });

  // Dots
  dotsEl.querySelectorAll('.carousel-dot').forEach((d, i) => {
    d.classList.toggle('active', i === index);
  });

  _syncHeader(index);
}

function _syncHeader(index) {
  deviceNameEl.textContent = room.devices[index].name;
}

// ── Swipe / drag ──────────────────────────────────────────────────────────────
const carousel = document.getElementById('deviceCarousel');

// Touch (mobile)
let touchStartX = 0;
let touchStartY = 0;
let swipeMoved  = false;

carousel.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  swipeMoved  = false;
}, { passive: true });

carousel.addEventListener('touchmove', e => {
  const dx = Math.abs(e.touches[0].clientX - touchStartX);
  const dy = Math.abs(e.touches[0].clientY - touchStartY);
  if (dx > dy && dx > 8) swipeMoved = true;
}, { passive: true });

carousel.addEventListener('touchend', e => {
  if (!swipeMoved) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) dx < 0 ? goTo(currentIndex + 1) : goTo(currentIndex - 1);
  swipeMoved = false;
});

// Mouse drag (desktop)
let mouseStartX  = 0;
let mouseDragged = false;

carousel.addEventListener('mousedown', e => {
  mouseStartX  = e.clientX;
  mouseDragged = false;
});

carousel.addEventListener('mousemove', e => {
  if (Math.abs(e.clientX - mouseStartX) > 8) mouseDragged = true;
});

carousel.addEventListener('mouseup', e => {
  if (!mouseDragged) return;
  const dx = e.clientX - mouseStartX;
  if (Math.abs(dx) > 50) dx < 0 ? goTo(currentIndex + 1) : goTo(currentIndex - 1);
  mouseDragged = false;
});

// ── Resize ────────────────────────────────────────────────────────────────────
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => controllers.forEach(c => c.resize()), 150);
});
