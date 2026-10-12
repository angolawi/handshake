import { describe, it, expect, beforeEach } from 'vitest';
import { dbHelper, initDb } from '../src/server/db/database.js';
import { recordAudit, getAuditsByMentorado } from '../src/server/services/auditService.js';

describe('auditService', () => {
  beforeEach(() => {
    initDb();
  });

  it('registra alteração do mentor e recupera com autor', () => {
    // Insere mentor e aluno se não existirem
    const mentorId = 'test_mentor';
    const alunoId = 'test_aluno';
    const mentId = 'test_ment';

    dbHelper.run(`INSERT OR IGNORE INTO usuario (id, nome, email, papel) VALUES (?, ?, ?, ?)`, mentorId, 'Mentor Teste', 'm@test.com', 'mentor');
    dbHelper.run(`INSERT OR IGNORE INTO usuario (id, nome, email, papel) VALUES (?, ?, ?, ?)`, alunoId, 'Aluno Teste', 'a@test.com', 'mentorado');
    dbHelper.run(`INSERT OR IGNORE INTO mentorado (id, usuario_id, mentor_id, fim_mentoria, dia_corte_semana) VALUES (?, ?, ?, ?, ?)`, mentId, alunoId, mentorId, '2027-01-01', 2);

    recordAudit(mentorId, mentId, 'progresso_topico', 'conclusao', '2026-10-10', '2026-10-11');

    const logs = getAuditsByMentorado(mentId);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].entidade).toBe('progresso_topico');
    expect(logs[0].campo).toBe('conclusao');
    expect(logs[0].valor_anterior).toBe('2026-10-10');
    expect(logs[0].valor_novo).toBe('2026-10-11');
    expect(logs[0].autor_nome).toBe('Mentor Teste');
  });
});
