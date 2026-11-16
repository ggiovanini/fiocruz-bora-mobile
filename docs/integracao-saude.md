# Integração com o aparelho

Atualização de 09/11/2026: além da consulta, há importação manual e envio automático opcional dos treinos reconhecidos. A autorização de leitura não ativa envio por conta própria; confira a seção de envio automático ao final.

Entrada: **Perfil → Conectar dados de atividade**. O histórico manual também tem um atalho para consultar os registros do aparelho.

## Escopo implementado

- iOS: HealthKit, apresentado como Apple Saúde.
- Android: Health Connect; detecta indisponibilidade ou necessidade de instalar/atualizar o serviço.
- Somente leitura de passos diários e treinos dos últimos sete dias do calendário local, incluindo hoje até o instante da consulta.
- Treinos: identificador de origem, nome quando fornecido, tipo, início/fim, duração e aplicativo que produziu o registro. Treinos precisam estar inteiramente dentro da janela consultada.
- Passos consultados por agregação nativa, sem somar amostras brutas de telefone e relógio no JavaScript.
- Solicitação de autorização explícita ao conectar. Atualização automática ao abrir ou voltar ao app se a última tentativa tiver pelo menos cinco minutos, e a cada cinco minutos durante o uso. O usuário pode desativar a atualização automática e usar Atualizar agora. A primeira leitura ocorre após conectar; nenhuma autorização é solicitada automaticamente.
- Dados reais mantidos **apenas na memória**, fora do armazenamento dos mocks e de eventos de telemetria. Sair da conta, revogar o aceite do protótipo, trocar organização ou encerrar o processo elimina a leitura. Ir para segundo plano limpa a leitura exibida e cancela o aproveitamento de consultas pendentes. Ao voltar, o app respeita o intervalo de cinco minutos; Atualizar agora permite antecipar a consulta.
- Apenas as preferências de conexão, atualização automática e envio automático são persistidas por conta e contexto, separadas dos mocks e dos registros de saúde. Ao reabrir com sessão ativa, o Bora retoma a preferência salva, mas o sistema continua controlando o acesso real. Enquanto não houver identidade real, essa preferência é local ao aparelho e à organização do protótipo.
- Falhas de leitura também respeitam o intervalo para evitar tentativas contínuas.
- Uma sincronização substitui a janela anterior e elimina repetições pelo par plataforma + identificador. Registros apagados deixam de aparecer na próxima leitura. A API bloqueia intervalos sobrepostos entre fontes e registros manuais da mesma atividade/dia; esses conflitos pedem revisão.
- Envio à API somente por importação manual confirmada ou pela autorização específica de envio automático. Sem escrita nos repositórios de saúde, GPS, dados cardíacos ou leitura/envio em segundo plano.

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

## Organização das telas · 09/11/2026

A consulta e importação ficam em **Treinos do aparelho** (`/health`), com lista compacta e detalhe em modal. Permissões, conexão, atualização automática e desconexão ficam em **Conexão de treinos** (`/health-settings`). Ambas usam o mesmo HealthProvider; a leitura continua separada da autorização de envio. O envio pode ser manual ou automático conforme a opção explicitamente escolhida. Os acessos de Configurações e Ajuda levam diretamente à conexão.


## Envio automático autorizado · 09/11/2026

Em Conexão de treinos, “Autorizo o envio automático dos treinos” vem desativado, inclusive para preferências antigas. A autorização informa os dados enviados: nome, tipo, duração, horários e identificador dos treinos reconhecidos dos últimos sete dias. A opção é por conta/contexto neste aparelho. Exige conexão do Saúde/Health Connect, atualização automática ativa e termos vigentes concedidos. Desconectar desativa a opção; desativar somente a atualização pausa novos envios automáticos. Uma requisição já iniciada pode concluir.

HealthImportProvider compartilha resultados entre a lista e o detalhe. HealthImportQueue envia de forma sequencial, usando o mesmo endpoint de importação e identidade estável da origem. O caminho manual compartilha o bloqueio por treino; não há somas locais de EV. A API mantém idempotência, consentimento, janela temporal e prevenção de sobreposição/manual duplicado. import_mode distingue automatic de manual na auditoria.

Somente tipos reconhecidos com dimensão fixa e pontuação configurada são automáticos. A partir de 16/11/2026, títulos ou modalidades sem correspondência usam Outras atividades físicas quando essa categoria tem taxa e dimensão configuradas. Ausência de categoria válida, dimensão ou taxa e erros de validação/conflito ficam para revisão manual. Falhas de rede, timeout, limite de requisições e erros de servidor pausam o lote até o próximo ciclo de leitura, sem insistir em cada treino restante. Consultas permanecem a cada cinco minutos com o app em primeiro plano. Não há tarefa de envio com o app fechado.

Os estados de envio ficam na memória do contexto; snapshots e payloads não são persistidos no aparelho. Ao reabrir, os treinos elegíveis são consultados novamente e a API reconhece reenvios sem crédito duplicado. O treino precisa continuar na janela aceita pela API. Apenas a preferência é persistida. Logout/troca de contexto encerram a fila; uma verificação de identidade antes de transmitir impede usar o token de outra conta.

Validação: 111 testes do app e 170 da API aprovados; TypeScript aprovado. Testes usam treinos sintéticos para concorrência manual/automático, repetição, recuperação de rede, pausa de lote, revogação durante envio, classificação pendente, preferência antiga e troca de sessão. No simulador iOS, conferidos opção desativada e explicação de autorização. Não foram ativados envios nem enviados treinos reais; a base do simulador não tinha treinos disponíveis. O teste com treinos de aparelho físico permanece necessário para validar o comportamento nativo ponta a ponta.

## Prévia visual de treinos · 09/11/2026

Treinos do aparelho oferece “Ver exemplo com treinos fictícios”, abrindo /health-preview. A prévia reutiliza WorkoutImportView, a mesma apresentação dos treinos reais, com quatro cenários: caminhada confirmada (35 EV ilustrativos), corrida em envio, ciclismo com falha e Yoga aguardando classificação. Lista e modais identificam a simulação.

A tentativa de envio é local, com breve transição para Enviando e confirmação fictícia. Há ações para concluir o cenário de envio e reiniciar os exemplos. Fixture e estados ficam isolados do HealthSession e do HealthImportProvider: não se solicita permissão, grava dados no Saúde, chama importação na API ou altera a jornada. Preferências reais permanecem preservadas.

Validação: 112 testes do app e TypeScript aprovados. Teste de isolamento impede dependências de API/HealthProvider no componente de prévia. No simulador iOS foram conferidos lista, modal, recuperação fictícia de falha e reinício. A prévia foi deixada aberta para avaliação.


## Classificação fixa das atividades

O vínculo manual de um treino pede apenas a atividade do catálogo, mostra a dimensão definida pela API e mantém a confirmação de envio. Não há botões para escolher Física/Mental. A preferência por modalidade guarda somente `activity_type`; dimensões salvas por versões antigas são ignoradas. O envio automático também usa a classificação vigente do catálogo, sem enviar uma dimensão escolhida. Tipos sem taxa ou dimensão válida ficam para revisão.

As duas opções de outras atividades exigem nome personalizado no registro manual. Desde 16/11/2026, a importação também aceita categorias com nome personalizado: o nome recebido acompanha o treino e a categoria continua definindo sua pontuação. Sem correspondência, usa Outras atividades físicas. Publicar a API atualizada antes do aplicativo.

## Nomes dos treinos e reaproveitamento — 16/11/2026

O Android lê `ExerciseSessionRecord.title`; no iOS, o app aproveita `metadata.HKWorkoutBrandName` quando disponível. São campos opcionais; o nome individual pode não ser compartilhado pelo aplicativo de origem. Sem nome, usa-se a modalidade conhecida. Apenas o campo de nome é aproveitado: notas, demais metadados e nome do aplicativo produtor não são enviados.

`workout_name`, limitado a 80 caracteres, é enviado junto ao código de categoria. A API preserva esse título em `activity_name` e mantém `activity_type` para classificar/pontuar. O histórico e a busca usam o título preservado; o detalhe de importação apresenta a categoria como informação para cálculo de EV. Reenvios não alteram nomes já registrados nem duplicam EV. Nomes que versões antigas descartaram não são recuperados automaticamente.

A associação considera: preferência explícita por nome/modalidade, preferência antiga por modalidade, palavras/frases completas do título (ignorando acentos e caixa, com categorias específicas antes de Treino), modalidade nativa e, por fim, Outras atividades físicas. Títulos ambíguos usam a modalidade nativa correspondente ou o fallback. Só categorias ativas, com taxa e dimensão válidas, podem ser enviadas. As preferências novas distinguem nomes diferentes dentro da mesma modalidade; antigas preferências continuam válidas.

O registro manual reaproveita nomes da própria pessoa, por categoria. Só mostra a etapa adicional quando há nomes diferentes do catálogo. Oferece nome anterior, nome padrão quando aplicável ou digitação de outro nome; duração/data e revisão permanecem. O total passa de cinco para seis etapas apenas nesse caso.

Testes automatizados cobrem títulos nativos, payload, associação por palavras, fallback, preferências por nome, reenvio e isolamento dos nomes por pessoa. A prévia web também foi usada para registrar um nome e reutilizá-lo na etapa seguinte. Validar em iOS/Android com treinos reais antes da distribuição. Nenhuma publicação foi feita.

Referências oficiais: [título opcional no Health Connect](https://developer.android.com/reference/androidx/health/connect/client/records/ExerciseSessionRecord), [nome de treino disponibilizado em metadados do HealthKit](https://developer.apple.com/documentation/healthkit/hkmetadatakeyworkoutbrandname).
