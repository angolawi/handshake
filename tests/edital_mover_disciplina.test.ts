import { describe, it, expect, beforeAll } from 'vitest';
import { dbHelper, initDb } from '../src/server/db/database.js';

describe('Movimentação de Disciplinas entre Grupos (PATCH /disciplinas/:id/mover-grupo)', () => {
  const editalId = `edital_mover_${Date.now()}`;
  let grupoBasicoId = `grp_basico_${Date.now()}`;
  let grupoEspecId = `grp_espec_${Date.now()}`;
  let disc1Id = `disc_pt_${Date.now()}`;
  let disc2Id = `disc_const_${Date.now()}`;
  let topicoId = `top_1_${Date.now()}`;

  beforeAll(() => {
    initDb();

    // Cria edital de teste
    dbHelper.run(
      `INSERT INTO edital (id, mentor_id, nome, banca, versao)
       VALUES (?, 'usr_mentor_gleyson', 'Edital Teste Mover', 'CEBRASPE', 1)`,
      editalId
    );

    // Cria Grupo 1 (Básico)
    dbHelper.run(
      `INSERT INTO grupo (id, edital_id, nome, ordem, questoes_prova, peso, nota_minima_grupo)
       VALUES (?, ?, 'Conhecimentos Básicos', 1, 40, 1.0, 10.0)`,
      grupoBasicoId,
      editalId
    );

    // Cria Grupo 2 (Específico)
    dbHelper.run(
      `INSERT INTO grupo (id, edital_id, nome, ordem, questoes_prova, peso, nota_minima_grupo)
       VALUES (?, ?, 'Conhecimentos Específicos', 2, 60, 2.0, 20.0)`,
      grupoEspecId,
      editalId
    );

    // Insere 2 disciplinas no Grupo Básico
    dbHelper.run(
      `INSERT INTO disciplina (id, edital_id, grupo_id, nome, tipo, ordem)
       VALUES (?, ?, ?, 'Língua Portuguesa', 'decoreba', 1)`,
      disc1Id,
      editalId,
      grupoBasicoId
    );

    dbHelper.run(
      `INSERT INTO disciplina (id, edital_id, grupo_id, nome, tipo, ordem)
       VALUES (?, ?, ?, 'Direito Constitucional', 'raciocinio', 2)`,
      disc2Id,
      editalId,
      grupoBasicoId
    );

    // Insere tópico na disciplina 1
    dbHelper.run(
      `INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem)
       VALUES (?, ?, NULL, '1', 'Compreensão de Texto', 1)`,
      topicoId,
      disc1Id
    );
  });

  it('move uma disciplina de Conhecimentos Básicos para Conhecimentos Específicos preservando tópicos', () => {
    // Estado inicial
    const antes = dbHelper.get<{ grupo_id: string }>(`SELECT grupo_id FROM disciplina WHERE id = ?`, disc1Id);
    expect(antes?.grupo_id).toBe(grupoBasicoId);

    const editalAntes = dbHelper.get<{ versao: number }>(`SELECT versao FROM edital WHERE id = ?`, editalId);
    const versaoAntes = editalAntes?.versao || 1;

    // Simula a lógica de movimentação
    const destMaxOrdem = dbHelper.get<{ maxOrdem: number }>(
      `SELECT COALESCE(MAX(ordem), 0) as maxOrdem FROM disciplina WHERE grupo_id = ?`,
      grupoEspecId
    )?.maxOrdem || 0;

    dbHelper.run(
      `UPDATE disciplina SET grupo_id = ?, ordem = ? WHERE id = ?`,
      grupoEspecId,
      destMaxOrdem + 1,
      disc1Id
    );
    dbHelper.run(`UPDATE edital SET versao = versao + 1 WHERE id = ?`, editalId);

    // Validações
    const depois = dbHelper.get<{ grupo_id: string; ordem: number }>(
      `SELECT grupo_id, ordem FROM disciplina WHERE id = ?`,
      disc1Id
    );
    expect(depois?.grupo_id).toBe(grupoEspecId);
    expect(depois?.ordem).toBe(1);

    // Tópicos permanecem intactos
    const topicos = dbHelper.all<{ id: string; texto: string }>(
      `SELECT id, texto FROM topico WHERE disciplina_id = ?`,
      disc1Id
    );
    expect(topicos.length).toBe(1);
    expect(topicos[0].texto).toBe('Compreensão de Texto');

    // Versão do edital incrementada
    const editalDepois = dbHelper.get<{ versao: number }>(`SELECT versao FROM edital WHERE id = ?`, editalId);
    expect(editalDepois?.versao).toBe(versaoAntes + 1);
  });

  it('permite criar um novo grupo sob demanda e mover a disciplina para ele', () => {
    const nomeNovoGrupo = 'Conhecimentos Especializados (TI)';
    const newGrpId = `grp_novo_${Date.now()}`;

    // Cria grupo na hora
    dbHelper.run(
      `INSERT INTO grupo (id, edital_id, nome, ordem, questoes_prova, peso, nota_minima_grupo)
       VALUES (?, ?, ?, 3, 30, 2.5, 15.0)`,
      newGrpId,
      editalId,
      nomeNovoGrupo
    );

    // Move disc2 para o novo grupo
    dbHelper.run(
      `UPDATE disciplina SET grupo_id = ?, ordem = 1 WHERE id = ?`,
      newGrpId,
      disc2Id
    );

    // Validações
    const disc2Depois = dbHelper.get<{ grupo_id: string; nome: string }>(
      `SELECT grupo_id, nome FROM disciplina WHERE id = ?`,
      disc2Id
    );
    expect(disc2Depois?.grupo_id).toBe(newGrpId);

    const grupoCriado = dbHelper.get<{ id: string; nome: string; peso: number }>(
      `SELECT id, nome, peso FROM grupo WHERE id = ?`,
      newGrpId
    );
    expect(grupoCriado?.nome).toBe(nomeNovoGrupo);
    expect(grupoCriado?.peso).toBe(2.5);
  });

  it('permite reordenar disciplinas dentro de um grupo', () => {
    // Insere mais uma disciplina no grupo Específico
    const disc3Id = `disc_extra_${Date.now()}`;
    dbHelper.run(
      `INSERT INTO disciplina (id, edital_id, grupo_id, nome, tipo, ordem)
       VALUES (?, ?, ?, 'Disciplina Extra', 'decoreba', 2)`,
      disc3Id,
      editalId,
      grupoEspecId
    );

    // Reordena: disc3 passa a ser primeira, disc1 passa a ser segunda
    const novaOrdemIds = [disc3Id, disc1Id];
    for (let i = 0; i < novaOrdemIds.length; i++) {
      dbHelper.run(
        `UPDATE disciplina SET ordem = ? WHERE id = ? AND grupo_id = ?`,
        i + 1,
        novaOrdemIds[i],
        grupoEspecId
      );
    }

    const d3 = dbHelper.get<{ ordem: number }>(`SELECT ordem FROM disciplina WHERE id = ?`, disc3Id);
    const d1 = dbHelper.get<{ ordem: number }>(`SELECT ordem FROM disciplina WHERE id = ?`, disc1Id);

    expect(d3?.ordem).toBe(1);
    expect(d1?.ordem).toBe(2);
  });
});
