# Notificações da API no app · 21/10/2026

## Disponível

- Perfil → Minhas notificações e atalho no cabeçalho com contagem de não lidas.
- Caixa paginada da API, com texto completo. Tocar na mensagem marca como lida; receber ou tocar no aviso do sistema apenas abre a caixa, sem marcar leitura automaticamente.
- Atualização a cada 30 segundos enquanto o app está ativo, ao voltar ao primeiro plano e pelo botão Atualizar mensagens. Novas mensagens também atualizam a listagem aberta.
- Em Avisos do aparelho (/notification-settings), Ativar avisos solicita autorização do sistema por iniciativa do usuário. Negar não impede usar a caixa. A preferência continua por conta e aparelho e pode ser desativada nessa tela.
- Testar aviso do sistema emite uma notificação local imediata, sem criar mensagem nem alterar o banco. Toque no aviso abre a caixa apenas para a conta correspondente autenticada.
- Alertas usam texto genérico, sem expor título/conteúdo da mensagem. O último aviso é persistido por conta para evitar repetição, inclusive depois de reabrir o app. Uma consulta agrupa eventuais mensagens novas em um único aviso.
- API exige autenticação e vínculo ativo com a organização. Retorna unread_count e latest_unread em todas as páginas, considerando toda a caixa autorizada. Erros de consulta não apagam as mensagens.

## Limite atual

São avisos locais após consulta da API. O app fechado ou em segundo plano não consulta a caixa nem recebe mensagens remotas. Não há tokens push, provedor APNs/FCM, credenciais nem envio remoto nesta entrega. Para esse comportamento, implementar push no servidor e registro/rotação/revogação de tokens, preservando a regra de enviar só à última instalação usada. A permissão local não configura push.

expo-notifications está instalado e vinculado aos pods iOS. Não adicionamos entitlement aps-environment nem modo remote-notification: avisos locais não precisam de credenciais push. O manifesto da própria biblioteca inclui POST_NOTIFICATIONS no Android. Não é necessário ativar Push Notifications no App ID para testar esses avisos locais.

## Validação no aparelho

1. Publicar a API atualizada e gerar novo Archive com os pods atualizados. Builds antigos não incluem o módulo nativo.
2. Entrar no app com um perfil de teste e abrir Notificações → Avisos. Ativar avisos e tocar em Testar aviso.
3. No admin, abrir o mesmo usuário em edição e enviar uma comunicação pelo canal No app (in_app).
4. Manter o app ativo: em até 30 segundos, conferir contagem e aviso. Abrir a caixa, verificar o texto, marcar como lida e conferir redução da contagem.
5. Atualizar/reabrir: a mesma mensagem não deve emitir novo aviso. Negar a permissão mantém a caixa disponível.
6. Fechar o app, enviar outra mensagem e reabrir: consultar e avisar apenas quando voltar ao uso. Recebimento enquanto fechado depende da futura integração push.

Validação automatizada cobre autorização, isolamento por destinatário/organização ativa, leitura idempotente, resumo entre páginas, deduplicação persistente, permissão negada e resposta atrasada após troca de sessão. A apresentação real de banner/som depende do sistema (permissões, modo Foco e configurações do usuário) e precisa ser conferida no aparelho.


## Separação e gestos · 09/11/2026

Notificações usa o cabeçalho ListScreen e fica dedicada às mensagens: contagem de não lidas, atualização, toque para marcar leitura e deslize à esquerda. Um deslize parcial revela “Remover”; um deslize completo remove. Há também ação de acessibilidade para remoção. A alteração visual de leitura ou remoção só é confirmada após sucesso da API; falhas preservam a mensagem. “Desfazer” restaura a última removida.

Avisos do aparelho reúne estado, ativação/desativação, teste e ajustes do sistema. Tem conteúdo centralizado e ação principal no rodapé. Configurações oferece acessos separados para Caixa de mensagens e Avisos do aparelho; Permissões do aparelho aponta para a mesma tela de avisos, sem duplicar controles. Abrir as telas não solicita autorização nem emite teste automaticamente.

A API adiciona DELETE /me/notifications/{id} e PATCH /me/notifications/{id}/restore. dismissed_at oculta mensagens da caixa, contador e latest_unread, sem apagar os registros de envio nem marcar leitura implicitamente. Restaurar preserva o estado lida/não lida. Aplicar a migration 2026_11_09_000002_add_message_dismissal antes desta versão do app.

Validação: 103 testes do app e 168 da API aprovados; TypeScript e exportações iOS, Android e web concluídos. Migration aplicada no MariaDB local. Conferidos no simulador caixa e preferências separadas, sem alterar mensagens ou permissões. Testes automatizados cobrem toque, distinção entre rolagem vertical e deslize, remoção duplicada, cancelamento, alternativa acessível, isolamento, idempotência, restauração e paginação sem mensagens removidas.
