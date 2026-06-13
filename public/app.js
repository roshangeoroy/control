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

let isDragging = false;
let startX     = 0;
let currentX   = 0;

function _getEventX(e) {
  return e.touches ? e.touches[0].clientX : e.clientX;
}

function _startDrag(e) {
  isDragging = true;
  startX     = _getEventX(e);
  currentX   = startX;
  
  // Disable transition for immediate follow
  deviceTrack.style.transition = 'none';
}

function _moveDrag(e) {
  if (!isDragging) return;
  currentX = _getEventX(e);
  let dx = currentX - startX;
  
  // Rubber banding at ends
  if ((currentIndex === 0 && dx > 0) || (currentIndex === controllers.length - 1 && dx < 0)) {
    dx *= 0.3;
  }
  
  // Apply transform: base offset + delta px
  const baseOffset = -currentIndex * carousel.offsetWidth;
  deviceTrack.style.transform = `translateX(${baseOffset + dx}px)`;
  
  // Prevent scrolling if swiping horizontally
  if (Math.abs(dx) > 10 && e.cancelable) e.preventDefault();
}

function _endDrag(e) {
  if (!isDragging) return;
  isDragging = false;

  const finalX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
  const dx = finalX - startX;
  const threshold = carousel.offsetWidth * 0.2;

  // Restore transition
  deviceTrack.style.transition = '';

  if (Math.abs(dx) > threshold) {
    if (dx < 0 && currentIndex < controllers.length - 1) {
      goTo(currentIndex + 1);
    } else if (dx > 0 && currentIndex > 0) {
      goTo(currentIndex - 1);
    } else {
      // Snap back if at boundaries or threshold not met
      deviceTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
  } else {
    // Snap back
    deviceTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
  }
}

// Touch events
carousel.addEventListener('touchstart', _startDrag, { passive: false });
carousel.addEventListener('touchmove',  _moveDrag,  { passive: false });
carousel.addEventListener('touchend',   _endDrag);

// Mouse events
carousel.addEventListener('mousedown', _startDrag);
window.addEventListener('mousemove',   _moveDrag);
window.addEventListener('mouseup',     _endDrag);
window.addEventListener('blur',        _endDrag);

// ── Resize ────────────────────────────────────────────────────────────────────
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => controllers.forEach(c => c.resize()), 150);
});
