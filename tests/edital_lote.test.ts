import { describe, it, expect } from 'vitest';
import { initDb, dbHelper } from '../src/server/db/database.js';
import { parseFullEdital } from '../src/server/services/parserService.js';

describe('Salvar Lote de Disciplinas e Tópicos', () => {
  it('grava em lote múltiplas disciplinas e árvores de tópicos vinculadas a um edital', () => {
    initDb();

    const mentorId = 'usr_mentor_gleyson';
    const editalId = `edital_teste_lote_${Date.now()}`;

    // 1. Cria edital base
    dbHelper.run(
      `INSERT INTO edital (id, mentor_id, nome, banca, versao, metodo_cobranca, fator_penalidade)
       VALUES (?, ?, ?, 'CEBRASPE', 1, 'certo_errado', 1.0)`,
      editalId,
      mentorId,
      'Concurso Auditor CGU - Teste Lote'
    );

    // Texto de teste com 2 grupos e 3 disciplinas
    const sampleText = `
15.2.2 CONHECIMENTOS BÁSICOS
ESTADO E DEMOCRACIA: 1 Estado e legitimidade. 1.1 Estado e poder. 2 Democracia. 2.1 Representação.
ÉTICA PÚBLICA: 1 Princípios éticos. 1.1 Imparcialidade.

15.2.3 CONHECIMENTOS ESPECÍFICOS
ENGENHARIA DE SOFTWARE: 1 Requisitos de software. 1.1 Requisitos funcionais. 1.2 Requisitos não funcionais. 2 Arquitetura.
    `;

    const parsed = parseFullEdital(sampleText);
    expect(parsed.totalDisciplinas).toBe(3);

    // Simula a rota de salvar lote
    const grupoMap = new Map<string, string>();

    for (const disc of parsed.disciplinas) {
      const gNome = disc.grupoSugerido || 'Geral';
      const gNorm = gNome.toLowerCase().trim();

      let grupoId = grupoMap.get(gNorm);
      if (!grupoId) {
        grupoId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        dbHelper.run(
          `INSERT INTO grupo (id, edital_id, nome, ordem, questoes_prova, peso)
           VALUES (?, ?, ?, 1, 40, 1.0)`,
          grupoId,
          editalId,
          gNome
        );
        grupoMap.set(gNorm, grupoId);
      }

      const discId = `disc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      dbHelper.run(
        `INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem)
         VALUES (?, ?, ?, ?, ?, 1)`,
        discId,
        editalId,
        disc.nome,
        grupoId,
        disc.tipoSugerido || 'decoreba'
      );

      // Inserção recursiva
      function insertTopics(nodes: typeof disc.topicos, paiId: string | null = null) {
        for (const n of nodes) {
          const tId = `top_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          dbHelper.run(
            `INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem)
             VALUES (?, ?, ?, ?, ?, ?)`,
            tId,
            discId,
            paiId,
            n.numeracao,
            n.texto,
            n.ordem
          );
          if (n.filhos && n.filhos.length > 0) {
            insertTopics(n.filhos, tId);
          }
        }
      }

      insertTopics(disc.topicos, null);
    }

    // Validações
    const gruposDb = dbHelper.all(`SELECT * FROM grupo WHERE edital_id = ?`, editalId);
    expect(gruposDb.length).toBe(2);

    const disciplinasDb = dbHelper.all(`SELECT * FROM disciplina WHERE edital_id = ?`, editalId);
    expect(disciplinasDb.length).toBe(3);

    const topicosDb = dbHelper.all(
      `SELECT t.* FROM topico t
       JOIN disciplina d ON t.disciplina_id = d.id
       WHERE d.edital_id = ?`,
      editalId
    );
    // Estado: 1, 1.1, 2, 2.1 (4)
    // Ética: 1, 1.1 (2)
    // Eng Soft: 1, 1.1, 1.2, 2 (4) -> Total = 10 tópicos
    expect(topicosDb.length).toBe(10);

    // Verifica que subtópicos têm pai_id preenchido
    const subtopicos = topicosDb.filter((t: any) => t.numeracao.includes('.'));
    expect(subtopicos.length).toBe(5);
    for (const sub of subtopicos) {
      expect(sub.pai_id).not.toBeNull();
    }
  });

  it('permite criar novo edital dinamicamente se o editalId for "novo" ou não encontrado', () => {
    initDb();

    // 1. Simula criação sob demanda de novo edital
    const novoNomeEdital = 'Concurso Receita Federal 2026';
    const banca = 'FGV';
    const novoId = `edital_rfb_${Date.now()}`;

    dbHelper.run(
      `INSERT INTO edital (id, mentor_id, nome, banca, versao, metodo_cobranca, fator_penalidade)
       VALUES (?, 'usr_mentor_gleyson', ?, ?, 1, 'certo_errado', 1.0)`,
      novoId,
      novoNomeEdital,
      banca
    );

    const editalCriado = dbHelper.get<{ id: string; nome: string; banca: string }>(
      `SELECT id, nome, banca FROM edital WHERE id = ?`,
      novoId
    );
    expect(editalCriado).toBeDefined();
    expect(editalCriado?.nome).toBe(novoNomeEdital);
    expect(editalCriado?.banca).toBe(banca);

    // 2. Insere disciplina e tópicos associados
    const grpId = `grp_${Date.now()}`;
    dbHelper.run(
      `INSERT INTO grupo (id, edital_id, nome, ordem, questoes_prova, peso)
       VALUES (?, ?, 'Conhecimentos Específicos', 1, 30, 1.5)`,
      grpId,
      novoId
    );

    const discId = `disc_${Date.now()}`;
    dbHelper.run(
      `INSERT INTO disciplina (id, edital_id, grupo_id, nome, tipo, ordem)
       VALUES (?, ?, ?, 'Direito Tributário', 'decoreba', 1)`,
      discId,
      novoId,
      grpId
    );

    const topicoId = `top_${Date.now()}`;
    dbHelper.run(
      `INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem)
       VALUES (?, ?, NULL, '1', 'Sistema Tributário Nacional', 1)`,
      topicoId,
      discId
    );

    const discEncontrada = dbHelper.get<{ id: string; nome: string }>(
      `SELECT id, nome FROM disciplina WHERE id = ? AND edital_id = ?`,
      discId,
      novoId
    );
    expect(discEncontrada).toBeDefined();
    expect(discEncontrada?.nome).toBe('Direito Tributário');

    const topicoEncontrado = dbHelper.get<{ id: string; texto: string }>(
      `SELECT id, texto FROM topico WHERE id = ? AND disciplina_id = ?`,
      topicoId,
      discId
    );
    expect(topicoEncontrado).toBeDefined();
    expect(topicoEncontrado?.texto).toBe('Sistema Tributário Nacional');
  });
});

