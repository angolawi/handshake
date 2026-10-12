import { describe, it, expect, beforeEach } from 'vitest';
import { initDb, dbHelper } from '../src/server/db/database.js';
import { runSeed } from '../src/server/db/seed.js';

// Função auxiliar idêntica à de ControleMatriz.tsx para teste unitário
function isPrimeiroFimDeSemanaDoMes(dataObj: Date): boolean {
  const diaSemana = dataObj.getDay(); // 0 = Domingo, 6 = Sábado
  if (diaSemana !== 0 && diaSemana !== 6) return false;

  const diaMes = dataObj.getDate();
  const ano = dataObj.getFullYear();
  const mes = dataObj.getMonth();

  const primeiroDiaMes = new Date(ano, mes, 1);
  const diaSemanaPrimeiro = primeiroDiaMes.getDay();
  const diaPrimeiroSabado = 1 + ((6 - diaSemanaPrimeiro + 7) % 7);

  if (diaSemana === 6 && diaMes === diaPrimeiroSabado) return true;
  if (diaSemana === 0 && diaMes === diaPrimeiroSabado + 1) return true;
  if (diaSemana === 0 && diaMes === 1) return true;

  return false;
}

describe('Controle Matriz e Revisões', () => {
  beforeEach(() => {
    initDb();
    runSeed();
  });

  describe('Cálculo do Primeiro Fim de Semana do Mês', () => {
    it('identifica corretamente o 1º fds de Outubro/2026 (mês que inicia numa quinta-feira)', () => {
      // 01/10/2026 = Quinta-feira
      // 03/10/2026 = Sábado (1º fds)
      // 04/10/2026 = Domingo (1º fds)
      // 10/10/2026 = Sábado (2º fds - não deve marcar)
      const sabado1 = new Date(2026, 9, 3);
      const domingo1 = new Date(2026, 9, 4);
      const quinta1 = new Date(2026, 9, 1);
      const sabado2 = new Date(2026, 9, 10);

      expect(isPrimeiroFimDeSemanaDoMes(sabado1)).toBe(true);
      expect(isPrimeiroFimDeSemanaDoMes(domingo1)).toBe(true);
      expect(isPrimeiroFimDeSemanaDoMes(quinta1)).toBe(false);
      expect(isPrimeiroFimDeSemanaDoMes(sabado2)).toBe(false);
    });

    it('identifica corretamente o 1º fds de Novembro/2026 (mês que inicia num domingo)', () => {
      // 01/11/2026 = Domingo (início do mês)
      // 07/11/2026 = Sábado (1º sábado)
      // 08/11/2026 = Domingo (consecutivo ao 1º sábado)
      // 14/11/2026 = Sábado (2º sábado)
      const domingoInicio = new Date(2026, 10, 1);
      const sabado1 = new Date(2026, 10, 7);
      const domingo1 = new Date(2026, 10, 8);
      const quarta = new Date(2026, 10, 4);
      const sabado2 = new Date(2026, 10, 14);

      expect(isPrimeiroFimDeSemanaDoMes(domingoInicio)).toBe(true);
      expect(isPrimeiroFimDeSemanaDoMes(sabado1)).toBe(true);
      expect(isPrimeiroFimDeSemanaDoMes(domingo1)).toBe(true);
      expect(isPrimeiroFimDeSemanaDoMes(quarta)).toBe(false);
      expect(isPrimeiroFimDeSemanaDoMes(sabado2)).toBe(false);
    });

    it('rejeita todos os dias úteis', () => {
      for (let dia = 1; dia <= 31; dia++) {
        const d = new Date(2026, 9, dia);
        if (d.getDay() !== 0 && d.getDay() !== 6) {
          expect(isPrimeiroFimDeSemanaDoMes(d)).toBe(false);
        }
      }
    });
  });

  describe('Persistência e Alternância de Marcação de Células', () => {
    it('permite marcar e desmarcar célula de disciplina na rodada (toggle-celula)', () => {
      const matriculaId = 'mat_marina_cgu';
      const ciclo = dbHelper.get<{ id: string }>(
        `SELECT id FROM ciclo WHERE matricula_id = ? ORDER BY numero DESC LIMIT 1`,
        matriculaId
      );
      expect(ciclo).toBeDefined();

      const rodada = dbHelper.get<{ id: string; cor: string }>(
        `SELECT id, cor FROM rodada WHERE ciclo_id = ? ORDER BY numero DESC LIMIT 1`,
        ciclo!.id
      );
      expect(rodada).toBeDefined();

      const slot = dbHelper.get<{ id: string }>(
        `SELECT id FROM ciclo_slot WHERE ciclo_id = ? LIMIT 1`,
        ciclo!.id
      );
      expect(slot).toBeDefined();

      const dataStr = '2026-10-15';

      // 1. Marcação inicial
      const idNovo = crypto.randomUUID();
      dbHelper.run(
        `INSERT INTO controle_celula (id, rodada_id, slot_id, data, cor, feito_em)
         VALUES (?, ?, ?, ?, ?, ?)`,
        idNovo,
        rodada!.id,
        slot!.id,
        dataStr,
        rodada!.cor,
        new Date().toISOString()
      );

      let celula = dbHelper.get<{ id: string; cor: string }>(
        `SELECT id, cor FROM controle_celula WHERE rodada_id = ? AND slot_id = ? AND data = ?`,
        rodada!.id,
        slot!.id,
        dataStr
      );
      expect(celula).toBeDefined();
      expect(celula!.cor).toBe(rodada!.cor);

      // 2. Desmarcação (toggle off)
      dbHelper.run(`DELETE FROM controle_celula WHERE id = ?`, celula!.id);
      celula = dbHelper.get<{ id: string; cor: string }>(
        `SELECT id, cor FROM controle_celula WHERE rodada_id = ? AND slot_id = ? AND data = ?`,
        rodada!.id,
        slot!.id,
        dataStr
      );
      expect(celula).toBeUndefined();
    });

    it('permite marcar e desmarcar revisão noturna na tabela controle_dia', () => {
      const mentorado = dbHelper.get<{ id: string }>(`SELECT id FROM mentorado LIMIT 1`);
      expect(mentorado).toBeDefined();
      const dataStr = '2026-10-15';

      // 1. Marca como feita (1)
      dbHelper.run(
        `INSERT INTO controle_dia (id, mentorado_id, data, revisao_noturna)
         VALUES (?, ?, ?, 1)
         ON CONFLICT(mentorado_id, data) DO UPDATE SET revisao_noturna = 1`,
        crypto.randomUUID(),
        mentorado!.id,
        dataStr
      );

      let row = dbHelper.get<{ revisao_noturna: number }>(
        `SELECT revisao_noturna FROM controle_dia WHERE mentorado_id = ? AND data = ?`,
        mentorado!.id,
        dataStr
      );
      expect(row?.revisao_noturna).toBe(1);

      // 2. Desmarca (0)
      dbHelper.run(
        `UPDATE controle_dia SET revisao_noturna = 0 WHERE mentorado_id = ? AND data = ?`,
        mentorado!.id,
        dataStr
      );

      row = dbHelper.get<{ revisao_noturna: number }>(
        `SELECT revisao_noturna FROM controle_dia WHERE mentorado_id = ? AND data = ?`,
        mentorado!.id,
        dataStr
      );
      expect(row?.revisao_noturna).toBe(0);
    });

    it('permite marcar e desmarcar revisão mensal na tabela revisao_mensal', () => {
      const mentorado = dbHelper.get<{ id: string }>(`SELECT id FROM mentorado LIMIT 1`);
      expect(mentorado).toBeDefined();
      const mesRef = '2026-10';

      // 1. Marca revisão mensal
      dbHelper.run(
        `INSERT INTO revisao_mensal (id, mentorado_id, mes_referencia, feita_em)
         VALUES (?, ?, ?, ?)`,
        crypto.randomUUID(),
        mentorado!.id,
        mesRef,
        new Date().toISOString()
      );

      let row = dbHelper.get<{ mes_referencia: string }>(
        `SELECT mes_referencia FROM revisao_mensal WHERE mentorado_id = ? AND mes_referencia = ?`,
        mentorado!.id,
        mesRef
      );
      expect(row).toBeDefined();

      // 2. Desmarca revisão mensal
      dbHelper.run(
        `DELETE FROM revisao_mensal WHERE mentorado_id = ? AND mes_referencia = ?`,
        mentorado!.id,
        mesRef
      );

      row = dbHelper.get<{ mes_referencia: string }>(
        `SELECT mes_referencia FROM revisao_mensal WHERE mentorado_id = ? AND mes_referencia = ?`,
        mentorado!.id,
        mesRef
      );
      expect(row).toBeUndefined();
    });
  });
});
