import { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';

export type Message = { id: string; title: string; body: string; read_at: string | null };
export function MessageRow({ message,busy,onRead,onDismiss }: { message:Message;busy:boolean;onRead:()=>void;onDismiss:()=>Promise<void> }) {
  const x=useRef(new Animated.Value(0)).current;
  const [revealed,setRevealed]=useState(false);
  const removing=useRef(false);
  const move=(toValue:number)=>Animated.spring(x,{toValue,useNativeDriver:false,bounciness:0,speed:24}).start();
  const close=()=>{setRevealed(false);move(0);};
  const remove=async()=>{
    if(busy || removing.current)return;
    removing.current=true;
    try { await onDismiss(); }
    finally { removing.current=false;close(); }
  };
  const gesture=useMemo(()=>PanResponder.create({
    onMoveShouldSetPanResponder:(_,g)=>!busy && Math.abs(g.dx)>12 && Math.abs(g.dx)>Math.abs(g.dy)*1.5 && (g.dx<0 || revealed),
    onPanResponderMove:(_,g)=>x.setValue(Math.max(-140,Math.min(0,(revealed ? -88 : 0)+g.dx))),
    onPanResponderRelease:(_,g)=>{
      const offset=(revealed ? -88 : 0)+g.dx;
      if(offset<=-120) { void remove(); return; }
      if(offset<-36) {setRevealed(true);move(-88);} else close();
    },
    onPanResponderTerminate:close,
  }),[busy,revealed,onDismiss]);
  return <View style={s.wrapper}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Remover mensagem: ${message.title}`} accessibilityElementsHidden={!revealed} importantForAccessibility={revealed ? 'yes' : 'no-hide-descendants'} disabled={busy} onPress={()=>{void remove();}} style={s.remove}><Icon name="trash" size={23} color={colors.text}/><Text style={s.removeText}>Remover</Text></Pressable>
    <Animated.View style={{transform:[{translateX:x}]}} {...gesture.panHandlers}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${message.title}. ${message.body}. ${message.read_at ? 'Lida' : 'Não lida'}.`} accessibilityHint={message.read_at ? 'Deslize para remover.' : 'Toque para marcar como lida. Deslize para remover.'} accessibilityState={{disabled:busy,busy}} accessibilityActions={[{name:'remove',label:'Remover mensagem'}]} onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='remove')void remove();}} disabled={busy} onPress={()=>{if(revealed)close();else if(!message.read_at)onRead();}} style={({pressed})=>[s.message,!message.read_at&&s.unread,pressed&&{opacity:.85},busy&&{opacity:.6}]}>
        <View style={s.heading}><Text style={s.title}>{message.title}</Text><Icon name={message.read_at ? 'check' : 'bell'} size={17} color={message.read_at ? colors.muted : colors.primary}/></View>
        <Text style={s.body}>{message.body}</Text>
      </Pressable>
    </Animated.View>
  </View>;
}
const s=StyleSheet.create({
  wrapper:{borderRadius:18,overflow:'hidden',backgroundColor:'#873446'},
  remove:{position:'absolute',top:0,bottom:0,right:0,width:88,alignItems:'center',justifyContent:'center',gap:6},
  removeText:{color:colors.text,fontFamily:'Montserrat_500Medium',fontSize:10},
  message:{padding:18,borderRadius:18,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,gap:8},
  unread:{borderLeftWidth:3,borderLeftColor:colors.primary},
  heading:{flexDirection:'row',alignItems:'center',gap:12},
  title:{flex:1,color:colors.text,fontFamily:'Montserrat_600SemiBold',fontSize:15,lineHeight:22},
  body:{color:colors.muted,fontFamily:'Montserrat_400Regular',fontSize:13,lineHeight:21},
});
