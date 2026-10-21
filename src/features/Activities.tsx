import { apiEnabled } from "@/api/session";
import { validateApiDraft } from "@/api/activityMapping";
import { useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  Copy,
  Flow,
  Notice,
  Placeholder,
} from "@/ui/Flow";
import { useMock } from "@/mocks/MockProvider";
import {
  newDraft,
  validateDraft,
  type Activity,
  activityTitle,
} from "@/mocks/model";
import { useEnergyPreview } from "./avatar/EnergyPreview";
import { dailyEnergy } from "./avatar/energy";
import { missions, statusLabels } from "@/mocks/catalog";

export function MissionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch, api } = useMock();
  const router = useRouter();
  const mission = missions.find((m) => m.id === id);
  const { energy, goal } = useEnergyPreview();
  const daily = dailyEnergy(energy.green, energy.blue, goal);
  if (!mission)
    return (
      <Flow title="Missão não encontrada">
        <Button
          title="Ver missões"
          onPress={() => router.replace("/missions")}
        />
      </Flow>
    );
  return (
    <Flow title={mission.title}>
      <Placeholder>Ilustração · {mission.category}</Placeholder>
      <Card title="Como participar">
        <Copy>{mission.description}</Copy>
        <Copy>
          Sua meta diária: {goal} EV · {daily.total} EV
        </Copy>
        <Copy muted>Escolha uma atividade física ou mental para sua jornada. Os valores exibidos são exemplos.</Copy>
      </Card>
      {state.draft && (
        <Button
          secondary
          title="Continuar rascunho existente"
          onPress={() => router.push("/activity")}
        />
      )}
      {daily.complete ? (
        <Notice>Meta diária atingida nos dados de exemplo.</Notice>
      ) : (
        <Button
          title={
            state.draft
              ? "Substituir rascunho por esta sugestão"
              : "Experimentar esta sugestão"
          }
          onPress={() => {
            dispatch({
              type: "draft",
              value: { ...newDraft(), type: mission.activity },
            });
            router.push("/activity");
          }}
        />
      )}
      <Button
        secondary
        title="Ver minhas atividades"
        onPress={() => router.push("/history")}
      />
    </Flow>
  );
}
export { default as ActivityForm } from "./ActivityEntry";
export function Review() {
  const { state, dispatch, api } = useMock();
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submission = useRef(false);
  const d = state.draft;
  if (!d)
    return (
      <Flow title="Tudo certo com seu registro?">
        <Copy>Não há rascunho para enviar.</Copy>
        <Button
          title="Ver minhas atividades"
          onPress={() => router.replace("/history")}
        />
      </Flow>
    );
  const mission = missions.find((m) => m.id === d.missionId);
  async function submit() {
    if (!d || submission.current) return;
    const e = apiEnabled ? validateApiDraft(d, api.data.catalog, api.data.energy?.today.date ?? d.date) : validateDraft(d);
    if (e) {
      setError(e);
      return;
    }
    submission.current = true;
    setSubmitted(true);
    if (apiEnabled) {
      try {
        const id = await api.enqueue(d);
        router.replace({ pathname: '/activity-result', params: { id } });
      } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível salvar o registro.'); setSubmitted(false); submission.current = false; }
      return;
    }
    const activity: Activity = {
      ...d,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "enqueue", value: activity });
    router.replace({ pathname: "/activity-result", params: { id: d.id } });
  }
  return (
    <Flow title="Tudo certo com seu registro?">
      <Card title={activityTitle(d)}>
        <Copy>
          {d.minutes} minutos · {d.date}
        </Copy>
        <Copy muted>
          {mission ? `Missão: ${mission.title}` : "Registro avulso"}
        </Copy>
      </Card>
      <Copy>
        {apiEnabled ? 'Sua atividade será registrada e a Energia Vital será calculada pela API.' : 'Seu registro fica salvo neste aparelho.'}
      </Copy>
      {!!error && <Notice>{error}</Notice>}
      <Button
        title={state.offline ? "Salvar para enviar depois" : "Enviar atividade"}
        disabled={submitted}
        onPress={submit}
      />
      <Button
        secondary
        title="Editar atividade"
        onPress={() => router.back()}
      />

    </Flow>
  );
}
export function ActivityResult() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, send, api } = useMock();
  const router = useRouter();
  const a = state.activities.find((a) => a.id === id);
  if (!a)
    return (
      <Flow title="Registro não encontrado">
        <Button
          title="Ver histórico"
          onPress={() => router.replace("/history")}
        />
      </Flow>
    );
  const descriptions = {
    pending:
      "Salvo no aparelho, aguardando processamento.",
    sending: "Enviando atividade…",
    confirmed:
      apiEnabled ? a.validationStatus === 'approved' ? `Atividade registrada. ${a.awardedEv ?? 0} EV adicionados à sua jornada.` : 'Atividade registrada e aguardando validação.' : "Registro salvo neste aparelho.",
    failed:
      "Não foi possível enviar. Seu registro está salvo; tente novamente.",
  };
  return (
    <Flow title={statusLabels[a.status]}>
      <Card title={activityTitle(a)}>
        <Copy>
          {a.minutes} minutos · {a.date}
        </Copy>
      </Card>
      <Notice>{a.error ?? descriptions[a.status]}</Notice>
      {a.status === "failed" && (
        <Button
          title="Tentar novamente"
          disabled={state.offline}
          onPress={() => {
            void send(a);
          }}
        />
      )}
      {!apiEnabled && state.offline && (
        <Button
          secondary
          title="Controles de conexão"
          onPress={() => router.push("/demo")}
        />
      )}
      <Button
        title={a.missionId ? "Voltar à missão" : "Voltar para Hoje"}
        onPress={() =>
          a.missionId
            ? router.replace({
                pathname: "/mission",
                params: { id: a.missionId },
              })
            : router.replace("/home")
        }
      />
      <Button
        secondary
        title="Ver minhas atividades"
        onPress={() => router.replace("/history")}
      />
    </Flow>
  );
}
export function History() {
  const { state, dispatch, api } = useMock();
  const router = useRouter();
  return (
    <Flow title="Minhas atividades">
      {apiEnabled && <Button secondary title={api.busy ? 'Atualizando…' : 'Atualizar atividades'} disabled={api.busy} onPress={() => { void api.refresh().catch(() => {}); }} />}
      <Button
        secondary
        title="Consultar atividades do aparelho"
        onPress={() => router.push("/health")}
      />
      {state.draft && (
        <Card title="Rascunho não enviado">
          <Copy>{activityTitle(state.draft)}</Copy>
          <Button
            secondary
            title="Continuar rascunho"
            onPress={() => router.push("/activity")}
          />
        </Card>
      )}
      {!state.activities.length && (
        <Placeholder>Nenhuma atividade registrada ainda.</Placeholder>
      )}
      {state.activities.map((a) => (
        <Card key={a.id} title={activityTitle(a)}>
          <Copy>
            {a.minutes} minutos · {a.date}
          </Copy>
          <Copy muted>{a.status === 'confirmed' && apiEnabled ? a.validationStatus === 'approved' ? `${a.awardedEv ?? 0} EV · Atividade registrada` : 'Aguardando validação' : statusLabels[a.status]}</Copy>
          <Button
            secondary
            title="Ver registro"
            onPress={() =>
              router.push({
                pathname: "/activity-result",
                params: { id: a.id },
              })
            }
          />
        </Card>
      ))}
      {apiEnabled && api.data.nextCursor && <Button secondary title="Carregar mais atividades" disabled={api.busy} onPress={() => { void api.loadMore().catch(() => {}); }} />}
      <Button
        title={state.draft ? "Continuar rascunho" : "Registrar nova atividade"}
        onPress={() => {
          if (!state.draft) dispatch({ type: "draft", value: newDraft() });
          router.push("/activity");
        }}
      />
    </Flow>
  );
}
