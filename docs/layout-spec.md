# Bóra: leiaute e registro de atividades

Atualizado em 19/10/2026 a partir das imagens originais em `Leiaute/`, exportadas do conceito Figma/PDF, e da regra de EV diária registrada em 17/10/2026.

## Direção visual implementada

- Azul-marinho, marca original em verde/azul, Montserrat e números de EV em destaque.
- Cabeçalho com marca centralizada e acesso ao perfil pela inicial do participante; telas internas têm botão de voltar.
- Hoje com três estatísticas, personagem 3D e arco de energia; abaixo, indicadores de verde, azul e meta total.
- Navegação inferior com Hoje, Desafios, Adicionar atividade em destaque ao centro, Ranking e Conhecer. O perfil fica no cabeçalho.
- Superfícies discretas e linhas de separação; leitura em coluna de até 520 px, tanto na web quanto no app.
- Ranking coletivo em linhas inspirado no leiaute original, preservando os limites do piloto. Não restaurar ranking individual público ou inventar dados de equipes.

## Conceitos preservados

EV diária = física/verde + intelectual/azul. Uma fonte pode substituir a outra integralmente para completar a mesma meta, sem exigência de 50/50.

Nível e constância agora têm telas e valores de prévia explicitamente ilustrativos (ver revisões de 19/10 abaixo); os valores oficiais dependem da API. A prévia de EV usa 40 verdes + 25 azuis, com meta inicial de 100 EV, explicitamente fictícios. A home, os desafios e o laboratório compartilham `EnergyPreviewProvider` na sessão do app. Alterações do laboratório refletem nas outras telas, mas registros de atividade não concedem pontos automaticamente. A prévia reinicia ao sair da sessão.

Os círculos verde e azul mostram valores em EV e sua contribuição em relação à mesma meta diária. Não representam duas metas independentes. O terceiro círculo e o arco do personagem representam o resultado combinado.

## Registro: a forma de entrada é diferente do tipo de atividade

1. **Por conta própria:** busca, sugestões e nome personalizado.
2. **Dados do aparelho:** abre a integração de saúde existente, com autorização e preferências próprias. Não conecta nem importa dados silenciosamente e ainda não gera EV.
3. **Evento:** abre o fluxo de eventos existente. Check-ins da demonstração permanecem simulados.
4. **Descobrir conteúdos:** caminho de inspiração; consumir conteúdo não cria atividade nem concede pontos automaticamente.

O formulário pergunta o que a pessoa fez, em vez de exigir primeiro uma escolha entre duas energias. Filtros Movimento, Mente e Bem-estar ajudam a encontrar sugestões; não são um enum definitivo de domínio e não determinam a cor do lançamento.

A busca ignora acentos e caixa. “Outra atividade” pede um nome de 2 a 80 caracteres. Após a escolha, o catálogo se recolhe em um resumo editável e revela tempo/data. Há atalhos de 10/20/30/45 minutos e Hoje/Ontem/Outra data. O rascunho persiste localmente e o nome personalizado aparece na revisão, no resultado e no histórico.

A etapa de revisão mantém envio simulado, fila offline, prevenção de envio duplicado e estados pendente/enviando/confirmada/falhou. Os controles técnicos de cenário continuam acessíveis pelo perfil, sem ocupar o formulário principal.

## Onde a experiência continua aberta

- O catálogo local é ilustrativo. Na integração, deverá vir de catálogo versionado/validado pela API, com identificadores estáveis em vez de nomes livres como chaves de domínio.
- Classificação de yoga, meditação, pausas e atividades mistas permanece decisão de produto; a interface não concede uma cor por inferência.
- Atividades personalizadas são aceitas no protótipo, mas não têm direito automático a EV. A API precisa definir revisão, elegibilidade e moderação.
- Tempo é a medida disponível na versão atual. O desenho admite campos guiados pelo catálogo (tempo, distância, sessão, conclusão), mas essas medidas adicionais ainda não foram implementadas.
- Bônus de eventos, confirmação de consumo de conteúdo, conversões em EV e prazos de desafios dependem das regras oficiais.

## Componentes e rotas atuais

- `src/features/JourneyHome.tsx`: tela Hoje e composição de EV.
- `src/features/ActivityEntry.tsx`: escolha da forma de entrada e formulário progressivo.
- `src/features/Activities.tsx`: revisão, resultado, histórico e detalhes compatíveis com links antigos.
- `src/features/JourneyChallenges.tsx`: desafio de EV total na prévia.
- `src/features/JourneyRanking.tsx`: visão coletiva e explicação das regras.
- `src/components/AppHeader.tsx`, `ActivityUI.tsx`, `src/design/Icon.tsx`: elementos visuais compartilhados.
- `src/features/avatar/EnergyAvatar.tsx`: cena que respeita foco, segundo plano e preferência de movimento reduzido.

A navegação usa `app/(tabs)` para Hoje, Desafios, a ação Adicionar, Ranking e Conhecer. Perfil é uma tela do Stack, acessível no cabeçalho; a rota `/content` redireciona para Conhecer. A experiência mantém Expo/React Native; não depende de uma página web dentro do app.

## Personagem único no perfil

Definição confirmada em 19/10/2026: nesta fase, todos os participantes usam o mesmo personagem 3D. Cadastro e edição de perfil não oferecem seleção de avatar. `ParticipantAvatar` reutiliza o modelo 3D padrão; o perfil acompanha a composição de energia da prévia, e o cadastro apresenta o personagem sem progresso atribuído.

A antiga preferência por emoji foi retirada do modelo local e é descartada ao restaurar versões anteriores, preservando nome, atividades e rascunho. Não há `avatar` selecionável no payload local de atualização de perfil. A edição de nome permanece disponível.

## Revisão da navegação inferior

A ação central Adicionar abre `/activity` sobre a aba atual, preservando o rascunho e retornando à aba de origem ao voltar. Não é uma aba de conteúdo vazia. O perfil saiu das abas para `/profile`, mantendo o endereço anterior e acesso pelo cabeçalho. O menu que duplicava esse acesso foi removido, mantendo a marca centralizada.

A home não repete os atalhos Desafios, Adicionar e Conhecer. Seus indicadores de EV, personagem e ações de histórico, conexão e eventos permanecem disponíveis. Conhecer reúne os conteúdos já existentes; artigos continuam em tela própria.

## Retorno às telas com 3D

O Canvas é preservado nas telas ainda presentes na navegação e sua renderização é suspensa enquanto estiverem ocultas ou em segundo plano. As abas mantêm as superfícies nativas com transição curta de opacidade, evitando zerar o GLView. Ver `docs/avatar-3d-poc.md` para a validação e o custo de memória dessa escolha.

## Apresentação na primeira abertura · 19/10/2026

Antes do acesso, três telas apresentam o Bóra: corpo/mente e suas cores; EV como soma das duas energias para uma meta diária livre de cotas por modalidade; constância, registro e significado do arco de progresso. A ilustração de fundo foi gerada para esta apresentação e é distribuída localmente em `assets/images/welcome-energy.jpg`; textos, botões e exemplos são elementos nativos acessíveis. O arco de 65/100 EV é explicitamente ilustrativo, sem alterar a prévia ou atribuir energia.

A pessoa pode continuar, voltar ou pular. A apresentação só é marcada como concluída ao tocar **Bóra começar** ou **Pular**, após salvar com sucesso a preferência local `bora:introduction:completed`. Fechar antes disso mantém a apresentação para a próxima abertura. A preferência é por instalação/aparelho, separada da sessão e dos dados fictícios: sair da conta ou recomeçar a demonstração não a apaga. Limpar os dados do aplicativo permite vê-la novamente; não há sincronização entre aparelhos. Falhas de gravação mostram uma opção de tentar novamente.

A leitura da preferência acontece antes da navegação, inclusive para acessos diretos a rotas internas, evitando exibir a home antes da apresentação. Após a conclusão, o fluxo de sessão, consentimento, perfil e retomada de atividade continua normalmente. A antiga tela genérica de boas-vindas foi substituída por esta apresentação; o fluxo de acesso começa em **Entrar no Bóra**.

Verificação: as três telas foram percorridas no simulador iOS; concluir levou à home da sessão existente. Após encerrar e relançar o processo do aplicativo, a home abriu diretamente, sem repetir a apresentação. TypeScript e 37 testes automatizados aprovados (incluindo três testes de persistência da apresentação).

## Minha constância · 19/10/2026

A rota protegida `/constancy` permite acompanhar a sequência de metas diárias de EV, os últimos sete dias e um calendário mensal. O visual retoma os círculos da apresentação: verde indica meta alcançada; azul indica contribuição parcial. Cada data passada ou o dia atual pode ser selecionado para consultar EV físico, mental, total e a meta daquele dia. Datas futuras ficam desabilitadas; o calendário permite voltar aos meses anteriores e retornar a Hoje. Meses sem dados mostram estado vazio.

Na prévia, um dia conta para a sequência quando a soma das energias alcança a meta daquele dia, mesmo usando apenas verde ou apenas azul. Se hoje ainda não completou a meta, a sequência até ontem é preservada. Uma data passada sem meta alcançada interrompe essa sequência. A meta histórica é um valor de cada registro diário e não muda ao ajustar a meta atual. A regra é uma definição da experiência demonstrativa, sem criar uma pontuação oficial na API.

A tela usa 14 dias históricos fictícios (identificados como ilustrativos), separados dos registros de atividades, e a mesma energia/meta de hoje da home. O histórico não é acumulado nem salvo como progresso real. Datas seguem o calendário local do aparelho, sem conversão de dia via UTC; a tela atualiza o dia na virada e ao retornar do segundo plano. A integração deverá receber registros diários da API com data, energia física, energia mental e meta aplicada.

Acesso pelo indicador **Constância** no topo da home, pela linha **Minha constância** em Sua jornada continua e pelo perfil. O indicador da home usa a mesma contagem ilustrativa da tela.

Verificação: TypeScript e 43 testes aprovados, com cobertura de calendário local, mudança de mês/ano, ano bissexto, semanas completas do mês, sequência, fonte única de energia, metas históricas e exclusão de datas futuras. No simulador iOS foram verificados o acesso pela home, a seleção de um dia com 120 EV exclusivamente mentais, o calendário, o mês anterior vazio e o retorno a Hoje. O botão **Ver mês** leva diretamente ao calendário.


## Meu nível, Vitalidade e EV acumulados · 19/10/2026

A rota protegida `/levels`, acessível pela home e pelo perfil, distingue **EV acumulados** (histórico preservado de conquistas) e **Vitalidade (PV)** (saldo dinâmico que determina o nível). Ambos aparecem lado a lado. Uma contribuição de 1 EV soma ao total histórico e gera 1 PV; só PV recebe desgaste. O simulador mostra o acumulado EV preservado enquanto a Vitalidade/nível diminuem.

O usuário escolheu desgaste após sete dias sem atividades. A prévia adota sete dias completos preservados, primeiro desconto no 8º dia, 20 PV/dia sujeito a desgaste e limiares `100*n*(n-1)/2` PV, piso zero/nível 1. Faixas, taxa e fronteira são exemplos para fechar na política. Uma atividade elegível reinicia a inatividade, mesmo sem alcançar a meta diária. O desgaste não apaga EV ou metas anteriores nem altera ranking automaticamente.

O botão **Experimentar evolução** leva a cenários de 0/7/8/14/30 dias, novas contribuições verdes/azuis e pausa protegida. Com o exemplo inicial de 950 EV e 950 PV, 30 dias sem atividades deixam **950 EV e 490 PV**, nível 3. Repor 150 EV resulta em **1.100 EV e 640 PV**, nível 4. Cenários não alteram a home ou registros. Aberturas EV e PV são constantes independentes, somadas ao EV de hoje apenas na prévia, sem persistência de pontuação oficial.

O registro canônico e o preparo da API estão no planejamento `docs/09-niveis-e-reserva-de-evolucao.md`. Não há débito automático, compra de proteção, pedido de licença ou motor oficial implementado.

Validação: TypeScript e 54 testes aprovados. Incluem carência, limiares, não duplicação de desgaste, proteção, reposição de qualquer cor e preservação de EV acumulados mesmo com PV zero.

Verificação no iOS da separação: o cenário de 30 dias exibiu 490 PV com 950 EV acumulados preservados; ao adicionar 50 EV mentais, passou a 540 PV e 1.000 EV acumulados. O nível continuou dependente apenas da Vitalidade.

## Login e reapresentação · 19/10/2026

O login passou a usar `LoginScreen`: marca centralizada, mensagem de boas-vindas, ilustração já criada para a apresentação, cartão com a ação principal **Continuar com a Fiocruz** e indicação clara de entrada simulada. Sessão expirada preserva a mensagem sobre rascunhos; falta de conexão desabilita a entrada e oferece reconexão simulada. Não há campos de senha nem acesso institucional real nesta etapa.

O cabeçalho não exibe o perfil enquanto o participante não tem acesso completo (`hasAccess`), abrangendo login e etapas iniciais. Continua oculto em Meu perfil e disponível nas telas internas autorizadas.

**Cenários de demonstração** é uma seção expansível com reapresentação, múltiplos vínculos, falha no acesso e vínculo não elegível, com descrições curtas. **Rever apresentação inicial** também aparece em Controles de demonstração. Ambos abrem a rota pública `/presentation`, que reutiliza as três telas existentes. Concluir ou pular volta à tela de origem (ou ao fluxo adequado se não houver histórico). O botão final manual é **Voltar ao app**. Não altera dados do participante, sessão, rascunhos ou a preferência persistida de primeira abertura; a apresentação automática continua exclusiva da primeira conclusão.

Verificado no iOS: login sem botão de perfil, abertura dos cenários, três telas de reapresentação e retorno ao mesmo login com os cenários ainda abertos. TypeScript e 54 testes aprovados.
