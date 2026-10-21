# Acesso temporário à API

Etapa provisória para testes, a substituir pelo login institucional.

## Configuração

Na API, habilite `BORA_TEST_LOGIN_ENABLED=true` em ambiente `local` ou `staging`. Em produção o endpoint retorna 404 mesmo com a configuração habilitada. Prepare os seis participantes locais com `php artisan db:seed --class=BoraDemoSeeder` (esse seeder só roda em local). O endpoint nunca escolhe usuários fora dos IDs fixos dessa demonstração, exclui perfis com papéis administrativos e exige vínculo ativo de participante. Sem participantes disponíveis retorna 503.

No app, copie `.env.example` para `.env` e ajuste `EXPO_PUBLIC_API_URL` para a URL da API incluindo `/api/v1`. Em aparelho físico, use o IP da máquina acessível pela rede ou a URL HTTPS de testes; localhost aponta para o próprio aparelho. Reinicie o Expo após alterar a variável. Sem essa variável, o protótipo mantém o login simulado.

## Comportamento

`POST /auth/test-login` sorteia um participante e emite token Sanctum com validade de oito horas. O app guarda a sessão no AsyncStorage, valida `/me` ao reabrir e reutiliza o usuário. Falhas de rede não descartam o token nem criam outro acesso. Token expirado ou rejeitado exige nova entrada. Sair tenta revogar a sessão no servidor e remove o token local. Sem conexão, o token remoto permanece sujeito à validade de oito horas. Não há renovação automática.

O armazenamento atual é provisório (AsyncStorage, sem criptografia). Antes da autenticação definitiva, substituir por armazenamento seguro. Registro de instalação e revogação já estão conectados à API. Sessões, rascunhos e atividades ficam separados dos dados do protótipo e isolados por usuário e vínculo.

O acesso temporário permanece para os testes. A jornada também foi conectada: perfil, vínculos, consentimento, atividades, energia, nível, constância, meta e notificações usam a API. Consulte [integracao-api.md](integracao-api.md). `apiRequest` centraliza o Bearer e o tratamento de falhas.

## Remoção

Desabilite `BORA_TEST_LOGIN_ENABLED` e remova a rota `auth/test-login`, o método `testLogin` e substitua `loginForTesting` pelo fluxo institucional em `src/api/session.ts`. Preserve o cliente autenticado compartilhado. Preserve as rotas protegidas por Sanctum.
