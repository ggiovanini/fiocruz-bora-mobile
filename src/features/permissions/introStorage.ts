export const permissionIntroKey = 'bora:permission-explanations:v1';
export type PermissionStep = 'notifications' | 'camera' | 'health';
export type PermissionChoices = Partial<Record<PermissionStep, boolean>>;
type Storage = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void> };
export async function readPermissionChoices(storage: Storage): Promise<PermissionChoices> {
  const raw = await storage.getItem(permissionIntroKey);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return { notifications: parsed?.notifications === true, camera: parsed?.camera === true, health: parsed?.health === true };
  } catch { return {}; }
}
export function nextPermissionStep(choices: PermissionChoices): PermissionStep | null {
  return !choices.notifications ? 'notifications' : !choices.camera ? 'camera' : !choices.health ? 'health' : null;
}
/** Save the explanation decision separately from OS authorization: “later” also counts as seen. */
export async function finishPermissionExplanation(storage: Storage, step: PermissionStep): Promise<PermissionChoices> {
  const choices = { ...await readPermissionChoices(storage), [step]: true };
  await storage.setItem(permissionIntroKey, JSON.stringify(choices));
  return choices;
}
