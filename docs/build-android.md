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

O identificador atual é `br.fiocruz.mobile.bora`, com versão 1.0.2 e versionCode 155. O identificador anterior, `br.fiocruz.boramobile`, representa outra instalação no Android; o sistema não migra seus dados locais automaticamente. Para próximos builds distribuídos, incremente `android.versionCode` em `app.json`.

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

## Ícone e splash

A splash usa `expo-splash-screen`, fundo azul `#002542` e símbolo centralizado. Sua liberação espera fontes e preferências iniciais ficarem prontas, sem temporizador artificial. Não depende de esperar uma resposta da API. A apresentação de boas-vindas permanece separada.

O símbolo do ícone adaptativo cabe no círculo seguro de diâmetro 66/108 do Android. As versões colorida, monocromática e de splash são derivadas do SVG original, preservando o B e o castelo:

```sh
npm run assets:android
npx expo prebuild --platform android --no-install
npm run android
```

O gerador valida a distância máxima dos pixels visíveis ao centro antes de salvar o foreground. Mantenha a margem transparente: preencher o canvas com o B provoca cortes nas máscaras redondas. O fundo é uma camada azul separada.

Mudanças nos ícones e na splash exigem nova instalação. Launchers podem manter o ícone antigo em cache. A aparência final da splash deve ser conferida também em um build Release; builds de desenvolvimento podem apresentar diferenças.

## API nos builds Release

Para Release, use Node 22.11 ou superior no ambiente do Android Studio: o validador compartilhado com o iOS usa `node:util.parseEnv`.

O build Release, inclusive pelo Android Studio, usa exclusivamente a URL `EXPO_PUBLIC_API_URL` de `.env.testflight`, o mesmo arquivo usado no Archive iOS. Preencha o arquivo a partir de `.env.testflight.example` com a URL HTTPS externa terminando em `/api/v1`.

O plugin `with-android-release-api` configura o empacotamento para validar esse endereço e sobrescrever tanto `EXPO_PUBLIC_API_URL` quanto `EXPO_PUBLIC_ANDROID_API_URL`, ignorando os arquivos dotenv locais nessa etapa. Se o arquivo estiver ausente ou a URL for inválida/local, o build falha. Alterar `.env.testflight` invalida o bundle para a próxima compilação. A URL fica incorporada ao app; mudanças exigem novo build.

Debug mantém o carregamento habitual do ambiente de desenvolvimento. A configuração é preservada pelo plugin após `expo prebuild`.

## Android Studio no macOS: Node não encontrado

Se a sincronização falhar com `Cannot run program "node"`, encerre completamente o Android Studio e abra `scripts/open-android-studio.command` pelo Finder. O atalho usa o Node 22.11.0 instalado pelo NVM, encerra processos antigos do Gradle e abre o projeto com o PATH correto. Se outra versão do Node for instalada, atualize `BORA_NODE_DIR` no atalho. O Android Studio precisa estar encerrado para receber o novo ambiente.

## Java do Gradle

`android/gradle/gradle-daemon-jvm.properties` fixa `toolchainVersion=17`, usando o JDK 17 instalado. A seleção de Java 25 pelo assistente do Android Studio causou falhas na configuração CMake de módulos nativos com a mensagem `A restricted method in java.lang.System has been called`. O atalho de abertura também usa JDK 17.

## Versão 1.0.2 · build 158 · 12/11/2026

Android incrementado de 157 para 158 em `app.json` e `android/app/build.gradle`, alinhado ao build iOS 158. Prebuild Android executado sem limpeza e sem reinstalar dependências.

A compilação Release gerou APK e AAB com Node 20.19.4, JDK 17 e as quatro arquiteturas configuradas no projeto. A chave de upload existente, guardada fora do repositório, foi aplicada por uma configuração temporária do Gradle; senhas e chave não foram adicionadas ao projeto. A configuração padrão de assinatura do template não é a usada nesses dois arquivos distribuíveis.

Arquivos `bora-1.0.2-158.apk` e `bora-1.0.2-158.aab` salvos na pasta local de assinatura Android do projeto. A versão e o pacote do APK foram conferidos com AAPT; APK e AAB tiveram suas assinaturas verificadas e comparadas ao certificado de upload existente. O build usa a API definida em `.env.testflight` e desabilita login local. Esta preparação não envia arquivos à Google Play nem inclui teste em aparelho.
