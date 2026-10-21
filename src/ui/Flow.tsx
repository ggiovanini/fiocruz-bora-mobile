import type { PropsWithChildren, Ref } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/components/AppHeader";
import { colors } from "@/design/tokens";
import { apiEnabled } from "@/api/session";
import { useMock } from "@/mocks/MockProvider";
export function Flow({
  title,
  children,
  back = true,
  demo = true,
  scrollRef,
  tag,
}: PropsWithChildren<{ title: string; back?: boolean; demo?: boolean; tag?: string; scrollRef?: Ref<ScrollView> }>) {
  const { state, storageError, api } = useMock();
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <AppHeader back={back} />
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.body}
      >
        {tag && <Text style={styles.tag}>{tag}</Text>}
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {demo && state.offline && (
          <Notice>Sem conexão. Seus registros ficam pendentes.</Notice>
        )}
        {demo && storageError && (
          <Notice>
            Não foi possível salvar neste aparelho. Mantenha o aplicativo aberto
            e tente novamente.
          </Notice>
        )}
        {apiEnabled && state.session === 'active' && !!api.error && <><Notice>{api.error}</Notice><Button title="Tentar novamente" disabled={api.busy} onPress={() => { void api.refresh().catch(() => {}); }} /></>}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Copy({
  children,
  muted = false,
}: PropsWithChildren<{ muted?: boolean }>) {
  return <Text style={[styles.copy, muted && styles.muted]}>{children}</Text>;
}
export function Card({
  title,
  children,
}: PropsWithChildren<{ title?: string }>) {
  return (
    <View style={styles.card}>
      {title && <Text style={styles.heading}>{title}</Text>}
      {children}
    </View>
  );
}
export function Placeholder({ children }: PropsWithChildren) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{children}</Text>
    </View>
  );
}
export function Notice({ children }: PropsWithChildren) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.notice}>
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}
export function Button({
  title,
  onPress,
  secondary,
  disabled,
  busy,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!busy, busy: !!busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (disabled || busy) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {busy && <ActivityIndicator color={colors.background} />}
      <Text style={[styles.buttonText, secondary && styles.secondaryText]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.copy}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}
export function Check({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.check}
    >
      <Text style={styles.checkbox}>{value ? "☑" : "☐"}</Text>
      <Text style={[styles.copy, styles.flex]}>{label}</Text>
    </Pressable>
  );
}
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: {
    fontFamily: "Montserrat_700Bold",
    color: colors.text,
    fontSize: 26,
    flex: 1,
  },
  tag: { color: colors.muted, fontFamily: "Montserrat_500Medium", fontSize: 9, letterSpacing: 2 },
  back: { fontSize: 40, color: colors.primary, minWidth: 32 },
  body: { padding: 24, paddingTop: 12, paddingBottom: 40, gap: 16, width: "100%", maxWidth: 520, alignSelf: "center" },
  title: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 27,
    lineHeight: 35,
    color: colors.text,
    marginBottom: 2,
  },
  copy: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 15,
    lineHeight: 23,
    color: colors.text,
  },
  muted: { color: colors.muted },
  heading: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 18,
    color: colors.text,
    marginBottom: 8,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: 6,
  },
  placeholder: {
    padding: 24,
    minHeight: 110,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontFamily: "Montserrat_500Medium",
    color: colors.muted,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 24,
  },
  notice: { backgroundColor: colors.accent, padding: 12, borderRadius: 12 },
  noticeText: { color: colors.text, fontSize: 13, lineHeight: 20 },
  button: {
    minHeight: 50,
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 15,
    color: colors.background,
    textAlign: "center",
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: { color: colors.text },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
  field: { gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: 14,
    color: colors.text,
    fontSize: 16,
  },
  check: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 10,
    minHeight: 48,
  },
  checkbox: { color: colors.lime, fontSize: 25 },
  flex: { flex: 1 },
});
