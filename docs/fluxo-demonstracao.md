# Fluxo navegável do Bóra

## Escopo

Aplicativo React Native/Expo com telas funcionais para avaliar navegação. Todo acesso, consentimento, envio e check-in é simulado. Os dados fictícios são salvos localmente com AsyncStorage; não há chamadas à API, login institucional, câmera real ou envio de telemetria.

A API continuará sendo a autoridade para identidade, permissões, consentimentos, atividades e EV. O estado de sessão persistido neste protótipo não é autenticação e não deve ser reaproveitado como mecanismo de segurança.

## Navegação

- Primeiro acesso: boas-vindas → entrada simulada → organização (cenário com mais de um vínculo) → consentimento → perfil inicial → Hoje.
- Sessão válida: abre Hoje; acesso direto às telas internas exige adesão e perfil completos na simulação.
- Abas: Hoje, Missões, Ranking por equipe e Perfil.
- Atividade: formulário → revisão → envio simulado → resultado → histórico/Hoje/missão de origem.
- Missões: lista/filtros → detalhe → atividade vinculada → progresso demonstrativo.
- Bem-estar: lista de conteúdos → conteúdo placeholder.
- Eventos: evento → QR Code simulado → confirmação de presença, sem duplicidade.
- Perfil: personalização, privacidade, ajuda, controles de demonstração e saída.

## Cenários para avaliação

1. Primeiro acesso: Continuar permanece bloqueado até selecionar o consentimento fictício.
2. Formulário: duração vazia, zero, negativa ou data inválida não avançam. Um rascunho pode ser retomado pelo histórico ou pela home.
3. Offline: Perfil → Controles de demonstração → Simular falta de conexão. Registrar atividade, fechar/reabrir o aplicativo e confirmar que permanece pendente.
4. Reconexão: desativar falta de conexão. Registros pendentes são enviados automaticamente pelo mock.
5. Falha: ativar Fazer o próximo envio falhar; enviar atividade; abrir o registro e tocar Tentar novamente. O ID é preservado.
6. Sessão: no formulário, Testar conexão ou sessão → Simular sessão expirada → Simular entrada institucional. O formulário e o rascunho são retomados.
7. Missão: registrar a duração da meta ilustrativa e confirmar; observar a missão concluída. Registros pendentes/falhos não contam para o progresso.
8. QR: simular código inválido, permissão negada e código válido. A leitura real permanece fora desta etapa; check-in requer conexão simulada.
9. Privacidade: revogação simulada retorna à entrada e interrompe envios. Os registros fictícios permanecem até limpar a demonstração.
10. Perfil → Controles de demonstração → Recomeçar demonstração: confirmação explícita remove os dados fictícios locais.

## Organização do código

- `app/`: rotas Expo Router e abas; guarda de navegação da demonstração.
- `src/features/`: telas agrupadas por fluxo.
- `src/ui/Flow.tsx`: estrutura visual, formulários e componentes acessíveis.
- `src/mocks/catalog.ts`: missões, conteúdos e evento fictícios.
- `src/mocks/model.ts`: estado, transições, validação de formulário e recuperação de envios interrompidos.
- `src/mocks/MockProvider.tsx`: armazenamento local serializado e envio simulado, com prevenção de duplicidade e falhas controladas.

## Executar e verificar

Usar Node 20.19.4 ou versão compatível com Expo SDK 57.

```sh
npm ci
npm start
npm run web
npm test
```

AsyncStorage adiciona um módulo nativo: builds de desenvolvimento já instalados precisam ser recompilados com `npm run ios` ou `npm run android`. A prévia web permite revisar o mesmo fluxo sem recompilar os projetos nativos.

Os testes cobrem duplicidade, retomada de registros e rascunhos, expiração de sessão, revogação, check-in, validação e reset. A exportação de bundles verifica compatibilidade do código Android/iOS; não substitui a execução em aparelhos.

## Próxima entrega: autenticação

Definir o provedor institucional e o contrato de identidade/vínculos; implementar sessão segura e renovação, conectar a guarda de rotas e substituir a entrada simulada. Tokens reais deverão usar armazenamento seguro, separado dos dados fictícios. Na integração com atividades, trocar o envio simulado por um cliente da API mantendo o identificador idempotente e os estados apresentados nas telas.

EV, níveis, termos definitivos, conteúdo editorial e ranking real permanecem placeholders. A conclusão de missão por minutos é apenas uma fixture explícita desta demonstração.

## Verificação desta entrega

- TypeScript e oito testes automatizados aprovados.
- Navegador: primeiro acesso, bloqueio do consentimento, abas, registro offline persistido após recarga, falha e reenvio, retomada do formulário após sessão expirada e conclusão de missão verificados.
- Dimensões de celular (390 × 844): formulário sem transbordamento horizontal.
- Bundles Android e iOS exportados com sucesso. A execução em aparelho e a recompilação dos projetos nativos permanecem etapas separadas.

## iOS 27 / Xcode 27

O SDK iOS 27 exige o ciclo de vida `UIScene`. O projeto permanece no Expo SDK 57, usando o suporte retroportado a partir de `expo@57.0.23` (lockfile atualizado para 57.0.24), React Native 0.86.3 e o plugin `expo-build-properties` com `ios.enableSceneSupport: true` em `app.json`.

O plugin ajusta o AppDelegate para `ExpoReactNativeFactoryProvider`, transfere a criação da janela para o runtime do Expo e declara `EXExpoAppSceneDelegate` no `UIApplicationSceneManifest`. Não é necessário criar um SceneDelegate manual neste SDK.

Após alterar essa configuração, regenerar o iOS preservando a pasta existente e atualizar os Pods antes de recompilar:

```sh
npx expo prebuild --platform ios --no-clean
npm run ios
```

Se uma atualização de versão gerar conflito com o lockfile de Pods, sincronizar com `cd ios && pod update --no-repo-update`. Reiniciar o servidor Expo após atualizar as dependências. Referência oficial: https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md#staying-on-sdk-57-with-xcode-27

A correção UIScene foi verificada com `xcodebuild` (Debug, iPhone 18 Pro / iOS 27, Xcode 27): **BUILD SUCCEEDED**. O Info.plist do aplicativo compilado declara `EXExpoAppSceneDelegate`. A abertura visual do aplicativo no simulador não foi validada nesta execução.

## Dados reais do aparelho

A opção **Perfil → Conectar dados de atividade** é uma exceção aos mocks: consulta Saúde/Health Connect após autorização explícita. Os registros reais ficam separados da demonstração, sem pontuação, API ou persistência. Veja [integração com o aparelho](integracao-saude.md).

## Revisão de leiaute em 19/10/2026

O registro de atividades agora abre uma escolha de formas de entrada (manual, aparelho, evento), preservando rascunhos. O manual oferece catálogo ilustrativo ampliado, busca, filtros de descoberta e nome personalizado. A seleção revela tempo/data, com revisão antes do envio.

A nova tela Desafios usa a meta de EV combinado da prévia; exemplos antigos de missões por minutos não são cotas obrigatórias por modalidade. Home, Desafios e laboratório compartilham a prévia de EV, que não é pontuação oficial nem crédito automático por registros. Ver `docs/layout-spec.md`.

## Apresentação inicial · 19/10/2026

A primeira abertura exibe três telas antes do acesso: significado das cores, soma em EV e constância diária. **Continuar** avança, **Voltar** retorna e **Pular** conclui imediatamente. **Bóra começar** salva a conclusão e segue para o fluxo normal. Após concluir, a apresentação não reaparece ao reabrir, sair da conta ou recomeçar a demonstração. A preferência é local ao aparelho; limpar os dados locais permite repetir a apresentação. Se o aplicativo for fechado antes de concluir ou pular, a apresentação continua pendente.

A antiga boas-vindas com placeholder foi substituída pela apresentação. Depois dela, novos participantes iniciam em **Entrar no Bóra**, seguindo por consentimento e perfil; sessões válidas mantêm o destino normal. A preferência é lida antes de exibir as rotas internas, sem alterar atividades ou EV. Os testes de armazenamento cobrem primeira abertura, persistência independente do reset e falhas de leitura/gravação.

## Acompanhar constância · 19/10/2026

Hoje → indicador **Constância** ou **Minha constância** abre a sequência de dias, a faixa dos últimos sete dias, o calendário e os detalhes do dia selecionado. A tela também está disponível em Meu perfil. Toque em datas passadas para consultar a soma das duas energias; navegue entre meses ou use **Hoje** para retornar. Dias futuros não podem ser selecionados.

O histórico é ilustrativo. Para simular a conclusão do dia, ajuste a energia/meta em **Explorar meu avatar**, volte à constância e observe a atualização do mesmo dia na home, na faixa semanal, no calendário e na sequência. O EV pode vir de uma só cor ou da soma das duas. Atividades cadastradas continuam sem atribuição automática de EV nesta etapa.


## Acompanhar nível e Vitalidade · 19/10/2026

Hoje → indicador **Nível** ou Meu perfil → **Meu nível** abre EV acumulados e Vitalidade (PV) separados, faixa do nível e próximo marco. **Experimentar evolução** compara cenários. Com 950 EV acumulados e 950 PV, sete dias mantêm ambos; oito dias deixam 930 PV; 30 dias deixam 490 PV (nível 3), **sempre preservando os 950 EV**. Repor 150 EV físicos/mentais resulta em 1.100 EV acumulados e 640 PV (nível 4). Pausa protegida evita desgaste de PV no período. Reiniciar restaura o exemplo.

O desgaste após sete dias de inatividade afeta somente Vitalidade. Faixas e taxa são ilustrativas. Não há pontuação oficial, desconto de EV histórico, mudança em atividades ou calendário, nem integração desses cálculos à API nesta etapa.

## Revisão do login · 19/10/2026

A entrada principal é **Continuar com a Fiocruz**, com indicação de demonstração. O botão de perfil não aparece durante a entrada. Em **Cenários de demonstração**, **Rever apresentação inicial** permite percorrer novamente as três telas e voltar ao login. O mesmo atalho está em Meu perfil → Controles de demonstração; a reapresentação retorna à origem e não limpa sessão, rascunhos ou a preferência de primeira abertura.
