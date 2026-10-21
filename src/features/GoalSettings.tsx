import { useState } from 'react';
import { Button, Copy, Field, Flow, Notice } from '@/ui/Flow';
import { useMock } from '@/mocks/MockProvider';
export default function GoalSettings() {
  const { api } = useMock();
  const summary = api.data.energy;
  const [goal, setGoal] = useState(String(summary?.scheduled_goal?.goal_ev ?? summary?.today.goal_ev ?? 100));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return <Flow title="Minha meta diária">
    <Copy>Uma meta para movimento e mente. Sua nova escolha entra em vigor amanhã.</Copy>
    <Copy muted>Meta de hoje: {summary?.today.goal_ev ?? '—'} EV</Copy>
    {summary?.scheduled_goal && <Notice>Meta agendada: {summary.scheduled_goal.goal_ev} EV a partir de {summary.scheduled_goal.effective_from.split('-').reverse().join('/') }.</Notice>}
    <Field label="Meta em EV por dia" value={goal} onChangeText={setGoal} keyboardType="number-pad" maxLength={10} />
    {!!message && <Notice>{message}</Notice>}
    <Button title="Salvar meta" busy={busy} onPress={async () => {
      if (!/^\d+$/.test(goal) || Number(goal) < 1 || Number(goal) > 2147483647) { setMessage('Informe uma meta inteira maior que zero.'); return; }
      setBusy(true); setMessage('');
      try { const result = await api.saveGoal(Number(goal)); setMessage(`Meta de ${result.goal_ev} EV agendada para amanhã.`); }
      catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
      finally { setBusy(false); }
    }} />
  </Flow>;
}
