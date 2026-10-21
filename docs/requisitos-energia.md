# Integração de energia · 20/10/2026

A API já concede EV por duração e oferece GET /api/v1/me/energy e PUT /api/v1/me/energy/goal. As telas/preview locais ainda não consomem esses endpoints. Não enviar incrementos de EV nem PV calculados no cliente.

- Inicial: 1 minuto = 1 EV em ambas as cores; cálculo final por atividade arredondado para baixo no servidor.
- Meta inicial 100 EV; física + mental completam a mesma meta. Excesso continua acumulando, mas não passa para a meta de amanhã.
- Alterações de meta e taxas valem amanhã; lançamentos retroativos usam a taxa da data original.
- Lançamento manual: hoje e seis dias anteriores, fuso America/Sao_Paulo informado pela API, duração em segundos múltiplos de 60. Preservar UUID do registro e Idempotency-Key na fila offline.
- O catálogo anuncia scoring_status configured, ev_per_minute, energy_dimension physical/intellectual/choice, rounding floor e recording_window_days 7. Para choice (Outra atividade e bem-estar), pedir dimensão ao usuário. Mesma taxa para ambas.
- Sucesso de transporte não é incremento local: usar awarded_ev e resumo oficial. Nunca somar novamente ao repetir uma operação. O registro é aprovado diretamente; não criar etapa de aprovação humana.
- GET me/energy retorna today, days, lifetime_earned_ev, streak_days, inactivity, scheduled_goal e vitality ativa. Consulta pessoal agrega organizações; não duplicar pontos ao trocar vínculo. Datas futuras/intervalos maiores que 366 dias são rejeitados.
- Constância conta metas cumpridas consecutivas. Hoje incompleto preserva a sequência de ontem; falhar não subtrai energia. Atividade abaixo da meta reinicia inatividade separadamente.
- Vitalidade: 1 PV por EV concedido; saldo separado do EV histórico. Desgaste diário no oitavo dia sem atividades: floor(meta vigente no dia × 20%), limitado ao saldo. A reserva maior demora mais para zerar, pois a taxa incide sobre a meta, não sobre o saldo.
- Retorno hoje cancela o desgaste de hoje; atividade retroativa aceita pode compensar perdas indevidas. Mostrar o saldo oficial reconciliado, sem aplicar uma segunda perda no cliente. Não reduzir EV acumulados, meta cumprida ou ranking.
- vitality informa status active, points inteiro >= 0, daily_decay_percent 20, daily_decay_pv da meta de hoje, credit_pv_per_ev 1, rounding floor e evaluated_through. Níveis são calculados pelos PV e gerenciados no painel. vitality.level_status active e vitality.level incluem number, name, minimum_pv, scheme_version, effective_from, next, remaining_pv, progress_percent e maximum_reached. Sem configuração vigente, status not_configured e level null. Proteções seguem pendentes. Não transportar os limiares ilustrativos do avatar para a API.
- Importação HealthKit/Health Connect permanece sem envio real. Deve aplicar a mesma janela/confiança e impedir crédito duplicado entre manual/importado. Não converter importações em lançamentos manuais para contornar esse fluxo.

A simulação móvel e exemplos de 50/100/150 ou +10 EV continuam demonstrativos até integração explícita. O detalhamento da API está em bora-api/docs/energia-vital.md.

- Modelo inicial: mínimos 0, 100, 300, 600 e 1.000 PV; nomes e faixas podem mudar pelo painel com vigência amanhã. Usar sempre o contrato oficial. O nível pode cair por desgaste; EV histórico não diminui. No topo, next null e progresso 100% não significam teto de reserva.
