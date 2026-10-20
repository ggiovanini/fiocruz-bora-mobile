# Prova de conceito: avatar 3D

Abra **Hoje → Experimentar avatar 3D** após entrar na demonstração. Rota: `/avatar-lab`.

O personagem é um modelo procedural de baixo detalhe, inspirado na referência fornecida: corpo verde, rosto sem feições e chama azul. As malhas estão em `src/features/avatar/AvatarScene.tsx`; não há download de modelo nem textura externa.

- Respirar: oscilação suave do corpo e braços.
- Caminhar: balanço alternado dos braços e pernas, no lugar.
- Comemorar: braços levantados, balanço e pequenos saltos.
- Pausar e reproduzir; velocidades de 0,5×, 1× e 1,5×.
- O arco de 270° representa a meta diária em EV: verde para energia física e azul para intelectual, como contribuições contíguas de uma única meta. Não há cota mínima por tipo.
- EV do dia = energia verde + energia azul. Uma fonte pode substituir a outra integralmente. Desafios devem ser definidos em EV total; o objetivo é a constância diária, sem exigir uma divisão 50/50.
- Meta selecionável na simulação: 50, 100 ou 150 EV/dia. Cada botão de atividade soma 10 EV à respectiva cor, sem assumir equivalência com minutos de atividade.
- Ao alcançar a meta, o personagem comemora. Acima da meta, os valores reais de EV continuam crescendo e o arco permanece limitado a 100%, preservando a proporção entre verde e azul.

A tela começa com 40 EV verdes e 25 EV azuis para uma meta de 100 EV. Todos são valores fictícios locais, compartilhados durante a sessão do app e reiniciados ao sair da sessão. Não altera pontuação, atividades ou progresso real do participante. A conversão das atividades em EV, a persistência da meta do usuário, o fechamento diário e o histórico de constância ainda precisam ser integrados ao fluxo real.

O mesmo modelo e as mesmas animações são usados na web e no app nativo, com entradas Canvas específicas para cada plataforma. A animação usa tempo por quadro, sem atualizar estado React por quadro. Após a primeira abertura, a cena é mantida enquanto a tela existir na navegação. Fora de foco ou em segundo plano, o loop de renderização é interrompido (`never`); ao voltar, o contexto é reutilizado. Preferência por movimento reduzido inicia a cena pausada.

## Executar

Use Node compatível com o Expo 57 (20.19.4+ ou LTS mais recente).

```sh
npm install
npm run web
```

Para iOS/Android, gere novamente o aplicativo de desenvolvimento após instalar `expo-gl`, `expo-asset` e `expo-file-system`. Um binário instalado antes desta mudança pode não conter o módulo gráfico.

```sh
npm run ios
# ou
npm run android
```

## Verificação

- `npm test`: checagem de tipos e 29 testes aprovados, incluindo soma das energias, substituição integral entre fontes, mudança de meta e limite visual do arco.
- Teste interativo no app web: renderização e animações, soma de energia azul, alteração da meta e comemoração ao atingir o total em EV.
- Bundles iOS e Android gerados com sucesso com `expo export`. A geração do bundle nativo não substitui teste gráfico em aparelho iOS/Android.

## Integração ao leiaute em 19/10/2026

O personagem e seu arco agora aparecem diretamente em Hoje. Home, Desafios e laboratório usam a mesma prévia de energia/meta durante a sessão do app. A prévia não concede EV aos registros nem persiste como pontuação oficial. Os valores reiniciam ao sair da sessão; o rascunho de atividades mantém sua persistência independente.

Ver `docs/layout-spec.md` para a nova hierarquia visual e as formas de entrada de atividades. A cena da home respeita movimento reduzido e mantém seus recursos ao perder foco, pausando a renderização.

## Reutilização do contexto 3D

A desmontagem a cada perda de foco foi removida de `EnergyAvatar` e do laboratório. O Canvas é criado na primeira visita e permanece montado até a tela ser efetivamente removida. Oculto ou com o app em segundo plano, usa `frameloop="never"`; visível, usa `always` para animação ou `demand` para cena estática. `AvatarRenderControl` solicita um quadro ao reaparecer, inclusive em modo de movimento reduzido.

As abas mantêm as superfícies nativas, sem congelar a atualização de foco, e usam transição de opacidade de 100 ms. Isso evita que o estado oculto do fallback de telas zere o layout do GLView e destrua o contexto.

Validação no iPhone 17 Pro / iOS 26.2: após a configuração final, os retornos Conhecer → Hoje, Desafios → Hoje e Histórico → Hoje não criaram contextos adicionais. Contagem de diagnóstico antes/depois: 2/2 (inclui contextos criados nas alterações por Fast Refresh anteriores ao teste). Não foi medido um tempo exato em milissegundos. A suíte de 34 testes e a checagem de tipos passaram.

Em desenvolvimento, o log `[Bora3D] Contexto gráfico criado` permite verificar recriações. Ele só é emitido quando o Canvas inicializa; não há log por quadro nem telemetria enviada.

Manter o contexto usa memória gráfica enquanto a tela existe, mas interrompe a renderização oculta. Remover a tela, sair da sessão ou reiniciar o app continua liberando/inicializando os recursos. A primeira abertura de uma nova tela 3D ainda tem o custo inicial; não há cache global ilimitado de telas.
