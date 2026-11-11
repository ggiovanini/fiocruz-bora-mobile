import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { apiEnabled } from '@/api/session';
import { validateApiDraft } from '@/api/activityMapping';
import { useMock } from '@/mocks/MockProvider';
import { activityOptions, localDate, newDraft, validateDraft, type Draft } from '@/mocks/model';
import { Button, Copy, Field, Notice } from '@/ui/Flow';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { BeanImage } from './avatar/BeanImage';
import { ActivityStepScreen, activityStepStyles as s } from './activity/ActivityStepScreen';
import { recentDates, supportsEnergy, type EnergyKind } from './activity/catalog';

type Step = 'kind' | 'activity' | 'name' | 'duration' | 'when';
export default function ActivityEntry() {
  const { state, dispatch, api } = useMock();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const { group } = useLocalSearchParams<{ group?: string }>();
  const initialKind = group === 'movement' ? 'physical' : group === 'mind' ? 'intellectual' : undefined;
  const [kind, setKind] = useState<EnergyKind>(initialKind ?? state.draft?.energyDimension ?? 'physical');
  const [step, setStep] = useState<Step>(initialKind ? 'activity' : 'kind');
  const [search, setSearch] = useState('');
  const [customTime, setCustomTime] = useState(false);
  const [error, setError] = useState('');
  const draft = state.draft;
  const today = api.data.energy?.today.date ?? localDate();
  const options = apiEnabled ? api.data.catalog : activityOptions.map(item => ({ code: item.type, name: item.type, discovery_group: item.group, requires_custom_name: item.type === 'Outra atividade', energy_dimension: item.group === 'movement' ? 'physical' as const : item.group === 'mind' ? 'intellectual' as const : 'choice' as const, recording_window_days: 7 }));
  const selected = options.find(item => apiEnabled ? item.code === draft?.activityCode : item.name === draft?.type);
  const resumeKind = selected?.energy_dimension === 'physical' || selected?.energy_dimension === 'intellectual' ? selected.energy_dimension : draft?.energyDimension;
  const query = search.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const visible = options.filter(item => supportsEnergy(item, kind) && item.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query));
  useEffect(() => { if (initialKind) { setKind(initialKind); setStep('activity'); setSearch(''); } }, [initialKind]);
  function close() { if (router.canGoBack()) router.back(); else router.replace('/home'); }
  function cancel() { dispatch({ type: 'draft', value: null }); close(); }
  const back = useCallback(() => {
    setError('');
    if (step === 'kind') { if (router.canGoBack()) router.back(); else router.replace('/home'); }
    else setStep(step === 'activity' ? 'kind' : step === 'name' ? 'activity' : step === 'duration' ? selected?.requires_custom_name ? 'name' : 'activity' : 'duration');
  }, [step, selected?.requires_custom_name, router]);
  useFocusEffect(useCallback(() => { const sub = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; }); return () => sub.remove(); }, [back]));
  function update(patch: Partial<Draft>) { if (draft) dispatch({ type: 'draft', value: { ...draft, ...patch } }); setError(''); }
  function choose(item: typeof options[number]) {
    dispatch({ type: 'draft', value: { ...(draft ?? newDraft()), type: item.name, activityCode: apiEnabled ? item.code : undefined, activityName: undefined, energyDimension: kind, date: draft?.date ?? today } });
    setCustomTime(false); setError(''); setStep(item.requires_custom_name ? 'name' : 'duration');
  }
  function selectDate(date: string) {
    if (!draft) { setStep('activity'); return; }
    const value = { ...draft, date };
    const message = apiEnabled ? validateApiDraft(value, api.data.catalog, today) : validateDraft(value);
    update({date});
    if (message) { setError(message); return; }
    router.push('/review');
  }
  const titles: Record<Step,string> = { kind:'Qual atividade você fez?', activity:kind === 'physical' ? 'Atividade física' : 'Atividade mental', name:'Qual foi a atividade?', duration:'Quanto tempo?', when:'Quando aconteceu?' };
  return <ActivityStepScreen title={titles[step]} step={step === 'kind' ? 1 : step === 'activity' || step === 'name' ? 2 : step === 'duration' ? 3 : 4} onBack={back} onClose={close} footer={<Button secondary title="Cancelar" onPress={cancel}/>}>
    {step === 'kind' && <>
      {(['physical','intellectual'] as const).map(value=><Pressable key={value} accessibilityRole="button" onPress={()=>{setKind(value);setSearch('');setError('');setStep('activity');}} style={s.choice}><Icon name={value==='physical'?'activity':'book'} size={26} color={value==='physical'?colors.lime:colors.primary}/><Text style={s.label}>{value==='physical'?'Física':'Mental'}</Text><Icon name="arrow"/></Pressable>)}
      {draft?.type && resumeKind && <Button secondary title="Continuar registro" onPress={()=>{setKind(resumeKind);update({energyDimension:resumeKind});setStep('duration');}}/>}
      <View style={{flex:1,justifyContent:'flex-end',minHeight:140}}><BeanImage size={Math.min(240,height*.29)}/></View>
      <View style={{flexDirection:'row',gap:12}}><Pressable accessibilityRole="button" accessibilityLabel="Registrar presença em evento" onPress={()=>router.push('/events')} style={[s.choice,{flex:1,minHeight:54,padding:12}]}><Icon name="qr"/><Text style={[s.hint,{color:colors.text}]}>Evento</Text></Pressable></View>
    </>}
    {step === 'activity' && <>
      <Field label="Buscar atividade" value={search} onChangeText={setSearch} placeholder="O que você fez?"/>
      {apiEnabled && api.busy && !options.length && <Copy muted>Carregando atividades…</Copy>}
      {visible.map(item=><Pressable key={item.code} accessibilityRole="button" onPress={()=>choose(item)} style={s.choice}><Text style={s.label}>{item.name}</Text><Icon name="arrow" size={20}/></Pressable>)}
      {!visible.length && !api.busy && <><Notice>Nenhuma atividade disponível para esta busca.</Notice>{apiEnabled && <Button secondary title="Atualizar atividades" onPress={()=>{void api.refresh().catch(()=>setError('Não foi possível atualizar as atividades.'));}}/>}</>}
    </>}
    {step === 'name' && <><Field label="Nome da atividade" value={draft?.activityName ?? ''} maxLength={80} onChangeText={activityName=>update({activityName})} placeholder="O que você fez?"/><Button title="Continuar" onPress={()=>{if(!draft?.activityName || draft.activityName.trim().length<2){setError('Informe um nome com pelo menos 2 caracteres.');return;}setError('');setStep('duration');}}/></>}
    {step === 'duration' && <>
      <Text style={s.hint}>{draft?.activityName || draft?.type}</Text>
      <View style={s.grid}>{[10,20,30,45,60,90].map(minutes=><Pressable key={minutes} accessibilityRole="button" accessibilityLabel={`${minutes} minutos`} onPress={()=>{update({minutes:String(minutes)});setStep('when');}} style={s.option}><Text style={s.value}>{minutes} min</Text></Pressable>)}</View>
      <Pressable accessibilityRole="button" onPress={()=>setCustomTime(true)} style={s.link}><Text style={s.hint}>Outro tempo</Text></Pressable>
      {customTime && <><Field label="Minutos" value={draft?.minutes ?? ''} keyboardType="number-pad" maxLength={4} onChangeText={minutes=>update({minutes})}/><Button title="Continuar" onPress={()=>{if(!draft || !/^\d+$/.test(draft.minutes) || +draft.minutes<1 || +draft.minutes>1440){setError('Informe de 1 a 1440 minutos.');return;}setError('');setStep('when');}}/></>}
    </>}
    {step === 'when' && <>
      <Text style={s.hint}>{draft?.activityName || draft?.type} · {draft?.minutes} min</Text>
      {recentDates(today,selected?.recording_window_days ?? 7).map((date,index)=><Pressable key={date} accessibilityRole="button" onPress={()=>selectDate(date)} style={[s.choice,{minHeight:60}]}><Text style={s.label}>{index===0?'Hoje':index===1?'Ontem':new Date(`${date}T12:00:00Z`).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',timeZone:'UTC'})}</Text><Icon name="arrow" size={18}/></Pressable>)}
    </>}
    {!!error && <Notice>{error}</Notice>}
    {apiEnabled && !!api.error && step === 'activity' && <Notice>{api.error}</Notice>}
  </ActivityStepScreen>;
}
