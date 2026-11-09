# Primeira limpeza do app · Bean

- Hoje: avatar responsivo à altura, resumo diário, faixa compacta de atalhos. Detalhes de cores em modal; indicadores de nível e constância permanecem clicáveis.
- Constância: Semana/Mês alternam conteúdo; tocar no dia abre detalhe em modal.
- Perfil: identidade e atalhos em grade. Configurações separadas em Conta, Aplicativo e Ajuda. Confirmação de saída em modal.
- Meta e edição de perfil abrem com apresentação modal.
- Biblioteca Lucide Native substitui desenhos manuais no componente Icon. Gráficos e marcas continuam SVG.
- Abertura e login: frase da campanha exata, como texto acessível: “Mexa-se pela mente, mova-se pela vida!”.

## Assets
Gerados com a ferramenta integrada de imagens, preservando as referências originais.

`assets/images/bean/bean-wave-v1.png`: Bean aprovado, corpo inteiro, acenando, PNG com alfa transparente. Prompt: identity-preserve; preservar corpo arredondado verde, faixa azul curva fixa, olhos pretos, sorriso, pequenos pés e mãos e símbolo no peito; acabamento 3D fosco; personagem único; sem fundo, chão, texto ou sombra projetada. Referência: Bean/01-bean-estudo-personagem.png.

`assets/images/welcome-bean-v1.png`: versão da arte welcome-energy.jpg com Bean. Prompt: compositing; preservar composição vertical, fundo azul-marinho e fitas verdes e azuis; substituir figura humana pelo Bean aprovado; personagem no trecho superior e 40% inferiores livres para texto da interface; sem tipografia. Referências: welcome-energy.jpg e estudo do Bean.

O PNG promocional tem cores fixas e não representa o saldo de energia. O avatar da Home continua dinâmico.

## Validação
TypeScript e exportação web. Validação visual em aparelhos pequenos, fontes ampliadas e comportamento de modais nativos ainda devem ser feitos no dispositivo.

## Revisão da abertura e das chamadas

A abertura mantém a frase da campanha e apresenta “Atividade física” e “Atividade mental” com objetos no estilo 3D do Bean: peso e livro. Removidos o subtítulo “Corpo e mente em movimento”, a descrição redundante e as legendas que identificavam energia por cor. A mesma dupla compacta substitui textos na entrada do registro. O Bean não é repetido nas chamadas de atividades.

Terminologia local revisada também em ranking, constância, apresentação do avatar, resumo de aparência e texto institucional padrão. Usamos Física/Mental ou atividade física/mental; cores continuam como recurso visual, sem nomear os tipos de energia.

Novos assets PNG com transparência, gerados pela ferramenta integrada a partir de `bean-wave-v1.png`:

- `assets/images/bean/activity-weight-v1.png`: prompt stylized-concept; um único haltere verde, formas arredondadas, material 3D fosco e luz suave como o Bean, silhueta legível em 64px, sem personagem, rosto, texto, fundo ou sombra projetada.
- `assets/images/bean/activity-book-v1.png`: prompt stylized-concept; um único livro aberto de capa azul e páginas marfim sem letras, formas arredondadas, material 3D fosco e luz suave como o Bean, silhueta legível em 64px, sem personagem, rosto, texto, fundo ou sombra projetada.
- `assets/images/bean/bean-physical-v1.png`: estudo preservado, não usado nas telas; Bean predominantemente verde caminhando, faixa lateral em tom verde mais escuro, corpo inteiro, preservando silhueta e rosto, sem fundo, texto ou acessórios.
- `assets/images/bean/bean-mental-v1.png`: estudo preservado, não usado nas telas; Bean predominantemente azul sentado lendo livro marfim, faixa lateral em azul mais escuro, corpo inteiro, preservando silhueta e rosto, sem fundo ou texto.

Ajuste posterior: restaurado o fundo welcome-bean-v1.png com o degradê original. Peso e livro aparecem abaixo do título da campanha, com altura de 64 pontos, em faixa de até 280 pontos.

A apresentação aceita deslize horizontal paginado: esquerda avança e direita retorna. Continuar e Voltar permanecem como alternativas acessíveis. O último slide exige o botão final; deslizar não conclui a adesão. Rolagem vertical permanece disponível para telas pequenas e fontes ampliadas.

## Home · personagem em destaque

O palco do avatar acompanha a largura disponível (altura = largura × 1,2, limite do conteúdo de 520 pontos), mantendo zoom 1,08. Essa proporção aproxima a largura do arco de 90% da área disponível. A margem acima do palco passou de 4 para 14 pontos (+10). Atalhos ficam após o personagem e o resumo diário, com margem superior de 28 pontos; em telas menores aparecem ao rolar.

O avatar e o progresso continuam renderizados ao vivo. A antiga plataforma geométrica fica oculta somente na Home, para dar lugar a duas camadas PNG transparentes independentes e decorativas. As regras de energia e os indicadores não foram alterados nesta etapa.

Gerados com a ferramenta integrada de imagens, usando a captura fornecida como referência:

- `assets/images/bean/foot-glow-white-v1.png`: prompt background-extraction; somente uma poça de luz branca elíptica em perspectiva, brilho central horizontal, halo frio muito sutil, bordas em alfa suave; sem personagem, pés, fitas, fundo, texto ou partículas. Camada posicionada ao nível dos pés, atrás do avatar.
- `assets/images/bean/home-particles-v1.png`: prompt stylized-concept; partículas ciano e verde suaves e pequenos arcos nas laterais, centro livre para avatar e progresso, bordas transparentes; sem personagem, chão, círculo de progresso, texto ou fundo opaco. Opacidade de uso de 28% para manter discrição.

TypeScript, testes e exportação web verificados. O alinhamento final de luz e pés deve ser conferido no aparelho.

### Correção da área 3D

A camada de efeitos tem zIndex 0; a área do avatar tem zIndex 1 e dimensões numéricas derivadas da janela, sem depender de percentuais e da própria medição. Os contêineres da superfície gráfica usam collapsable=false, e os Canvas declaram largura/altura. Enquanto o estado inicial de AppState for desconhecido, a renderização é permitida; estados explícitos de segundo plano continuam pausando o avatar. A confirmação visual em dispositivo continua pendente.

### Contorno provisório específico do iOS

Validação interativa no iPhone 17 Pro/iOS 26.2: a composição simplificada com altura de 420 pontos mostrou personagem e arco novamente, após reiniciar o app. Por enquanto o iOS usa essa composição, sem os PNGs decorativos, com a plataforma 3D original. Outras plataformas mantêm as camadas decorativas. O problema não foi conclusivamente atribuído a uma impossibilidade de sobreposição no iOS; a investigação também observou falha em uma tentativa de texturas dentro do Canvas. Essa tentativa experimental foi removida. Os diagnósticos temporários também foram removidos.

### Decisão final desta etapa

A pedido do usuário, a Home mantém somente o personagem, a plataforma e o arco de progresso em 3D em todas as plataformas. Os PNGs de partículas e brilho ficam guardados, sem uso na Home. No iOS, permanece a altura de 420 pontos que apresentou a cena corretamente no simulador. Não há contêiner de imagens nem texturas decorativas na cena.

## Indicadores da Home

Removidos a saudação com nome, o link sob o avatar e os textos “Meta de hoje” e “Faltam … EV”. Física, Mental e Meta ficam acima dos círculos. Os valores de atividade ficam dentro dos círculos; peso e livro ficam abaixo. Meta mostra o percentual no círculo e a meta absoluta em EV abaixo.

Cada coluna inteira é um botão acessível. Física abre `/activity?group=movement`, Mental abre `/activity?group=mind`, ambos na lista filtrada, sem sobrescrever um rascunho existente. Meta abre `/goal`, com visualização e ajuste no modo conectado e na demonstração. A regra de meta agendada para amanhã no modo conectado foi preservada.

As pequenas ilustrações ficam nos indicadores, fora da área 3D. Não foram reativados os fundos ou brilhos decorativos. Aparência dos três indicadores e permanência do personagem confirmadas no simulador iOS; navegação revisada no código, sem completar envio de atividade ou alterar a meta real.

## Equilíbrio de espaçamento

Os rodapés dos indicadores alinham pelo topo, mantendo os 8 pontos de distância usados junto ao título. As ilustrações sobem 8 pontos dentro de sua faixa, aproximando o conteúdo visível dos círculos. A Home transfere 30 pontos da folga inferior do palco para a margem superior: margem do hero 44, margem dos indicadores -20. Tamanho, câmera e geometria do 3D permanecem iguais. Resultado conferido no simulador iOS, com o personagem visível e as folgas acima e abaixo mais equilibradas.

## Treinos do aparelho e conexão · 09/11/2026

- `/health` agora apresenta o estado da conexão, a atualização manual e a lista compacta de treinos dos últimos sete dias. Sem conexão, oferece acesso à configuração; abrir a tela não solicita permissões.
- `/health-settings` reúne consentimento para consulta, autorização do sistema, atualização automática, gerenciamento de permissões e desconexão. O acesso de Configurações e o de Ajuda apontam diretamente para essa tela.
- Cada treino abre um modal com origem, horários/duração, correspondência com o catálogo, confirmação de envio e resultado. A confirmação, o estado de envio e o resultado permanecem no componente do treino ao fechar o modal, sem alterar o contrato de importação.
- O HealthProvider continua compartilhado pelas telas. Não houve mudança nas regras de leitura, atualização automática, armazenamento ou pontuação.

Validação: 87 testes e TypeScript aprovados; exportações iOS, Android e web concluídas. Conferidos no simulador iOS a lista desconectada e o acesso à tela de conexão. A validação não concedeu permissões do Saúde nem leu ou enviou treinos reais.

## Registro manual em telas cheias

A partir de 09/11/2026, o fluxo de adicionar atividade usa escolha Física/Mental, catálogo, duração, data e confirmação. Bean somente na escolha inicial e no encerramento com artes específicas. Detalhes do contrato da API, imagens, rascunhos e validação em `registro-atividade-em-etapas.md`.

## Desafios compactos · 09/11/2026

Os cartões mostram título, estado, progresso numérico/barra e prazo. Toque no cartão abre um modal com descrição publicada, período completo, objetivo, atividade elegível, regras e recompensa. Medalhas e atualização ficam em ações compactas no topo da lista. Paginação, proteção por organização e preservação de rascunhos permanecem.

Regras conferidas em ChallengeProgress da API: atividades aprovadas com taxa de energia configurada e data dentro do período; restrição ao tipo de atividade quando houver. A ação de registro aparece só em desafios ativos e incompletos. Objetivo concluído e medalha entregue são tratados separadamente: a recompensa é indicada como conquistada somente com medal.earned.

A demonstração usa os mesmos componentes e identifica explicitamente que a meta diária é um exemplo, sem inventar recompensa. A API e o cálculo de progresso não foram alterados.

Validação: 94 testes e TypeScript aprovados; exportação iOS, Android e web concluída. No simulador iOS, conferidos os cartões de desafios publicados e o modal de descrição, regras e recompensa de um desafio concluído. Nenhuma atividade foi enviada durante esta revisão.

## Recompensas e busca de desafios · 09/11/2026

Removida a mensagem redundante “Objetivo alcançado” no rodapé do detalhe; o estado de conclusão permanece no topo. Antes de medal.earned=true, o cartão e o detalhe usam apenas um símbolo genérico de presente com cadeado. Nome, descrição e imagem da medalha não são renderizados. Após a conquista, a medalha real aparece como miniatura de 48 pontos no cartão e completa no detalhe.

A lista carrega 20 desafios por página com botão “Carregar mais” e contagem de itens/total. Busca por nome ou descrição é aplicada ao confirmar a lupa ou a tecla de busca, usando `q` na API. Busca e limpeza reiniciam na primeira página; as próximas páginas preservam o termo. Assim a pesquisa não se limita aos cartões já baixados. O filtro continua restrito a desafios publicados da organização ativa.

A API valida q como string de até 100 caracteres e pesquisa título/descrição antes da paginação. O cliente preserva parâmetros de busca ao acrescentar page nos recursos paginados. Não houve mudança nas regras de pontuação ou concessão de medalhas.

Validação: 97 testes do app e 161 da API aprovados. Testes de UI de componentes verificam que a medalha não é renderizada antes da conquista; testes da API incluem busca de um desafio fora da primeira página, paginação sem repetição e isolamento de organização/rascunhos. Exportações iOS, Android e web concluídas; conferida no simulador a busca, limpeza e exibição das medalhas conquistadas na lista.

## Cabeçalho reutilizável de listas · 09/11/2026

`src/ui/ListScreen.tsx` reúne título, ícone opcional da área, busca opcional e conteúdo rolável. Aplicado à lista conectada de Desafios e à demonstração, sem alterar as demais telas que usam Flow.

A lupa à direita abre um painel abaixo do título, com maior separação e foco no campo. Ao confirmar, o painel se recolhe; o termo aplicado permanece em um indicador compacto com ações de editar e limpar. O estado de busca continua controlado pela tela, preservando a consulta na API e a paginação. Telas sem configuração de busca não exibem a lupa.

Nos primeiros 64 pontos de rolagem, o título reduz de 27 para 21 e o espaçamento vertical de 18 para 6; o cabeçalho compensa esse deslocamento inicial e depois acompanha o conteúdo. A implementação usa ScrollView, sem depender do driver nativo de animação para propriedades de layout.

Validação: 97 testes e TypeScript aprovados; exportações iOS, Android e web concluídas. No simulador iOS, conferidos abertura/recolhimento da busca, pesquisa, indicador do filtro e limpeza. A lista disponível tinha dois desafios, sem extensão suficiente para conferir visualmente toda a transição de rolagem de uma lista longa.

## Eventos em lista e detalhe · 09/11/2026

Eventos reutiliza ListScreen, com ícone de calendário, lupa recolhida e compactação inicial do cabeçalho. Os cartões exibem miniatura, título, situação, período resumido e local; todo o cartão abre o modal de detalhe (Sheet), no mesmo padrão dos Desafios. Descrição, imagem completa, local sem corte, início/fim em horário de Brasília e registro de presença ficam no modal de detalhe. O fluxo de QR Code e suas validações permanecem.

O espaço de imagem é obrigatório no layout: eventos sem imagem, ou com falha ao carregá-la, exibem um placeholder de calendário na mesma dimensão. Isso vale tanto para a miniatura quanto para a capa do detalhe, sem exigir nova publicação dos eventos existentes.

A busca consulta nome, descrição ou local na API antes da paginação de 20 itens. Confirmar recolhe o campo e mantém o filtro com edição/limpeza. A lista atualiza ao retornar ao foco; o modal usa os dados da lista, preservando filtro e posição ao fechar. A lista recarrega ao retornar do fluxo de presença. A demonstração usa os mesmos cartões e modal de detalhe.

Validação: 100 testes do app e 163 testes da API aprovados; TypeScript e exportações iOS, Android e web concluídos. No simulador iOS, conferidos lista compacta com placeholder, abertura do detalhe, pesquisa por local, resultado vazio e limpeza. Nenhuma presença real foi enviada. Testes automatizados cobrem filtro antes da paginação, isolamento por organização/publicação, presença por usuário, disponibilidade do botão por período e fallback de imagem.


## Detalhe de Eventos em modal · 09/11/2026

O detalhe passa a usar o mesmo Sheet dos Desafios, com título e fechar no topo, fundo escurecido e conteúdo rolável. Fechar preserva a lista, busca e posição de rolagem. O modal fecha antes de abrir QR Code ou medalhas. A rota separada /event foi removida do app; o endpoint de consulta individual da API permanece disponível.

Validação: 100 testes e TypeScript aprovados. Conferidos no simulador iOS a abertura do modal e o retorno à lista pelo botão fechar.

## Meu nível com foco na evolução · 09/11/2026

Revisados o planejamento 09-niveis-e-reserva-de-evolucao, layout-spec e o contrato de energia vigente. A visão principal de /levels passa a destacar somente nível, Vitalidade em PV e próximo marco, com progresso da faixa e PV restantes. O selo e a Vitalidade ficam lado a lado; nomes personalizados de nível são preservados, sem repetir o nome padrão. Mantido o atalho de registrar atividade.

“Como funciona” abre o mesmo Sheet usado pelos Desafios e Eventos. Reúne EV acumulados (saldo independente e preservado), conversão EV/PV, faixas e desgaste após sete dias completos. No modo conectado, nomes, mínimos, progresso, PV e desgaste vêm da API, sem cálculo adicional no cliente. Maior nível e ausência de configuração são tratados explicitamente; maior nível não significa teto de Vitalidade.

Na demonstração, explicações, faixas ilustrativas, simulador de inatividade/reposição/pausa e acesso à constância foram movidos para o modal. Seus cálculos e isolamento da jornada permanecem.

Validação: 100 testes e TypeScript aprovados. No simulador iOS, conferidos resumo sem rolagem no iPhone 17 Pro (nível 2, 230 PV e 70 PV até o próximo marco), abertura de “Como funciona”, separação dos 360 EV históricos e fechamento do modal. Nenhum registro ou saldo foi alterado.

## Conteúdo centralizado e ação no rodapé · 09/11/2026

Flow passa a oferecer centered e footer opcionais. O conteúdo pode preencher o espaço flexível e centralizar verticalmente o resumo abaixo do título. A ação principal fica fora da rolagem, com espaço reservado e área segura inferior. O comportamento padrão de conteúdo permanece; nenhuma outra tela foi migrada.

Aplicado aos modos conectado e demonstrativo de Meu nível. “Registrar atividade” fica no rodapé; o conjunto de nível, Vitalidade, próximo marco e “Como funciona” fica centralizado. Continua existindo rolagem de segurança para telas menores, texto ampliado ou mensagens adicionais, sem alturas rígidas nem sobreposição.

A preferência foi registrada na skill pessoal mobile-screen-balance, limitada a telas curtas; listas e formulários longos não recebem essa disposição automaticamente.

Validação: 100 testes e TypeScript aprovados. Equilíbrio do conteúdo e botão no rodapé conferidos no simulador iOS, com a área segura respeitada.

## Conhecer compacto e conteúdo em modal · 09/11/2026

Conhecer usa ListScreen, com ícone de livro, busca recolhida e cabeçalho que compacta no início da rolagem, como Eventos. Os cartões horizontais exibem miniatura de 68×84, categoria, título de até duas linhas e resumo de até duas linhas. O item inteiro é um botão acessível; removidos a introdução e os botões repetidos “Abrir conteúdo”. Na ausência ou falha da capa, o espaço da miniatura usa um ícone de livro.

O toque abre Sheet, com título, autoria, imagem interna opcional, resumo e texto completo, consultado pelo endpoint de detalhe. Carregamento, falha, conteúdo retirado e nova tentativa aparecem no modal. Fechar preserva a busca e a rolagem da lista. A rota /article continua compatível com acessos diretos; a lista não navega mais para ela. O modo de demonstração usa os mesmos cartões e modal, com indicação de conteúdo em preparação.

A busca por título, resumo ou categoria usa q na API antes da paginação. Pesquisa a publicação vigente, sem antecipar edições em rascunho. Paginação de 20 e botão “Carregar mais” permanecem.

Validação: 100 testes do app e 164 da API aprovados; TypeScript aprovado. Conferidos no simulador iOS lista, miniaturas, abertura/fechamento do modal, texto completo e busca/limpeza por categoria. Filtro JSON também consultado no MariaDB local. Nenhum conteúdo editorial foi alterado.

## Coleção de medalhas em grade · 09/11/2026

Minhas medalhas reutiliza ListScreen, com troféu e lupa recolhida. A grade tem duas colunas e mostra arte/nome; um contador aparece somente para conquistas repetidas. Em telas estreitas ou com fontes ampliadas, passa a uma coluna. O toque abre Sheet com imagem maior, descrição, quantidade e histórico de origens e datas no horário de Brasília. Fechar preserva busca e posição. Removidas a introdução e a data repetida fora do histórico.

A busca por nome ou descrição usa q na API antes da paginação de 20. O filtro considera a mesma versão da última conquista própria apresentada na coleção; não pesquisa o cadastro administrativo atual nem medalhas de terceiros ou não conquistadas. Resultados preservam a contagem e todo o histórico próprio. Concessão, reconciliação e imagens conquistadas permanecem iguais.

Validação: 100 testes do app e 165 da API aprovados; TypeScript aprovado. No simulador iOS, conferidos grade com imagens, abertura/fechamento dos dois detalhes, pesquisa por nome, preservação do filtro ao fechar e limpeza. A pesquisa também foi exercitada no servidor local com MariaDB. Nenhuma conquista foi criada ou alterada.

## Notificações: caixa e preferências separadas · 09/11/2026

/notifications passa a usar ListScreen, com caixa de mensagens, contador, atualização e atalho compacto “Avisos”. Mensagens não lidas têm borda/ícone; tocar marca como lida após confirmação da API. Deslize parcial revela remoção e deslize completo remove, com “Desfazer” e alternativa acessível. Não se pede permissão nem se altera a preferência ao ler ou remover.

/notification-settings concentra o estado dos avisos, ativação/desativação, teste e abertura dos ajustes do sistema. Conteúdo centralizado e ação principal no rodapé via Flow. Configurações oferece Caixa de mensagens e Avisos do aparelho separadamente. Permissões do aparelho mantém câmera e direciona avisos à nova tela, sem duplicar os controles. O NotificationProvider e a introdução inicial permanecem.

Remoção usa dismissed_at na API, excluindo caixa/contador sem apagar envio ou forçar leitura. Restauração preserva o estado anterior. Validação: 103 testes do app, 168 da API, TypeScript e exportações iOS/Android/web aprovados. Migration aplicada no MariaDB local; telas conferidas no simulador sem alterar mensagens ou permissões existentes.

## Histórico com foco na lista · 09/11/2026

Minhas atividades usa ListScreen, com ícone e busca recolhida como as outras áreas. Atalhos Registrar/Continuar, Do aparelho e Atualizar ficam no topo; o rascunho aparece em uma faixa curta. Removidos os botões “Ver registro” repetidos e a ação de registro no final da lista. Cada item clicável mostra nome, data, duração, situação e EV quando oficialmente concedidos.

O toque abre Sheet com data/duração, dimensão e origem quando fornecidas, energia concedida, data de registro e informações de processamento/erro. Registros com falha mantêm reenvio no detalhe, com proteção contra repetição e bloqueio offline ou contexto/consentimento incompatível. A confirmação /activity-result e o fluxo de adicionar atividade permanecem.

A busca por nome usa q no endpoint pessoal, com paginação por cursor e apenas registros próprios. Não altera o cache global nem a fila offline. Pendências locais que correspondem à busca são combinadas por ID; falha de consulta ou estado offline mostra os resultados salvos com indicação explícita. Limpar volta à lista original. O mapeamento preserva a dimensão e a origem do snapshot da API, sem inferir ou recalcular pontos.

Validação: 103 testes do app e 169 da API aprovados; TypeScript aprovado. No simulador iOS, conferidos atualização, cartões compactos, detalhes de registro mental e busca/limpeza por nome no MariaDB local. Nenhuma atividade nova foi enviada. Testes da API cobrem busca antes do cursor, nomes registrados preservados após mudança de catálogo e isolamento pessoal/organizacional.

## Importação automática de treinos · 09/11/2026

Conexão de treinos ganha autorização específica de envio automático, desativada por padrão e persistida por conta/contexto. A atualização automática continua sendo a leitura; o envio exige a nova autorização, conexão e termos vigentes. Somente treinos reconhecidos com dimensão fixa e taxa configurada seguem automaticamente. Revisões e conflitos continuam no detalhe manual.

A lista e os modais compartilham os estados Enviando, Confirmado, Revisar treino e Falha. Envios manuais e automáticos usam a mesma fila por identidade de origem. O servidor não altera as regras de pontuação, deduplicação ou janela temporal; apenas registra o modo na auditoria. Detalhes e validação em integracao-saude.md.

## Exemplos interativos dos treinos do aparelho · 09/11/2026

Criada /health-preview, acessível pelo botão “Ver exemplo com treinos fictícios” na consulta de treinos. Reutiliza a apresentação real de lista e modal com dados isolados para demonstrar Confirmado, Enviando, Falha e Revisar treino. Envios simulados e EV ilustrativos nunca chegam à API ou ao Histórico. Há controles de confirmação fictícia e reinício.

Validação: 112 testes do app e TypeScript aprovados; lista e recuperação de falha conferidas no simulador iOS. Nenhum treino fictício foi enviado à jornada real.

## Ajuste da meta em painel compacto · 09/11/2026

/goal passa a usar Sheet, como os outros detalhes do app. Sem AppHeader/logo no painel: título e fechar no topo, meta atual, aviso de vigência, campo e salvar. A altura acompanha o conteúdo, com a tela anterior visível sob o fundo escurecido. A apresentação da rota é transparente, sem a folha nativa alta que antes envolvia a tela completa.

Sheet ganha avoidKeyboard opcional, usado somente neste formulário para acomodar o teclado. Fechar descarta a edição não salva e retorna à origem. Validação numérica, meta demonstrativa e agendamento conectado para amanhã permanecem; envios repetidos enquanto salva são bloqueados.

Validação: 112 testes e TypeScript aprovados. No simulador iOS, conferidas abertura sobre a Home, altura compacta, foco no campo, valor preservado e fechamento sem salvar. O teclado virtual não apareceu com a configuração atual do simulador; o comportamento de ajuste foi implementado com KeyboardAvoidingView. Nenhuma meta foi alterada.
