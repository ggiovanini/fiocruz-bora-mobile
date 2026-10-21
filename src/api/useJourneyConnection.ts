import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useRef, useState, type MutableRefObject } from 'react';
import { Platform } from 'react-native';
import { initialState, restoreState, type Activity, type Draft, type MockState } from '../mocks/model';
import { apiRequest, clearApiSession, loginForTesting, ApiError } from './session';
import { emptyJourney, type JourneySnapshot, type ServerActivity } from './contracts';
import { fromServer, mergeActivities, prepareActivity, uuid } from './activityMapping';

export const journeyStorageKey = (user: string, membership?: string) => `bora:api:v1:${user}:${membership ?? 'none'}`;
export function useJourneyConnection(current: MutableRefObject<MockState>, commit: (state: MockState) => void, writes: MutableRefObject<Promise<void>>) {
  const [data, setData] = useState<JourneySnapshot>(emptyJourney);
  const dataRef = useRef(data);
  const generation = useRef(0);
  const sequence = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sending = useRef(false);
  const closing = useRef(false);
  const update = (next: JourneySnapshot) => { dataRef.current = next; setData(next); };
  const valid = (token: number) => token === generation.current;
  const installation = async (user: string) => {
    const key = `bora:installation:v1:${user}`;
    let id = await AsyncStorage.getItem(key);
    if (!id) { id = uuid(); await AsyncStorage.setItem(key, id); }
    return id;
  };
  const connect = useCallback(async (userId: string, selected?: string) => {
    let token = generation.current;
    const request = ++sequence.current;
    setBusy(true); setError('');
    try {
      const [profile, memberships, energy, catalog] = await Promise.all([
        apiRequest('/me'), apiRequest('/me/memberships'), apiRequest('/me/energy'), apiRequest('/activity-types'),
      ]);
      if (!valid(token) || request !== sequence.current) return;
      if (profile.data.id !== userId) throw new Error('A conta mudou. Entre novamente.');
      const remembered = selected ?? await AsyncStorage.getItem(`bora:membership:v1:${userId}`) ?? undefined;
      const member = memberships.data.find((m: { id: string }) => m.id === remembered)
        ?? (memberships.data.length === 1 ? memberships.data[0] : undefined);
      const switched = current.current.userId !== userId || current.current.membershipId !== member?.id;
      const raw = switched ? await AsyncStorage.getItem(journeyStorageKey(userId, member?.id)) : null;
      const local = switched ? restoreState(raw) : current.current;
      let consent = null;
      let history: { data: ServerActivity[]; next_cursor: string | null } = { data: [], next_cursor: null };
      if (member) {
        [consent, history] = await Promise.all([
          apiRequest(`/memberships/${member.id}/consents/activity-recording`).then(result => result.data),
          apiRequest(`/memberships/${member.id}/activities?per_page=20`),
        ]);
        if (!valid(token) || request !== sequence.current) return;
        await AsyncStorage.setItem(`bora:membership:v1:${userId}`, member.id);
      }
      if (!valid(token) || request !== sequence.current) return;
      if (switched) token = ++generation.current;
      else if (dataRef.current.energy) {
        const days = new Map(dataRef.current.energy.days.map(day => [day.date, day]));
        for (const day of energy.data.days) days.set(day.date, day);
        energy.data.days = [...days.values()];
      }
      update({ profile: profile.data, memberships: memberships.data, catalog: catalog.data, energy: energy.data, consent, nextCursor: history.next_cursor });
      const latestLocal = switched ? local : current.current;
      commit({ ...initialState, ...latestLocal, userId, membershipId: member?.id, session: 'active',
        name: profile.data.display_name, organization: member?.organization_name ?? '', offline: false, failNext: false,
        accepted: consent?.status === 'granted', profileComplete: !!profile.data.display_name?.trim(),
        activities: mergeActivities(latestLocal.activities, history.data),
      });
      const id = await installation(userId);
      if (!valid(token)) return;
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await apiRequest(`/me/installations/${id}`, { method: 'PUT', body: JSON.stringify({ platform: Platform.OS }) });
      }
    } catch (failure) {
      if (valid(token)) setError(failure instanceof Error ? failure.message : 'Não foi possível carregar sua jornada.');
      throw failure;
    } finally { if (request === sequence.current) setBusy(false); }
  }, []);
  const refresh = async () => { if (current.current.userId) await connect(current.current.userId, current.current.membershipId); };
  const login = async () => {
    closing.current = false;
    generation.current++; update(emptyJourney); setError('');
    const user = await loginForTesting();
    await connect(user.id);
  };
  const selectMembership = async (id: string) => {
    if (!current.current.userId || !dataRef.current.memberships.some(member => member.id === id)) throw new Error('Vínculo indisponível.');
    generation.current++;
    await connect(current.current.userId, id);
  };
  const acceptConsent = async (granted = true) => {
    setError('');
    const { membershipId } = current.current;
    const policy = dataRef.current.consent;
    if (!membershipId || !policy?.configured || !policy.policy_version) throw new Error('O termo de participação ainda não está disponível.');
    const token = generation.current;
    const result = await apiRequest(`/memberships/${membershipId}/consents/activity-recording`, {
      method: 'PUT', body: JSON.stringify({ policy_version: policy.policy_version, status: granted ? 'granted' : 'revoked' }),
    });
    if (!valid(token)) return;
    update({ ...dataRef.current, consent: result.data });
    commit({ ...current.current, accepted: result.data.status === 'granted' });
  };
  const saveProfile = async (name: string) => {
    setError('');
    const token = generation.current;
    const result = await apiRequest('/me', { method: 'PATCH', body: JSON.stringify({ display_name: name.trim() }) });
    if (!valid(token)) return;
    update({ ...dataRef.current, profile: result.data });
    commit({ ...current.current, name: result.data.display_name, profileComplete: true });
  };
  const saveGoal = async (goal: number) => {
    setError('');
    const token = generation.current;
    const result = await apiRequest('/me/energy/goal', { method: 'PUT', body: JSON.stringify({ goal_ev: goal }) });
    if (valid(token) && dataRef.current.energy) update({ ...dataRef.current, energy: { ...dataRef.current.energy, scheduled_goal: result.data } });
    return result.data as { goal_ev: number; effective_from: string };
  };
  const enqueue = async (draft: Draft) => {
    const s = current.current;
    if (!s.membershipId || !s.accepted || !dataRef.current.energy) throw new Error('Confirme sua participação antes de registrar atividades.');
    const activity = prepareActivity(draft, dataRef.current.catalog, s.membershipId, dataRef.current.energy.today.date);
    commit({ ...s, draft: null, activities: [activity, ...s.activities] });
    // A request must never leave the device before both UUIDs and its exact payload are durable.
    try { await writes.current; }
    catch {
      commit({ ...current.current, draft, activities: current.current.activities.filter(row => row.id !== activity.id) });
      throw new Error('Não foi possível salvar no aparelho. Seu rascunho foi preservado.');
    }
    return activity.id;
  };
  const send = async (activity: Activity): Promise<void> => {
    const s = current.current;
    if (closing.current || sending.current || s.offline || !s.accepted || s.session !== 'active' || !activity.apiPayload || !activity.operationKey || activity.membershipId !== s.membershipId) return;
    const token = generation.current;
    sending.current = true;
    const patch = (changes: Partial<Activity>) => {
      if (valid(token)) commit({ ...current.current, activities: current.current.activities.map(row => row.id === activity.id ? { ...row, ...changes } : row) });
    };
    try {
      await writes.current;
      if (!valid(token)) return;
      patch({ status: 'sending', error: undefined });
      const result = await apiRequest(`/memberships/${activity.membershipId}/activities`, {
        method: 'POST', headers: { 'Idempotency-Key': activity.operationKey }, body: JSON.stringify(activity.apiPayload),
      });
      if (!valid(token)) return;
      patch({ ...fromServer(result.data) });
      // A successful post remains successful even when refreshing the summary fails.
      await refresh().catch(() => {});
    } catch (failure) {
      patch({ status: 'failed', error: failure instanceof Error ? failure.message : 'Não foi possível enviar. Tente novamente.' });
      if (failure instanceof ApiError && failure.status === 403) {
        await refresh().catch(() => {});
      }
    } finally {
      sending.current = false;
      // A refresh may render while this request still owns the queue lock.
      // Drain the next durable item explicitly rather than relying on another render.
      const state = current.current;
      const next = state.activities.find(row => row.status === 'pending' && row.apiPayload && row.operationKey && row.membershipId === state.membershipId);
      if (!closing.current && next && state.session === 'active' && state.accepted && !state.offline) void send(next);
    }
  };
  const loadMore = async () => {
    const { membershipId } = current.current;
    const cursor = dataRef.current.nextCursor;
    if (!membershipId || !cursor || busy) return;
    const token = generation.current;
    setBusy(true);
    try {
      const page = await apiRequest(`/memberships/${membershipId}/activities?per_page=20&cursor=${encodeURIComponent(cursor)}`);
      if (!valid(token)) return;
      commit({ ...current.current, activities: mergeActivities(current.current.activities, page.data) });
      update({ ...dataRef.current, nextCursor: page.next_cursor });
    } catch (failure) {
      if (valid(token)) setError(failure instanceof Error ? failure.message : 'Não foi possível carregar o histórico.');
      throw failure;
    } finally { setBusy(false); }
  };
  const loadEnergyMonth = async (month: string) => {
    const summary = dataRef.current.energy;
    if (!summary || month > summary.today.date.slice(0, 7)) return;
    const from = `${month}-01`;
    const last = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
    const to = [`${month}-${last}`, summary.today.date].sort()[0];
    const token = generation.current;
    const result = await apiRequest(`/me/energy?from=${from}&to=${to}`);
    if (!valid(token) || !dataRef.current.energy) return;
    const days = new Map(dataRef.current.energy.days.map(day => [day.date, day]));
    for (const day of result.data.days) days.set(day.date, day);
    update({ ...dataRef.current, energy: { ...dataRef.current.energy, days: [...days.values()] } });
  };
  const logout = async () => {
    closing.current = true;
    generation.current++; sequence.current++; setBusy(true);
    const user = current.current.userId;
    try {
      if (user) await apiRequest('/auth/logout', { method: 'POST', body: JSON.stringify({ installation_id: await installation(user) }) });
    } catch { /* Local logout remains possible without a network connection. */ }
    finally {
      await clearApiSession(); update(emptyJourney); setError('');
      commit({ ...initialState }); setBusy(false);
    }
  };
  const expire = () => {
    closing.current = true;
    generation.current++; sequence.current++;
    update(emptyJourney); setBusy(false);
    commit({ ...current.current, session: 'expired', accepted: false });
  };
  return { data, busy, error, connect, login, selectMembership, acceptConsent, saveProfile, saveGoal, enqueue, send, refresh, loadMore, loadEnergyMonth, logout, expire };
}
