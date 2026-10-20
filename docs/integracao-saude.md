# Teste base de integração com o aparelho

Entrada: **Perfil → Conectar dados de atividade**. O histórico manual também tem um atalho para consultar os registros do aparelho.

## Escopo implementado

- iOS: HealthKit, apresentado como Apple Saúde.
- Android: Health Connect; detecta indisponibilidade ou necessidade de instalar/atualizar o serviço.
- Somente leitura de passos diários e treinos dos últimos sete dias do calendário local, incluindo hoje até o instante da consulta.
- Treinos: identificador de origem, tipo, início/fim, duração e aplicativo que produziu o registro. Treinos precisam estar inteiramente dentro da janela consultada.
- Passos consultados por agregação nativa, sem somar amostras brutas de telefone e relógio no JavaScript.
- Solicitação de autorização explícita ao conectar. Atualização automática ao abrir ou voltar ao app se a última tentativa tiver pelo menos cinco minutos, e a cada cinco minutos durante o uso. O usuário pode desativar a atualização automática e usar Atualizar agora. A primeira leitura ocorre após conectar; nenhuma autorização é solicitada automaticamente.
- Dados reais mantidos **apenas na memória**, fora do armazenamento dos mocks e de eventos de telemetria. Sair da conta, revogar o aceite do protótipo, trocar organização ou encerrar o processo elimina a leitura. Ir para segundo plano limpa a leitura exibida e cancela o aproveitamento de consultas pendentes. Ao voltar, o app respeita o intervalo de cinco minutos; Atualizar agora permite antecipar a consulta.
- Apenas as preferências de conexão e atualização automática são persistidas por organização, separadas dos mocks e dos registros de saúde. Ao reabrir com sessão ativa, o Bora retoma a preferência salva, mas o sistema continua controlando o acesso real. Enquanto não houver identidade real, essa preferência é local ao aparelho e à organização do protótipo.
- Falhas de leitura também respeitam o intervalo para evitar tentativas contínuas.
- Uma sincronização substitui a janela anterior e elimina repetições pelo par plataforma + identificador. Registros apagados deixam de aparecer na próxima leitura. Cópias do mesmo treino produzidas por diferentes apps, com IDs diferentes, ainda não são reconciliadas.
- Sem envio à API, Energia Vital, escrita nos repositórios de saúde, GPS, dados cardíacos ou leitura em segundo plano.

Esta etapa **importa registros já existentes** no Saúde/Health Connect. Não inicia nem grava um treino, nem captura movimento ao vivo. Um aplicativo ou dispositivo de origem precisa produzir esses registros. Android Health Connect não garante que todo aparelho tenha uma fonte de passos configurada.

## Diferenças entre plataformas

No iOS, concluir a solicitação de autorização não prova que o usuário liberou leitura: o HealthKit oculta essa decisão. A tela explica que ausência de resultados pode significar falta de dados ou permissão negada. Gerenciar permissões abre o Saúde; o usuário procura Perfil → Apps → Bóra.

No Android, cada tipo é verificado separadamente. Conceder apenas passos ou apenas treinos continua funcionando. Uma agregação sem fontes é apresentada como sem dados, em vez de zero. A atividade nativa de explicação das permissões funciona mesmo sem login ou servidor de desenvolvimento, pelos ajustes do Health Connect.

Duração: no iOS usamos a duração informada pelo treino; no Android mostramos o intervalo entre início e fim, que pode incluir pausas. A tela sinaliza essa diferença.

Desconectar limpa a sessão local e a preferência de conexão do Bora, mas não revoga a autorização do sistema. Para isso, utilize Gerenciar permissões. Nenhum registro de saúde é apagado do aparelho pelo Bora.

## Executar

É necessário recompilar o aplicativo; Expo Go e navegador não oferecem essa integração. Use Node 20.19.4 ou superior compatível com o Expo instalado.

```sh
npm install
npx expo prebuild --no-clean --no-install
npx expo run:ios
# ou, com JDK 17 e Android SDK configurados:
npx expo run:android
```

O iOS precisa da capacidade HealthKit também no perfil de assinatura ao instalar em um aparelho físico. O build Android passa a exigir API 26 (Android 8) ou superior devido à biblioteca nativa. A integração ainda depende da disponibilidade efetiva do serviço, que o app verifica; instalar o Bora não garante suporte ao Health Connect. Android deve ter Health Connect disponível (integrado nas versões recentes ou instalado quando aplicável). O app verifica a disponibilidade antes de solicitar acesso.

Os plugins em `app.json` preservam a configuração nas próximas gerações nativas. O plugin local de explicação deve permanecer **antes** de `react-native-health-connect`: os modificadores do manifesto são executados em ordem inversa, permitindo retargetar o atalho de privacidade ao final.

## Roteiro de aceitação em aparelhos reais

1. Ter passos e um treino recente no Saúde ou Health Connect, usando uma fonte de teste conhecida.
2. Abrir Perfil → Conectar dados de atividade, ler o aviso, marcar o aceite e conectar. Com a opção automática ativa, verificar a primeira leitura sem tocar em Atualizar agora.
3. Autorizar apenas passos; sincronizar e conferir o total diário e a ausência de treinos acessíveis.
4. Autorizar também treinos nos ajustes; retornar e sincronizar. Conferir tipo, horário, duração e origem com o aplicativo de origem.
5. Repetir a sincronização: a quantidade não deve aumentar por duplicação.
6. Negar/revogar permissões: nenhum dado da consulta anterior deve reaparecer. No iOS, aceitar que o app não consegue distinguir negação de ausência de dados.
7. Testar um período sem registros, um treino apagado na origem e uma fonte indisponível.
8. Desativar atualização automática, reiniciar o app e verificar que não há leitura até tocar em Atualizar agora. Ativar novamente e verificar a atualização aos cinco minutos.
9. Ir para segundo plano por mais de cinco minutos: não deve haver leitura enquanto o app está fora de uso; retornar deve atualizar uma vez, sem novo pedido de permissão.
10. Desconectar e reiniciar o app: não deve haver leitura automática. Sair da conta deve limpar os registros em memória e impedir leituras até entrar novamente; mocks continuam independentes.
11. Android: abrir a explicação de uso pelas permissões do sistema e verificar que funciona sem Metro ou sessão autenticada.

A compilação e os testes sintéticos validam código, configuração e contratos. A capacidade de ler dados reais de cada aparelho só pode ser confirmada após esse roteiro com autorização do usuário.

## Validação automatizada desta implementação

Em 01/10/2026: TypeScript e 21 testes aprovados; exportação dos bundles iOS, Android e web concluída; build Debug do iPhone 18 Pro / iOS 27 concluído com HealthKit e UIScene configurados; build Android Debug (APK, todas as arquiteturas configuradas) concluído com Health Connect e a atividade de explicação das permissões. Os testes usam dados sintéticos e cobrem autorização parcial, acesso revogado, cancelamento de leituras, ausência de dados, paginação, deduplicação e limites de dias locais com horário de verão. Nenhuma leitura de dados pessoais foi realizada durante a validação.

Atualização automática: TypeScript e 25 testes aprovados, incluindo primeira conexão, retorno antes/depois do intervalo, suspensão em segundo plano, preferência desativada, atualização manual e limitação de tentativas após falhas.

## Problemas de compilação iOS

Para a incompatibilidade ExpoModulesJSI/Swift 6.4, consulte [build-ios.md](build-ios.md).

## Envio à Apple: descrição de uso do Saúde

O envio de um Archive pode ser rejeitado por ausência de `NSHealthUpdateUsageDescription`, mesmo com leitura somente: o SDK nativo inclui APIs de gravação que podem ser identificadas na validação da Apple. Em 20/10/2026, substituímos `false` por uma descrição explícita em `app.json` e adicionamos a mesma chave ao `ios/Bra/Info.plist`. O texto informa que esta versão apenas consulta os dados; não promete uma funcionalidade de gravação inexistente.

A autorização continua com `toShare: []` e leitura somente de passos e treinos. A presença da descrição no plist não concede acesso nem altera essa solicitação. Não é uma opção do cadastro no App Store Connect. Referência: [NSHealthUpdateUsageDescription — Apple](https://developer.apple.com/documentation/bundleresources/information-property-list/nshealthupdateusagedescription).

Para reenviar, gere um **novo Archive** no Xcode e use Validate App / Distribute App. O Archive anterior conserva o plist antigo. Não é necessário apagar Pods ou gerar o projeto novamente para aplicar esta correção, pois o plist nativo já foi atualizado. As próximas execuções de prebuild preservam a descrição pelo plugin. Se o número de build já tiver sido aceito no App Store Connect, incremente-o antes do novo Archive. A aceitação do envio precisa ser confirmada pela Apple.
