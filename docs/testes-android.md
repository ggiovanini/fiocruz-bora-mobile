# Verificação inicial Android — 22/10/2026

## Resultados

- Node 20.19.4: verificação TypeScript e 73 testes aprovados.
- Exportação do bundle Android concluída.
- JDK 17, SDK 36, arquitetura arm64-v8a: assembleDebug concluído.
- APK instalado no emulador Pixel 8 / Android 15.
- A abertura ainda falha com `Unable to load script`. Metro foi iniciado na porta 8081 e o redirecionamento adb foi aplicado, mas não houve solicitação do bundle registrada pelo servidor. Isso impede validar os fluxos da interface nesta rodada. Investigar a conexão/configuração de desenvolvimento antes de atribuir a falha ao bundle de distribuição.

## Ajustes identificados

- O projeto nativo usa applicationId/namespace `br.fiocruz.boramobile`, enquanto app.json define `br.fiocruz.mobile.bora`. Conciliar antes da distribuição; a troca do identificador altera a identidade da instalação.
- versionName nativo é 1.0.0; app.json e package.json usam 1.0.1. versionCode está em 154.
- A explicação nativa do Health Connect e o plugin que a gera ainda descrevem passos e ausência de envio à API. O fluxo atual solicita apenas treinos e oferece importação explícita à API; atualizar os dois textos em conjunto.

## Próxima rodada

Resolver a abertura no emulador; validar apresentação, acesso, navegação e avatar; testar QR/câmera e notificações. Em aparelho com fonte de treinos conhecida, validar concessão/negação/revogação de acesso ao Health Connect, seleção e importação, repetição e modo offline. Os resultados acima não confirmam esses fluxos nem leitura de dados reais.
