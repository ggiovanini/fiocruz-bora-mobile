import { useState } from "react";
import { useRouter } from "expo-router";
import { Linking, Platform } from "react-native";
import {
  Button,
  Check,
  Copy,
  Flow,
  Notice,
  Placeholder,
} from "@/ui/Flow";

import { apiEnabled } from "@/api/session";
import { useMock } from "@/mocks/MockProvider";
import { useHealth } from "@/health/HealthProvider";
export default function HealthSettings() {
  const { session, state, adapter, ready, preferenceError } = useHealth();
  const router = useRouter();
  const { api } = useMock();
  const canImport = apiEnabled && state.connected && state.automatic && api.data.consent?.status==='granted';
  const [agree, setAgree] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const native = Platform.OS === "ios" || Platform.OS === "android";
  return (
    <Flow title="Conexão de treinos" demo={false}>
      <Copy muted>{adapter.label} · {state.connected ? 'Conectado' : 'Não conectado'}</Copy>
      <Copy>Consulte treinos dos últimos sete dias e escolha como enviá-los para sua jornada.</Copy>
      {state.connected && <Button secondary title="Ver treinos" onPress={() => router.navigate('/health')}/>}
      {!native ? (
        <Placeholder>
          A conexão com dados de atividade está disponível no aplicativo
          instalado em um iPhone ou Android compatível.
        </Placeholder>
      ) : (
        <>
          <Check
            label="Quero consultar meus treinos neste aparelho."
            value={agree || state.connected}
            onChange={(value) => {
              setAgree(value);
              if (!value) session.disconnect();
            }}
          />
          <Button
            title={
              state.connected
                ? "Rever autorização no sistema"
                : `Conectar ${adapter.label}`
            }
            busy={state.busy}
            disabled={!ready || (!agree && !state.connected)}
            onPress={() => {
              void session.connect();
            }}
          />
          <Check
            label="Atualização automática"
            value={state.automatic}
            onChange={(value) => {
              if (ready) session.setAutomatic(value);
            }}
          />
          <Copy muted>
            Consulta durante o uso do app, sem leitura em segundo plano.
          </Copy>
          <Check label="Autorizo o envio automático dos treinos" value={state.automaticImport} disabled={!ready || (!state.automaticImport && !canImport)} onChange={value=>{if(ready && (!value || canImport)){session.setAutomaticImport(value);if(value && !state.snapshot)void session.sync();}}}/>
          <Copy muted>Ao ativar, você autoriza enviar tipo, duração, horários e identificador dos treinos reconhecidos dos últimos sete dias. Classificações pendentes e conflitos ficam para revisão manual.</Copy>
          {!canImport && <Copy muted>Para ativar, conecte o aparelho, mantenha a atualização automática ativa e aceite os termos de registro de atividades.</Copy>}
          {api.data.profile?.email?.toLowerCase().endsWith('@bora.example') && <Notice>Este perfil de demonstração é compartilhado. Use somente treinos de teste.</Notice>}
          {!ready && <Notice>Carregando preferências…</Notice>}
          {preferenceError && (
            <Notice>
              Não foi possível salvar ou recuperar suas preferências. Confira a
              conexão e a atualização automática ao reabrir o app.
            </Notice>
          )}
          {!!state.message && <Notice>{state.message}</Notice>}
          {Platform.OS === "ios" && (
            <Copy muted>
              O iOS não informa ao Bora se a leitura foi negada. Uma lista vazia
              pode significar ausência de dados ou acesso não autorizado.
              Confira no Saúde → perfil → Apps → Bóra.
            </Copy>
          )}
          {state.availability === "update-required" && (
            <Button
              secondary
              title="Abrir Health Connect na loja"
              onPress={() => {
                void Linking.openURL(
                  "https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata",
                ).catch(() =>
                  setSettingsError(
                    "Não foi possível abrir a loja. Procure Health Connect na Play Store.",
                  ),
                );
              }}
            />
          )}
          <Button
            secondary
            title="Gerenciar permissões no sistema"
            disabled={state.busy}
            onPress={() => {
              session.disconnect();
              setAgree(false);
              void adapter
                .managePermissions()
                .catch(() =>
                  setSettingsError(
                    "Abra os ajustes do Saúde ou do Health Connect e procure Bóra para alterar as permissões.",
                  ),
                );
            }}
          />
          {!!settingsError && <Notice>{settingsError}</Notice>}
          {state.connected && <Button
            secondary
            title="Desconectar e limpar leitura local"
            onPress={() => {
              session.disconnect();
              setAgree(false);
            }}
          />}
          <Copy muted>
            Desconectar interrompe a leitura no Bora. Para revogar a permissão
            do sistema, use Gerenciar permissões.
          </Copy>
        </>
      )}

    </Flow>
  );
}
