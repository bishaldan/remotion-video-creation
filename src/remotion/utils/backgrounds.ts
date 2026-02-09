/**
 * Background utilities for Remotion slides
 * Supports both solid colors and CSS gradients
 */

export type BackgroundStyle = string; // "#ffffff" or "linear-gradient(135deg, #667eea, #764ba2)"

// Default gradient presets for dynamic slides
export const GRADIENT_PRESETS = {
  purpleBlue: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  darkSpace: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #2d1b4e 100%)",
  sunset: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  ocean: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  forest: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  midnight: "linear-gradient(135deg, #232526 0%, #414345 100%)",
  warmFlame: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  coolBlue: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
} as const;

/**
 * Parses a background string and returns the appropriate CSS property
 * Handles both solid colors and gradients
 */
export function parseBackground(background: string | undefined, defaultBg: string = "#0f0f1a"): React.CSSProperties {
  const bg = background || defaultBg;
  
  // Check if it's a gradient (starts with linear-gradient, radial-gradient, etc.)
  const isGradient = bg.includes("gradient");
  
  if (isGradient) {
    return { background: bg };
  }
  
  return { backgroundColor: bg };
}

/**
 * Get a random gradient preset
 */
export function getRandomGradient(): string {
  const presets = Object.values(GRADIENT_PRESETS);
  return presets[Math.floor(Math.random() * presets.length)];
}
