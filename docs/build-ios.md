# Build iOS no Xcode 27.1 / Swift 6.4

## Falha corrigida em 19/10/2026

O build apresentava duas causas relacionadas:

1. Módulos Expo pré-compilados com Swift 6.3.1 eram importados por Swift 6.4.
2. Mesmo recompilado, o ExpoModulesJSI 57.1.0 deixava uma extensão privada C++ na interface pública. O sanitizador original reconhecia `extension __ObjC.`, mas Swift 6.4 emite `extension __ObjC::`. Consumidores como ExpoModulesCore falhavam com `cannot find type '__ObjC::expo' in scope`.

## Configuração aplicada

- `app.json`: `expo-build-properties.ios.usePrecompiledModules: false`, preservado ao regenerar o iOS.
- `ios/Podfile.properties.json`: `EXPO_USE_PRECOMPILED_MODULES: "false"` para o projeto nativo atual.
- `scripts/patch-expo-jsi.cjs`: amplia o padrão de limpeza do script de build do JSI para `__ObjC[.:]`, removendo o mesmo bloco interno nas duas versões do Swift. Executado pelo `postinstall`; é idempotente e falha explicitamente se o script upstream mudar, para revisão do workaround.

O patch altera apenas o sanitizador de interfaces de uma dependência, não os fontes Swift ou a API pública do aplicativo. Deve ser revisado/removido quando o Expo incorporar a correção. A primeira compilação pode demorar mais porque os módulos passam a ser compilados localmente.

## Executar

Com Node compatível com Expo 57 (neste ambiente, 20.19.4):

```sh
npm install
pod install --project-directory=ios
npm run ios -- --no-build-cache
```

`--no-build-cache` limpa os dados derivados deste app para evitar interfaces anteriores em cache; não é necessário usá-lo em todo build. Não é preciso mudar o Xcode global nem apagar todas as dependências ou o cache global do CocoaPods.

Referência da opção de compilação: [Precompiled Expo Modules](https://docs.expo.dev/guides/prebuilt-expo-modules/).

## Validação

Compilação Debug para simulador iOS arm64 concluída com `BUILD SUCCEEDED` no Xcode 27.1 / Swift 6.4, sem assinatura, em diretório derivado isolado. O ExpoModulesJSI foi recompilado com Swift 6.4 e sua interface pública foi verificada sem extensões privadas `__ObjC`. Essa verificação confirma o build; não inclui execução do app em um dispositivo físico.

## Runtime: Three.js / Hermes

Three 0.186.1 inclui uma entrada CommonJS (`three.cjs`) que chama `process.emitWarning`, API do Node indisponível no Hermes. A falha ocorria já ao importar Fiber/AvatarViewport, antes da cena e das barreiras de erro montarem.

O `metro.config.js` resolve todos os imports da raiz `three` para `three.module.js`, inclusive os `require('three')` internos do Fiber, usando uma única instância ESM. Os demais módulos continuam com a resolução padrão do Expo. Não há polyfill de `process.emitWarning` nem downgrade da biblioteca.

Depois de mudar a configuração Metro, reinicie o servidor com `npx expo start --clear`. Não é necessário recompilar o binário iOS para essa alteração. Os testes de resolução cobrem iOS, Android, web e a preservação do resolver padrão. Verificação executada no simulador iPhone 17 Pro / iOS 26.2: abertura da home, avatar e arco renderizados e seleção da animação de comemoração no laboratório. Suíte de 33 testes aprovada.

Avisos não fatais observados: `THREE.Clock` obsoleto, parâmetro de `pixelStorei` ainda não suportado pelo Expo GL e ausência de `EXT_color_buffer_float` no simulador. Eles não foram silenciados e não impediram a renderização testada.
