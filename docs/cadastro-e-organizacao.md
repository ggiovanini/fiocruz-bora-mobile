# Cadastro e confirmação de organização

Implementado em 09/11/2026. O fluxo começa com uma pessoa autenticada na API. O login institucional e a criação/vinculação do perfil pela identidade verificada continuam sob o contrato de autenticação; esta entrega não cria um login por e-mail arbitrário. O acesso temporário de demonstração continua selecionando perfis já existentes.

## Primeiro acesso

- A pessoa sem vínculo escolhe uma organização no diretório pesquisável e paginado. A escolha abre um pedido pendente, separado dos vínculos de acesso.
- Se não encontrar a organização, pode continuar na jornada pessoal e retornar a Minha organização depois. A conclusão dessa etapa fica salva no servidor.
- Depois da escolha, uma tela explica a espera pela confirmação com linguagem amigável e convida a começar.
- Aceita os termos da jornada pessoal, completa o perfil e usa atividades, EV, níveis, constância, equipes e conteúdo geral.
- Perfil e Configurações mostram a situação do vínculo. Minha organização permite consultar o resultado, atualizar a situação, cancelar um pedido pendente e solicitar outra organização. Um pedido analisado não pode ser cancelado por um reenvio antigo.
- A confirmação cria um vínculo de participante. Para usar recursos institucionais, a pessoa seleciona a organização confirmada e aceita os termos daquele contexto. O app atualiza vínculos e pedidos ao retomar a sessão e oferece atualização manual.
- Eventos, QR de presença e desafios institucionais exigem vínculo confirmado. Abrir esses caminhos na jornada pessoal apresenta orientação e permite escolher um vínculo confirmado, sem consultar conteúdo restrito.
- O histórico pessoal agrega os próprios registros de todos os contextos. A fila offline continua isolada por conta/contexto; confirmar ou corrigir um pedido mantém o contexto pessoal e não redireciona registros pendentes para outra organização.

## Pré-requisitos de validação

Usar Node 20.19.4 (ou versão compatível com as dependências instaladas). `npm test` valida tipos e os fluxos, incluindo primeiro acesso sem vínculo, preservação da fila pessoal após confirmação e saída da conta durante envio. Confirmar em aparelho a navegação e as permissões de Saúde antes de distribuir uma versão.

A API deve receber a migration de cadastro antes da distribuição deste app. Os termos pessoais e institucionais são versionados pela API. Alterar os textos de referência do repositório não publica nem substitui uma versão já aceita.

O login simplificado, a nova imagem do Bean e as apresentações únicas de notificações/câmera estão descritos em [Login e primeiras permissões](login-e-permissoes.md). Os controles ficam em Configurações → Aplicativo → Permissões do aparelho.
