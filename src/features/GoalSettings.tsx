import { useToast } from '@/ui/Toast';
import { GoalSlider } from './GoalSlider';
import { clampDailyGoal, MIN_DAILY_GOAL, MAX_DAILY_GOAL } from './goalRange';
import { useRouter } from 'expo-router';
import { Sheet } from '@/ui/Sheet';
import { apiEnabled } from '@/api/session';
import { useEnergyPreview } from './avatar/EnergyPreview';
import { useState, useRef } from 'react';
import { Button, Copy, Notice } from '@/ui/Flow';
import { useMock } from '@/mocks/MockProvider';
export default function GoalSettings() {
  const { api } = useMock();
  const router=useRouter();
  const toast=useToast();
  const saving=useRef(false);
  const summary = api.data.energy;
  const preview = useEnergyPreview();
  const [goal, setGoal] = useState(() => clampDailyGoal(summary?.scheduled_goal?.goal_ev ?? summary?.today.goal_ev ?? preview.goal));
  const initialGoal = useRef(goal);
  const currentGoal = summary?.today.goal_ev ?? preview.goal;
  const canSave = goal !== initialGoal.current && goal !== currentGoal && goal !== summary?.scheduled_goal?.goal_ev;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  function close() {
    if (saving.current) return;
    if (router.canGoBack()) router.back(); else router.replace('/home');
  }
  return <Sheet visible title="Minha meta diária" onClose={close}>
    <Copy>{apiEnabled ? 'Sua nova meta entra em vigor amanhã.' : 'Meta da demonstração.'}</Copy>
    <Copy muted>Meta de hoje: {summary?.today.goal_ev ?? preview.goal} EV</Copy>
    {summary?.scheduled_goal && <Notice>Meta agendada: {summary.scheduled_goal.goal_ev} EV a partir de {summary.scheduled_goal.effective_from.split('-').reverse().join('/') }.</Notice>}
    <GoalSlider value={goal} onChange={value => { setGoal(value); setMessage(''); }} disabled={busy} />
    {!!message && <Notice>{message}</Notice>}
    <Button title="Salvar nova meta" busy={busy} disabled={busy || !canSave} onPress={async () => {
      if(saving.current || !canSave)return;
      if (!Number.isInteger(goal) || goal < MIN_DAILY_GOAL || goal > MAX_DAILY_GOAL) { setMessage(`Escolha uma meta entre ${MIN_DAILY_GOAL} e ${MAX_DAILY_GOAL} EV.`); return; }
      if (!apiEnabled) { preview.setGoal(goal); close(); toast('Meta atualizada na demonstração.'); return; }
      saving.current=true;setBusy(true); setMessage('');
      try { const result = await api.saveGoal(goal); saving.current=false; close(); toast(`Nova meta de ${result.goal_ev} EV agendada para amanhã.`); }
      catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
      finally { saving.current=false;setBusy(false); }
    }} />
    <Button title="Manter a meta atual" secondary disabled={busy || !summary?.scheduled_goal} onPress={async () => {
      if(saving.current || !summary?.scheduled_goal)return;
      if(!apiEnabled){close();return;}
      saving.current=true;setBusy(true);setMessage('');
      try { await api.cancelGoal(); saving.current=false;close();toast('Meta atual mantida. Nenhuma alteração agendada.'); }
      catch(error){setMessage(error instanceof Error ? error.message : 'Não foi possível cancelar a alteração de meta.');}
      finally{saving.current=false;setBusy(false);}
    }} />
  </Sheet>;
}
