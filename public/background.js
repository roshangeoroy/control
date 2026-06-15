const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

let grid = [];
let cols = 0;
let rows = 0;
let colorPalette = []; // Will be populated from CSS

const cellSize = 10; 
const pixelSize = 10;

/**
 * Helper function to read colors from CSS variables.
 * Assumes variables are named --palette-color-1, --palette-color-2, etc.
 */
function getColorsFromCSS() {
  const rootStyles = getComputedStyle(document.documentElement);
  const colors = [];
  let i = 1;
  while (true) {
    const color = rootStyles.getPropertyValue(`--palette-color-${i}`).trim();
    if (color) {
      colors.push(color);
      i++;
    } else {
      break;
    }
  }
  return colors;
}

/**
 * 1. Init the grid
 * We use Math.ceil + 2 to ensure the grid always OVERFLOWS the screen slightly.
 * This prevents the "Reverse L" empty space at the edges.
 */
function initGrid() {
  // Populate the color palette from CSS only once
  if (colorPalette.length === 0) {
    colorPalette = getColorsFromCSS();
    if (colorPalette.length === 0) {
      console.error("No colors found in CSS palette variables (--palette-color-X).");
      // Fallback to a default if no colors are defined
      colorPalette = ['#FFFFFF']; 
    }
  }

  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.width = w;
  canvas.height = h;

  // Create enough cells to cover the screen plus a small buffer
  cols = Math.ceil(w / cellSize) + 2;
  rows = Math.ceil(h / cellSize) + 2;

  grid = new Array(rows).fill(0).map(() => new Array(cols).fill(0).map(() => {
    if (Math.random() > 0.9) { // ~10% chance to have a pixel initially
      return {
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        alpha: 0
      };
    }
    return null;
  }));
}

/**
 * 2. Update state of the grid
 * This is where the twinkling logic is applied.
 */
function updateGrid() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const pixel = grid[y][x];

      if (pixel) {
        // Decrease alpha for existing pixels
        pixel.alpha -= 0.005; // Fade out slowly

        // If alpha drops too low, remove the pixel
        if (pixel.alpha <= 0) {
          grid[y][x] = null;
        }
      } else {
        // Randomly make new pixels appear (pop to alpha = 1)
        if (Math.random() > 0.99999) { // Very low chance for a new pixel to appear
          grid[y][x] = {
            color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
            alpha: 1.0 // Pop to full brightness
          };
        }
      }
    }
  }
}

/**
 * 3. Provide loop that updates the grid
 */
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateGrid();
  
  // Calculate margins to center the overflowed grid
  const totalGridWidth = cols * cellSize;
  const totalGridHeight = rows * cellSize;
  const marginX = (canvas.width - totalGridWidth) / 2;
  const marginY = (canvas.height - totalGridHeight) / 2;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const pixel = grid[y][x];
      if (pixel && pixel.alpha > 0) { // Only draw if pixel exists and is visible
        // Position the pixel in the center of its cell
        const drawX = marginX + (x * cellSize) + (cellSize / 2) - (pixelSize / 2);
        const drawY = marginY + (y * cellSize) + (cellSize / 2) - (pixelSize / 2);
        
        // Use rgba with the pixel's alpha
        ctx.fillStyle = `${pixel.color}${Math.floor(pixel.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fillRect(drawX, drawY, pixelSize, pixelSize);
      }
    }
  }

  requestAnimationFrame(loop);
}

window.addEventListener('resize', initGrid);
initGrid();
loop();