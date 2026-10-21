export type Cursor = {id: string; created_at: string};
// API ordering uses created_at then UUID, including messages created in the same second.
export function isNewNotice(previous: Cursor | null, next: Cursor | null): next is Cursor {
  if (!next) return false;
  if (!previous) return true;
  const delta = Date.parse(next.created_at) - Date.parse(previous.created_at);
  return delta > 0 || (delta === 0 && next.id > previous.id);
}
