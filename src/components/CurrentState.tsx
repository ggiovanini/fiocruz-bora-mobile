import { StyleSheet, View } from 'react-native'; import { colors } from '@/design/tokens';
export function CurrentState(){return (
    <View style={styles.figure}>
        <View style={styles.aura}/>
        <View style={styles.shadow}/>
    </View>
)}
const styles=StyleSheet.create({figure:{alignItems:'center',height:330,justifyContent:'center',position:'relative'},aura:{borderColor:colors.border,borderRadius:150,borderWidth:10,height:285,position:'absolute',width:285},head:{backgroundColor:colors.lime,borderRadius:30,height:48,position:'absolute',top:40,width:48},body:{backgroundColor:colors.lime,borderRadius:42,height:150,position:'absolute',top:85,width:78},arm:{backgroundColor:colors.lime,borderRadius:20,height:22,position:'absolute',right:83,top:130,transform:[{rotate:'-38deg'}],width:110},leg:{backgroundColor:colors.lime,borderRadius:22,bottom:28,height:140,left:148,position:'absolute',transform:[{rotate:'7deg'}],width:30},shadow:{backgroundColor:'#1BDA61',borderRadius:40,bottom:8,height:12,opacity:.7,position:'absolute',width:98}});
