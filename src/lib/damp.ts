// Exponential damping, ported from THREE.MathUtils.damp so scalar easing
// (video scrub position, degree indicator) doesn't need `three` as a dependency.
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
