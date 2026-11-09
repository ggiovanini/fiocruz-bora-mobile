import { useState } from 'react';
import { Redirect } from 'expo-router';
import { Button, Copy, Flow } from '@/ui/Flow';
import { CelebrationScreen } from '@/features/celebrations/CelebrationScreen';
import { closingWord, type Celebration } from '@/features/celebrations/model';
const examples: Celebration[] = [
  { id: 'preview-goal', type: 'daily_goal_reached', occurred_at: '', payload: { title: 'Meta diária concluída!', name: '100 EV', date: '2026-11-09', description: 'Cada cuidado conta. Você completou sua meta de energia.' } },
  { id: 'preview-level', type: 'level_up', occurred_at: '', payload: { title: 'Você subiu de nível!', name: 'Nível 2', description: 'Seu cuidado está fazendo você evoluir.' } },
  { id: 'preview-medal', type: 'achievement_awarded', occurred_at: '', payload: { title: 'Você recebeu uma conquista!', name: 'Em movimento', style: 'movement', description: 'Cada passo conta.' } },
  { id: 'preview-event', type: 'event_checked_in', occurred_at: '', payload: { title: 'Presença confirmada!', name: 'Encontro Bóra', description: 'Que bom ter você neste encontro!' } },
];
export default function CelebrationPreview() {
  const [index, setIndex] = useState<number | null>(0);
  const [word, setWord] = useState('Incrível!');
  if (!__DEV__) return <Redirect href="/home"/>;
  return <Flow title="Prévia de celebrações">
    <Copy>Exemplos locais. Nenhum ponto ou conquista é concedido.</Copy>
    <Button title="Rever sequência" onPress={() => setIndex(0)}/>
    {index !== null && <CelebrationScreen key={index} item={examples[index]} word={word} busy={false} onClose={() => {
      setIndex(index + 1 < examples.length ? index + 1 : null);
      setWord(closingWord(word));
    }}/>}
  </Flow>;
}
