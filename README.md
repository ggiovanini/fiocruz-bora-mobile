# Bóra Mobile

Aplicativo React Native do Bóra para iOS e Android. É responsável pela experiência do colaborador, cache local, fila offline e envio de ações à API central.

## Base entregue

- Expo SDK 57 e React Native com TypeScript estrito;
- Expo Router com abas para Hoje, Missões e Perfil;
- tokens e componentes iniciais em `src/design`;
- Expo Observe para métricas de desempenho, erros e navegação;
- despacho de telemetria bloqueado até que o consentimento seja registrado pela tela de privacidade.

## Desenvolvimento

```bash
npm ci
npm start
npm run typecheck
```

Use Node **20.19.4**. Para validar telemetria do Expo Observe é necessário um development build; o Expo Go não envia esses eventos.

## Escopo inicial

- autenticação e seleção de organização;
- consentimento e configurações de privacidade;
- home de Energia Vital, missões, ranking e perfil/avatar;
- registro de atividades e sincronização idempotente;
- funcionamento em rede instável ou sem conexão.

## Padrões

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir uma alteração. A aplicação não calcula a pontuação definitiva nem guarda credenciais de integrações.

## Protótipo navegável

O fluxo completo de demonstração, seus cenários de teste e os pontos de integração com a API estão em [docs/fluxo-demonstracao.md](docs/fluxo-demonstracao.md).

A demonstração inclui quatro abas, primeiro acesso, atividades com persistência local, missões, conteúdos, eventos, privacidade e controles para simular falha, offline e sessão expirada. Não há login ou pontuação reais. Telemetria permanece desativada mesmo quando o consentimento fictício é selecionado.

## Integração com Saúde e Health Connect

O Perfil agora oferece leitura real de passos e treinos dos últimos sete dias, mediante autorização, com atualização automática durante o uso e opção manual. Os dados permanecem somente em memória, sem envio à API ou pontuação. Consulte [o escopo e o roteiro para aparelhos reais](docs/integracao-saude.md). É necessário recompilar o app; Expo Go não é compatível.

## Compilação Android

Para alinhar pacote, versão, ícones e plugins com o projeto nativo, consulte [build Android](docs/build-android.md). O prebuild deve ser seguido de uma nova compilação e instalação.

## Compilação iOS

O projeto compila os módulos Expo localmente e aplica uma compatibilidade do ExpoModulesJSI com Swift 6.4 no `postinstall`. Instruções e motivo em [docs/build-ios.md](docs/build-ios.md).

## Materiais do piloto TestFlight

O pacote em [`store/testflight-pt-BR`](store/testflight-pt-BR/README.md) reúne ícones, seis imagens com capturas reais (iPhone/iPad), descrição beta, roteiro de teste e notas para revisão. A prévia está em `store/testflight-pt-BR/index.html`. O ícone iOS principal está configurado em `expo.ios.icon`; precisa ser incorporado ao próximo build.

## Base de acesso e instalações

[Requisitos de identidade, instalações e notificações](docs/requisitos-acesso-e-notificacoes.md). O acesso temporário e a jornada já estão conectados; consulte a seção de integração com a API abaixo.

## Equipes

[Requisitos de equipes independentes e adesão pelo usuário](docs/requisitos-equipes.md). A participação real ainda não está implementada.

## Linguagem da interface

A interface deve apresentar o fluxo final do produto, sem avisos repetitivos de piloto, teste ou simulação. Ao conectar um recurso à API, remover os textos provisórios correspondentes. Recursos ainda locais devem indicar essa condição de forma breve, sem afirmar envio, consentimento formal ou sincronização inexistentes. Controles de desenvolvimento ficam restritos a `__DEV__`; opções sem efeito, como métricas ainda não integradas, não devem aparecer como funcionalidades disponíveis.

## Integração com a API

Com `EXPO_PUBLIC_API_URL` configurada, perfil, vínculos, consentimento, catálogo, atividades, histórico, energia, Vitalidade, nível, constância, meta e notificações usam a API. Consulte [o contrato da integração](docs/integracao-api.md). Os dados antigos do protótipo não são importados. Sem essa configuração, permanece disponível a navegação com dados de exemplo.
