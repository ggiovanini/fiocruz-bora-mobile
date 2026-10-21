# Requisitos de acesso e notificações

Atualização em 21/10/2026: a caixa da API já está integrada, com contador, atualização em primeiro plano e avisos locais opcionais. Veja [estado atual e roteiro de teste](notificacoes-api.md). O texto abaixo registra o planejamento de 20/10; as referências a interface ainda não integrada foram superadas. Push remoto e sua política de instalações continuam pendentes.

Decisão de 20/10/2026. Requisitos da próxima integração; não são funções já disponíveis no app.

- Login Fiocruz autentica uma identidade vinculada a um perfil local UUID do Bóra. E-mail não é chave permanente e não autoriza fusão automática de contas. Consultar perfil e vínculos ativos na API; não usar a sessão do mock como credencial.
- Guardar bearer token em armazenamento seguro; isolar fila/cache por pessoa e contexto. Sessão expirada preserva rascunho da conta, bloqueia envio e pede nova autenticação. Não importar atividades demonstrativas para o ambiente real.
- Gerar UUID aleatório persistido por instalação/associação. Não usar IMEI, identificador publicitário ou outro identificador físico. Registrar plataforma com `PUT /api/v1/me/installations/{uuid}` após login e uso em primeiro plano. No ambiente local, token é emitido por comando da API e expira em oito horas; login institucional e renovação ainda estão pendentes.
- A API mantém somente uma última instalação usada por pessoa; comunicar uso em primeiro plano, nunca por recebimento de push ou sincronização de fundo. Não reenviar eventos offline antigos como se fossem uso atual. A ordem é a observada pelo servidor, não o relógio do aparelho.
- Logout chama `POST /api/v1/auth/logout` com installation_id e remove credenciais locais. Troca de conta exige nova associação UUID; não tentar tomar posse do UUID anterior. Se offline, sair localmente e tratar revogação remota posteriormente sem promover instalação antiga; concluir essa política antes de push real.
- Preparar permissão, obtenção/rotação e remoção do token de notificações em etapa própria. Registrar ambiente e aplicativo de destino para separar builds. Não solicitar permissão de push nesta etapa.
- Notificações futuras vão apenas à última instalação. Sem permissão/token válido ou com instalação revogada, não enviar para outra antiga. Preferências de comunicação devem ser respeitadas e a tela bloqueada não deve expor saúde/atividades. Deep links exigem autenticação e autorização.

A API já oferece perfil, vínculos, contexto autorizado e registro de instalação. O app ainda usa mocks; não foi conectado nesta entrega. Tokens de push, envio, sessão vinculada à instalação, revogação offline e proteção contra requisições atrasadas precisam ser concluídos e testados antes de habilitar notificações.

Aceite da integração: A → B → A resulta somente em A como destino; logout de A limpa o destino sem voltar a B; logout de instalação antiga preserva a mais recente; troca de conta não envia dados nem notificações à conta anterior; negar permissão não ativa envio em outro aparelho.

## Base disponível na API · 20/10/2026

O painel cadastra perfis sem senha e edita contatos. `GET /api/v1/me` passa a incluir email e phone da própria pessoa. Há seis perfis de demonstração locais, incluindo `ana@bora.example`; testes podem usar token do comando local da API sem criar uma senha. Não enviar perfis/credenciais dos mocks como identidade real.

A caixa de entrada está disponível em `GET /api/v1/me/notifications` (paginação de 20) e `PATCH /api/v1/me/notifications/{id}/read`. As chamadas exigem bearer token e só retornam mensagens próprias de organizações com vínculo ativo. A integração da interface e do armazenamento seguro do token no app ainda precisa ser implementada. Essa caixa por perfil não é push: o envio a apenas uma instalação continua pendente do provedor/tokens e deve preservar a regra de última utilizada.

## Contrato real de atividades · 20/10/2026

A API oferece `GET /api/v1/activity-types`, leitura/registro do aceite em `/api/v1/memberships/{membership}/consents/activity-recording` e POST/GET `/api/v1/memberships/{membership}/activities` (detalhe por ID). O POST manual exige UUID em `Idempotency-Key`, client_activity_id UUID, código do tipo, activity_date, timezone e duration_seconds em minutos inteiros convertidos para segundos. O retorno 201/pending significa recebido, não aprovado ou pontuado.

A fila real deverá persistir IDs por pessoa/contexto, repetir o mesmo conteúdo/chave em timeout e tratar 409 sem gerar chave nova silenciosamente. Separar estado de transporte do estado de validação e consultar detalhe para atualizações; o replay mantém a resposta original. Não importar registros `mock-*` nem inferir energia pelo catálogo. Interface mobile e sessão real continuam pendentes de conexão; nenhum registro demonstrativo foi enviado automaticamente.
