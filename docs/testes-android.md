# Verificação Android — 22/10/2026

## Estado atual

- Pacote Android alinhado com app.json: `br.fiocruz.mobile.bora`.
- Versão 1.0.1 e versionCode 154; ícones, cores e permissão de câmera reaplicados pelo prebuild.
- Classes Kotlin movidas para o pacote atual; explicação nativa do Health Connect atualizada no plugin e na classe gerada.
- Node 20.19.4: TypeScript e 77 testes aprovados.
- JDK 17, SDK 36, arquitetura arm64-v8a: assembleDebug concluído.
- APK instalado no emulador Pixel 8 / Android 15.
- Apresentação inicial confirmada pela interface acessível: marca Bóra/Fiocruz, texto Corpo e mente em movimento, tela 1 de 3 e botão Continuar.
- Registro ReactNativeJS confirmou a inicialização de main com Fabric, sem falha de inicialização nessa abertura.

## Bloqueios encontrados e resolvidos

1. O projeto nativo conservava o pacote antigo `br.fiocruz.boramobile` e versionName 1.0.0. O prebuild Android regenerou as configurações a partir de app.json e plugins.
2. A abertura inicial mostrava `Unable to load script`. A configuração de suporte ao desenvolvimento agora usa explicitamente a variante do app, preservada pelo plugin with-android-dev-support. O Metro precisava escutar no localhost IPv4 para funcionar com o redirecionamento adb; com isso, o bundle foi carregado.
3. O bundle revelou falha nativa em expo-observe por falta de extra.eas.projectId. O módulo opcional foi excluído do autolinking Android e o carregamento JS foi condicionado à plataforma/configuração. A telemetria Android permanece desativada. Os testes cobrem ausência de configuração, exclusão Android e o controle de consentimento para plataformas configuradas.

## Limites e próxima rodada

A abertura da apresentação não confirma acesso à API, navegação completa, avatar, QR/câmera ou notificações. Esses fluxos continuam pendentes. Em aparelho com fonte de treinos conhecida, validar concessão/negação/revogação de acesso ao Health Connect, seleção e importação, repetição e modo offline. Não houve leitura de dados reais de saúde nesta rodada.

A mudança de pacote cria uma instalação distinta e não migra dados locais do pacote antigo. O Xcode não foi regenerado. A configuração de assinatura Release Android ainda usa a chave de desenvolvimento do template e precisa ser preparada antes da distribuição.

Comandos e detalhes em [build Android](build-android.md).

## Ícone adaptativo e splash — atualização de 22/10/2026

- Foreground e versão monocromática regenerados a partir de assets/imgs/Icon.svg, com o B e o castelo completos. Pixels visíveis do foreground limitados a raio 298,9 px em uma camada 1024 px; o círculo seguro do Android permite 312,9 px.
- Ícone redondo conferido visualmente no launcher do Pixel 8 / Android 15, sem recortes do símbolo.
- Splash configurada via expo-splash-screen: fundo #002542, símbolo centralizado, variantes clara/escura iguais. Liberação após fontes e preferências locais da apresentação; restauração da conexão com a API continua usando o indicador de carregamento da interface.
- 79 testes e TypeScript aprovados. Builds Debug e Release arm64 concluídos.
- APK Release local instalado e aberto pelo launcher: splash capturada com o símbolo completo e transição para a tela de acesso confirmada. Nenhuma falha AndroidRuntime registrada nessa abertura.
- APK Debug reinstalado após a conferência, para continuar o desenvolvimento com Metro e API HTTP local.
- Apenas Android foi regenerado. A configuração da splash está em app.json; o projeto iOS não foi regenerado nesta rodada.
