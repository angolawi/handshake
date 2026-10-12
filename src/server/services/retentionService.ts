// Rotina de Retenção e Exclusão LGPD de Fotos de Resumo (HU-5.6 e HU-1.6)

import fs from 'node:fs';
import path from 'node:path';
import { dbHelper } from '../db/database.js';

export function purgeExpiredPhotos(): { apagadas: number } {
  const hoje = new Date().toISOString().slice(0, 10);

  // Busca fotos expiradas que ainda não foram marcadas como excluídas
  const fotosExpiradas = dbHelper.all<{ id: string; storage_key: string }>(
    `SELECT id, storage_key FROM resumo_foto
     WHERE expira_em <= ? AND excluida_em IS NULL`,
    hoje
  );

  let apagadas = 0;
  const agora = new Date().toISOString();

  for (const foto of fotosExpiradas) {
    if (foto.storage_key) {
      const fullPath = path.resolve(process.cwd(), 'uploads', foto.storage_key);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        console.error(`Erro ao apagar arquivo ${foto.storage_key}:`, err);
      }
    }

    dbHelper.run(
      `UPDATE resumo_foto SET excluida_em = ? WHERE id = ?`,
      agora,
      foto.id
    );
    apagadas++;
  }

  return { apagadas };
}

export function deleteStudentData(mentoradoId: string): void {
  // Apaga fotos do disco
  const fotos = dbHelper.all<{ storage_key: string }>(
    `SELECT rf.storage_key
     FROM resumo_foto rf
     JOIN sessao s ON rf.sessao_id = s.id
     JOIN matricula m ON s.matricula_id = m.id
     WHERE m.mentorado_id = ?`,
    mentoradoId
  );

  for (const f of fotos) {
    if (f.storage_key) {
      const fullPath = path.resolve(process.cwd(), 'uploads', f.storage_key);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch {}
      }
    }
  }

  // Anonimiza auditorias (LGPD: dados de auditoria não são apagados, apenas anonimizados)
  dbHelper.run(
    `UPDATE usuario SET nome = 'Usuário Removido (LGPD)', email = 'anonimizado_' || id || '@removido.local', excluido_em = datetime('now')
     WHERE id IN (SELECT usuario_id FROM mentorado WHERE id = ?)`,
    mentoradoId
  );
}
