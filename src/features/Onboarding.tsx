import { useEffect, useState } from "react";
import { Linking } from "react-native";
import { Redirect, useRouter } from "expo-router";
import {
  Flow,
  Button,
  Card,
  Check,
  Copy,
  Field,
  Notice,
} from "@/ui/Flow";
import LoginScreen from "./access/LoginScreen";
import { ParticipantAvatar } from "./avatar/ParticipantAvatar";
import { hasAccess, useMock } from "@/mocks/MockProvider";

import { apiEnabled } from "@/api/session";

type Step =
  | "login"
  | "organization"
  | "consent"
  | "profile"
  | "error"
  | "ineligible"
  | "declined";
export default function Onboarding() {
  const { state, dispatch, api } = useMock();
  const router = useRouter();
  const firstStep: Step =
    state.session === "active"
      ? apiEnabled && !state.membershipId ? "organization" : state.accepted
        ? "profile"
        : "consent"
      : "login";
  const [step, setStep] = useState<Step>(firstStep);
  const [accepted, setAccepted] = useState(false);
  const [name, setName] = useState(state.name);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!apiEnabled || state.session !== 'active') return;
    setStep(!state.membershipId ? 'organization' : !state.accepted ? 'consent' : 'profile');
    setName(state.name);
  }, [state.session, state.membershipId, state.accepted]);
  useEffect(() => { setAccepted(false); }, [api.data.consent?.policy_version, state.membershipId]);
  const policyAvailable = !apiEnabled || !!(api.data.consent?.configured && (api.data.consent.document_version || api.data.consent.policy_url));
  if (hasAccess(state)) return <Redirect href="/" />;
  async function login(multiple = false) {
    if (loading) return;
    if (state.offline) {
      setLoginError(
        "O primeiro acesso e a reautenticação precisam de conexão.",
      );
      return;
    }
    if (apiEnabled) {
      setLoading(true);
      setLoginError("");
      try {
        await api.login();
      } catch (error) {
        setLoginError(error instanceof Error ? error.message : "Não foi possível entrar.");
      } finally { setLoading(false); }
      return;
    }
    dispatch({ type: "patch", value: { session: "active" } });
    setStep(multiple ? "organization" : state.accepted ? "profile" : "consent");
  }
  if (step === "login") return <LoginScreen
    loading={loading} apiMode={apiEnabled}
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
      {!!loginError && <Notice>{loginError}</Notice>}
      {step === "organization" && (
        <>
          <Copy>
            Escolha a organização para continuar.
          </Copy>
          {(apiEnabled ? api.data.memberships.map(member => ({ id: member.id, name: member.organization_name }))
            : [{ id: 'fiocruz', name: 'Fiocruz · Cogetic' }, { id: 'other', name: 'Outra organização' }]).map(org => (
            <Button key={org.id} secondary title={org.name} disabled={api.busy} onPress={async () => {
              setLoginError('');
              try {
                if (apiEnabled) await api.selectMembership(org.id);
                else { dispatch({ type: 'patch', value: { organization: org.name } }); setStep(state.accepted ? 'profile' : 'consent'); }
              } catch (error) { setLoginError(error instanceof Error ? error.message : 'Não foi possível selecionar o vínculo.'); }
            }} />
          ))}
          {apiEnabled && api.data.memberships.length === 0 && <Copy>Nenhum vínculo ativo foi encontrado para sua conta.</Copy>}
          {apiEnabled && <Button secondary title="Atualizar vínculos" onPress={() => { void api.refresh().catch(() => {}); }} />}

        </>
      )}
      {step === "consent" && (
        <>
          <Card title="Participação voluntária">
            <Copy>
              Você escolhe o ritmo da sua jornada. Conheça os termos e saiba
              como suas informações são utilizadas.
            </Copy>
          </Card>
          {!policyAvailable && <Notice>Os termos de participação ainda não estão disponíveis. Tente novamente mais tarde.</Notice>}
          <Button secondary title="Ler Termos de Uso" onPress={() => {
            const policy = api.data.consent;
            if (apiEnabled && !policy?.document_slug && policy?.policy_url) {
              void Linking.openURL(policy.policy_url).catch(() => setLoginError('Não foi possível abrir os termos.'));
            } else router.push({ pathname: '/legal', params: { slug: policy?.document_slug ?? 'termos-de-uso', ...(policy?.document_version ? { version: String(policy.document_version) } : {}) } });
          }} />
          <Button secondary title="Ler Política de Privacidade" onPress={() => router.push({ pathname: '/legal', params: { slug: 'politica-de-privacidade' } })} />
          <Check
            label="Li os termos e autorizo o registro das minhas atividades."
            value={accepted}
            onChange={setAccepted}
          />
          <Button
            title="Continuar"
            disabled={!accepted || loading || !policyAvailable}
            onPress={async () => {
              setLoading(true); setLoginError('');
              try {
                if (apiEnabled) await api.acceptConsent();
                else { dispatch({ type: "patch", value: { accepted: true, telemetry: false } }); setStep("profile"); }
              } catch (error) {
                setLoginError(error instanceof Error ? error.message : 'Não foi possível registrar sua decisão.');
                await api.refresh().catch(() => {});
                setAccepted(false);
              } finally { setLoading(false); }
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
            onPress={async () => {
              try {
                if (apiEnabled) await api.saveProfile(name);
                else dispatch({ type: 'patch', value: { name: name.trim(), profileComplete: true } });
              } catch (error) { setLoginError(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
            }}
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
            Não encontramos um vínculo ativo para este acesso.
          </Copy>
          <Card title="Suporte">
            <Copy>Procure a equipe responsável pelo seu acesso.</Copy>
          </Card>
          <Button
            title="Usar outra conta"
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
              if (apiEnabled) setStep('login');
              else { dispatch({ type: "patch", value: { session: "active" } }); setStep("consent"); }
            }}
          />
        </>
      )}
    </Flow>
  );
}
