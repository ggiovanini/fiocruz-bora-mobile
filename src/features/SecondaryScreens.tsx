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
export function Content({ tab = false }: { tab?: boolean }) {
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
export function Article() {
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
export function Events() {
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
export function Qr() {
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
  const { state, dispatch } = useMock();
  const router = useRouter();
  const [name, setName] = useState(state.name);
  return (
    <Flow title="Editar perfil">
      <ParticipantAvatar height={200} />
      <Copy muted>O personagem 3D é o mesmo para todos os participantes.</Copy>
      <Field
        label="Nome de exibição"
        value={name}
        onChangeText={setName}
        maxLength={50}
      />
      <Button
        title="Salvar perfil"
        disabled={!name.trim()}
        onPress={() => {
          dispatch({ type: "patch", value: { name: name.trim() } });
          router.back();
        }}
      />
    </Flow>
  );
}
export function Privacy() {
  const { state, dispatch } = useMock();
  const [confirm, setConfirm] = useState(false);
  return (
    <Flow title="Preferências e privacidade">
      <Notice>
        Preferências locais de demonstração. Nenhum consentimento real é
        coletado.
      </Notice>
      <Card title="Participação no piloto">
        <Copy>
          Consentimento simulado: {state.accepted ? "ativo" : "não concedido"}
        </Copy>
        <Copy muted>
          Texto, finalidade, versão e retenção serão definidos com as áreas
          responsáveis.
        </Copy>
      </Card>
      <Check
        label="Simular consentimento opcional para métricas de uso"
        value={state.telemetry}
        onChange={(telemetry) =>
          dispatch({ type: "patch", value: { telemetry } })
        }
      />
      <Copy muted>O envio real de telemetria permanece desabilitado.</Copy>
      <Button
        secondary
        title="Rever minha participação"
        onPress={() => setConfirm(!confirm)}
      />
      {confirm && (
        <Card title="Revogar participação simulada?">
          <Copy>
            Você voltará à entrada. Seus dados fictícios permanecerão no
            aparelho até limpar a demonstração.
          </Copy>
          <Button
            title="Confirmar revogação simulada"
            onPress={() =>
              dispatch({
                type: "patch",
                value: {
                  accepted: false,
                  telemetry: false,
                  session: "signedOut",
                  resumePath: null,
                },
              })
            }
          />
          <Button
            secondary
            title="Manter participação"
            onPress={() => setConfirm(false)}
          />
        </Card>
      )}
      <Card title="Acesso e exclusão de dados">
        <Copy>
          O canal de solicitação e o procedimento institucional serão definidos
          antes do piloto.
        </Copy>
      </Card>
    </Flow>
  );
}
export function Help() {
  return (
    <Flow title="Ajuda e suporte">
      <Card title="Como funciona esta versão?">
        <Copy>
          O fluxo utiliza dados fictícios. A opção Dados de atividade permite
          consultar dados reais do Saúde ou Health Connect, somente após sua
          autorização. Essa leitura fica na memória durante a sessão. Nenhuma
          API, conta institucional ou câmera é acessada.
        </Copy>
      </Card>
      <Card title="Registro sem conexão">
        <Copy>
          Use os controles de demonstração no Perfil para simular falta de
          conexão. A atividade ficará pendente e será enviada quando você
          restabelecer a conexão simulada.
        </Copy>
      </Card>
      <Card title="Energia Vital">
        <Copy>
          A pontuação será exibida após a definição das regras. Confirmar uma
          atividade demonstra apenas a navegação e o progresso.
        </Copy>
      </Card>
      <Card title="Suporte do piloto">
        <Copy>Canal institucional a definir com a Cogetic.</Copy>
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
