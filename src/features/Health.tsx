import { useState } from "react";
import { Linking, Platform } from "react-native";
import {
  Button,
  Card,
  Check,
  Copy,
  Flow,
  Notice,
  Placeholder,
} from "@/ui/Flow";
import HealthWorkoutImport from "./HealthWorkoutImport";
import { useHealth } from "@/health/HealthProvider";
export default function Health() {
  const { session, state, adapter, ready, preferenceError } = useHealth();
  const [agree, setAgree] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const native = Platform.OS === "ios" || Platform.OS === "android";
  return (
    <Flow title="Dados de atividade" demo={false}>
      <Card title="Você escolhe o que compartilhar">
        <Copy>
          Conecte o {adapter.label} para consultar seus treinos
          dos últimos sete dias.
        </Copy>
        <Copy>
          A atualização automática consulta seus dados durante o uso do app.
          Você pode desativá-la ou desconectar quando quiser.
        </Copy>
        <Copy muted>
          A leitura fica na memória durante a sessão. Para registrar na jornada,
          selecione um treino e autorize seu envio ao servidor. A consulta sozinha
          não gera Energia Vital; passos não são consultados.
        </Copy>
      </Card>
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
            label="Atualizar automaticamente durante o uso do app"
            value={state.automatic}
            onChange={(value) => {
              if (ready) session.setAutomatic(value);
            }}
          />
          <Copy muted>
            Sem leitura em segundo plano. A autorização do sistema continua
            necessária.
          </Copy>
          {!ready && <Notice>Carregando preferências…</Notice>}
          {preferenceError && (
            <Notice>
              Não foi possível salvar ou recuperar suas preferências. Confira a
              conexão e a atualização automática ao reabrir o app.
            </Notice>
          )}
          <Button
            title="Atualizar agora"
            disabled={!ready || !state.connected}
            busy={state.busy}
            onPress={() => {
              void session.sync();
            }}
          />
          {!!state.message && <Notice>{state.message}</Notice>}
          {state.connected &&
            !state.snapshot &&
            !state.busy &&
            !state.message && (
              <Notice>
                {state.automatic
                  ? "Aguardando a próxima atualização automática. Você também pode atualizar agora."
                  : "Toque em Atualizar agora para consultar seus dados."}
              </Notice>
            )}
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
          <Button
            secondary
            title="Desconectar e limpar leitura local"
            onPress={() => {
              session.disconnect();
              setAgree(false);
            }}
          />
          <Copy muted>
            Desconectar interrompe a leitura no Bora. Para revogar a permissão
            do sistema, use Gerenciar permissões.
          </Copy>
        </>
      )}
      {state.snapshot && (
        <>
          <Copy muted>
            Atualizado às:{" "}
            {new Date(state.snapshot.syncedAt).toLocaleString("pt-BR")}.
            Atualize após alterar permissões ou atividades no sistema.
          </Copy>
          <Copy>Treinos encontrados · {state.snapshot.workouts.length}</Copy>
          {state.snapshot.access.workouts === "denied" ? (
            <Notice>Leitura de treinos não autorizada.</Notice>
          ) : (
            !state.snapshot.workouts.length && (
              <Placeholder>
                Nenhum treino disponível neste período. Confira as fontes
                conectadas e permissões no sistema.
              </Placeholder>
            )
          )}
          {state.snapshot.workouts.map(workout => <HealthWorkoutImport key={workout.id} workout={workout}/>)}
        </>
      )}
    </Flow>
  );
}
