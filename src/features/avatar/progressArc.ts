// Both energies start at the base and travel up the left side.
const start = -Math.PI / 2;
const sweep = -Math.PI * 2;
export function progressArcs(green: number, blue: number) {
  const physical = Number.isFinite(green) ? Math.max(0, green) : 0;
  const mental = Number.isFinite(blue) ? Math.max(0, blue) : 0;
  const denominator = Math.max(100, physical + mental);
  const greenSweep = sweep * physical / denominator;
  const blueSweep = sweep * mental / denominator;
  return {
    track: {start, sweep},
    goal: {start, sweep: greenSweep + blueSweep},
    physical: {start, sweep: greenSweep},
    mental: {start, sweep: blueSweep},
  };
}
