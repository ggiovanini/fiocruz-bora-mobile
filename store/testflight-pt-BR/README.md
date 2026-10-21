# Bóra — pacote do piloto TestFlight

Preparado em 19/10/2026 para Nibilabs. Idioma: português do Brasil. Bundle configurado no projeto: `br.fiocruz.mobile.bora`.

## Conteúdo

- `icones/`: símbolo original em fundo azul-escuro e alternativa clara, 1024 × 1024, sem transparência e sem cantos arredondados embutidos. Miniaturas em tamanhos comuns de iOS para referência.
- `imagens/iphone/`: cinco peças de 1206 × 2622 px, com títulos e capturas reais do app.
- `imagens/ipad/`: uma peça de 2064 × 2752 px, capturada em iPad de 13 polegadas. O app declara suporte a tablet.
- `capturas-originais/`: seis capturas nativas sem a composição editorial, nos tamanhos respectivos. Valores de demonstração e avisos da interface foram preservados.
- `visao-geral.png` e `index.html`: prévia rápida do conjunto.
- `textos/descricao-beta.txt`: descrição para o TestFlight.
- `textos/o-que-testar.txt`: roteiro da rodada de testes.
- `textos/notas-revisao-beta-en.txt`: acesso e limites da beta, em inglês, para o revisor.
- `textos/convite-piloto.txt`: mensagem reutilizável para convidar participantes. Não foi enviada a ninguém.
- `textos/campos-app-store.txt` e `metadados.json`: valores para copiar, incluindo sugestões para futuro cadastro/página e pendências explícitas.
- `fontes/`: vetores originais, fundo gerado, prompt usado e composição reproduzível. O fundo foi gerado pela ferramenta image_gen integrada; a marca foi preservada a partir do SVG original e a interface foi capturada do app real.

## O que preencher no TestFlight

1. Em Test Information, usar `descricao-beta.txt` como **Beta App Description** e `suporte@nibilabs.com` como **Feedback Email**.
2. Nas informações da compilação, usar `o-que-testar.txt` no campo **What to Test**.
3. Para testes externos, usar `notas-revisao-beta-en.txt` nas notas da revisão beta e completar o nome e o telefone da pessoa de contato. A entrada do app é simulada; o revisor não precisa de credenciais institucionais.
4. A primeira rodada externa pode passar por TestFlight App Review. O material descreve o estágio atual, sem apresentar login, ranking, conteúdos de exemplo ou pontuação como serviços oficiais.

As imagens não são anexos obrigatórios de Test Information. No TestFlight, screenshots de convite podem ser herdadas da última versão pública aprovada, quando ela existe. Estas peças servem para apresentação do piloto e preparação de material de página; as capturas originais também estão disponíveis. Não é necessário publicar o protótipo na App Store pública para testar por TestFlight.

## Ícone no aplicativo

O ícone principal foi copiado para `assets/app-store/bora-icon-1024.png` e referenciado em `expo.ios.icon` no `app.json`. A alternativa clara é uma opção visual; não foi configurada como aparência automática.

O ícone da loja/TestFlight vem do binário. Para incorporá-lo ao próximo build iOS:

```sh
npx expo prebuild --platform ios
npx expo run:ios
```

Para distribuir aos participantes, gerar e enviar a compilação de distribuição pelo fluxo habitual do projeto. A execução local acima não faz upload e não cria uma build TestFlight. Os ajustes nativos existentes foram preservados; não foi executado `prebuild --clean`.

## Identificação e URLs fornecidas

- Titular: Nibilabs.
- Copyright: 2026 Nibilabs.
- Feedback: suporte@nibilabs.com.
- Suporte: https://www.nibilabs.com/solicitacao-de-exclusao-de-dados/
- Privacidade: https://www.nibilabs.com/politica-de-privacidade

As URLs foram mantidas exatamente como informadas. Não foi possível verificar seu conteúdo neste ambiente; conferir que estão públicas e que cobrem o Bóra, o piloto e a consulta opcional ao Saúde. Nenhuma política jurídica foi inventada e nenhuma declaração de App Privacy foi enviada/preenchida automaticamente.

Faltam nome/sobrenome e telefone da pessoa de contato da revisão beta. A classificação etária e eventuais declarações de privacidade devem refletir o build efetivo. A disponibilidade do nome sugerido não foi consultada nem reservada.

## Coerência com o build atual

A descrição informa explicitamente que login, EV, Vitalidade, níveis, calendário, ranking e eventos contêm simulações. A consulta opcional de passos/treinos do Saúde é uma integração real e separada da pontuação fictícia. As imagens usam perfil fictício “Participante”, sem dados pessoais ou registros reais de saúde. Não foram inventadas integrações, premiações ou resultados clínicos.

As capturas foram obtidas na interface atual servida ao simulador. O binário de distribuição deve usar o mesmo código para corresponder às imagens; recapturar se as telas mudarem.

## Fontes de especificação consultadas

- [Informações de teste no TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/provide-test-information/).
- [TestFlight](https://developer.apple.com/testflight/).
- [Tamanhos e formato das capturas](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/).
- [Nome, subtítulo e privacidade](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/).
- [Textos e palavras-chave](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/).

Os PNGs finais são RGB, sem alpha. Nome/subtítulo têm até 30 caracteres, texto promocional até 170, descrição até 4.000 e palavras-chave até 100 bytes. O arquivo `validacao.json` registra as verificações locais. A aprovação e os requisitos efetivos do formulário são determinados pela Apple.

## Reproduzir as composições

`fontes/renderizar.cjs` usa Sharp e as fontes Montserrat já presentes no projeto. O layout é determinístico, usando capturas nativas e mantendo a proporção da interface. Para regenerar: `node store/testflight-pt-BR/fontes/renderizar.cjs`. O script aceita Sharp disponível no ambiente ou usa o runtime local do Codex.
