# Celebrações em tela cheia — levantamento e proposta

Levantamento e primeira implementação em 09/11/2026. As seções de proposta abaixo preservam o planejamento; o estado entregue está descrito a seguir.

## Estado implementado

- API: ocorrências persistentes em `celebrations`, com unicidade por pessoa e origem, ordem estável, conteúdo preservado e fechamento idempotente. Rotas autenticadas `GET /api/v1/me/celebrations` (até 30 pendências) e `PATCH /api/v1/me/celebrations/{id}/dismiss`, restritas à própria pessoa.
- Gatilhos: meta diária, subida de nível, presença em evento, medalha de desafio/evento e conclusão de desafio sem nova medalha quando a atividade cruza sua meta. Registro manual e importação de treino usam o mesmo motor. Reenvios não geram novas ocorrências.
- Subida de nível incluída nesta entrega. O motor compara a situação antes e depois do crédito na mesma configuração e preserva o maior nível observado em `celebration_progress`. Um salto mostra o nível de destino; recuperação de um nível já observado não repete a celebração. Alteração administrativa ou consulta de energia não cria celebração de nível.
- App: apresentador global com animação de entrada, redução de movimento, medalha com imagem ou desenho alternativo, nome/mensagem e botão variável. Conteúdo central e ação no rodapé, com área segura e rolagem para conteúdo maior.
- A celebração existente de atividade continua na rota de resultado. Ao sair dela para a home, as demais pendências aparecem em sequência. O apresentador aguarda as explicações iniciais de permissões e só aparece nos destinos de leitura definidos; não interrompe formulário ou câmera. Após check-in, as telas aparecem ao retornar a eventos ou abrir medalhas.
- Fechamentos são gravados no aparelho por usuário antes de avançar, e confirmados no servidor nas próximas consultas. Reabertura e falta de rede preservam os recibos. Retorno ao primeiro plano, atualização da jornada, troca para destino permitido e consulta periódica recuperam pendências. O consumo é sincronizado por usuário entre aparelhos após confirmação no servidor; aparelhos simultaneamente offline podem exibir a mesma ocorrência antes dessa confirmação.
- Não há importação em massa de celebrações históricas. Novas concessões feitas pela reconciliação existente geram celebração, mesmo quando baseadas em atividades anteriores. Constância e outros marcos continuam como evolução.
- Prévia em desenvolvimento: `/celebration-preview`, com uma sequência local sem conceder pontos. Em release, essa rota redireciona para a home.
- Ajuste de apresentação no iPhone: aguardar 600 ms de estabilidade da rota antes de montar o modal, para evitar apresentação durante a substituição do controlador nativo. Manter o mesmo modal ao avançar entre itens e não desmontá-lo por uma atualização da jornada em segundo plano. O estado inicial desconhecido de `AppState` não é tratado como aplicativo em segundo plano. Teste de regressão cobre espera, cancelamento por mudança de rota e retorno ao primeiro plano.

Migration: `bora-api/database/migrations/2026_11_09_000003_create_celebrations.php`. Aplicar antes de disponibilizar a API com os novos gatilhos. O banco de teste atual já recebeu essa migration.

Validação: TypeScript; suíte do app com Node 22; testes Laravel de unicidade/replay, privacidade, fechamento repetido, lotes, meta retroativa, nível recuperado, presença e atividade que gera meta + nível + duas medalhas. Prévia visual percorrida até o fim. Validação de migrations e integridade também em MySQL isolado.

## Experiência

Uma tela por acontecimento, com animação de entrada, informação central e ação no rodapé. Para conquistas: medalha em destaque, “Você recebeu uma conquista!”, nome e mensagem cadastrada. Usar a imagem da medalha quando existir e o componente de medalha por estilo como alternativa. A ação apenas fecha a celebração e avança para a próxima; não concede pontos nem exige compartilhar ou abrir a coleção.

Sortear entre **Incrível!**, **Demais!**, **Mandei bem!**, **Arrasei!** e **Boa!** ao preparar cada item. Preservar a palavra durante toda a exibição e evitar repetir a anterior. Ao terminar, devolver a pessoa ao destino do fluxo original.

## Gatilhos encontrados

| Acontecimento | Fonte no código atual | Condição para celebrar | Prioridade proposta |
| --- | --- | --- | --- |
| Atividade registrada | Mobile: `src/features/Activities.tsx`, `src/features/activity/ActivityCelebration.tsx` | Já existe celebração na rota de resultado. Integrá-la à fila, preservando o estado real do envio. | Primeira entrega |
| Meta diária atingida | API: `/me/energy`; mobile: `EnergySummary.today` e `days` em `src/api/contracts.ts` | Primeira conclusão da meta da data no fuso da jornada. Usar `goal_met`, não percentual visual nem cálculo local de EV. | Primeira entrega |
| Medalha recebida por desafio | API: `app/Domain/Challenge/Services/ChallengeProgress.php` | Nova linha em `earned_medals`, identificada pelo ID da concessão. Nome, descrição, estilo e imagem são preservados nessa linha. | Primeira entrega |
| Presença confirmada em evento | API: `app/Http/Controllers/Api/EventController.php`; mobile: `src/features/Events.tsx` | Novo check-in confirmado por QR ou código. A interpretação de “marcar um evento” neste levantamento é registrar presença; não foi identificado um fluxo de agendamento nesta tela. | Primeira entrega |
| Medalha recebida por evento | Mesma transação do check-in | Apenas se houver nova concessão. Um evento pode confirmar presença sem conceder outra medalha, por regra de não repetição. | Primeira entrega |
| Subida de nível | `EnergySummary.vitality.level` e atualização em `src/api/useJourneyConnection.ts` | Evolução decorrente de crédito confirmado. Exige distinguir ganho de PV de alteração administrativa das faixas. | Segunda entrega |
| Marco de constância | `EnergySummary.streak_days` | Sugestão: 3, 7, 14 e 30 dias. Marcos ainda são decisão de produto; não existe premiação automática por eles. | Segunda entrega |
| Primeira atividade / marcos pessoais | Histórico de atividades e `lifetime_earned_ev` | Possíveis celebrações de primeira prática, quantidade, minutos ou EV. Exigem definir critérios e apuração oficial, sem inventar medalhas. | Evolução |

Conclusão de desafio e recebimento da medalha correspondente devem formar uma única celebração de conquista. Se a medalha não puder repetir, a conclusão ainda pode ser celebrada com “Desafio concluído”, sem afirmar que houve nova premiação. Presença e medalha podem aparecer em sequência por serem acontecimentos diferentes.

Retorno após inatividade, participação em equipe e resultados de ranking são candidatos editoriais futuros. Não ativar automaticamente: precisam de critérios próprios. Não celebrar queda de nível, desgaste, rejeição, sincronização ou mera edição de perfil/meta.

## Dados disponíveis e lacunas

- `MedalBadge` (`src/features/MedalBadge.tsx`) já apresenta imagem ou desenho por estilo. O cadastro de conquista já possui nome, mensagem (`description`), estilo, imagem e regra de repetição.
- A coleção em `ChallengeController::medals` agrupa por conquista, mas seu histórico contém IDs individuais de concessão. A fila deve usar esses IDs, pois a mesma conquista pode ser recebida por desafios ou eventos distintos.
- `ChallengeProgress::reconcile` é chamado pelas consultas de desafios e medalhas. Registrar atividade não garante que a medalha tenha sido apurada naquele momento. Para uma sequência imediata, reconciliar desafios após o crédito e antes de buscar as celebrações.
- O check-in retorna `checked_in`, `replayed` e `medal_awarded`, mas não entrega o ID e o conteúdo da medalha recebida. No replay, `medal_awarded` pode continuar verdadeiro: sozinho, esse campo não identifica novidade. Expor IDs de check-in/concessão ou recuperar ocorrências pendentes oficiais.
- `ActivityCelebration` atualmente usa uma imagem de fundo e texto; não é uma fila global de animações. Ela também apresenta registro pendente de envio. Nesse estado, pode reconhecer o registro local, mas não anunciar meta ou medalha antes da confirmação.
- Comparar apenas o resumo anterior e posterior perde acontecimentos com app fechado, resposta perdida ou troca de aparelho. A coleção paginada também não deve funcionar como caixa de pendências.

## Fila proposta

Criar ocorrências persistentes na API e um apresentador global no app. Contrato proposto: `id`, `type`, `occurred_at`, referência de origem e conteúdo visual preservado. Tipos iniciais: `activity_registered`, `daily_goal_reached`, `event_checked_in`, `achievement_awarded` e, quando aplicável, `challenge_completed` sem nova medalha.

1. Produzir ocorrências após confirmação da operação, junto da transação de negócio. Uma atividade pode gerar registro, meta e várias conquistas.
2. Consultar pendências após operações confirmadas, abertura/retorno ao app e recuperação de conexão. Paginar até consumir as pendências, sem depender da organização selecionada para fatos pessoais já conquistados; validar acesso no servidor.
3. Exibir uma por vez: confirmação da ação, meta diária e conquistas decorrentes. Dentro da mesma categoria, ordenar por instante e ID estável. Entre operações independentes, respeitar a ordem cronológica.
4. Ao tocar no botão, persistir localmente o fechamento, avançar e confirmar o consumo na API. Repetir essa confirmação deve ser seguro. Retomar pendências após encerramento do app; limpar a apresentação em logout e separar armazenamento por usuário.
5. A fila deve aguardar formulários, câmera, confirmação de envio e outros modais terminarem. Não abrir telas concorrentes nem perder o destino final da navegação. Fechar pelo botão ou voltar do sistema deve consumir apenas o item atual.

Chaves de unicidade propostas: atividade por ID oficial; meta por usuário + data da jornada; presença por ID do check-in; medalha por `earned_medals.id`. Para meta retroativa, mostrar a data correta (“Meta de 8 de novembro concluída”), nunca dizer “hoje”. Reprocessamento, reenvio e recomposição não devem recriar uma celebração já consumida.

No lançamento do recurso, criar um marco de início: não transformar todo o histórico existente em uma fila de medalhas antigas. Reconciliações que concedam novas medalhas após esse marco podem gerar pendências, ainda que baseadas em atividades anteriores.

Para futuros marcos de nível e constância, definir identidade estável, tratamento de recomposição e alterações administrativas antes de habilitar. Reatingir o mesmo nível após desgaste não deve gerar ciclos ilimitados de celebração.

## Apresentação e validação da implementação

Conteúdo curto centralizado, ação no rodapé com área segura, texto que acomode fonte ampliada e mensagem longa com rolagem quando necessária. Respeitar redução de movimento e anunciar título/conteúdo para leitores de tela. A animação não deve impedir o fechamento.

Validar: uma atividade que completa meta e dois desafios; presença com e sem nova medalha; repetição legítima da mesma conquista; replay de atividade/check-in; perda de resposta; fechamento do app no meio da fila; mudança de conta; recuperação offline; meta retroativa; ausência de imagem; fonte ampliada e redução de movimento. Confirmar que a sequência não altera EV/PV nem duplica concessões.

Evoluções: unificar também a tela de registro de atividade no apresentador global, caso seja desejado substituir a rota atual; definir constância e outros marcos pessoais. Atividade, meta, presença, conquistas e subida de nível já estão cobertas pelo fluxo entregue.
