import { LiveKnowledge, LiveArticle } from './Knowledge';
import { LiveEvents, LiveEventQr } from "./Events";
import { apiEnabled } from "@/api/session";
import { ParticipantAvatar } from "./avatar/ParticipantAvatar";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  Check,
  Copy,
  Field,
  Flow,
  Notice,
  Placeholder,
} from "@/ui/Flow";
import { useMock } from "@/mocks/MockProvider";
import { articles, pilotEvent } from "@/mocks/catalog";
export function Content({ tab = false }: { tab?: boolean }) { return apiEnabled ? <LiveKnowledge tab={tab}/> : <PreviewContent tab={tab}/>; }
function PreviewContent({ tab = false }: { tab?: boolean }) {
  const router = useRouter();
  return (
    <Flow title="Conhecer" back={!tab}>
      <Copy muted>Ideias e conteúdos para movimentar o corpo, aprender e cuidar de você.</Copy>
      {articles.map((a) => (
        <Card key={a.id} title={a.title}>
          <Copy muted>{a.category}</Copy>
          <Copy>{a.summary}</Copy>
          <Button
            secondary
            title="Abrir conteúdo"
            onPress={() =>
              router.push({ pathname: "/article", params: { id: a.id } })
            }
          />
        </Card>
      ))}
    </Flow>
  );
}
export function Article() { return apiEnabled ? <LiveArticle/> : <PreviewArticle/>; }
function PreviewArticle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = articles.find((a) => a.id === id);
  return (
    <Flow title={article?.title || "Conteúdo não encontrado"}>
      {article && (
        <>
          <Placeholder>Capa, imagem ou vídeo</Placeholder>
          <Card title="Conteúdo em preparação">
            <Copy>{article.summary}</Copy>
            <Copy muted>
              Autoria · tempo de leitura · conteúdo completo a definir.
            </Copy>
          </Card>
        </>
      )}
    </Flow>
  );
}
export function Events() { return apiEnabled ? <LiveEvents/> : <PreviewEvents/>; }
function PreviewEvents() {
  const router = useRouter();
  const { state } = useMock();
  return (
    <Flow title="Eventos">
      <Card title={pilotEvent.title}>
        <Copy>{pilotEvent.when}</Copy>
        <Copy>{pilotEvent.where}</Copy>
        <Placeholder>Descrição e orientações do evento</Placeholder>
        {state.checkins.includes(pilotEvent.id) ? (
          <Notice>Presença já confirmada na demonstração.</Notice>
        ) : (
          <Button
            title="Registrar presença por QR Code"
            onPress={() => router.push("/qr")}
          />
        )}
      </Card>
    </Flow>
  );
}
export function Qr() { return apiEnabled ? <LiveEventQr/> : <PreviewQr/>; }
function PreviewQr() {
  const { state, dispatch } = useMock();
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <Flow title="Ler QR Code">
      <Placeholder>
        Área reservada para a câmera{"\n"}A câmera real não é acessada nesta
        versão.
      </Placeholder>
      <Copy muted>
        O pedido de permissão será apresentado aqui quando a leitura real for
        implementada.
      </Copy>
      {!!error && <Notice>{error}</Notice>}
      <Button
        title="Simular código válido"
        onPress={() => {
          if (state.offline) {
            setError(
              "Conecte-se para validar a presença. Nesta proposta, check-in exige conexão.",
            );
            return;
          }
          dispatch({ type: "checkin", id: pilotEvent.id });
          router.replace("/checkin");
        }}
      />
      <Button
        secondary
        title="Simular código inválido"
        onPress={() =>
          setError(
            "Código inválido ou evento indisponível. Confira o código e tente novamente.",
          )
        }
      />
      <Button
        secondary
        title="Simular permissão negada"
        onPress={() =>
          setError(
            "Permissão da câmera negada. Na versão final, você poderá habilitá-la nos ajustes do aparelho.",
          )
        }
      />
    </Flow>
  );
}
export function Checkin() {
  const { state } = useMock();
  const router = useRouter();
  return (
    <Flow
      title={
        state.checkins.includes(pilotEvent.id)
          ? "Presença confirmada"
          : "Presença não registrada"
      }
    >
      <Card title={pilotEvent.title}>
        <Copy>
          {state.checkins.includes(pilotEvent.id)
            ? "Check-in simulado registrado. Leituras repetidas não geram outra presença."
            : "Leia o código do evento para registrar sua presença."}
        </Copy>
        <Copy muted>
          EV e vínculo com missões dependem das regras aprovadas.
        </Copy>
      </Card>
      <Button
        title="Voltar para Hoje"
        onPress={() => router.replace("/home")}
      />
    </Flow>
  );
}
export function EditProfile() {
  const { state, dispatch, api } = useMock();
  const router = useRouter();
  const [name, setName] = useState(state.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Flow title="Editar perfil">
      <ParticipantAvatar height={200} />
      <Copy muted>O personagem 3D é o mesmo para todos os participantes.</Copy>
      <Field
        label="Nome de exibição"
        value={name}
        onChangeText={setName}
        maxLength={100}
      />
      {!!error && <Notice>{error}</Notice>}
      <Button
        busy={busy}
        title="Salvar perfil"
        disabled={!name.trim()}
        onPress={async () => {
          setBusy(true); setError('');
          try {
            if (apiEnabled) await api.saveProfile(name);
            else dispatch({ type: "patch", value: { name: name.trim() } });
            router.back();
          } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
          finally { setBusy(false); }
        }}
      />
    </Flow>
  );
}
export function Privacy() {
  const { dispatch, api } = useMock();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [revoke, setRevoke] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Flow title="Preferências e privacidade">
      <Button secondary title="Termos, privacidade e documentos" onPress={() => router.push('/legal')} />
      {!!error && <Notice>{error}</Notice>}
      {apiEnabled && api.data.consent?.status === 'granted' && <Card title="Registro de atividades autorizado">
        <Copy>Você pode revogar essa autorização quando quiser.</Copy>
        <Button secondary title="Rever autorização" onPress={() => setRevoke(value => !value)} />
        {revoke && <>
          <Copy>Ao revogar, novos registros ficam bloqueados até você autorizar novamente.</Copy>
          <Button title="Revogar autorização" busy={busy} onPress={async () => {
            setBusy(true); setError('');
            try { await api.acceptConsent(false); }
            catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível atualizar.'); }
            finally { setBusy(false); }
          }} />
        </>}
      </Card>}
      <Button
        secondary
        title="Sair da conta"
        onPress={() => setConfirm(!confirm)}
      />
      {confirm && (
        <Card title="Sair do Bóra?">
          <Copy>
            Você precisará entrar novamente para continuar sua jornada.
          </Copy>
          <Button
            title="Confirmar saída"
            onPress={() =>
              dispatch({
                type: "patch",
                value: {
                  session: "signedOut",
                  resumePath: null,
                },
              })
            }
          />
          <Button
            secondary
            title="Continuar no app"
            onPress={() => setConfirm(false)}
          />
        </Card>
      )}

    </Flow>
  );
}
export function Help() {
  const router = useRouter();
  return (
    <Flow title="Ajuda e suporte">
      <Card title="Sua jornada no Bóra">
        <Copy>Encontre atividades, acompanhe sua jornada e consulte os documentos do Bóra pelo aplicativo.</Copy>
      </Card>
      <Card title="Dados do aparelho">
        <Copy>Você escolhe se deseja conectar o Saúde ou Health Connect. A consulta depende da sua autorização e pode ser desativada a qualquer momento.</Copy>
        <Button secondary title="Gerenciar conexão" onPress={() => router.push('/health')} />
      </Card>
      <Card title="Termos e privacidade">
        <Copy>Consulte as condições de uso e como suas informações são utilizadas.</Copy>
        <Button secondary title="Ler documentos" onPress={() => router.push('/legal')} />
      </Card>
    </Flow>
  );
}
export function Demo() {
  const { state, dispatch } = useMock();
  const { resume } = useLocalSearchParams<{ resume?: string }>();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  return (
    <Flow title="Controles de demonstração">
      <Notice>Estes controles existem apenas para avaliar o protótipo.</Notice>
      <Button secondary title="Rever apresentação inicial" onPress={() => router.push('/presentation')} />
      <Check
        label="Simular falta de conexão"
        value={state.offline}
        onChange={(offline) => dispatch({ type: "patch", value: { offline } })}
      />
      <Check
        label="Fazer o próximo envio falhar"
        value={state.failNext}
        onChange={(failNext) =>
          dispatch({ type: "patch", value: { failNext } })
        }
      />
      <Copy muted>
        Restabelecer a conexão envia automaticamente as atividades pendentes.
        Envios com falha exigem nova tentativa no histórico.
      </Copy>
      <Button
        secondary
        title="Simular sessão expirada"
        onPress={() =>
          dispatch({
            type: "patch",
            value: {
              session: "expired",
              resumePath: resume === "/activity" ? "/activity" : "/home",
            },
          })
        }
      />
      <Button
        secondary
        title="Ver registros e reenvios"
        onPress={() => router.push("/history")}
      />
      <Button
        secondary
        title="Recomeçar demonstração"
        onPress={() => setConfirm(true)}
      />
      {confirm && (
        <Card title="Apagar dados fictícios deste aparelho?">
          <Copy>
            O perfil, consentimentos simulados, rascunhos, atividades e
            check-ins serão removidos.
          </Copy>
          <Button
            title="Apagar e voltar às boas-vindas"
            onPress={() => dispatch({ type: "reset" })}
          />
          <Button
            secondary
            title="Cancelar"
            onPress={() => setConfirm(false)}
          />
        </Card>
      )}
      <Copy muted>Mocks locais · nenhuma credencial real é armazenada.</Copy>
    </Flow>
  );
}
