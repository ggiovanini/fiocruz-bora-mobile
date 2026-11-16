import type { Activity } from '../../mocks/model';

const normalized = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
export function savedActivityNames(item: { code: string; name: string }, saved: { name: string; activity_type: string }[], activities: Activity[]): string[] {
  const recent = [...activities].sort((a,b) => b.createdAt.localeCompare(a.createdAt))
    .filter(row => row.status === 'confirmed' && row.validationStatus !== 'rejected' && (row.activityCode === item.code || (!row.activityCode && row.type === item.name)))
    .map(row => ({ name: row.activityName || row.type, activity_type: item.code }));
  const seen = new Set<string>();
  return [...recent, ...saved].filter(row => row.activity_type === item.code).map(row => row.name.trim()).filter(name => {
    const key = normalized(name);
    if (name.length < 2 || name.length > 80 || key === normalized(item.name) || seen.has(key)) return false;
    seen.add(key); return true;
  });
}
