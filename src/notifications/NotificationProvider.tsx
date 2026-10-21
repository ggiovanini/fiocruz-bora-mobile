import {createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren} from 'react';
import {AppState, Linking, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {useRouter, useRootNavigationState} from 'expo-router';
import {apiEnabled, apiRequest} from '@/api/session';
import {hasAccess, useMock} from '@/mocks/MockProvider';
import {isNewNotice, type Cursor} from './notice';

Notifications.setNotificationHandler({handleNotification: async () => ({shouldShowBanner:true, shouldShowList:true, shouldPlaySound:true, shouldSetBadge:false})});
type Inbox = {unread:number; error:string; enabled:boolean; refresh:()=>Promise<void>; enable:()=>Promise<void>; disable:()=>Promise<void>; test:()=>Promise<void>};
const Context=createContext<Inbox|null>(null);
const allowed=(permission: Notifications.NotificationPermissionsStatus)=>permission.granted || permission.ios?.status===Notifications.IosAuthorizationStatus.PROVISIONAL;
export function NotificationProvider({children}:PropsWithChildren) {
 const {state,ready}=useMock(); const router=useRouter(); const navigation=useRootNavigationState();
 const user=apiEnabled && ready && hasAccess(state) ? state.userId : null;
 const current=useRef(user);
 const scope=useRef({user});
 if(current.current!==user)scope.current={user};
 current.current=user;
 const [unread,setUnread]=useState(0),[error,setError]=useState(''),[enabled,setEnabled]=useState(false);
 const busy=useRef<string|null>(null);
 const preference=(id:string)=>`bora:notification-opt-in:v1:${id}`;
 const watermark=(id:string)=>`bora:notification-watermark:v1:${id}`;
 const present=useCallback(async(id:string,test=false)=>{
  const context=scope.current;
  if(Platform.OS==='web'||current.current!==id||AppState.currentState!=='active') return;
  if(!allowed(await Notifications.getPermissionsAsync())||current.current!==id||scope.current!==context||AppState.currentState!=='active')return;
  const identifier=await Notifications.scheduleNotificationAsync({content:{title:'Bóra',body:test?'Os avisos do Bóra estão funcionando neste aparelho.':'Você tem uma nova mensagem no Bóra. Abra sua caixa de entrada.',data:{boraInbox:true,userId:id},sound:'default'},trigger:Platform.OS==='android'?{channelId:'default'}:null});
  if(current.current!==id||scope.current!==context)await Notifications.dismissNotificationAsync(identifier);
 },[]);
 const refresh=useCallback(async()=>{
  const id=current.current;if(!id||busy.current===id)return;
  const context=scope.current;
  busy.current=id;
  try{
   const result=await apiRequest('/me/notifications');
   if(current.current!==id||scope.current!==context)return;
   setUnread(result.unread_count??0);setError('');
   if(Platform.OS==='web'||await AsyncStorage.getItem(preference(id))!=='true')return;
   const permission=await Notifications.getPermissionsAsync();
   if(current.current!==id||scope.current!==context)return;
   setEnabled(allowed(permission));if(!allowed(permission))return;
   const raw=await AsyncStorage.getItem(watermark(id));
   const previous:Cursor|null=raw?JSON.parse(raw):null;
   if(isNewNotice(previous,result.latest_unread)&&current.current===id&&scope.current===context&&AppState.currentState==='active'&&await AsyncStorage.getItem(preference(id))==='true'){
    await AsyncStorage.setItem(watermark(id),JSON.stringify(result.latest_unread));
    await present(id);
   }
  }catch(e){if(current.current===id&&scope.current===context)setError(e instanceof Error?e.message:'Não foi possível consultar as notificações.');}
  finally{if(busy.current===id)busy.current=null;}
 },[present]);
 useEffect(()=>{
  setUnread(0);setError('');setEnabled(false);
  if(!user)return;
  const id=user;
  void (async()=>{const opt=await AsyncStorage.getItem(preference(id));if(Platform.OS!=='web'){const p=await Notifications.getPermissionsAsync();if(current.current===id)setEnabled(opt==='true'&&allowed(p));}})().catch(()=>{});
  void refresh();
  const listener=AppState.addEventListener('change',next=>{if(next==='active')void refresh();});
  const timer=setInterval(()=>{if(AppState.currentState==='active')void refresh();},30000);
  return()=>{listener.remove();clearInterval(timer);void Notifications.getPresentedNotificationsAsync().then(rows=>Promise.all(rows.filter(row=>row.request.content.data?.userId===id).map(row=>Notifications.dismissNotificationAsync(row.request.identifier)))).catch(()=>{});};
 },[user,refresh]);
 useEffect(()=>{
  const open=(response:Notifications.NotificationResponse)=>{
   const data=response.notification.request.content.data;
   if(navigation?.key && data?.boraInbox && current.current && data.userId===current.current)router.push('/notifications');
  };
  const listener=Notifications.addNotificationResponseReceivedListener(open);
  if(user && navigation?.key)void Notifications.getLastNotificationResponseAsync().then(response=>{if(response)open(response);return Notifications.clearLastNotificationResponseAsync();}).catch(()=>{});
  return()=>listener.remove();
 },[user,router,navigation?.key]);
 const enable=async()=>{
  const id=current.current;if(!id)return;
  const context=scope.current;
  try{
   if(Platform.OS==='web'){setError('Os avisos do sistema estão disponíveis no app instalado.');return;}
   if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('default',{name:'Mensagens do Bóra',importance:Notifications.AndroidImportance.DEFAULT});
   let permission=await Notifications.getPermissionsAsync();
   if(!allowed(permission)&&permission.canAskAgain)permission=await Notifications.requestPermissionsAsync();
   if(current.current!==id||scope.current!==context)return;
   if(!allowed(permission)){setError('Avisos não autorizados. Você pode permiti-los nos ajustes do aparelho.');if(!permission.canAskAgain)await Linking.openSettings();return;}
   await AsyncStorage.setItem(preference(id),'true');if(current.current!==id||scope.current!==context)return;setEnabled(true);setError('');await refresh();
  }catch{if(current.current===id)setError('Não foi possível ativar os avisos neste aparelho.');}
 };
 const disable=async()=>{const id=current.current;if(!id)return;try{await AsyncStorage.removeItem(preference(id));if(current.current===id)setEnabled(false);}catch{setError('Não foi possível salvar a preferência.');}};
 const test=async()=>{const id=current.current;if(!id||!enabled)return;try{await present(id,true);}catch{if(current.current===id)setError('Não foi possível emitir o aviso de teste.');}};
 return <Context.Provider value={{unread,error,enabled,refresh,enable,disable,test}}>{children}</Context.Provider>;
}
export function useNotifications(){const value=useContext(Context);if(!value)throw new Error('NotificationProvider is required');return value;}
