import { ActivityCelebration } from "./activity/ActivityCelebration";
import { ActivityStepScreen } from "./activity/ActivityStepScreen";
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
  function cancel() {
    if (submission.current) return;
    dispatch({ type: 'draft', value: null });
    router.dismissTo('/history');
  }
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
        router.replace({ pathname: '/activity-result', params: { id, celebrate: '1', dimension: d.energyDimension ?? api.data.catalog.find(item => item.code === d.activityCode)?.energy_dimension ?? 'physical' } });
      } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível salvar o registro.'); setSubmitted(false); submission.current = false; }
      return;
    }
    const activity: Activity = {
      ...d,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "enqueue", value: activity });
    router.replace({ pathname: "/activity-result", params: { id: d.id, celebrate: '1', dimension: d.energyDimension ?? 'physical' } });
  }
  return <ActivityStepScreen title="Tudo certo?" step={5} onBack={() => router.back()} onClose={() => router.replace('/home')}
    footer={<><Button title={state.offline ? "Salvar para enviar depois" : "Confirmar atividade"} busy={submitted} disabled={submitted} onPress={() => { void submit(); }}/><Button secondary title="Cancelar" disabled={submitted} onPress={cancel}/>{!!error && <Notice>{error}</Notice>}</>}>
    <Card title={activityTitle(d)}>
      <Copy>{d.energyDimension === 'intellectual' ? 'Atividade mental' : d.energyDimension === 'physical' ? 'Atividade física' : 'Atividade'}</Copy>
      <Copy>{d.minutes} minutos</Copy>
      <Copy>{new Date(`${d.date}T12:00:00Z`).toLocaleDateString('pt-BR',{timeZone:'UTC'})}</Copy>
      {!!mission && <Copy muted>{mission.title}</Copy>}
    </Card>
    {state.offline && <Notice>Seu registro ficará salvo para enviar quando a conexão voltar.</Notice>}
    {!apiEnabled && <Copy muted>Registro de demonstração.</Copy>}
  </ActivityStepScreen>;
}
export function ActivityResult() {
  const { id, celebrate, dimension } = useLocalSearchParams<{ id: string; celebrate?: string; dimension?: string }>();
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
  if (celebrate === '1' && a.status !== 'failed') return <ActivityCelebration activity={a} dimension={dimension === 'intellectual' ? 'intellectual' : 'physical'} onClose={() => router.replace('/home')}/>;
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
export { default as History } from "./history/History";
