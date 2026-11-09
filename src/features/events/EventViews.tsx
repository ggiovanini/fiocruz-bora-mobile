import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { Button, Card, Copy, Notice } from '@/ui/Flow';
import { Sheet } from '@/ui/Sheet';
import { MedalBadge } from '../MedalBadge';
import { eventDate, eventPeriod, eventStatus, type Event } from './model';

function EventCover({ uri, title, compact = false }: { uri?: string | null; title: string; compact?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!uri || failedUrl === uri) return <View accessible accessibilityLabel={`Evento ${title}, sem imagem disponível`} style={[compact ? s.thumbnail : s.cover,s.coverPlaceholder]}><Icon name="calendar" size={compact ? 26 : 64}/></View>;
  return <Image source={{ uri }} accessibilityLabel={`Imagem do evento ${title}`} style={compact ? s.thumbnail : s.cover} resizeMode="cover" onError={() => setFailedUrl(uri)}/>;
}
export function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${event.title}. ${eventStatus(event)}. ${eventPeriod(event)}. ${event.location}. Ver detalhes.`} onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: .75 }]}>
    <View style={s.row}>
      <EventCover uri={event.image_url} title={event.title} compact/>
      <View style={s.main}><Text style={s.title} numberOfLines={2}>{event.title}</Text><View style={s.statusRow}><Icon name={event.checked_in ? 'check' : 'calendar'} size={14} color={event.checked_in ? colors.lime : colors.primary}/><Text style={[s.status,event.checked_in && { color: colors.lime }]}>{eventStatus(event)}</Text></View></View>
      <Icon name="arrow" size={18}/>
    </View>
    <View style={s.info}><Icon name="clock" size={15} color={colors.muted}/><Text style={s.meta} numberOfLines={2}>{eventPeriod(event)}</Text></View>
    <View style={s.info}><Icon name="pin" size={15} color={colors.muted}/><Text style={s.meta} numberOfLines={1}>{event.location || 'Local a confirmar'}</Text></View>
  </Pressable>;
}
export function EventDetail({ event, onClose, onCheckIn, onMedals, illustrative = false }: { event?: Event; onClose: () => void; onCheckIn: () => void; onMedals: () => void; illustrative?: boolean }) {
  return <Sheet visible={!!event} title={event?.title ?? 'Evento'} onClose={onClose}>
    {event && <EventDetailContent event={event} onCheckIn={onCheckIn} onMedals={onMedals} illustrative={illustrative}/>}
  </Sheet>;
}
export function EventDetailContent({ event, onCheckIn, onMedals, illustrative = false }: { event: Event; onCheckIn: () => void; onMedals: () => void; illustrative?: boolean }) {
  return <>
    {illustrative && <Notice>Evento de demonstração.</Notice>}
    <View style={s.statusRow}><Icon name={event.checked_in ? 'check' : 'calendar'} size={18} color={event.checked_in ? colors.lime : colors.primary}/><Text style={[s.status,event.checked_in && { color: colors.lime }]}>{eventStatus(event)}</Text></View>
    <EventCover uri={event.image_url} title={event.title}/>
    {!!event.description && <Card title="Sobre o evento"><Copy>{event.description}</Copy></Card>}
    <Card title="Local"><View style={s.info}><Icon name="pin" size={20}/><Text style={s.location}>{event.location || 'Local a confirmar'}</Text></View></Card>
    <Card title="Período">
      {event.starts_at && event.ends_at ? <><Copy>Início · {eventDate(event.starts_at)}</Copy><Copy>Fim · {eventDate(event.ends_at)}</Copy><Copy muted>Horário de Brasília</Copy></> : <Copy>Data e horário a definir</Copy>}
    </Card>
    <Card title="Presença">
      {event.checked_in ? <>
        <Copy>Participação registrada.</Copy>
        {event.medal && <><MedalBadge name={event.medal.name} variant={event.medal.style} imageUrl={event.medal.image_url}/><Copy>{event.medal.name}</Copy><Button secondary title="Minhas medalhas" onPress={onMedals}/></>}
      </> : <>
        {!!event.qr_instructions && <Copy>{event.qr_instructions}</Copy>}
        {event.active ? <Button title="Registrar presença" onPress={onCheckIn}/> : <Copy muted>{eventStatus(event) === 'Encerrado' ? 'O período para registrar presença terminou.' : 'O registro por QR Code abre durante o evento.'}</Copy>}
      </>}
    </Card>
  </>;
}
const s = StyleSheet.create({
  card: { padding:16,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,gap:10 },
  row: { flexDirection:'row',alignItems:'center',gap:12 },
  main: { flex:1,minWidth:0,gap:6 },
  title: { color:colors.text,fontFamily:'Montserrat_600SemiBold',fontSize:16,lineHeight:22 },
  statusRow: { flexDirection:'row',alignItems:'center',gap:6 },
  status: { flexShrink:1,color:colors.primary,fontFamily:'Montserrat_500Medium',fontSize:11,lineHeight:17 },
  info: { flexDirection:'row',alignItems:'center',gap:8 },
  meta: { flex:1,color:colors.muted,fontFamily:'Montserrat_500Medium',fontSize:11,lineHeight:17 },
  location: { flex:1,color:colors.text,fontFamily:'Montserrat_400Regular',fontSize:15,lineHeight:23 },
  coverPlaceholder: { alignItems:'center',justifyContent:'center',backgroundColor:colors.accent,borderWidth:1,borderColor:colors.border },
  thumbnail: { width:56,height:56,borderRadius:12 },
  cover: { width:'100%',aspectRatio:16/9,borderRadius:16 },
});
