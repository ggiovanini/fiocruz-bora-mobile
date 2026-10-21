import { apiEnabled } from '@/api/session';
import { useMock } from '@/mocks/MockProvider';
import { createContext, useContext, useState, type PropsWithChildren } from 'react';
const Context = createContext<{
  energy: { green: number; blue: number };
  setEnergy: React.Dispatch<React.SetStateAction<{ green: number; blue: number }>>;
  goal: number;
  setGoal: React.Dispatch<React.SetStateAction<number>>;
} | null>(null);
/** Official API energy when connected; isolated fixtures only without an API configuration. */
export function EnergyPreviewProvider({ children }: PropsWithChildren) {
  const { api } = useMock();
  const [energy, setEnergy] = useState({ green: 40, blue: 25 });
  const [goal, setGoal] = useState(100);
  return <Context.Provider value={{ energy: apiEnabled ? { green: api.data.energy?.today.physical_ev ?? 0, blue: api.data.energy?.today.intellectual_ev ?? 0 } : energy, setEnergy: apiEnabled ? () => {} : setEnergy, goal: apiEnabled ? api.data.energy?.today.goal_ev ?? 100 : goal, setGoal: apiEnabled ? () => {} : setGoal }}>{children}</Context.Provider>;
}
export function useEnergyPreview() {
  const context = useContext(Context);
  if (!context) throw new Error('EnergyPreviewProvider is required');
  return context;
}
