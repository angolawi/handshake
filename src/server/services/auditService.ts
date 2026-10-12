// Serviço de Auditoria para alterações do Mentor (HU-1.5)

import { dbHelper } from '../db/database.js';
import { Auditoria } from '../../shared/types.js';

export function recordAudit(
  autorId: string,
  mentoradoId: string,
  entidade: string,
  campo: string,
  valorAnterior: string | null,
  valorNovo: string | null
): void {
  const id = crypto.randomUUID();
  const em = new Date().toISOString();

  dbHelper.run(
    `INSERT INTO auditoria (id, autor_id, mentorado_id, entidade, campo, valor_anterior, valor_novo, em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    autorId,
    mentoradoId,
    entidade,
    campo,
    valorAnterior,
    valorNovo,
    em
  );
}

export function getAuditsByMentorado(mentoradoId: string): Auditoria[] {
  return dbHelper.all<Auditoria>(
    `SELECT a.*, u.nome as autor_nome
     FROM auditoria a
     JOIN usuario u ON a.autor_id = u.id
     WHERE a.mentorado_id = ?
     ORDER BY a.em DESC`,
    mentoradoId
  );
}
