# Registro de atividade em etapas · 09/11/2026

O registro manual passa a usar telas cheias com progresso e retorno entre etapas:

1. Física ou Mental, com Bean na parte inferior. Importar treino e Evento continuam como atalhos secundários.
2. Atividade do catálogo da API, sem Bean. Busca disponível; atividade personalizada pede o nome em uma etapa curta.
3. Duração, por opções rápidas ou minutos personalizados. O campo é obrigatório no contrato atual da API.
4. Quando aconteceu, com os dias permitidos pelo catálogo, limitados aos sete dias da integração atual.
5. Resumo e confirmação. O envio continua pela fila existente, persistida antes de liberar a operação.

Os atalhos Física/Mental da Home abrem diretamente a etapa 2. Rascunhos continuam preservados ao sair e podem ser retomados; o fluxo só substitui a seleção existente quando outra atividade é escolhida.

## Duas dimensões, sem terceira categoria

Conferidos os enums EnergyDimension e RateDimension e o catálogo de ActivityController no repositório da API. Energia admite physical e intellectual; choice permite que o participante escolha entre elas. DiscoveryGroup também possui wellbeing, mas esse campo não representa uma terceira energia. O app anterior expunha esse grupo como filtro “Bem-estar”.

As listas agora priorizam energy_dimension retornada pela API. Choice aparece nas duas opções e registra a escolha do participante. Catálogos sem dimensão configurada usam discovery_group apenas como compatibilidade; itens genéricos não são escondidos. Nada foi alterado na API. Nomes de atividades como “Pausa de bem-estar” continuam sendo os nomes publicados no catálogo.

## Encerramento

Após salvar o registro, o resultado do fluxo usa uma arte de tela inteira, “Arrasou!” e um botão “Arrasei!”. Uma linha curta informa o estado verdadeiro: pendente, enviando, aguardando validação ou EV efetivamente aprovados. Falhas continuam apresentando o erro e a opção de tentar novamente. A consulta pelo histórico mantém a tela de detalhe existente.

## Imagens e prompts

Geradas pela ferramenta integrada de imagens a partir de assets/images/bean/bean-wave-v1.png, preservando o Bean arredondado, olhos ovais pretos, sorriso, faixa lateral e emblema no peito, com acabamento 3D fosco. Arquivos finais no projeto:

- assets/images/bean/celebrate-physical-v1.png: retrato para fundo de comemoração de movimento; Bean predominantemente verde em pequeno salto com braços levantados, partículas discretas, fundo azul-marinho #002B45, topo e rodapé livres para título e botão; sem texto, números ou interface na imagem.
- assets/images/bean/celebrate-mental-v1.png: retrato para fundo de comemoração de aprendizado; Bean com destaque azul, livro aberto marfim e uma mão levantada, partículas ciano discretas, fundo azul-marinho #002B45, topo e rodapé livres; sem letras, números ou interface na imagem.

A tipografia e o botão são componentes acessíveis, não parte do bitmap.

## Validação

91 testes aprovados, incluindo classificação por dimensão, atividades choice, janela de datas e mensagens que não antecipam pontos da API. TypeScript e exportação iOS/Android/web concluídos. Conferida no simulador a sequência física até o resumo de confirmação. Nenhuma atividade foi enviada ao servidor na validação; ficou um rascunho de teste de Caminhada, 30 minutos, hoje, na confirmação.
