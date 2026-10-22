const start = -Math.PI * .45;
const sweep = Math.PI * 1.9;
export function progressArcs(green: number, blue: number) {
  const physical = Number.isFinite(green) ? Math.max(0, green) : 0;
  const mental = Number.isFinite(blue) ? Math.max(0, blue) : 0;
  const denominator = Math.max(100, physical + mental);
  const greenSweep = sweep * physical / denominator;
  const blueSweep = sweep * mental / denominator;
  return {
    track: {start, sweep},
    physical: {start: start + sweep - greenSweep, sweep: greenSweep},
    mental: {start, sweep: blueSweep},
  };
}
