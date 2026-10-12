// Serviço de Agregações de Tópicos, Fases e Consolidação Semanal

import { dbHelper } from '../db/database.js';
import { QuestoesSemanais, Topico } from '../../shared/types.js';

/**
 * Agrega questões certas e resolvidas recursivamente dos nós filhos para os pais
 */
export function aggregateTopicMetrics(topic: Topico, leafMetricsMap: Map<string, { certas: number; resolvidas: number }>): {
  certas: number;
  resolvidas: number;
} {
  if (!topic.filhos || topic.filhos.length === 0) {
    const leaf = leafMetricsMap.get(topic.id) || { certas: 0, resolvidas: 0 };
    topic.questoes_certas = leaf.certas;
    topic.questoes_resolvidas = leaf.resolvidas;
    topic.porcentagem = leaf.resolvidas > 0 ? Math.round((leaf.certas / leaf.resolvidas) * 100) : 0;
    return leaf;
  }

  let totalCertas = 0;
  let totalResolvidas = 0;

  for (const child of topic.filhos) {
    const childMetrics = aggregateTopicMetrics(child, leafMetricsMap);
    totalCertas += childMetrics.certas;
    totalResolvidas += childMetrics.resolvidas;
  }

  topic.questoes_certas = totalCertas;
  topic.questoes_resolvidas = totalResolvidas;
  topic.porcentagem = totalResolvidas > 0 ? Math.round((totalCertas / totalResolvidas) * 100) : 0;

  return { certas: totalCertas, resolvidas: totalResolvidas };
}

/**
 * Verifica se a disciplina deve avançar automaticamente de fase (HU-4.4).
 * Uma disciplina avança quando todos os seus tópicos folha estiverem concluídos
 * (possuem data de início e de conclusão preenchidas) na fase atual.
 */
export function checkAndAdvanceDisciplinePhase(
  matriculaId: string,
  disciplinaId: string
): { avancou: boolean; faseNova?: number } {
  // Obtém a fase atual da disciplina para esta matrícula
  const faseRow = dbHelper.get<{ fase_atual: number }>(
    `SELECT fase_atual FROM fase_disciplina WHERE matricula_id = ? AND disciplina_id = ?`,
    matriculaId,
    disciplinaId
  );
  const faseAtual = faseRow ? faseRow.fase_atual : 1;
  if (faseAtual >= 3) return { avancou: false };

  // Busca todos os tópicos folha da disciplina (aqueles que não são pai de nenhum outro)
  const leafTopics = dbHelper.all<{ id: string }>(
    `SELECT t.id FROM topico t
     WHERE t.disciplina_id = ? AND t.arquivado_em IS NULL
       AND NOT EXISTS (SELECT 1 FROM topico f WHERE f.pai_id = t.id AND f.arquivado_em IS NULL)`,
    disciplinaId
  );

  if (leafTopics.length === 0) return { avancou: false };

  // Verifica o progresso de cada tópico folha na fase atual
  const leafIds = leafTopics.map(l => l.id);
  const completedCount = dbHelper.get<{ count: number }>(
    `SELECT COUNT(*) as count FROM progresso_topico
     WHERE matricula_id = ? AND fase = ? AND conclusao IS NOT NULL
       AND topico_id IN (${leafIds.map(() => '?').join(',')})`,
    matriculaId,
    faseAtual,
    ...leafIds
  )?.count || 0;

  if (completedCount === leafTopics.length) {
    const faseNova = faseAtual + 1;
    // Atualiza a fase da disciplina
    dbHelper.run(
      `INSERT INTO fase_disciplina (id, matricula_id, disciplina_id, fase_atual)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(matricula_id, disciplina_id) DO UPDATE SET fase_atual = excluded.fase_atual`,
      crypto.randomUUID(),
      matriculaId,
      disciplinaId,
      faseNova
    );
    return { avancou: true, faseNova };
  }

  return { avancou: false };
}

/**
 * Calcula os totais acumulados de questões por semana até as datas de corte (HU-4.6).
 * O dia de corte semanal é definido no cadastro do mentorado (dia da reunião semanal).
 */
export function calculateWeeklyQuestions(
  mentoradoId: string,
  matriculaId: string
): QuestoesSemanais[] {
  // Busca o dia da semana da reunião (0=Dom, 1=Seg, 2=Ter, etc.)
  const mentorado = dbHelper.get<{ dia_corte_semana: number }>(
    `SELECT dia_corte_semana FROM mentorado WHERE id = ?`,
    mentoradoId
  );
  const diaCorte = mentorado ? mentorado.dia_corte_semana : 2; // Padrão Terça (2)

  // Busca todos os lançamentos de questões da matrícula ordenados por data
  const lancamentos = dbHelper.all<{
    data: string;
    certas: number;
    resolvidas: number;
    disciplina_id: string;
    disciplina_nome: string;
    grupo_nome: string;
  }>(
    `SELECT l.data, l.certas, l.resolvidas, d.id as disciplina_id, d.nome as disciplina_nome, g.nome as grupo_nome
     FROM lancamento_questao l
     JOIN topico t ON l.topico_id = t.id
     JOIN disciplina d ON t.disciplina_id = d.id
     JOIN grupo g ON d.grupo_id = g.id
     WHERE l.matricula_id = ?
     ORDER BY l.data ASC`,
    matriculaId
  );

  if (lancamentos.length === 0) return [];

  // Gera as datas de corte das últimas 4 semanas
  const cortes: string[] = [];
  const hoje = new Date();
  
  // Encontra a terça/dia de corte mais recente
  const d = new Date(hoje);
  while (d.getDay() !== diaCorte) {
    d.setDate(d.getDate() - 1);
  }

  for (let i = 0; i < 4; i++) {
    const corteDate = new Date(d);
    corteDate.setDate(corteDate.getDate() - (i * 7));
    cortes.unshift(corteDate.toISOString().slice(0, 10));
  }

  // Para cada corte, acumula cumulativamente todas as questões até aquela data
  return cortes.map(corteStr => {
    const lancamentosAteCorte = lancamentos.filter(l => l.data <= corteStr);

    const mapDisciplinas = new Map<string, {
      disciplina_id: string;
      disciplina_nome: string;
      grupo_nome: string;
      certas: number;
      resolvidas: number;
    }>();

    let totalCertas = 0;
    let totalResolvidas = 0;

    for (const l of lancamentosAteCorte) {
      totalCertas += l.certas;
      totalResolvidas += l.resolvidas;

      const curr = mapDisciplinas.get(l.disciplina_id) || {
        disciplina_id: l.disciplina_id,
        disciplina_nome: l.disciplina_nome,
        grupo_nome: l.grupo_nome,
        certas: 0,
        resolvidas: 0,
      };
      curr.certas += l.certas;
      curr.resolvidas += l.resolvidas;
      mapDisciplinas.set(l.disciplina_id, curr);
    }

    const disciplinas = Array.from(mapDisciplinas.values()).map(d => ({
      ...d,
      porcentagem: d.resolvidas > 0 ? Math.round((d.certas / d.resolvidas) * 100) : 0,
    }));

    return {
      data_corte: corteStr,
      disciplinas,
      total_certas: totalCertas,
      total_resolvidas: totalResolvidas,
      media_geral: totalResolvidas > 0 ? Math.round((totalCertas / totalResolvidas) * 100) : 0,
    };
  });
}
