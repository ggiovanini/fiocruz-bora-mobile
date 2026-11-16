# Login Único Fiocruz no app

Implementação em 11/11/2026. A API Laravel integra o SSO de produção com `Socialite::driver('fiocruz')`; a liberação existe somente no staging online. O app não recebe client secret nem tokens institucionais.

## Configuração

```dotenv
EXPO_PUBLIC_API_URL=https://bora.dmgn.com.br/api/v1
EXPO_PUBLIC_ANDROID_API_URL=https://bora.dmgn.com.br/api/v1
```

O override Android é opcional; se existir no ambiente de compilação, ele prevalece e precisa apontar para o mesmo endereço. Builds para outra API recusam o Login Único. A prévia web informa que o login exige o app instalado. Na ausência de API, o modo de protótipo continua separado.

O botão de entrada usa o Login Único quando a API está configurada, exceto no modo local explicitamente habilitado descrito abaixo. No início, o app cria verificador e state com aleatoriedade criptográfica, envia o desafio SHA-256 ao backend e abre a URL retornada com `expo-web-browser`. O Laravel recebe o callback institucional online e devolve um código descartável ao app em `bora://auth/fiocruz`.

O app valida o endereço de retorno e o state, troca o código pelo token Bóra apresentando o verificador original, e guarda a sessão no SecureStore. O código expira em dois minutos e é consumido uma única vez. O token Bóra do Login Único expira em 30 dias por padrão (configurável na API, até esse limite) e é revogado no logout online. Tokens já emitidos mantêm o prazo original; a duração nova vale a partir do próximo login após atualizar a API. Falhas de rede não apagam uma credencial válida; respostas 401 encerram a sessão atual sem afetar uma sessão nova que tenha sido estabelecida enquanto a requisição estava em andamento.

As sessões temporárias antigas no AsyncStorage são descartadas na restauração. Os dados locais da jornada permanecem separados por usuário. O identificador de instalação recebido na troca é utilizado no registro e no logout. Em cancelamento ou encerramento do app durante o login, começar uma nova tentativa; não há recuperação automática da tentativa incompleta.

## Nova build necessária

Foram adicionados `expo-crypto`, `expo-web-browser` e `expo-secure-store` com versões compatíveis com o SDK do projeto. O scheme `bora` já estava declarado em iOS e Android. Os Pods do iOS foram atualizados. Gerar uma build nativa nova; uma atualização apenas de JavaScript sobre uma build antiga não instala esses módulos.

## Validação

Tipos e testes automatizados cobrem o desafio/verificador, state, códigos duplicados, endereço forjado, cancelamento, bloqueio fora do staging e armazenamento seguro. Também foram gerados bundles iOS e Android para conferir a integração JavaScript. Esses checks não substituem o teste em aparelho com o cadastro institucional real após a publicação da API no staging.

Verificar em iOS e Android: login, retorno do navegador, primeiro cadastro, restauração após fechar o app, expiração e logout. O logout encerra a sessão do Bóra; a sessão do SSO pode permanecer ativa e permitir reentrada sem pedir senha.

Configuração do servidor, migração, vinculação de contas existentes e permissões administrativas estão em [Login Único na API](../../bora-api/docs/login-unico-oidc.md).

## Organização preferencial

Atualização de 12/11/2026: se a plataforma definir uma organização preferencial, as novas contas institucionais recebem um vínculo confirmado de participante na criação do perfil. O app reconhece o vínculo retornado pela API, pula a escolha manual de organização e informa a organização atribuída antes dos termos. Os consentimentos continuam obrigatórios.

`GET /me` informa `registration_organization` com id e nome. A indicação aparece no cadastro somente se o vínculo correspondente continuar ativo. Sem preferência, o fluxo de escolha e confirmação já existente é preservado. Trocar a preferencial não move contas antigas nem reativa vínculos suspensos. O nome fornecido pela claim `name` preenche o perfil; um nome já escolhido pela pessoa é preservado.

As builds anteriores também reconhecem o vínculo ativo e pulam a escolha, mas a nova mensagem exige a atualização do app. Não foi gerado um novo binário nesta alteração. Política e implantação em [Organização preferencial](../../bora-api/docs/organizacao-preferencial.md).

## Desenvolvimento local com participante fictício

No `.env` do app, configure `EXPO_PUBLIC_LOCAL_LOGIN_ENABLED=true` e a URL da API local (`localhost`, `10.0.2.2` no emulador Android ou IP privado da rede para aparelho físico). Na API, configure `APP_ENV=local` e `BORA_TEST_LOGIN_ENABLED=true`. Prepare os participantes fictícios com `php artisan bora:demo-seed`. Após mudar a configuração da API, execute `php artisan config:clear`; reinicie o Expo após alterar o `.env` do app.

O botão de entrada reutiliza uma sessão válida ou sorteia um participante fictício sem privilégios administrativos, com sessão de oito horas. Sair e entrar novamente permite outro sorteio, que pode repetir o mesmo participante. Os demais recursos continuam usando a API local e suas autorizações normais. Use banco e dados fictícios separados dos ambientes publicados.

O modo exige build de desenvolvimento e endereço local/privado. Os scripts de Release para iOS e Android forçam `EXPO_PUBLIC_LOCAL_LOGIN_ENABLED=false`. Em outras formas de gerar builds para staging ou produção, remova a opção do ambiente de build ou configure `EXPO_PUBLIC_LOCAL_LOGIN_ENABLED=false`. Uma configuração incompatível interrompe a entrada; falhas no Login Único nunca acionam o login fictício. A API recusa `/auth/test-login` em staging e produção mesmo com `BORA_TEST_LOGIN_ENABLED=true`. A opção pública do app não é segredo nem substitui a proteção da API.

## Persistência da sessão e retorno do SSO — 16/11/2026

A rota `bora://auth/fiocruz` agora retorna ao índice `/`, que decide entre jornada e cadastro conforme a sessão atual. A rota de retorno fica explicitamente disponível fora dos grupos protegidos, sem animação. Antes ela redirecionava diretamente para `/onboarding`, que deixa de estar disponível assim que um participante cadastrado se autentica, criando uma corrida na navegação.

A duração anterior de oito horas existia tanto no token emitido quanto no limite global do Sanctum. Ambos foram ajustados para permitir a sessão institucional de 30 dias. O login fictício local continua com oito horas. Não há renovação automática além do vencimento.

Validar em aparelho iOS e Android: retorno com sessão SSO já salva, retorno pedindo senha, cadastro incompleto, cancelamento, login após expiração e reabertura do app. A correção de navegação precisa de atualização do aplicativo; a nova duração depende da publicação da API. Ainda não foi publicada nenhuma dessas alterações nesta tarefa.

Biometria ainda não foi habilitada. Ela pode desbloquear uma sessão válida guardada no aparelho, mas não renova tokens vencidos. Uma implementação deve ser opcional, verificar biometria disponível/cadastrada e permitir nova tentativa ou Login Único em cancelamento ou mudança da biometria. Não se deve pedir biometria a cada requisição da API.
