import { ParticipantAvatar } from "./avatar/ParticipantAvatar";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Button, Card, Copy, Flow } from "@/ui/Flow";
import { useMock } from "@/mocks/MockProvider";
import { useLevelPreview } from "./levels/useLevelPreview";

export function Profile() {
  const router = useRouter();
  const { state, dispatch } = useMock();
  const evolution = useLevelPreview();
  const [confirm, setConfirm] = useState(false);
  return (
    <Flow title="Meu perfil">
      <ParticipantAvatar />
      <Copy>{state.name}</Copy>
      <Copy muted>Seu personagem Bóra · modelo padrão para todos.</Copy>
      <Copy muted>{state.organization}</Copy>
      <Card title="Sua evolução">
        <Copy>
          {state.activities.filter((a) => a.status === "confirmed").length}{" "}
          atividade(s) confirmada(s)
        </Copy>
        <Copy>{evolution.totalEarnedEV} EV acumulados · preservados no histórico.</Copy>
        <Copy muted>Nível {evolution.level} · {evolution.vitality} PV de Vitalidade na prévia.</Copy>
      </Card>
      <Button secondary title="Meu nível" onPress={() => router.push('/levels')} />
      <Button
        secondary
        title="Minha constância"
        onPress={() => router.push("/constancy")}
      />
      <Button
        secondary
        title="Editar perfil"
        onPress={() => router.push("/edit-profile")}
      />
      <Button
        secondary
        title="Conectar dados de atividade"
        onPress={() => router.push("/health")}
      />
      <Button
        secondary
        title="Preferências e privacidade"
        onPress={() => router.push("/privacy")}
      />
      <Button
        secondary
        title="Ajuda e suporte"
        onPress={() => router.push("/help")}
      />
      <Button
        secondary
        title="Controles de demonstração"
        onPress={() => router.push("/demo")}
      />
      <Button
        secondary
        title="Sair da conta"
        onPress={() => setConfirm(true)}
      />
      {confirm && (
        <Card title="Sair da demonstração?">
          <Copy>
            Seus registros fictícios serão preservados neste aparelho.
          </Copy>
          <Button
            title="Confirmar saída"
            onPress={() =>
              dispatch({
                type: "patch",
                value: { session: "signedOut", resumePath: null },
              })
            }
          />
          <Button
            secondary
            title="Continuar no aplicativo"
            onPress={() => setConfirm(false)}
          />
        </Card>
      )}
    </Flow>
  );
}
