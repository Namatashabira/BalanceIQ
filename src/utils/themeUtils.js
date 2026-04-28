/**
 * Calculate relative luminance of a color
 * Used to determine if text should be light or dark
 */
export function getRelativeLuminance(hexColor) {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Apply gamma correction
  const rLin = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLin = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLin = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Compute the WCAG contrast ratio between two colors
 */
export function getContrastRatio(hexColorA, hexColorB) {
  const lumA = getRelativeLuminance(hexColorA);
  const lumB = getRelativeLuminance(hexColorB);
  const [lighter, darker] = lumA > lumB ? [lumA, lumB] : [lumB, lumA];
  return (lighter + 0.05) / (darker + 0.05);
}

// Convert HEX -> HSL so we can nudge lightness for contrast fixes
function hexToHsl(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substr(0, 2), 16) / 255;
  const g = parseInt(clean.substr(2, 2), 16) / 255;
  const b = parseInt(clean.substr(4, 2), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;

  if (d === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  h /= 6;
  return { h, s, l };
}

// Convert HSL -> HEX
function hslToHex(h, s, l) {
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  const toHex = (x) => {
    const v = Math.round(x * 255);
    return v.toString(16).padStart(2, '0');
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Lighten/darken a color by delta (-1..1) on the lightness channel
function adjustLightness(hex, delta) {
  const { h, s, l } = hexToHsl(hex);
  const nextL = Math.min(1, Math.max(0, l + delta));
  return hslToHex(h, s, nextL);
}

// Try to ensure a color stays distinct against all provided backgrounds
function ensureDistinctAgainstSurfaces(hexColor, backgrounds, fallback, minContrast = 3.2) {
  if (!hexColor) return fallback;

  const attempts = [
    hexColor,
    adjustLightness(hexColor, -0.25),
    adjustLightness(hexColor, -0.18),
    adjustLightness(hexColor, -0.12),
    adjustLightness(hexColor, -0.06),
    adjustLightness(hexColor, 0.08),
    adjustLightness(hexColor, 0.14),
    adjustLightness(hexColor, 0.2)
  ];

  for (const candidate of attempts) {
    const ok = backgrounds.every((bg) => getContrastRatio(candidate, bg) >= minContrast);
    if (ok) return candidate;
  }
  return fallback;
}

/**
 * Ensure a theme color has enough contrast against the page background
 * Falls back to a default palette color when the chosen color is too light
 */
export function ensureReadableColor(hexColor, background = '#f3f4f6', fallback = '#3B82F6', minContrast = 2.8) {
  if (!hexColor) return fallback;
  const ratio = getContrastRatio(hexColor, background);
  return ratio < minContrast ? fallback : hexColor;
}

/**
 * Determine if a color is light or dark
 * Returns true if the color is light (needs dark text)
 */
export function isLightColor(hexColor) {
  const luminance = getRelativeLuminance(hexColor);
  // WCAG threshold is 0.5, but we use 0.6 for better readability
  return luminance > 0.6;
}

/**
 * Get appropriate text color for a background
 * Returns '#1f2937' (dark gray) for light backgrounds
 * Returns '#ffffff' (white) for dark backgrounds
 */
export function getTextColorForBackground(backgroundColor) {
  return isLightColor(backgroundColor) ? '#1f2937' : '#ffffff';
}

/**
 * Apply theme colors with appropriate text contrast
 */
export function applyThemeColors(primary, secondary, accent) {
  const root = document.documentElement;

  const surfaces = {
    page: '#f3f4f6',
    card: '#ffffff',
    muted: '#f9fafb',
    border: '#e5e7eb',
    textStrong: '#111827',
    textSubtle: '#4b5563'
  };

  // Prevent near-invisible themes by enforcing contrast against all major surfaces
  const safePrimary = ensureDistinctAgainstSurfaces(primary, [surfaces.page, surfaces.card], '#3B82F6');
  const safeSecondary = ensureDistinctAgainstSurfaces(secondary, [surfaces.page, surfaces.card], '#10B981');
  const safeAccent = ensureDistinctAgainstSurfaces(accent, [surfaces.page, surfaces.card], '#8B5CF6');

  // Base surfaces/text/borders that keep cards and backgrounds distinct
  root.style.setProperty('--surface-page', surfaces.page);
  root.style.setProperty('--surface-card', surfaces.card);
  root.style.setProperty('--surface-muted', surfaces.muted);
  root.style.setProperty('--border-subtle', surfaces.border);
  root.style.setProperty('--text-strong', surfaces.textStrong);
  root.style.setProperty('--text-subtle', surfaces.textSubtle);
  
  // Set CSS variables
  root.style.setProperty('--color-primary', safePrimary);
  root.style.setProperty('--color-secondary', safeSecondary);
  root.style.setProperty('--color-accent', safeAccent);
  
  // Calculate and set text colors for each theme color
  root.style.setProperty('--color-primary-text', getTextColorForBackground(safePrimary));
  root.style.setProperty('--color-secondary-text', getTextColorForBackground(safeSecondary));
  root.style.setProperty('--color-accent-text', getTextColorForBackground(safeAccent));
  
  // Set contrasting colors for better visibility
  root.style.setProperty('--color-on-primary', getTextColorForBackground(safePrimary));
  root.style.setProperty('--color-on-secondary', getTextColorForBackground(safeSecondary));
  root.style.setProperty('--color-on-accent', getTextColorForBackground(safeAccent));
  
  // Set chart color variables
  root.style.setProperty('--chart-color-1', safePrimary);
  root.style.setProperty('--chart-color-2', safeSecondary);
  root.style.setProperty('--chart-color-3', safeAccent);
  root.style.setProperty('--chart-grid-color', '#E5E7EB');
  root.style.setProperty('--chart-axis-color', '#6B7280');
  root.style.setProperty('--chart-text-color', '#374151');
}

/**
 * Get theme colors for charts/graphs
 * Returns an array of colors suitable for multi-series charts
 */
export function getChartColors() {
  const root = getComputedStyle(document.documentElement);
  return [
    root.getPropertyValue('--chart-color-1').trim() || '#3B82F6',
    root.getPropertyValue('--chart-color-2').trim() || '#10B981',
    root.getPropertyValue('--chart-color-3').trim() || '#8B5CF6',
    root.getPropertyValue('--chart-color-4').trim() || '#F59E0B',
    root.getPropertyValue('--chart-color-5').trim() || '#EF4444',
    root.getPropertyValue('--chart-color-6').trim() || '#14B8A6',
    root.getPropertyValue('--chart-color-7').trim() || '#8B5CF6',
    root.getPropertyValue('--chart-color-8').trim() || '#F97316',
  ];
}

/**
 * Get theme color palette object for chart libraries
 */
export function getChartTheme() {
  const root = getComputedStyle(document.documentElement);
  return {
    primary: root.getPropertyValue('--color-primary').trim() || '#3B82F6',
    secondary: root.getPropertyValue('--color-secondary').trim() || '#10B981',
    accent: root.getPropertyValue('--color-accent').trim() || '#8B5CF6',
    colors: getChartColors(),
    textColor: '#374151', // Always use dark gray for chart text
    gridColor: '#E5E7EB', // Light gray for grid lines
    axisColor: '#6B7280', // Medium gray for axis
  };
}
