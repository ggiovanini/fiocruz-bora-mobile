import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Copy, Field, Flow, Notice } from '@/ui/Flow';
import { ActionRow, Chip, activityStyles as ui } from '@/components/ActivityUI';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { useMock } from '@/mocks/MockProvider';
import { activityOptions, activityTitle, localDate, newDraft, validateDraft } from '@/mocks/model';
import { missions } from '@/mocks/catalog';
function yesterday() { const date = new Date(); date.setDate(date.getDate() - 1); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export default function ActivityEntry() {
  const { state, dispatch } = useMock();
  const router = useRouter();
  const [editing, setEditing] = useState(!!state.draft);
  const [choosing, setChoosing] = useState(!state.draft?.type);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [customDate, setCustomDate] = useState(false);
  const [error, setError] = useState('');
  const draft = state.draft;
  const update = (value: Partial<NonNullable<typeof draft>>) => {
    if (draft) dispatch({ type: 'draft', value: { ...draft, ...value } });
    setError('');
  };
  if (!editing || !draft) return <Flow key="entry" title="Cada momento conta.">
    <Copy muted>Uma caminhada, uma leitura, uma pausa. Escolha como trazer esse momento para a sua jornada.</Copy>
    <View style={s.energyNote}><View style={[s.dot,{backgroundColor:colors.lime}]} /><View style={[s.dot,{backgroundColor:colors.primary}]} /><Text style={s.energyText}>Dois caminhos para a mesma Energia Vital.</Text></View>
    {draft && <View style={s.resume}><Text style={ui.heading}>Você tem um rascunho</Text><Text style={ui.muted}>{activityTitle(draft) || 'Atividade ainda não escolhida'}</Text><Button title="Continuar meu registro" onPress={() => setEditing(true)} /></View>}
    <View style={{ marginTop: 12 }}>
      <Text style={ui.eyebrow}>Como você quer registrar?</Text>
      <ActionRow icon="edit" title="Registrar por conta própria" description="Escolha uma atividade e conte quanto tempo dedicou." color={colors.lime} onPress={() => { if (!draft) dispatch({ type: 'draft', value: { ...newDraft(), type: '' } }); setEditing(true); if (!draft) setChoosing(true); }}/>
      <ActionRow icon="phone" title="Trazer dados do aparelho" description="Consulte passos e treinos. Você controla a conexão." onPress={() => router.push('/health')}/>
      <ActionRow icon="qr" title="Participar de um evento" description="Encontre um evento e registre sua presença." onPress={() => router.push('/events')}/>
    </View>
    <View style={s.discovery}><Text style={ui.heading}>Ainda procurando inspiração?</Text><Text style={ui.muted}>Descubra conteúdos para aprender, desacelerar e cuidar de você.</Text><Pressable accessibilityRole="button" onPress={() => router.push('/content')} style={s.textLink}><Text style={s.textLinkLabel}>Explorar conteúdos</Text><Icon name="arrow" size={17}/></Pressable></View>
    <Text style={ui.muted}>Nesta prévia, registros manuais e eventos são simulados. Os dados do aparelho ainda não concedem EV.</Text>
  </Flow>;
  const mission = missions.find(m => m.id === draft.missionId);
  const query = search.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const visible = activityOptions.filter(option => option.group !== 'other' && (filter === 'all' || option.group === filter) && option.type.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query));
  return <Flow key={choosing ? "choose" : "details"} title="Um momento para você.">
    <View style={s.step}><Text style={ui.eyebrow}>01 · Sua atividade</Text><Text style={s.stepMuted}>02 · Revisão</Text></View>
    <Text style={ui.muted}>Registre o que fez. A Energia Vital reúne movimento e mente em uma mesma meta.</Text>
    {mission && <Notice>Sugestão do desafio: {mission.title}. Você pode escolher outra atividade.</Notice>}
    {choosing ? <>
    <View style={s.search}><Icon name="search" size={19}/><View style={{flex:1}}><Field label="Buscar atividade" value={search} onChangeText={setSearch} placeholder="O que fez hoje?" autoCorrect={false}/></View></View>
    <View style={ui.chips}>{[['all','Todas'],['movement','Movimento'],['mind','Mente'],['wellbeing','Bem-estar']].map(([value,label]) => <Chip key={value} label={label} selected={filter===value} onPress={() => setFilter(value)}/>)}</View>
    <View style={s.options}>
      {visible.map(option => { const selected = draft.type === option.type; return <Pressable key={option.type} accessibilityRole="button" accessibilityLabel={option.type} accessibilityState={{selected}} onPress={() => { update({type:option.type, activityName:undefined}); setChoosing(false); }} style={[s.option,selected&&s.optionSelected]}><Icon name={option.icon} size={20} color={selected ? colors.text : colors.muted}/><Text style={[s.optionLabel,selected&&{color:colors.text}]}>{option.type}</Text>{selected && <Icon name="check" size={15} color={colors.text}/>}</Pressable>; })}
    </View>
    {!visible.length && <Text style={ui.muted}>Não encontramos essa sugestão. Você pode nomear sua atividade abaixo.</Text>}
    <Pressable accessibilityRole="button" accessibilityState={{selected:draft.type==='Outra atividade'}} onPress={() => { update({type:'Outra atividade'}); setChoosing(false); }} style={s.other}><Icon name={draft.type==='Outra atividade'?'check':'plus'} size={19}/><Text style={s.otherLabel}>Outra atividade</Text><Text style={s.otherHint}>Conte do seu jeito</Text></Pressable>
    </> : <Pressable accessibilityRole="button" accessibilityLabel="Alterar atividade selecionada" onPress={() => setChoosing(true)} style={s.selectedCard}><Icon name={draft.type==='Outra atividade'?'plus':activityOptions.find(option=>option.type===draft.type)?.icon || 'activity'} color={colors.text}/><View style={{flex:1,gap:5}}><Text style={ui.eyebrow}>SUA ESCOLHA</Text><Text style={ui.heading}>{activityTitle(draft)}</Text></View><Text style={s.textLinkLabel}>Alterar</Text></Pressable>}
    {draft.type==='Outra atividade' && <Field label="Nome da atividade" placeholder="Ex.: tocar um instrumento" value={draft.activityName || ''} maxLength={80} onChangeText={activityName => update({activityName})}/>}
    {!!draft.type && <>
    <View style={ui.line}/>
    <Text style={ui.heading}>Quanto tempo você dedicou?</Text>
    <View style={ui.chips}>{['10','20','30','45'].map(value => <Chip key={value} label={`${value} min`} selected={draft.minutes===value} onPress={() => update({minutes:value})}/>)}</View>
    <Field label="Tempo em minutos" value={draft.minutes} onChangeText={minutes => update({minutes})} keyboardType="number-pad" placeholder="Ou informe outro tempo" maxLength={4}/>
    <Text style={ui.heading}>Quando aconteceu?</Text>
    <View style={ui.chips}><Chip label="Hoje" selected={!customDate&&draft.date===localDate()} onPress={() => {setCustomDate(false);update({date:localDate()});}}/><Chip label="Ontem" selected={!customDate&&draft.date===yesterday()} onPress={() => {setCustomDate(false);update({date:yesterday()});}}/><Chip label="Outra data" selected={customDate || ![localDate(),yesterday()].includes(draft.date)} onPress={() => setCustomDate(true)}/></View>
    {(customDate || ![localDate(),yesterday()].includes(draft.date)) && <Field label="Data (AAAA-MM-DD)" value={draft.date} onChangeText={date => update({date})} maxLength={10} placeholder="AAAA-MM-DD"/>}
    <View style={s.validation}><Icon name="leaf" size={20}/><Text style={[ui.muted,{flex:1}]}>Seu registro será revisado antes de gerar EV. As sugestões são formas de encontrar atividades; a classificação da energia e os pontos serão definidos pelas regras do Bóra.</Text></View>
    {!!error && <Notice>{error}</Notice>}
    <Button title="Revisar meu registro" onPress={() => {const message=validateDraft(draft);setError(message||'');if(!message)router.push('/review');}}/>
    <Pressable accessibilityRole="button" onPress={() => router.replace('/home')} style={s.textLink}><Text style={s.textLinkLabel}>Salvar rascunho e continuar depois</Text></Pressable>
    </>}
    <Pressable accessibilityRole="button" onPress={() => setEditing(false)} style={s.textLink}><Text style={ui.muted}>Ver outras formas de registrar</Text></Pressable>
  </Flow>;
}
const s = StyleSheet.create({ selectedCard:{flexDirection:'row',alignItems:'center',gap:14,padding:18,borderRadius:18,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface}, energyNote:{flexDirection:'row',alignItems:'center',gap:6,paddingVertical:8},dot:{width:7,height:7,borderRadius:4},energyText:{fontFamily:'Montserrat_500Medium',fontSize:11,color:colors.text,flex:1,marginLeft:4},resume:{gap:10,padding:18,borderWidth:1,borderColor:colors.border,borderRadius:18},discovery:{gap:8,padding:20,backgroundColor:colors.surface,borderRadius:20,marginTop:10},textLink:{minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10},textLinkLabel:{fontFamily:'Montserrat_500Medium',fontSize:12,color:colors.primary},step:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:6},stepMuted:{fontSize:10,color:colors.muted,fontFamily:'Montserrat_500Medium'},search:{flexDirection:'row',alignItems:'center',gap:12},options:{flexDirection:'row',flexWrap:'wrap',gap:10},option:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:15,paddingHorizontal:13,minWidth:'46%',flexGrow:1,borderRadius:15,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface},optionSelected:{borderColor:colors.text,backgroundColor:colors.surface},optionLabel:{fontFamily:'Montserrat_500Medium',fontSize:12,color:colors.muted,flex:1},other:{flexDirection:'row',alignItems:'center',minHeight:50,gap:9},otherLabel:{fontFamily:'Montserrat_500Medium',fontSize:13,color:colors.primary},otherHint:{fontFamily:'Montserrat_400Regular',fontSize:10,color:colors.muted,marginLeft:'auto'},selection:{fontFamily:'Montserrat_500Medium',fontSize:11,color:colors.lime},validation:{flexDirection:'row',gap:12,paddingVertical:10,alignItems:'flex-start'}, });
