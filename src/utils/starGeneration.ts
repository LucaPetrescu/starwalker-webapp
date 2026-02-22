/**
 * Star generation utilities for planetarium / star field
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Random position on the surface of a sphere (for inner dome stars)
 */
export function generateRandomSpherePosition(radius: number): { x: number; y: number; z: number } {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.sin(phi) * Math.sin(theta),
    z: radius * Math.cos(phi),
  };
}

/**
 * Star color weighted toward white/yellow with some blue and red
 */
export function generateStarColor(): { r: number; g: number; b: number } {
  const t = Math.random();
  if (t < 0.05) return { r: 0.7, g: 0.85, b: 1 };      // blue-white
  if (t < 0.15) return { r: 0.95, g: 0.95, b: 1 };     // white
  if (t < 0.35) return { r: 1, g: 0.98, b: 0.9 };      // yellow-white
  if (t < 0.65) return { r: 1, g: 0.95, b: 0.8 };      // yellow-orange
  return { r: 1, g: 0.85, b: 0.7 };                    // orange-red
}

/**
 * Random star size between min and max
 */
export function generateStarSize(minSize: number, maxSize: number): number {
  return minSize + Math.random() * (maxSize - minSize);
}
