// Serviço de Métricas Abrangentes do Mentorado na Visão do Mentor
// Plataforma Handshake - Metodologia Gleyson Azevedo

import { dbHelper } from '../db/database.js';

export interface MetricasMentorado {
  notaLiquida: {
    totalCertas: number;
    totalResolvidas: number;
    totalErradas: number;
    notaLiquida: number;
    aproveitamentoLiquidoPct: number;
    aproveitamentoBrutoPct: number;
    pontuacaoTotalEdital: number;
    notaMinimaAprovacao: number;
    atingiuCorteGeral: boolean;
    metodoCobranca: string;
    fatorPenalidade: number;
  };
  coberturaEdital: {
    totalTopicosFolha: number;
    topicosConcluidos: number;
    coberturaPct: number;
    topicosConcluidosUltimos30Dias: number;
    velocidadeSemanalTopicos: number; // Pace: tópicos/semana
    diasAteFimMentoria: number;
    projecaoConclusaoDias: number | null;
    emDiaComCronograma: boolean;
  };
  equilibrioCognitivo: {
    decoreba: {
      questoesResolvidas: number;
      questoesCertas: number;
      acertoPct: number;
      totalDisciplinas: number;
    };
    raciocinio: {
      questoesResolvidas: number;
      questoesCertas: number;
      acertoPct: number;
      totalDisciplinas: number;
    };
    polaridadeDominante: 'equilibrado' | 'melhor_decoreba' | 'melhor_raciocinio';
  };
  giroCiclo: {
    slotsPorDia: number;
    tamanhoMatriz: string;
    diasPorVolta: number;
    voltasPorSemanaEsperadas: number;
    voltasConcluidasUltimos14Dias: number;
    voltasPorSemanaRealizadas: number;
    metaSemanalAtingida: boolean;
  };
  aderenciaRevisoes: {
    diasComEstudoUltimos30Dias: number;
    diasComRevisaoNoturnaUltimos30Dias: number;
    taxaRevisaoNoturnaPct: number;
    revisaoMensalFeita: boolean;
    mesReferenciaAtual: string;
  };
  funilFases: {
    fase1Teoria: number;
    fase2Aplicacao: number;
    fase3Manutencao: number;
    totalDisciplinas: number;
  };
  pautaReuniaoSemanal: Array<{
    tipo: 'critico' | 'atencao' | 'positivo' | 'sono_revisao';
    titulo: string;
    descricao: string;
    disciplinaId?: string;
  }>;
  disciplinasDetalhadas: Array<{
    id: string;
    nome: string;
    grupoId: string;
    grupoNome: string;
    tipo: 'decoreba' | 'raciocinio';
    faseAtual: number;
    totalTopicos: number;
    topicosConcluidos: number;
    progressoPct: number;
    questoesResolvidas: number;
    questoesCertas: number;
    acertoBrutoPct: number;
    acertoLiquidoPct: number;
    abaixoDoCorte: boolean;
  }>;
}

/**
 * Calcula todas as métricas analíticas e pedagógicas de um mentorado para o mentor
 */
export function getMentoradoComprehensiveMetrics(mentoradoId: string): MetricasMentorado {
  // 1. Dados cadastrais do mentorado e sua matrícula ativa
  const mentorado = dbHelper.get<{
    id: string;
    usuario_id: string;
    fim_mentoria: string;
    dia_corte_semana: number;
  }>(`SELECT id, usuario_id, fim_mentoria, dia_corte_semana FROM mentorado WHERE id = ?`, mentoradoId);

  const matricula = dbHelper.get<{
    id: string;
    edital_id: string;
  }>(`SELECT id, edital_id FROM matricula WHERE mentorado_id = ? AND removido_em IS NULL LIMIT 1`, mentoradoId);

  const matriculaId = matricula?.id || '';
  const editalId = matricula?.edital_id || '';

  // 2. Dados do Edital (Parâmetros Cebraspe, penalidades e cortes)
  const edital = dbHelper.get<{
    metodo_cobranca: string;
    fator_penalidade: number;
    pontuacao_total: number;
    nota_minima_aprovacao: number;
  }>(
    `SELECT metodo_cobranca, fator_penalidade, pontuacao_total, nota_minima_aprovacao 
     FROM edital WHERE id = ?`,
    editalId
  ) || {
    metodo_cobranca: 'certo_errado',
    fator_penalidade: 1.0,
    pontuacao_total: 120.0,
    nota_minima_aprovacao: 60.0,
  };

  // 3. Questões Resolvidas e Nota Líquida
  const lancamentos = dbHelper.all<{
    certas: number;
    resolvidas: number;
    disciplina_id: string;
    tipo: 'decoreba' | 'raciocinio';
    grupo_id: string;
    data: string;
  }>(
    `SELECT lq.certas, lq.resolvidas, d.id as disciplina_id, d.tipo, d.grupo_id, lq.data
     FROM lancamento_questao lq
     JOIN topico t ON lq.topico_id = t.id
     JOIN disciplina d ON t.disciplina_id = d.id
     WHERE lq.matricula_id = ?`,
    matriculaId
  );

  let totalCertas = 0;
  let totalResolvidas = 0;
  let decorebaCertas = 0;
  let decorebaResolvidas = 0;
  let raciocinioCertas = 0;
  let raciocinioResolvidas = 0;

  const questoesPorDisciplina = new Map<string, { certas: number; resolvidas: number }>();

  for (const l of lancamentos) {
    totalCertas += l.certas;
    totalResolvidas += l.resolvidas;

    if (l.tipo === 'decoreba') {
      decorebaCertas += l.certas;
      decorebaResolvidas += l.resolvidas;
    } else {
      raciocinioCertas += l.certas;
      raciocinioResolvidas += l.resolvidas;
    }

    const cur = questoesPorDisciplina.get(l.disciplina_id) || { certas: 0, resolvidas: 0 };
    cur.certas += l.certas;
    cur.resolvidas += l.resolvidas;
    questoesPorDisciplina.set(l.disciplina_id, cur);
  }

  const totalErradas = Math.max(0, totalResolvidas - totalCertas);
  const penalidade = edital.metodo_cobranca === 'certo_errado' ? edital.fator_penalidade : 0;
  const notaLiquida = Math.max(0, Number((totalCertas - totalErradas * penalidade).toFixed(1)));
  const aproveitamentoLiquidoPct =
    totalResolvidas > 0 ? Math.max(0, Math.round((notaLiquida / totalResolvidas) * 100)) : 0;
  const aproveitamentoBrutoPct =
    totalResolvidas > 0 ? Math.round((totalCertas / totalResolvidas) * 100) : 0;
  const atingiuCorteGeral = aproveitamentoLiquidoPct >= Math.round((edital.nota_minima_aprovacao / edital.pontuacao_total) * 100);

  // 4. Cobertura do Edital (Tópicos Folha)
  const todosTopicosFolha = dbHelper.all<{
    id: string;
    disciplina_id: string;
  }>(
    `SELECT t.id, t.disciplina_id FROM topico t
     JOIN disciplina d ON t.disciplina_id = d.id
     WHERE d.edital_id = ? AND t.arquivado_em IS NULL
       AND NOT EXISTS (SELECT 1 FROM topico f WHERE f.pai_id = t.id AND f.arquivado_em IS NULL)`,
    editalId
  );

  const topicosConcluidosRows = dbHelper.all<{
    topico_id: string;
    conclusao: string;
  }>(
    `SELECT pt.topico_id, pt.conclusao FROM progresso_topico pt
     WHERE pt.matricula_id = ? AND pt.fase = 1 AND pt.conclusao IS NOT NULL`,
    matriculaId
  );

  const setTopicosConcluidos = new Set(topicosConcluidosRows.map(r => r.topico_id));
  const totalTopicosFolha = todosTopicosFolha.length;
  const topicosConcluidos = todosTopicosFolha.filter(t => setTopicosConcluidos.has(t.id)).length;
  const coberturaPct = totalTopicosFolha > 0 ? Math.round((topicosConcluidos / totalTopicosFolha) * 100) : 0;

  // Pace: tópicos concluídos nos últimos 30 dias
  const data30DiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const topicosConcluidosUltimos30Dias = topicosConcluidosRows.filter(r => r.conclusao >= data30DiasAtras).length;
  const velocidadeSemanalTopicos = Number(((topicosConcluidosUltimos30Dias / 30) * 7).toFixed(1));

  // Dias até o fim da mentoria e projeção
  const hoje = new Date();
  const fimMentoriaDate = mentorado?.fim_mentoria ? new Date(mentorado.fim_mentoria) : new Date(hoje.getTime() + 180 * 86400000);
  const diasAteFimMentoria = Math.max(1, Math.round((fimMentoriaDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)));

  const topicosRestantes = Math.max(0, totalTopicosFolha - topicosConcluidos);
  let projecaoConclusaoDias: number | null = null;
  if (velocidadeSemanalTopicos > 0) {
    const ritmoDiario = velocidadeSemanalTopicos / 7;
    projecaoConclusaoDias = Math.round(topicosRestantes / ritmoDiario);
  }
  const emDiaComCronograma = projecaoConclusaoDias === null || projecaoConclusaoDias <= diasAteFimMentoria;

  // 5. Polaridade Cognitiva (Decoreba vs Raciocínio)
  const decorebaAcertoPct =
    decorebaResolvidas > 0 ? Math.round((decorebaCertas / decorebaResolvidas) * 100) : 0;
  const raciocinioAcertoPct =
    raciocinioResolvidas > 0 ? Math.round((raciocinioCertas / raciocinioResolvidas) * 100) : 0;

  let polaridadeDominante: 'equilibrado' | 'melhor_decoreba' | 'melhor_raciocinio' = 'equilibrado';
  if (decorebaAcertoPct >= raciocinioAcertoPct + 10 && decorebaResolvidas >= 5) {
    polaridadeDominante = 'melhor_decoreba';
  } else if (raciocinioAcertoPct >= decorebaAcertoPct + 10 && raciocinioResolvidas >= 5) {
    polaridadeDominante = 'melhor_raciocinio';
  }

  const contagemDisciplinasTipo = dbHelper.all<{ tipo: string; count: number }>(
    `SELECT tipo, COUNT(*) as count FROM disciplina WHERE edital_id = ? AND arquivado_em IS NULL GROUP BY tipo`,
    editalId
  );
  const totalDiscDecoreba = contagemDisciplinasTipo.find(c => c.tipo === 'decoreba')?.count || 0;
  const totalDiscRaciocinio = contagemDisciplinasTipo.find(c => c.tipo === 'raciocinio')?.count || 0;

  // 6. Giro do Ciclo de Estudos
  const cicloAtivo = dbHelper.get<{
    id: string;
    slots_por_dia: number;
  }>(`SELECT id, slots_por_dia FROM ciclo WHERE matricula_id = ? ORDER BY numero DESC LIMIT 1`, matriculaId);

  const slotsPorDia = Math.max(1, cicloAtivo?.slots_por_dia || 3);
  const totalSlotsPorVolta = slotsPorDia * slotsPorDia;
  const diasPorVolta = slotsPorDia;
  const voltasPorSemanaEsperadas = Number((6 / diasPorVolta).toFixed(1));

  // Voltas realizadas nos últimos 14 dias (via controle_celula)
  const data14DiasAtras = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const slotsMarcadosUltimos14Dias = dbHelper.get<{ count: number }>(
    `SELECT COUNT(DISTINCT cc.id) as count 
     FROM controle_celula cc
     JOIN rodada r ON cc.rodada_id = r.id
     JOIN ciclo c ON r.ciclo_id = c.id
     WHERE c.matricula_id = ? AND cc.data >= ?`,
    matriculaId,
    data14DiasAtras
  )?.count || 0;

  const voltasConcluidasUltimos14Dias = Number((slotsMarcadosUltimos14Dias / totalSlotsPorVolta).toFixed(1));
  const voltasPorSemanaRealizadas = Number((voltasConcluidasUltimos14Dias / 2).toFixed(1));
  const metaSemanalAtingida = voltasPorSemanaRealizadas >= 2.0;

  // 7. Aderência a Revisões (Noturna Diária e Mensal 1º FDS)
  const celulasDiasEstudo = dbHelper.get<{ count: number }>(
    `SELECT COUNT(DISTINCT data) as count 
     FROM controle_celula cc
     JOIN rodada r ON cc.rodada_id = r.id
     JOIN ciclo c ON r.ciclo_id = c.id
     WHERE c.matricula_id = ? AND cc.data >= ?`,
    matriculaId,
    data30DiasAtras
  )?.count || 0;

  const diasComEstudoUltimos30Dias = Math.max(celulasDiasEstudo, 1);
  const diasComRevisaoNoturna = dbHelper.get<{ count: number }>(
    `SELECT COUNT(DISTINCT data) as count FROM controle_dia 
     WHERE mentorado_id = ? AND revisao_noturna = 1 AND data >= ?`,
    mentoradoId,
    data30DiasAtras
  )?.count || 0;

  const taxaRevisaoNoturnaPct = Math.round(
    (diasComRevisaoNoturna / diasComEstudoUltimos30Dias) * 100
  );

  const mesAtualStr = hoje.toISOString().slice(0, 7); // ex: '2026-10'
  const revisaoMensalFeita = !!dbHelper.get<{ id: string }>(
    `SELECT id FROM revisao_mensal WHERE mentorado_id = ? AND mes_referencia = ?`,
    mentoradoId,
    mesAtualStr
  );

  // 8. Disciplinas Detalhadas e Funil de Fases
  const disciplinasEdital = dbHelper.all<{
    id: string;
    nome: string;
    grupo_id: string;
    grupo_nome: string;
    tipo: 'decoreba' | 'raciocinio';
  }>(
    `SELECT d.id, d.nome, d.grupo_id, g.nome as grupo_nome, d.tipo
     FROM disciplina d
     JOIN grupo g ON d.grupo_id = g.id
     WHERE d.edital_id = ? AND d.arquivado_em IS NULL
     ORDER BY g.ordem ASC, d.ordem ASC`,
    editalId
  );

  const fasesExistentes = dbHelper.all<{
    disciplina_id: string;
    fase_atual: number;
  }>(`SELECT disciplina_id, fase_atual FROM fase_disciplina WHERE matricula_id = ?`, matriculaId);
  const mapaFases = new Map(fasesExistentes.map(f => [f.disciplina_id, f.fase_atual]));

  let fase1Count = 0;
  let fase2Count = 0;
  let fase3Count = 0;

  const topicosPorDisciplinaMap = new Map<string, string[]>();
  for (const t of todosTopicosFolha) {
    const arr = topicosPorDisciplinaMap.get(t.disciplina_id) || [];
    arr.push(t.id);
    topicosPorDisciplinaMap.set(t.disciplina_id, arr);
  }

  const disciplinasDetalhadas = disciplinasEdital.map(d => {
    const faseAtual = mapaFases.get(d.id) || 1;
    if (faseAtual === 1) fase1Count++;
    else if (faseAtual === 2) fase2Count++;
    else fase3Count++;

    const topicosDaDisc = topicosPorDisciplinaMap.get(d.id) || [];
    const totalTopicos = topicosDaDisc.length;
    const topicosConcluidosDisc = topicosDaDisc.filter(tid => setTopicosConcluidos.has(tid)).length;
    const progressoPct = totalTopicos > 0 ? Math.round((topicosConcluidosDisc / totalTopicos) * 100) : 0;

    const q = questoesPorDisciplina.get(d.id) || { certas: 0, resolvidas: 0 };
    const erradasDisc = Math.max(0, q.resolvidas - q.certas);
    const notaLiqDisc = Math.max(0, q.certas - erradasDisc * penalidade);
    const acertoBrutoPct = q.resolvidas > 0 ? Math.round((q.certas / q.resolvidas) * 100) : 0;
    const acertoLiquidoPct = q.resolvidas > 0 ? Math.round((notaLiqDisc / q.resolvidas) * 100) : 0;
    const abaixoDoCorte = q.resolvidas >= 3 && acertoLiquidoPct < 60;

    return {
      id: d.id,
      nome: d.nome,
      grupoId: d.grupo_id,
      grupoNome: d.grupo_nome,
      tipo: d.tipo,
      faseAtual,
      totalTopicos,
      topicosConcluidos: topicosConcluidosDisc,
      progressoPct,
      questoesResolvidas: q.resolvidas,
      questoesCertas: q.certas,
      acertoBrutoPct,
      acertoLiquidoPct,
      abaixoDoCorte,
    };
  });

  // 9. Pauta Automática da Reunião Semanal (Insights de Ação para o Mentor)
  const pautaReuniaoSemanal: MetricasMentorado['pautaReuniaoSemanal'] = [];

  // Ponto crítico: disciplina com menor aproveitamento
  const discCritica = [...disciplinasDetalhadas]
    .filter(d => d.questoesResolvidas >= 3)
    .sort((a, b) => a.acertoLiquidoPct - b.acertoLiquidoPct)[0];

  if (discCritica && discCritica.acertoLiquidoPct < 65) {
    pautaReuniaoSemanal.push({
      tipo: 'critico',
      titulo: `Alerta Vermelho: ${discCritica.nome}`,
      descricao: `Aproveitamento líquido de apenas ${discCritica.acertoLiquidoPct}% (${discCritica.questoesCertas}/${discCritica.questoesResolvidas} certas). Aluno perde muitos pontos por penalidade Cebraspe.`,
      disciplinaId: discCritica.id,
    });
  }

  // Ponto de Atenção: Déficit na Revisão Noturna
  if (taxaRevisaoNoturnaPct < 70) {
    pautaReuniaoSemanal.push({
      tipo: 'sono_revisao',
      titulo: `Déficit de Revisão Noturna (${taxaRevisaoNoturnaPct}%)`,
      descricao: `O aluno realizou a revisão noturna em menos de 70% dos dias com estudo. Alerte sobre a perda de retenção hipocampal antes do sono REM.`,
    });
  }

  // Destaque Positivo / Maturação
  const discDestaque = [...disciplinasDetalhadas]
    .filter(d => d.questoesResolvidas >= 5)
    .sort((a, b) => b.acertoLiquidoPct - a.acertoLiquidoPct)[0];

  if (discDestaque && discDestaque.acertoLiquidoPct >= 80) {
    pautaReuniaoSemanal.push({
      tipo: 'positivo',
      titulo: `Ponto Forte: ${discDestaque.nome}`,
      descricao: `Excelente aproveitamento líquido de ${discDestaque.acertoLiquidoPct}% (${discDestaque.questoesCertas}/${discDestaque.questoesResolvidas} certas). ${discDestaque.faseAtual === 1 && discDestaque.progressoPct >= 80 ? 'Candidata imediata para avanço à Fase 2.' : 'Domínio consolidado.'}`,
      disciplinaId: discDestaque.id,
    });
  }

  // Disciplina Negligenciada / Estagnada
  const discNegligenciada = disciplinasDetalhadas.find(
    d => d.faseAtual === 1 && d.questoesResolvidas === 0 && d.progressoPct === 0
  );
  if (discNegligenciada) {
    pautaReuniaoSemanal.push({
      tipo: 'atencao',
      titulo: `Disciplina Estagnada: ${discNegligenciada.nome}`,
      descricao: `A disciplina pertence ao edital ativo mas ainda não possui tópicos vencidos ou questões registradas. Verificar alocação no ciclo de estudos.`,
      disciplinaId: discNegligenciada.id,
    });
  }

  // Status do Giro do Ciclo
  if (voltasPorSemanaRealizadas < 1.5 && slotsMarcadosUltimos14Dias > 0) {
    pautaReuniaoSemanal.push({
      tipo: 'atencao',
      titulo: `Ritmo do Ciclo Abaixo da Meta (${voltasPorSemanaRealizadas}x / semana)`,
      descricao: `A Metodologia Gleyson Azevedo preconiza >= 2.0 voltas por semana para refrescar as sinapses. Verificar gargalos de tempo ou pausas excessivas do aluno.`,
    });
  }

  return {
    notaLiquida: {
      totalCertas,
      totalResolvidas,
      totalErradas,
      notaLiquida,
      aproveitamentoLiquidoPct,
      aproveitamentoBrutoPct,
      pontuacaoTotalEdital: edital.pontuacao_total,
      notaMinimaAprovacao: edital.nota_minima_aprovacao,
      atingiuCorteGeral,
      metodoCobranca: edital.metodo_cobranca,
      fatorPenalidade: penalidade,
    },
    coberturaEdital: {
      totalTopicosFolha,
      topicosConcluidos,
      coberturaPct,
      topicosConcluidosUltimos30Dias,
      velocidadeSemanalTopicos,
      diasAteFimMentoria,
      projecaoConclusaoDias,
      emDiaComCronograma,
    },
    equilibrioCognitivo: {
      decoreba: {
        questoesResolvidas: decorebaResolvidas,
        questoesCertas: decorebaCertas,
        acertoPct: decorebaAcertoPct,
        totalDisciplinas: totalDiscDecoreba,
      },
      raciocinio: {
        questoesResolvidas: raciocinioResolvidas,
        questoesCertas: raciocinioCertas,
        acertoPct: raciocinioAcertoPct,
        totalDisciplinas: totalDiscRaciocinio,
      },
      polaridadeDominante,
    },
    giroCiclo: {
      slotsPorDia,
      tamanhoMatriz: `${slotsPorDia}x${slotsPorDia}`,
      diasPorVolta,
      voltasPorSemanaEsperadas,
      voltasConcluidasUltimos14Dias,
      voltasPorSemanaRealizadas,
      metaSemanalAtingida,
    },
    aderenciaRevisoes: {
      diasComEstudoUltimos30Dias,
      diasComRevisaoNoturnaUltimos30Dias: diasComRevisaoNoturna,
      taxaRevisaoNoturnaPct,
      revisaoMensalFeita,
      mesReferenciaAtual: mesAtualStr,
    },
    funilFases: {
      fase1Teoria: fase1Count,
      fase2Aplicacao: fase2Count,
      fase3Manutencao: fase3Count,
      totalDisciplinas: disciplinasEdital.length,
    },
    pautaReuniaoSemanal,
    disciplinasDetalhadas,
  };
}
