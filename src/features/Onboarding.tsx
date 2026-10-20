import { useState } from "react";
import { Redirect, useRouter } from "expo-router";
import {
  Flow,
  Button,
  Card,
  Check,
  Copy,
  Field,
  Notice,
  Placeholder,
} from "@/ui/Flow";
import LoginScreen from "./access/LoginScreen";
import { ParticipantAvatar } from "./avatar/ParticipantAvatar";
import { hasAccess, useMock } from "@/mocks/MockProvider";

type Step =
  | "login"
  | "organization"
  | "consent"
  | "profile"
  | "error"
  | "ineligible"
  | "declined";
export default function Onboarding() {
  const { state, dispatch } = useMock();
  const router = useRouter();
  const firstStep: Step =
    state.session === "active"
      ? state.accepted
        ? "profile"
        : "consent"
      : "login";
  const [step, setStep] = useState<Step>(firstStep);
  const [accepted, setAccepted] = useState(false);
  const [telemetry, setTelemetry] = useState(state.telemetry);
  const [name, setName] = useState(state.name);
  const [loginError, setLoginError] = useState("");
  if (hasAccess(state)) return <Redirect href="/" />;
  function login(multiple = false) {
    if (state.offline) {
      setLoginError(
        "O primeiro acesso e a reautenticação precisam de conexão.",
      );
      return;
    }
    dispatch({ type: "patch", value: { session: "active" } });
    setStep(multiple ? "organization" : state.accepted ? "profile" : "consent");
  }
  if (step === "login") return <LoginScreen
    expired={state.session === "expired"} offline={state.offline} error={loginError}
    onLogin={() => login()} onMultiple={() => login(true)}
    onFailure={() => setStep("error")} onIneligible={() => setStep("ineligible")}
    onPresentation={() => router.push('/presentation')}
    onReconnect={() => { dispatch({ type: "patch", value: { offline: false } }); setLoginError(""); }}
  />;
  const title = {
    organization: "Seu vínculo",
    consent: "Sua participação",
    profile: "Vamos nos conhecer",
    error: "Não foi possível entrar",
    ineligible: "Vínculo não encontrado",
    declined: "Você decide quando começar",
  }[step];
  return (
    <Flow title={title} back={false}>
      {step === "organization" && (
        <>
          <Copy>
            Esta tela aparece apenas quando há mais de um vínculo elegível.
          </Copy>
          {["Fiocruz · Cogetic", "Organização de demonstração"].map((org) => (
            <Button
              key={org}
              secondary
              title={org}
              onPress={() => {
                dispatch({ type: "patch", value: { organization: org } });
                setStep(state.accepted ? "profile" : "consent");
              }}
            />
          ))}
        </>
      )}
      {step === "consent" && (
        <>
          <Notice>
            Termos ilustrativos, ainda sem validade para adesão real.
          </Notice>
          <Card title="Participação voluntária">
            <Copy>
              Atividades e progresso ficam no seu perfil. A proposta do piloto
              prevê apenas indicadores agregados para gestores.
            </Copy>
          </Card>
          <Placeholder>
            Termos completos · finalidades · versão · política de privacidade a
            validar
          </Placeholder>
          <Check
            label="Li o resumo e quero simular minha participação."
            value={accepted}
            onChange={setAccepted}
          />
          <Check
            label="Simular consentimento opcional para métricas de uso."
            value={telemetry}
            onChange={setTelemetry}
          />
          <Button
            title="Continuar"
            disabled={!accepted}
            onPress={() => {
              dispatch({ type: "patch", value: { accepted: true, telemetry } });
              setStep("profile");
            }}
          />
          <Button
            secondary
            title="Não participar agora"
            onPress={() => {
              dispatch({ type: "patch", value: { session: "signedOut" } });
              setStep("declined");
            }}
          />
          <Copy muted>
            Mesmo com esta opção marcada, a demonstração não envia telemetria.
          </Copy>
        </>
      )}
      {step === "profile" && (
        <>
          <ParticipantAvatar introductory height={220} />
          <Copy muted>Este é o personagem Bóra, o mesmo para todos os participantes.</Copy>
          <Field
            label="Nome de exibição"
            value={name}
            maxLength={50}
            onChangeText={setName}
            autoComplete="off"
          />
          <Copy muted>{state.organization}</Copy>
          <Button
            title="Concluir e começar"
            disabled={!name.trim()}
            onPress={() =>
              dispatch({
                type: "patch",
                value: { name: name.trim(), profileComplete: true },
              })
            }
          />
        </>
      )}
      {step === "error" && (
        <>
          <Copy>O acesso não foi concluído. Tente novamente.</Copy>
          <Button title="Tentar novamente" onPress={() => setStep("login")} />
        </>
      )}
      {step === "ineligible" && (
        <>
          <Copy>
            A identidade foi reconhecida no cenário simulado, mas não possui
            vínculo elegível para o piloto.
          </Copy>
          <Card title="Suporte">
            <Copy>Canal institucional a definir com a Cogetic.</Copy>
          </Card>
          <Button
            title="Usar outra conta simulada"
            onPress={() => setStep("login")}
          />
        </>
      )}
      {step === "declined" && (
        <>
          <Copy>
            Você pode voltar em outro momento. A participação é voluntária.
          </Copy>
          <Button title="Entrar no Bóra" onPress={() => setStep("login")} />
          <Button
            secondary
            title="Rever os termos"
            onPress={() => {
              dispatch({ type: "patch", value: { session: "active" } });
              setStep("consent");
            }}
          />
        </>
      )}
    </Flow>
  );
}
