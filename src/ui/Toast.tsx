import {createContext,useContext,useEffect,useRef,useState,type PropsWithChildren} from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {colors} from '@/design/tokens';
const Context=createContext<(message:string)=>void>(()=>{});
export function ToastProvider({children}:PropsWithChildren) {
 const [message,setMessage]=useState('');
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const show=(value:string)=>{clearTimeout(timer.current);setMessage(value);timer.current=setTimeout(()=>setMessage(''),5000);};
 return <Context.Provider value={show}>{children}{!!message && <View pointerEvents="none" style={s.overlay}><View style={s.toast}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={s.text}>{message}</Text></View></View>}</Context.Provider>;
}
export const useToast=()=>useContext(Context);
const s=StyleSheet.create({overlay:{position:'absolute',left:24,right:24,bottom:100,alignItems:'center'},toast:{width:'100%',maxWidth:472,padding:16,borderRadius:14,backgroundColor:colors.surface,borderColor:colors.lime,borderWidth:1},text:{color:colors.text,fontFamily:'Montserrat_500Medium',fontSize:14,lineHeight:21,textAlign:'center'}});
