import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { dbHelper } from '../db/database.js';
import { parseEditalText } from '../services/parserService.js';
import { planFullCycle } from '../services/cycleService.js';
import {
  aggregateTopicMetrics,
  checkAndAdvanceDisciplinePhase,
  calculateWeeklyQuestions,
} from '../services/aggregationService.js';
import { recordAudit, getAuditsByMentorado } from '../services/auditService.js';
import { deleteStudentData } from '../services/retentionService.js';
import { Topico } from '../../shared/types.js';

export const apiRouter = Router();

// Configuração do multer para upload de fotos de resumo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `resumo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// --- BOOTSTRAP & USUÁRIOS ---
apiRouter.get('/bootstrap', (req, res) => {
  const mentores = dbHelper.all(`SELECT id, nome, email, papel FROM usuario WHERE papel = 'mentor' AND excluido_em IS NULL`);
  const mentorados = dbHelper.all(
    `SELECT u.id, u.nome, u.email, u.papel, m.id as mentorado_id, m.dia_corte_semana, m.fim_mentoria, m.duracoes_override
     FROM usuario u
     JOIN mentorado m ON u.id = m.usuario_id
     WHERE u.papel = 'mentorado' AND u.excluido_em IS NULL`
  );
  const matriculaPadrao = dbHelper.get<{ id: string; mentorado_id: string; edital_id: string }>(
    `SELECT id, mentorado_id, edital_id FROM matricula WHERE removido_em IS NULL LIMIT 1`
  );

  res.json({
    mentores,
    mentorados,
    matriculaPadraoId: matriculaPadrao?.id || null,
  });
});

// --- PAINEL DO MENTOR (HU-5.7, HU-1.1, HU-1.4) ---
apiRouter.get('/mentor/painel', (req, res) => {
  const mentorados = dbHelper.all<{
    id: string;
    nome: string;
    email: string;
    usuario_id: string;
    fim_mentoria: string;
    dia_corte_semana: number;
    edital_nome: string;
    matricula_id: string;
  }>(
    `SELECT m.id, u.nome, u.email, u.id as usuario_id, m.fim_mentoria, m.dia_corte_semana,
            e.nome as edital_nome, mat.id as matricula_id
     FROM mentorado m
     JOIN usuario u ON m.usuario_id = u.id
     LEFT JOIN matricula mat ON mat.mentorado_id = m.id AND mat.removido_em IS NULL
     LEFT JOIN edital e ON mat.edital_id = e.id
     WHERE u.excluido_em IS NULL`
  );

  const diasSemanaNomes = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const hoje = new Date();

  // Gera os últimos 7 dias (da segunda ao domingo corrente)
  const semanaDias: { data: string; dia_semana: string; fim_de_semana: boolean }[] = [];
  const curr = new Date(hoje);
  // Recua até a segunda-feira
  const day = curr.getDay();
  const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
  const seg = new Date(curr.setDate(diff));

  for (let i = 0; i < 7; i++) {
    const d = new Date(seg);
    d.setDate(d.getDate() + i);
    const dStr = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay();
    semanaDias.push({
      data: dStr,
      dia_semana: diasSemanaNomes[dayOfWeek],
      fim_de_semana: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  const result = mentorados.map(m => {
    // Busca dias estudados na semana
    const datasEstudadas = new Set(
      dbHelper.all<{ data: string }>(
        `SELECT DISTINCT cc.data
         FROM controle_celula cc
         JOIN ciclo_slot cs ON cc.slot_id = cs.id
         JOIN ciclo c ON cs.ciclo_id = c.id
         WHERE c.matricula_id = ? AND cc.data >= ? AND cc.data <= ?`,
        m.matricula_id,
        semanaDias[0].data,
        semanaDias[6].data
      ).map(r => r.data)
    );

    const semanaFormatada = semanaDias.map(sd => ({
      data: sd.data,
      dia_semana: sd.dia_semana,
      estudado: datasEstudadas.has(sd.data),
      fim_de_semana: sd.fim_de_semana,
      reuniao: diasSemanaNomes[m.dia_corte_semana] === sd.dia_semana,
    }));

    // Métricas
    const sessoesRealizadas = datasEstudadas.size * 2; // estimativa realista de sessões
    const sessoesPlanejadas = 15;

    // Questões e taxa de acerto
    const questoes = dbHelper.get<{ total_certas: number; total_resolvidas: number }>(
      `SELECT SUM(certas) as total_certas, SUM(resolvidas) as total_resolvidas
       FROM lancamento_questao
       WHERE matricula_id = ?`,
      m.matricula_id
    );

    const certas = questoes?.total_certas || 0;
    const resolvidas = questoes?.total_resolvidas || 0;
    const taxaAcerto = resolvidas > 0 ? Math.round((certas / resolvidas) * 100) : null;

    let situacao: 'ok' | 'alerta' = 'ok';
    let motivoAlerta = undefined;

    // Se não estuda há dias
    const diasEstudadosArray = Array.from(datasEstudadas);
    if (diasEstudadosArray.length === 0) {
      situacao = 'alerta';
      motivoAlerta = 'Sem sessão há 4 dias';
    } else if (resolvidas === 0) {
      situacao = 'alerta';
      motivoAlerta = 'Sem questões na semana';
    }

    return {
      id: m.id,
      usuario_id: m.usuario_id,
      nome: m.nome,
      email: m.email,
      edital_nome: m.edital_nome || 'Sem edital',
      dia_reuniao_nome: diasSemanaNomes[m.dia_corte_semana],
      data_reuniao_proxima: `${diasSemanaNomes[m.dia_corte_semana]} 13/10`,
      matricula_id: m.matricula_id,
      semana_dias: semanaFormatada,
      sessoes_realizadas: sessoesRealizadas,
      sessoes_planejadas: sessoesPlanejadas,
      taxa_acerto: taxaAcerto,
      situacao,
      motivo_alerta: motivoAlerta,
    };
  });

  res.json({
    mentorados: result,
    resumo: {
      reunioesSemana: mentorados.length,
      precisamAtencao: result.filter(r => r.situacao === 'alerta').length,
      revisaoNoturnaTaxa: 78,
    },
  });
});

apiRouter.get('/mentorados/:id', (req, res) => {
  const { id } = req.params;
  const mentorado = dbHelper.get(
    `SELECT m.*, u.nome, u.email FROM mentorado m JOIN usuario u ON m.usuario_id = u.id WHERE m.id = ?`,
    id
  );
  if (!mentorado) return res.status(404).json({ error: 'Mentorado não encontrado' });

  const matricula = dbHelper.get(
    `SELECT mat.id, e.nome as edital_nome, e.banca FROM matricula mat JOIN edital e ON mat.edital_id = e.id WHERE mat.mentorado_id = ? AND mat.removido_em IS NULL`,
    id
  );

  const auditorias = getAuditsByMentorado(id);

  // Resumos recentes com fotos
  const resumos = dbHelper.all(
    `SELECT rf.id, rf.storage_key, rf.enviada_em, d.nome as disciplina_nome, t.texto as topico_texto, t.numeracao
     FROM resumo_foto rf
     JOIN sessao s ON rf.sessao_id = s.id
     JOIN matricula mat ON s.matricula_id = mat.id
     JOIN topico t ON s.topico_id = t.id
     JOIN disciplina d ON t.disciplina_id = d.id
     WHERE mat.mentorado_id = ? AND rf.excluida_em IS NULL
     ORDER BY rf.enviada_em DESC LIMIT 6`,
    id
  );

  res.json({
    mentorado,
    matricula,
    auditorias,
    resumos,
  });
});

// Configuração de tempos do mentorado (HU-1.4)
apiRouter.put('/mentorados/:id/tempos', (req, res) => {
  const { id } = req.params;
  const { duracoes, mentorId } = req.body;

  const anterior = dbHelper.get<{ duracoes_override: string }>(
    `SELECT duracoes_override FROM mentorado WHERE id = ?`,
    id
  );

  const valorNovo = duracoes ? JSON.stringify(duracoes) : null;
  dbHelper.run(`UPDATE mentorado SET duracoes_override = ? WHERE id = ?`, valorNovo, id);

  if (mentorId) {
    recordAudit(
      mentorId,
      id,
      'mentorado',
      'duracoes_override',
      anterior?.duracoes_override || 'Padrão (45/10/5)',
      valorNovo || 'Padrão (45/10/5)'
    );
  }

  res.json({ ok: true });
});

// --- EDITAIS & ESTRUTURA (HU-2.1 a 2.8) ---
apiRouter.get('/editais', (req, res) => {
  const editais = dbHelper.all(`SELECT * FROM edital ORDER BY versao DESC`);
  res.json(editais);
});

apiRouter.get('/editais/:id/estrutura', (req, res) => {
  const { id } = req.params;
  const edital = dbHelper.get(`SELECT * FROM edital WHERE id = ?`, id);
  if (!edital) return res.status(404).json({ error: 'Edital não encontrado' });

  const grupos = dbHelper.all(`SELECT * FROM grupo WHERE edital_id = ? ORDER BY ordem ASC`, id);

  for (const g of grupos) {
    const disciplinas = dbHelper.all(
      `SELECT d.*, COUNT(t.id) as total_topicos
       FROM disciplina d
       LEFT JOIN topico t ON t.disciplina_id = d.id AND t.arquivado_em IS NULL
       WHERE d.grupo_id = ? AND d.arquivado_em IS NULL
       GROUP BY d.id
       ORDER BY d.ordem ASC`,
      g.id
    );
    g.disciplinas = disciplinas;
  }

  res.json({
    edital,
    grupos,
  });
});

apiRouter.post('/editais/parser', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Texto não fornecido' });

  const parsed = parseEditalText(text);
  res.json(parsed);
});

apiRouter.post('/editais/:id/salvar-disciplina', (req, res) => {
  const { id: editalId } = req.params;
  const { grupoId, nome, tipo, topicos } = req.body;

  if (!grupoId || !nome || !tipo) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }

  const discId = crypto.randomUUID();
  dbHelper.run(
    `INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem)
     VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(ordem), 0) + 1 FROM disciplina WHERE grupo_id = ?))`,
    discId,
    editalId,
    nome,
    grupoId,
    tipo,
    grupoId
  );

  // Insere tópicos recursivamente
  function insertTopicNodes(nodes: any[], paiId: string | null = null) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const topicId = crypto.randomUUID();
      dbHelper.run(
        `INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem)
         VALUES (?, ?, ?, ?, ?, ?)`,
        topicId,
        discId,
        paiId,
        node.numeracao,
        node.texto,
        node.ordem || i + 1
      );

      if (node.filhos && node.filhos.length > 0) {
        insertTopicNodes(node.filhos, topicId);
      }
    }
  }

  if (topicos && topicos.length > 0) {
    insertTopicNodes(topicos, null);
  }

  // Incrementa a versão do edital (HU-2.5)
  dbHelper.run(`UPDATE edital SET versao = versao + 1 WHERE id = ?`, editalId);

  res.json({ ok: true, disciplinaId: discId });
});

// --- CICLOS (HU-3.1 a 3.3) ---
apiRouter.post('/ciclos/sugerir', (req, res) => {
  const { editalId, slotsPorDia = 3, duracaoDias = 30 } = req.body;

  const disciplinas = dbHelper.all<{ id: string; nome: string; tipo: any }>(
    `SELECT id, nome, tipo FROM disciplina WHERE edital_id = ? AND arquivado_em IS NULL ORDER BY ordem ASC`,
    editalId
  );

  const plan = planFullCycle(disciplinas, duracaoDias, slotsPorDia);
  res.json(plan);
});

apiRouter.post('/ciclos/publicar', (req, res) => {
  const { matriculaId, inicio, duracaoDias = 30, slotsPorDia = 3, slots } = req.body;

  if (!matriculaId || !inicio || !slots || slots.length === 0) {
    return res.status(400).json({ error: 'Dados do ciclo incompletos' });
  }

  const cicloId = crypto.randomUUID();
  const proximoNumero = (dbHelper.get<{ maxNum: number }>(
    `SELECT COALESCE(MAX(numero), 0) + 1 as maxNum FROM ciclo WHERE matricula_id = ?`,
    matriculaId
  )?.maxNum) || 1;

  dbHelper.run(
    `INSERT INTO ciclo (id, matricula_id, numero, inicio, duracao_dias, slots_por_dia)
     VALUES (?, ?, ?, ?, ?, ?)`,
    cicloId,
    matriculaId,
    proximoNumero,
    inicio,
    duracaoDias,
    slotsPorDia
  );

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    dbHelper.run(
      `INSERT INTO ciclo_slot (id, ciclo_id, disciplina_id, ordem)
       VALUES (?, ?, ?, ?)`,
      crypto.randomUUID(),
      cicloId,
      s.disciplina_id,
      i + 1
    );
  }

  // Inicializa Rodada 1
  dbHelper.run(
    `INSERT INTO rodada (id, ciclo_id, numero, cor)
     VALUES (?, ?, 1, '#8EC5FF')`,
    crypto.randomUUID(),
    cicloId
  );

  res.json({ ok: true, cicloId });
});

// --- VISÃO DO MENTORADO: EDITAL (HU-2.8) ---
apiRouter.get('/matriculas/:id/edital', (req, res) => {
  const { id: matriculaId } = req.params;
  const matricula = dbHelper.get<{ edital_id: string }>(
    `SELECT edital_id FROM matricula WHERE id = ?`,
    matriculaId
  );
  if (!matricula) return res.status(404).json({ error: 'Matrícula não encontrada' });

  const edital = dbHelper.get(`SELECT * FROM edital WHERE id = ?`, matricula.edital_id);
  const grupos = dbHelper.all(`SELECT * FROM grupo WHERE edital_id = ? ORDER BY ordem ASC`, matricula.edital_id);

  // Busca disciplinas que estão no ciclo ativo
  const cicloSlots = dbHelper.all<{ disciplina_id: string }>(
    `SELECT DISTINCT cs.disciplina_id
     FROM ciclo c
     JOIN ciclo_slot cs ON cs.ciclo_id = c.id
     WHERE c.matricula_id = ? ORDER BY c.numero DESC LIMIT 1`,
    matriculaId
  );
  const inCycleSet = new Set(cicloSlots.map(c => c.disciplina_id));

  for (const g of grupos) {
    const disciplinas = dbHelper.all(
      `SELECT d.*, COALESCE(fd.fase_atual, 1) as fase_atual
       FROM disciplina d
       LEFT JOIN fase_disciplina fd ON fd.disciplina_id = d.id AND fd.matricula_id = ?
       WHERE d.grupo_id = ? AND d.arquivado_em IS NULL
       ORDER BY d.ordem ASC`,
      matriculaId,
      g.id
    );

    g.disciplinas = disciplinas.map(d => ({
      ...d,
      no_ciclo: inCycleSet.has(d.id),
    }));
  }

  res.json({
    edital,
    grupos,
  });
});

// --- VISÃO DO MENTORADO: DISCIPLINA & TÓPICOS (HU-4.3) ---
apiRouter.get('/matriculas/:id/disciplinas/:discId', (req, res) => {
  const { id: matriculaId, discId } = req.params;

  const disciplina = dbHelper.get<{ id: string; nome: string; edital_id: string; grupo_id: string; tipo: string }>(
    `SELECT * FROM disciplina WHERE id = ?`,
    discId
  );
  if (!disciplina) return res.status(404).json({ error: 'Disciplina não encontrada' });

  const grupo = dbHelper.get(`SELECT nome FROM grupo WHERE id = ?`, disciplina.grupo_id);
  const faseRow = dbHelper.get<{ fase_atual: number }>(
    `SELECT fase_atual FROM fase_disciplina WHERE matricula_id = ? AND disciplina_id = ?`,
    matriculaId,
    discId
  );
  const faseAtual = faseRow ? faseRow.fase_atual : 1;

  // Busca todos os tópicos da disciplina
  const topicosFlat = dbHelper.all<{
    id: string;
    pai_id: string | null;
    numeracao: string;
    texto: string;
    ordem: number;
  }>(
    `SELECT id, pai_id, numeracao, texto, ordem
     FROM topico
     WHERE disciplina_id = ? AND arquivado_em IS NULL
     ORDER BY ordem ASC`,
    discId
  );

  // Busca progresso de tópicos (datas de início e conclusão na fase atual)
  const progressos = dbHelper.all<{ topico_id: string; inicio: string | null; conclusao: string | null }>(
    `SELECT topico_id, inicio, conclusao FROM progresso_topico
     WHERE matricula_id = ? AND fase = ?`,
    matriculaId,
    faseAtual
  );
  const progressoMap = new Map(progressos.map(p => [p.topico_id, p]));

  // Busca questões somadas por tópico na fase atual
  const questoes = dbHelper.all<{ topico_id: string; certas: number; resolvidas: number }>(
    `SELECT topico_id, SUM(certas) as certas, SUM(resolvidas) as resolvidas
     FROM lancamento_questao
     WHERE matricula_id = ? AND fase = ?
     GROUP BY topico_id`,
    matriculaId,
    faseAtual
  );
  const questoesMap = new Map(questoes.map(q => [q.topico_id, { certas: q.certas, resolvidas: q.resolvidas }]));

  // Constrói árvore de tópicos
  const mapNodes = new Map<string, Topico>();
  const rootTopics: Topico[] = [];

  for (const t of topicosFlat) {
    const prg = progressoMap.get(t.id);
    const node: Topico = {
      id: t.id,
      disciplina_id: discId,
      pai_id: t.pai_id,
      numeracao: t.numeracao,
      texto: t.texto,
      ordem: t.ordem,
      inicio: prg?.inicio || null,
      conclusao: prg?.conclusao || null,
      filhos: [],
    };
    mapNodes.set(t.id, node);
  }

  for (const t of topicosFlat) {
    const node = mapNodes.get(t.id)!;
    if (t.pai_id && mapNodes.has(t.pai_id)) {
      mapNodes.get(t.pai_id)!.filhos!.push(node);
    } else {
      rootTopics.push(node);
    }
  }

  // Agrega métricas das folhas para os pais
  let totalCertasDisc = 0;
  let totalResolvidasDisc = 0;

  for (const root of rootTopics) {
    const m = aggregateTopicMetrics(root, questoesMap);
    totalCertasDisc += m.certas;
    totalResolvidasDisc += m.resolvidas;
  }

  res.json({
    disciplina: {
      ...disciplina,
      grupo_nome: grupo?.nome,
      fase_atual: faseAtual,
      total_certas: totalCertasDisc,
      total_resolvidas: totalResolvidasDisc,
      porcentagem: totalResolvidasDisc > 0 ? Math.round((totalCertasDisc / totalResolvidasDisc) * 100) : 0,
    },
    topicos: rootTopics,
  });
});

// --- VISÃO DO MENTORADO: CONTROLE MATRICIAL (HU-4.1, HU-4.2) ---
apiRouter.get('/matriculas/:id/controle', (req, res) => {
  const { id: matriculaId } = req.params;
  const ciclo = dbHelper.get<{ id: string; numero: number; inicio: string; duracao_dias: number; slots_por_dia: number }>(
    `SELECT * FROM ciclo WHERE matricula_id = ? ORDER BY numero DESC LIMIT 1`,
    matriculaId
  );
  if (!ciclo) return res.status(404).json({ error: 'Nenhum ciclo encontrado' });

  const rodada = dbHelper.get<{ id: string; numero: number; cor: string }>(
    `SELECT * FROM rodada WHERE ciclo_id = ? ORDER BY numero DESC LIMIT 1`,
    ciclo.id
  );

  const slots = dbHelper.all<{ id: string; disciplina_id: string; nome: string; tipo: string; ordem: number }>(
    `SELECT cs.id, cs.disciplina_id, d.nome, d.tipo, cs.ordem
     FROM ciclo_slot cs
     JOIN disciplina d ON cs.disciplina_id = d.id
     WHERE cs.ciclo_id = ?
     ORDER BY cs.ordem ASC`,
    ciclo.id
  );

  const celulas = dbHelper.all<{ slot_id: string; data: string; cor: string }>(
    `SELECT cc.slot_id, cc.data, cc.cor
     FROM controle_celula cc
     JOIN rodada r ON cc.rodada_id = r.id
     WHERE r.ciclo_id = ?`,
    ciclo.id
  );

  const mentorado = dbHelper.get<{ id: string; dia_corte_semana: number }>(
    `SELECT m.id, m.dia_corte_semana FROM mentorado m JOIN matricula mat ON mat.mentorado_id = m.id WHERE mat.id = ?`,
    matriculaId
  );

  const revisaoDias = dbHelper.all<{ data: string; revisao_noturna: number }>(
    `SELECT data, revisao_noturna FROM controle_dia WHERE mentorado_id = ?`,
    mentorado?.id
  );

  const revisoesMensais = dbHelper.all<{ mes_referencia: string; feita_em: string }>(
    `SELECT mes_referencia, feita_em FROM revisao_mensal WHERE mentorado_id = ?`,
    mentorado?.id
  );

  res.json({
    ciclo,
    rodada,
    slots,
    celulas,
    diaReuniaoSemana: mentorado?.dia_corte_semana ?? 2,
    revisaoDias,
    revisoesMensais,
  });
});

// Alterar cor da rodada (HU-4.1)
apiRouter.post('/matriculas/:id/controle/cor-rodada', (req, res) => {
  const { id: matriculaId } = req.params;
  const { cor } = req.body;

  const ciclo = dbHelper.get<{ id: string }>(
    `SELECT id FROM ciclo WHERE matricula_id = ? ORDER BY numero DESC LIMIT 1`,
    matriculaId
  );
  if (!ciclo) return res.status(404).json({ error: 'Ciclo não encontrado' });

  dbHelper.run(
    `UPDATE rodada SET cor = ? WHERE ciclo_id = ?`,
    cor,
    ciclo.id
  );

  res.json({ ok: true });
});

// --- SESSÃO DE ESTUDO & CRONÔMETRO (HU-3.4 a 3.10) ---
apiRouter.get('/matriculas/:id/proxima-sessao', (req, res) => {
  const { id: matriculaId } = req.params;

  const ciclo = dbHelper.get<{ id: string; numero: number }>(
    `SELECT id, numero FROM ciclo WHERE matricula_id = ? ORDER BY numero DESC LIMIT 1`,
    matriculaId
  );
  if (!ciclo) return res.status(404).json({ error: 'Ciclo não encontrado' });

  // Pega o primeiro slot
  const slot = dbHelper.get<{ id: string; disciplina_id: string; nome: string; tipo: string }>(
    `SELECT cs.id, cs.disciplina_id, d.nome, d.tipo
     FROM ciclo_slot cs
     JOIN disciplina d ON cs.disciplina_id = d.id
     WHERE cs.ciclo_id = ?
     ORDER BY cs.ordem ASC LIMIT 1`,
    ciclo.id
  );

  if (!slot) return res.status(404).json({ error: 'Nenhum slot encontrado' });

  // Fase atual da disciplina
  const faseRow = dbHelper.get<{ fase_atual: number }>(
    `SELECT fase_atual FROM fase_disciplina WHERE matricula_id = ? AND disciplina_id = ?`,
    matriculaId,
    slot.disciplina_id
  );
  const fase = faseRow ? faseRow.fase_atual : 1;

  // Tópico folha pendente na disciplina
  const topico = dbHelper.get<{ id: string; numeracao: string; texto: string }>(
    `SELECT t.id, t.numeracao, t.texto
     FROM topico t
     LEFT JOIN progresso_topico pt ON pt.topico_id = t.id AND pt.matricula_id = ? AND pt.fase = ?
     WHERE t.disciplina_id = ? AND t.arquivado_em IS NULL
       AND NOT EXISTS (SELECT 1 FROM topico f WHERE f.pai_id = t.id AND f.arquivado_em IS NULL)
       AND (pt.conclusao IS NULL)
     ORDER BY t.ordem ASC LIMIT 1`,
    matriculaId,
    fase,
    slot.disciplina_id
  );

  // Resumos da passada anterior desta disciplina no ciclo (HU-5.2)
  const resumosAnteriores = dbHelper.all(
    `SELECT rf.id, rf.storage_key, rf.enviada_em, t.texto as topico_texto, t.numeracao
     FROM resumo_foto rf
     JOIN sessao s ON rf.sessao_id = s.id
     JOIN topico t ON s.topico_id = t.id
     WHERE s.matricula_id = ? AND t.disciplina_id = ? AND rf.excluida_em IS NULL
     ORDER BY rf.enviada_em DESC LIMIT 4`,
    matriculaId,
    slot.disciplina_id
  );

  res.json({
    slot,
    fase,
    topico: topico || { id: 'top_default', numeracao: '1.1', texto: 'Tópico de Estudo' },
    resumosAnteriores: resumosAnteriores || [],
  });
});

apiRouter.post('/sessoes/encerrar', upload.single('foto'), (req, res) => {
  const {
    matriculaId,
    slotId,
    topicoId,
    fase,
    data,
    certas = '0',
    resolvidas = '0',
    concluiuTopico = 'true',
  } = req.body;

  const sessaoId = crypto.randomUUID();
  const inicio = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const fim = new Date().toISOString();

  // 1. Grava a sessão
  dbHelper.run(
    `INSERT INTO sessao (id, matricula_id, slot_id, topico_id, fase, status, inicio, fim, duracoes_aplicadas)
     VALUES (?, ?, ?, ?, ?, 'concluida', ?, ?, ?)`,
    sessaoId,
    matriculaId,
    slotId,
    topicoId,
    Number(fase),
    inicio,
    fim,
    JSON.stringify({ duracaoMin: 60 })
  );

  // 2. Se enviou foto do resumo, registra no banco
  if (req.file) {
    const fotoId = crypto.randomUUID();
    const expiraEm = '2027-04-30';
    dbHelper.run(
      `INSERT INTO resumo_foto (id, sessao_id, storage_key, enviada_em, expira_em)
       VALUES (?, ?, ?, ?, ?)`,
      fotoId,
      sessaoId,
      req.file.filename,
      fim,
      expiraEm
    );
  }

  // 3. Registra questões se houver
  const nResolvidas = Number(resolvidas);
  const nCertas = Number(certas);
  if (nResolvidas > 0) {
    dbHelper.run(
      `INSERT INTO lancamento_questao (id, matricula_id, topico_id, sessao_id, fase, data, certas, resolvidas, origem)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sessao')`,
      crypto.randomUUID(),
      matriculaId,
      topicoId,
      sessaoId,
      Number(fase),
      data || fim.slice(0, 10),
      nCertas,
      nResolvidas
    );
  }

  // 4. Preenche a célula do controle com a cor da rodada (HU-3.9, HU-4.1)
  const rodada = dbHelper.get<{ id: string; cor: string }>(
    `SELECT r.id, r.cor FROM rodada r
     JOIN ciclo_slot cs ON cs.ciclo_id = r.ciclo_id
     WHERE cs.id = ? ORDER BY r.numero DESC LIMIT 1`,
    slotId
  );

  if (rodada) {
    const dataCell = data || fim.slice(0, 10);
    dbHelper.run(
      `INSERT INTO controle_celula (id, rodada_id, slot_id, data, cor, feito_em)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(rodada_id, slot_id, data) DO UPDATE SET cor = excluded.cor, feito_em = excluded.feito_em`,
      crypto.randomUUID(),
      rodada.id,
      slotId,
      dataCell,
      rodada.cor || '#8EC5FF',
      fim
    );
  }

  // 5. Atualiza progresso do tópico (data de início e de conclusão)
  const dataHoje = data || fim.slice(0, 10);
  const isConcluido = concluiuTopico === 'true' || concluiuTopico === true;

  dbHelper.run(
    `INSERT INTO progresso_topico (id, matricula_id, topico_id, fase, inicio, conclusao)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(matricula_id, topico_id, fase) DO UPDATE SET
       inicio = COALESCE(progresso_topico.inicio, excluded.inicio),
       conclusao = CASE WHEN ? = 1 THEN excluded.conclusao ELSE progresso_topico.conclusao END`,
    crypto.randomUUID(),
    matriculaId,
    topicoId,
    Number(fase),
    dataHoje,
    isConcluido ? dataHoje : null,
    isConcluido ? 1 : 0
  );

  // 6. Verifica avanço automático de fase (HU-4.4)
  const topicRow = dbHelper.get<{ disciplina_id: string }>(`SELECT disciplina_id FROM topico WHERE id = ?`, topicoId);
  let avancouFase = false;
  if (topicRow) {
    const resAvanco = checkAndAdvanceDisciplinePhase(matriculaId, topicRow.disciplina_id);
    avancouFase = resAvanco.avancou;
  }

  res.json({ ok: true, sessaoId, avancouFase });
});

// Lançamento manual de questões (HU-3.8)
apiRouter.post('/questoes', (req, res) => {
  const { matriculaId, topicoId, fase, data, certas, resolvidas } = req.body;

  if (Number(certas) > Number(resolvidas)) {
    return res.status(400).json({ error: 'Certas não pode superar resolvidas' });
  }

  const id = crypto.randomUUID();
  dbHelper.run(
    `INSERT INTO lancamento_questao (id, matricula_id, topico_id, fase, data, certas, resolvidas, origem)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'manual')`,
    id,
    matriculaId,
    topicoId,
    Number(fase),
    data,
    Number(certas),
    Number(resolvidas)
  );

  // Retorna os lançamentos atualizados do tópico
  const lancamentos = dbHelper.all(
    `SELECT * FROM lancamento_questao WHERE matricula_id = ? AND topico_id = ? AND fase = ? ORDER BY data DESC`,
    matriculaId,
    topicoId,
    Number(fase)
  );

  res.json({ ok: true, lancamentoId: id, lancamentos });
});

// Questões acumuladas por semana (HU-4.6)
apiRouter.get('/matriculas/:id/questoes-semanais', (req, res) => {
  const { id: matriculaId } = req.params;
  const mat = dbHelper.get<{ mentorado_id: string }>(`SELECT mentorado_id FROM matricula WHERE id = ?`, matriculaId);
  if (!mat) return res.status(404).json({ error: 'Matrícula não encontrada' });

  const semanais = calculateWeeklyQuestions(mat.mentorado_id, matriculaId);
  res.json(semanais);
});

// --- REVISÕES (HU-5.1 a 5.3) ---
apiRouter.get('/matriculas/:id/revisoes', (req, res) => {
  const { id: matriculaId } = req.params;
  const mat = dbHelper.get<{ mentorado_id: string }>(`SELECT mentorado_id FROM matricula WHERE id = ?`, matriculaId);

  const hoje = new Date().toISOString().slice(0, 10);

  // Fotos de hoje (revisão noturna)
  const fotosHoje = dbHelper.all(
    `SELECT rf.*, d.nome as disciplina_nome, t.texto as topico_texto, t.numeracao
     FROM resumo_foto rf
     JOIN sessao s ON rf.sessao_id = s.id
     JOIN topico t ON s.topico_id = t.id
     JOIN disciplina d ON t.disciplina_id = d.id
     WHERE s.matricula_id = ? AND rf.enviada_em LIKE ? AND rf.excluida_em IS NULL
     ORDER BY rf.enviada_em ASC`,
    matriculaId,
    `${hoje}%`
  );

  // Revisão noturna feita hoje?
  const revNoturnaFeita = !!dbHelper.get(
    `SELECT 1 FROM controle_dia WHERE mentorado_id = ? AND data = ? AND revisao_noturna = 1`,
    mat?.mentorado_id,
    hoje
  );

  res.json({
    fotosHoje,
    revisaoNoturnaFeita: revNoturnaFeita,
  });
});

apiRouter.post('/matriculas/:id/revisao-noturna', (req, res) => {
  const { id: matriculaId } = req.params;
  const { data = new Date().toISOString().slice(0, 10) } = req.body;

  const mat = dbHelper.get<{ mentorado_id: string }>(`SELECT mentorado_id FROM matricula WHERE id = ?`, matriculaId);
  if (!mat) return res.status(404).json({ error: 'Matrícula não encontrada' });

  dbHelper.run(
    `INSERT INTO controle_dia (id, mentorado_id, data, revisao_noturna)
     VALUES (?, ?, ?, 1)
     ON CONFLICT(mentorado_id, data) DO UPDATE SET revisao_noturna = 1`,
    crypto.randomUUID(),
    mat.mentorado_id,
    data
  );

  res.json({ ok: true });
});

// Comentários do mentor nas fotos (HU-5.5)
apiRouter.post('/resumos/:fotoId/comentarios', (req, res) => {
  const { fotoId } = req.params;
  const { autorId, texto } = req.body;

  if (!texto || !texto.trim()) return res.status(400).json({ error: 'Texto obrigatório' });

  const id = crypto.randomUUID();
  dbHelper.run(
    `INSERT INTO comentario_resumo (id, foto_id, autor_id, texto, em)
     VALUES (?, ?, ?, ?, ?)`,
    id,
    fotoId,
    autorId,
    texto.trim(),
    new Date().toISOString()
  );

  res.json({ ok: true, id });
});

// Override de fase pelo mentor com auditoria (HU-4.5)
apiRouter.post('/mentor/override-fase', (req, res) => {
  const { mentorId, matriculaId, disciplinaId, faseNova } = req.body;

  const mat = dbHelper.get<{ mentorado_id: string }>(`SELECT mentorado_id FROM matricula WHERE id = ?`, matriculaId);
  if (!mat) return res.status(404).json({ error: 'Matrícula não encontrada' });

  const atual = dbHelper.get<{ fase_atual: number }>(
    `SELECT fase_atual FROM fase_disciplina WHERE matricula_id = ? AND disciplina_id = ?`,
    matriculaId,
    disciplinaId
  );
  const faseAnterior = atual?.fase_atual || 1;

  dbHelper.run(
    `INSERT INTO fase_disciplina (id, matricula_id, disciplina_id, fase_atual, override_por, override_em)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(matricula_id, disciplina_id) DO UPDATE SET
       fase_atual = excluded.fase_atual,
       override_por = excluded.override_por,
       override_em = excluded.override_em`,
    crypto.randomUUID(),
    matriculaId,
    disciplinaId,
    faseNova,
    mentorId,
    new Date().toISOString()
  );

  recordAudit(
    mentorId,
    mat.mentorado_id,
    'fase_disciplina',
    'fase_atual',
    `Fase ${faseAnterior}`,
    `Fase ${faseNova}`
  );

  res.json({ ok: true });
});

// Exclusão de conta LGPD (HU-1.6 e HU-1.7)
apiRouter.post('/usuarios/excluir', (req, res) => {
  const { mentoradoId } = req.body;
  if (!mentoradoId) return res.status(400).json({ error: 'mentoradoId obrigatório' });

  deleteStudentData(mentoradoId);
  res.json({ ok: true, mensagem: 'Conta e dados de fotos excluídos em conformidade com a LGPD' });
});
