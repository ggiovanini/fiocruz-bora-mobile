# Compilação Android

Use Node 20.19.4, JDK 17 e Android SDK configurado. A fonte das configurações nativas é `app.json` junto com os plugins em `plugins/`.

## Reaplicar configurações

Após alterar pacote, versão, ícones, permissões ou plugins:

```sh
npx expo prebuild --platform android --no-install
npx expo run:android
```

Para regenerar completamente o Android a partir das configurações:

```sh
npx expo prebuild --platform android --clean --no-install
npx expo run:android
```

`--platform android` limita a geração ao Android. O comando sem plataforma também pode regenerar o iOS. Antes de usar `--clean`, mantenha ajustes nativos necessários em plugins e preserve alterações manuais ainda não versionadas.

## Identidade

O identificador atual é `br.fiocruz.mobile.bora`, com versão 1.0.1 e versionCode 154. O identificador anterior, `br.fiocruz.boramobile`, representa outra instalação no Android; o sistema não migra seus dados locais automaticamente. Para próximos builds distribuídos, incremente `android.versionCode` em `app.json`.

## Configurações que precisam sobreviver ao prebuild

- `with-health-rationale`: gera a explicação acessível pelos ajustes do Health Connect, com o pacote atual e o fluxo de importação explícita.
- `with-android-dev-support`: usa `BuildConfig.DEBUG` do aplicativo ao criar o React host. Debug deve carregar o JavaScript do Metro; Release deve carregar o bundle empacotado. O padrão da fábrica Expo usa a flag da biblioteca React Native, que pode desativar o Metro mesmo em um APK Debug.
- Permissões, câmera, versão mínima e ícones são definidos pelos plugins e pelas propriedades de `app.json`.

O prebuild não compila nem instala o app. Alterações nativas exigem nova compilação e instalação. Para dispositivo USB ou emulador usando Metro na porta 8081, o redirecionamento pode ser configurado com `adb reverse tcp:8081 tcp:8081`.

A configuração de assinatura Release ainda usa a chave de desenvolvimento do template; a assinatura de distribuição deve ser configurada antes da publicação na loja.

## Metro local no macOS

Se o Metro escutar apenas em `::1`, o redirecionamento do emulador pode não alcançar o servidor. Para restringir o servidor ao localhost IPv4:

```sh
NODE_OPTIONS=--dns-result-order=ipv4first npx expo start --localhost --clear
adb reverse tcp:8081 tcp:8081
```

## Telemetria opcional

O módulo nativo `expo-observe` é excluído do autolinking Android em `package.json`: a versão instalada inicializa o dispatcher mesmo quando o JavaScript não importa o módulo e interrompe o app sem `extra.eas.projectId`. O carregamento da telemetria também é condicionado à configuração no JavaScript, e fica desativado no Android. O iOS continua elegível quando houver um ID de projeto configurado, sempre com envio condicionado ao consentimento.

Para habilitar telemetria Android futuramente, configure o projeto Expo real, revise o comportamento de coleta/consentimento, remova a exclusão nativa e a condição de plataforma e gere um novo build. Não use um ID fictício apenas para contornar o erro.
