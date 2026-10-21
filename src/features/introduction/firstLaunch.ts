// Device-level preference: independent of accounts, sessions and demo resets.
export const INTRODUCTION_KEY = 'bora:introduction:completed';
type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};
export async function hasSeenIntroduction(storage: Storage) {
  return (await storage.getItem(INTRODUCTION_KEY)) === 'true';
}
export async function completeIntroduction(storage: Storage) {
  await storage.setItem(INTRODUCTION_KEY, 'true');
}
