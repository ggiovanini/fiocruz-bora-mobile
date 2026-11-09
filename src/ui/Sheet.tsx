import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens';
import { Icon } from '@/design/Icon';
export function Sheet({ visible, title, onClose, children, avoidKeyboard = false }: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void; avoidKeyboard?: boolean }>) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView style={s.overlay} enabled={avoidKeyboard} behavior={Platform.OS==='ios' ? 'padding' : 'height'}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar painel" />
      <SafeAreaView edges={['bottom']} style={s.panel} accessibilityViewIsModal>
        <View style={s.header}><Text accessibilityRole="header" style={s.title}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} style={s.close}><Icon name="plus" size={24}/></Pressable></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>{children}</ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>;
}
const s = StyleSheet.create({ overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' }, panel: { maxHeight: '88%', width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 }, header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 }, title: { flex: 1, color: colors.text, fontSize: 19, fontFamily: 'Montserrat_600SemiBold' }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] }, body: { padding: 20, paddingTop: 0, gap: 12 } });
