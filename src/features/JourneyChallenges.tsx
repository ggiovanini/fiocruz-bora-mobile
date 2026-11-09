import { useState } from 'react';
import { useRouter } from 'expo-router';
import { apiEnabled } from '@/api/session';
import { ListScreen } from '@/ui/ListScreen';
import { Notice } from '@/ui/Flow';
import Challenges from './Challenges';
import { ChallengeCard, ChallengeDetail } from './challenges/ChallengeViews';
import type { Challenge } from './challenges/model';
import { useEnergyPreview } from './avatar/EnergyPreview';
import { dailyEnergy } from './avatar/energy';
import { useToday } from './constancy/useToday';
function PreviewChallenges() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { energy, goal } = useEnergyPreview();
  const today = useToday();
  const daily = dailyEnergy(energy.green,energy.blue,goal);
  const challenge: Challenge = { id:'preview-daily',title:'Sua meta de hoje',description:'Combine atividades físicas e mentais do seu jeito para completar a meta diária.',metric:'ev',target:goal,progress:daily.total,progress_percent:daily.progress,starts_on:today,ends_on:today,activity_type:null,activity_name:null,period_status:'active',completed:daily.complete,medal:null };
  return <ListScreen title="Desafios" icon="target" back={false}>
    <Notice>Demonstração · exemplo de meta diária</Notice>
    <ChallengeCard challenge={challenge} onPress={()=>setOpen(true)}/>
    <ChallengeDetail illustrative challenge={open ? challenge : undefined} onClose={()=>setOpen(false)} onRegister={()=>{setOpen(false);router.push('/activity');}}/>
  </ListScreen>;
}
export default function JourneyChallenges() { return apiEnabled ? <Challenges/> : <PreviewChallenges/>; }
