# Integração da jornada com a API

Implementada em 20/10/2026. Defina `EXPO_PUBLIC_API_URL` com a URL acessível pelo aparelho, incluindo `/api/v1`. O acesso temporário por perfis de demonstração permanece nesta fase. Os demais dados dos recursos conectados são retornados pela API.

## API local no emulador Android

O `.env` pode manter endereços separados, sem alterar o iOS:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
EXPO_PUBLIC_ANDROID_API_URL=http://10.0.2.2:8000/api/v1
```

O Android usa a variável específica quando preenchida; iOS e web usam a variável comum. Sem a variável Android, todas as plataformas usam a comum. A mesma seleção se aplica aos documentos públicos e às requisições autenticadas.

`10.0.2.2` é o acesso ao computador pelo emulador do Android Studio; não é o endereço de um aparelho físico. O servidor Laravel pode continuar em `127.0.0.1:8000`. O build Debug já declara INTERNET e permite HTTP. Não é necessário um novo prebuild para mudar apenas esses endereços: reinicie o Metro e recarregue o app.

Para homologação/distribuição, use endereços HTTPS acessíveis pelo aparelho e remova a configuração local específica do Android do ambiente de build.

## Recursos conectados

- Perfil: consulta do nome e contatos; edição do nome via `PATCH /me`.
- Vínculos: consulta das organizações próprias e seleção quando houver mais de uma. A seleção fica salva por usuário; o servidor continua autorizando cada solicitação pelo vínculo.
- Participação: consulta e registro/revogação do consentimento de atividades, associado à versão exata dos termos publicados. A leitura dos termos usa essa publicação específica. Nova publicação exige novo aceite; o checkbox nunca é marcado automaticamente.
- Catálogo: tipos ativos, nomes, grupos e classificação física/mental/escolha vêm de `/activity-types`. O formulário exige dimensão para tipos com escolha e nome personalizado quando solicitado.
- Registro manual: usa o fuso, a janela de sete dias e as regras de pontuação da API. Não há estimativa local de EV oficial.
- Histórico: consulta por vínculo, conciliação por `client_activity_id`, carregamento de páginas por cursor e exibição do estado de validação e EV efetivamente concedido.
- Jornada: home, avatar, perfil e constância usam energia, metas históricas, sequência, EV acumulados e PV oficiais. A tela de nível apresenta a faixa e o próximo nível retornados pelo servidor, sem aplicar a fórmula ilustrativa antiga.
- Meta: alteração agendada para o dia seguinte; a meta de hoje permanece igual. Controles de energia fictícia não alteram o modo API.
- Notificações: caixa interna paginada e marcação como lida em `PATCH /me/notifications/{id}/read`.
- Instalações: UUID separado por usuário; registro iOS/Android durante o acesso ativo. Logout tenta revogar o token e a instalação no servidor e encerra a sessão local mesmo sem rede. No navegador, o UUID acompanha o logout sem registrar uma plataforma nativa fictícia.

## Persistência, envio e reconciliação

O armazenamento do protótipo (`bora:prototype:v1`) fica separado do armazenamento da integração (`bora:api:v1:{user}:{membership}`). Registros fictícios não são migrados nem enviados. Rascunhos e filas pertencem ao usuário e vínculo que os criaram. As preferências locais de saúde também são separadas por identidade.

Antes de enviar, o app persiste dois UUIDs distintos (`client_activity_id` e chave idempotente), o vínculo e o payload exato. Tentativas posteriores reutilizam todos esses valores. Um envio iniciado e interrompido volta a pendente após reabrir. Falhas preservam o registro e oferecem nova tentativa; confirmação da API substitui o estado local pela identidade do registro, inclusive se a primeira resposta tiver sido perdida. Falhar ao atualizar o resumo depois de um POST bem-sucedido não transforma o registro confirmado em erro.

401 encerra o acesso autenticado e solicita nova entrada. Uma resposta atrasada do token anterior não pode apagar uma sessão nova. Resultados de solicitações antigas não são aplicados após troca de conta/vínculo. 403/409/422 permanecem falhas visíveis; não são tratados como confirmação nem provocam uma nova chave de envio. Falha de persistência bloqueia o POST para não perder a idempotência.

A abertura da sessão precisa de rede para consultar os contratos e autorizações atuais. Durante o uso, registros ficam preservados no aparelho diante de uma falha de conexão. Não há sincronização em segundo plano: as atualizações ocorrem ao abrir, voltar ao app, atualizar manualmente e depois de registrar uma atividade. A virada do dia usa o fuso da jornada e pede novo resumo. Não há polling contínuo do servidor.

## Fora deste recorte

Equipes/ranking, campanhas específicas, conteúdos editoriais, eventos e QR Code continuam como exemplos até terem endpoints próprios. A consulta HealthKit/Health Connect permanece local e não é transformada em registro manual nem enviada como importação. Sem configuração de API, o protótipo mantém os dados de exemplo; um erro com a API configurada nunca substitui os dados oficiais por fixtures.

Autenticação institucional, armazenamento seguro definitivo do token e sincronização em segundo plano permanecem evoluções separadas do acesso temporário já documentado.

## Validação

Testes de contrato e mapeamento cobrem UUIDs, payload, escolhas do catálogo, janela de datas, reenvio, conciliação e erros HTTP. A suíte da API valida as operações e o vínculo entre consentimento e publicação. O teste no navegador usa uma API e banco isolados, sem alterar as atividades dos participantes do ambiente local.

## Desafios e conquistas

A aba Desafios também está conectada a `/memberships/{membership}/challenges`. A coleção pessoal usa `/me/medals`, com acesso pelo Perfil e pelos Desafios. A API avalia as atividades aprovadas e concede a medalha uma única vez; o app exibe o progresso e a conquista sem conceder pontos por conta própria. Regras, período e estilos são mantidos no admin. Ao abrir um desafio, o tipo elegível pode ser preenchido no formulário sem substituir um rascunho existente.
