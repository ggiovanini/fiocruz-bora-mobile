# Meta inicial no cadastro

Novos participantes escolhem entre Iniciante (30 EV), Dia a dia (60 EV) e Experiente (100 EV) em um carrossel ilustrado, depois de consentimento/perfil e antes da jornada. O botão confirma a opção em exibição. As três abas também permitem navegar sem deslizar; apenas a opção visível fica disponível ao leitor de tela.

A ação fica no rodapé seguro. O conteúdo ocupa a área central e permite rolagem em telas pequenas ou com fontes ampliadas. O app informa que atividades para corpo e mente somam EV para uma só meta e que a escolha começa hoje.

`initial_goal_selected: false` no perfil mantém a pessoa no cadastro. O app só libera a jornada depois de confirmar a escolha e recarregar perfil e energia da API. Erros mantêm a etapa disponível para tentar novamente; a API aceita repetir a mesma confirmação sem duplicar os registros. A preferência no protótipo também fica salva na jornada local.

Contas existentes não repetem a etapa. A ausência do campo na API preserva compatibilidade com o fluxo anterior. Alterações feitas nas configurações continuam sendo agendadas para amanhã.

Publicar primeiro a API e sua migration; depois atualizar o app. Nenhuma publicação foi feita nesta tarefa. Regras e validações em [Meta inicial na API](../../bora-api/docs/meta-inicial.md).
