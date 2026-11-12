# Login e primeiras permissões

Atualizado em 09/11/2026.

## Experiência

- Login com apenas a assinatura Bóra/Fiocruz, nova imagem do Bean convidando a entrar, “Bóra começar?”, a frase “Mexa-se pela mente, mova-se pela vida.” e um botão “Entrar com Login Único”. Mensagens de falha/conexão aparecem somente quando necessárias. Os cenários de demonstração foram retirados desta tela.
- A disposição segue a referência enviada: logo no alto, título e texto alinhados à esquerda, um único botão abaixo e Bean ampliado na base, com recorte nas bordas. As cores e a identidade visual do Bóra foram mantidas.
- A escolha da organização acontece após o acesso, durante o cadastro. Em seguida aparece “Sua escolha está salva!”, explicando que alguém da organização confirmará a participação e que a jornada pessoal já pode começar.
- Depois dos termos/perfil e antes de liberar a interação com o app, aparecem duas explicações: notificações e câmera. Cada uma tem um pedido explícito e a opção “Agora não”. Não se abre a câmera nessa apresentação.
- A decisão de ter visto cada explicação é salva por instalação/aparelho em `bora:permission-explanations:v1`. Tanto permitir quanto deixar para depois concluem a explicação. A gravação ocorre antes do diálogo do sistema para sobreviver a uma interrupção. Reinstalar ou limpar os dados pode fazer a apresentação aparecer novamente.
- Essa marca não representa permissão concedida: o estado real é consultado no sistema. A preferência de avisos continua separada por conta. Negar não bloqueia a jornada e não abre os ajustes automaticamente na apresentação inicial.
- Configurações → Aplicativo → Permissões do aparelho reúne a câmera e o acesso a Avisos do aparelho, que concentra os controles de notificação. A caixa de mensagens permanece separada. O QR direciona a essa página se a câmera não estiver autorizada e mantém a entrada manual do código. No navegador, as explicações informam que a ativação é feita no app instalado e permitem continuar sem solicitar permissões nativas.
- Os avisos disponíveis hoje são locais, com o app em uso, a partir da consulta à caixa de entrada. A apresentação não promete push com o app fechado.
- O navegador Expo permanece montado sob a apresentação das permissões, evitando perda de navegação e de estado ao concluir as explicações.

## Autenticação

Atualização de 11/11/2026: quando a API está configurada, o botão usa o Login Único institucional pelo navegador seguro do sistema, exclusivamente no staging online. A sessão é guardada no armazenamento seguro do aparelho. O fluxo e os requisitos de build estão em [Login Único Fiocruz](login-unico.md). O modo de protótipo sem API permanece separado.

## Validação

Tipos e fluxos automatizados, prévia visual do login em 390 × 844 e compilação web. As solicitações nativas e o retorno dos ajustes precisam ser verificados em iOS/Android antes de distribuir o aplicativo. Os testes cobrem persistência, “agora não”, interrupção entre as duas explicações e recusa sem abertura automática dos ajustes.

## Nova imagem do Bean

Arquivo final: `assets/images/bean/bean-login-invite-v1.png`.

Criação pelo gerador de imagens integrado, com fundo transparente e o Bean aprovado como referência (`assets/images/bean/bean-wave-v1.png`). O original da referência foi preservado. A imagem gerada foi inspecionada e copiada para o projeto; o login não depende da pasta de imagens geradas fora dele.

Prompt utilizado:

> Use case: stylized-concept. Asset type: transparent PNG illustration for the Bóra mobile app login screen. Reference image is the approved Bean mascot; preserve its exact character identity, green rounded bean body, blue flowing region around its head and left flank, blue hand tip, black oval eyes, simple friendly black smile, tiny rounded feet and the same small blue castle outline emblem on its chest. Generate a NEW full body pose welcoming the viewer to join: Bean leans slightly forward with a warm smile, one arm out toward the viewer in an inviting open gesture, the other raised in a gentle wave. Polished soft 3D clay/vinyl rendering, bright lime green and sky blue matching the reference, softly lit, no props, no text, no additional logos, no scenery, no floating particles, no rings. Real transparent alpha background. Square composition, entire body and both hands and feet in frame, generous 8 percent safe margins, character occupying about 80 percent of canvas, crisp edges for rendering at 300px wide against a dark navy app background. Do not add human fingers or clothing; preserve rounded mitten-like arms and feet.
