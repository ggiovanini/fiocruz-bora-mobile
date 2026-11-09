import { Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Sheet } from '@/ui/Sheet';
import { apiEnabled } from '@/api/session';
import { useEnergyPreview } from './avatar/EnergyPreview';
import { useState, useRef } from 'react';
import { Button, Copy, Field, Notice } from '@/ui/Flow';
import { useMock } from '@/mocks/MockProvider';
export default function GoalSettings() {
  const { api } = useMock();
  const router=useRouter();
  const saving=useRef(false);
  const summary = api.data.energy;
  const preview = useEnergyPreview();
  const [goal, setGoal] = useState(String(summary?.scheduled_goal?.goal_ev ?? summary?.today.goal_ev ?? preview.goal));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return <Sheet visible title="Minha meta diária" avoidKeyboard onClose={()=>{Keyboard.dismiss();if(router.canGoBack())router.back();else router.replace('/home');}}>
    <Copy>{apiEnabled ? 'Sua nova meta entra em vigor amanhã.' : 'Meta da demonstração.'}</Copy>
    <Copy muted>Meta de hoje: {summary?.today.goal_ev ?? preview.goal} EV</Copy>
    {summary?.scheduled_goal && <Notice>Meta agendada: {summary.scheduled_goal.goal_ev} EV a partir de {summary.scheduled_goal.effective_from.split('-').reverse().join('/') }.</Notice>}
    <Field label="Meta em EV por dia" value={goal} onChangeText={setGoal} keyboardType="number-pad" maxLength={10} editable={!busy} />
    {!!message && <Notice>{message}</Notice>}
    <Button title="Salvar meta" busy={busy} onPress={async () => {
      if(saving.current)return;
      if (!/^\d+$/.test(goal) || Number(goal) < 1 || Number(goal) > 2147483647) { setMessage('Informe uma meta inteira maior que zero.'); return; }
      if (!apiEnabled) { preview.setGoal(Number(goal)); setMessage('Meta atualizada na demonstração.'); return; }
      saving.current=true;Keyboard.dismiss();setBusy(true); setMessage('');
      try { const result = await api.saveGoal(Number(goal)); setMessage(`Meta de ${result.goal_ev} EV agendada para amanhã.`); }
      catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
      finally { saving.current=false;setBusy(false); }
    }} />
  </Sheet>;
}
