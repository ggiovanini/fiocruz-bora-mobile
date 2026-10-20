import { createContext, useContext, useState, type PropsWithChildren } from 'react';
const Context = createContext<{
  energy: { green: number; blue: number };
  setEnergy: React.Dispatch<React.SetStateAction<{ green: number; blue: number }>>;
  goal: number;
  setGoal: React.Dispatch<React.SetStateAction<number>>;
} | null>(null);
/** Shared, explicitly fictional preview. Activity records do not award points here. */
export function EnergyPreviewProvider({ children }: PropsWithChildren) {
  const [energy, setEnergy] = useState({ green: 40, blue: 25 });
  const [goal, setGoal] = useState(100);
  return <Context.Provider value={{ energy, setEnergy, goal, setGoal }}>{children}</Context.Provider>;
}
export function useEnergyPreview() {
  const context = useContext(Context);
  if (!context) throw new Error('EnergyPreviewProvider is required');
  return context;
}
