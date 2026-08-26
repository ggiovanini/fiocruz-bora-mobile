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
