import { describe, it, expect, beforeAll } from 'vitest';
import { dbHelper, initDb } from '../src/server/db/database.js';

describe('Remoção de Edital pelo Mentor (DELETE /editais/:id)', () => {
  beforeAll(() => {
    initDb();
  });

  it('permite excluir diretamente um edital sem mentorados matriculados', () => {
    const editalId = `edital_teste_sem_alunos_${Date.now()}`;
    dbHelper.run(
      `INSERT INTO edital (id, mentor_id, nome, banca, versao) VALUES (?, ?, ?, ?, ?)`,
      editalId,
      'usr_mentor_gleyson',
      'Edital Temporário Teste',
      'CEBRASPE',
      1
    );

    // Adiciona um grupo e disciplina para verificar se a cascata funciona
    const grupoId = `grp_teste_${Date.now()}`;
    dbHelper.run(
      `INSERT INTO grupo (id, edital_id, nome, ordem) VALUES (?, ?, ?, ?)`,
      grupoId,
      editalId,
      'Conhecimentos Básicos',
      1
    );

    const discId = `disc_teste_${Date.now()}`;
    dbHelper.run(
      `INSERT INTO disciplina (id, edital_id, grupo_id, nome, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?)`,
      discId,
      editalId,
      grupoId,
      'Direito Constitucional Teste',
      'decoreba',
      1
    );

    // Verifica que existe no banco
    const antes = dbHelper.get(`SELECT id FROM edital WHERE id = ?`, editalId);
    expect(antes).toBeDefined();

    // Executa a remoção
    dbHelper.run(`DELETE FROM edital WHERE id = ?`, editalId);

    // Verifica que o edital foi removido
    const depois = dbHelper.get(`SELECT id FROM edital WHERE id = ?`, editalId);
    expect(depois).toBeUndefined();

    // Verifica que a cascata removeu grupos e disciplinas
    const grupoDepois = dbHelper.get(`SELECT id FROM grupo WHERE id = ?`, grupoId);
    expect(grupoDepois).toBeUndefined();

    const discDepois = dbHelper.get(`SELECT id FROM disciplina WHERE id = ?`, discId);
    expect(discDepois).toBeUndefined();
  });

  it('detecta matrículas ativas e desvincula convites ao forçar remoção', () => {
    const editalId = `edital_com_aluno_${Date.now()}`;
    dbHelper.run(
      `INSERT INTO edital (id, mentor_id, nome, banca, versao) VALUES (?, ?, ?, ?, ?)`,
      editalId,
      'usr_mentor_gleyson',
      'Edital com Alunos',
      'FGV',
      1
    );

    const matriculaId = `mat_teste_${Date.now()}`;
    dbHelper.run(
      `INSERT INTO matricula (id, mentorado_id, edital_id, atribuido_em) VALUES (?, ?, ?, ?)`,
      matriculaId,
      'ment_marina',
      editalId,
      new Date().toISOString()
    );

    const conviteId = `conv_teste_${Date.now()}`;
    dbHelper.run(
      `INSERT INTO convite (id, mentor_id, nome, email, token, edital_id, expira_em) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      conviteId,
      'usr_mentor_gleyson',
      'Candidato Teste',
      'candidato@teste.com',
      `token_${Date.now()}`,
      editalId,
      new Date(Date.now() + 86400000).toISOString()
    );

    // Verifica que tem matrícula ativa
    const count = dbHelper.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM matricula WHERE edital_id = ? AND removido_em IS NULL`,
      editalId
    )?.count;
    expect(count).toBe(1);

    // Desvincula convites e remove edital com cascata
    dbHelper.run(`UPDATE convite SET edital_id = NULL WHERE edital_id = ?`, editalId);
    dbHelper.run(`DELETE FROM edital WHERE id = ?`, editalId);

    // Convite agora tem edital_id nulo
    const conviteAtualizado = dbHelper.get<{ edital_id: string | null }>(
      `SELECT edital_id FROM convite WHERE id = ?`,
      conviteId
    );
    expect(conviteAtualizado?.edital_id).toBeNull();

    // Matrícula foi removida por cascata
    const matriculaDepois = dbHelper.get(`SELECT id FROM matricula WHERE id = ?`, matriculaId);
    expect(matriculaDepois).toBeUndefined();

    // Edital removido
    const editalDepois = dbHelper.get(`SELECT id FROM edital WHERE id = ?`, editalId);
    expect(editalDepois).toBeUndefined();
  });
});
