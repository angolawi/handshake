import { describe, it, expect } from 'vitest';
import {
  generateCycleSequence,
  planFullCycle,
  analyzeCycleClashes,
  NEURO_MOTIVATION,
} from '../src/server/services/cycleService.js';
import { TipoDisciplina } from '../src/shared/types.js';

describe('cycleService', () => {
  const disciplinas: { id: string; nome: string; tipo: TipoDisciplina }[] = [
    { id: '1', nome: 'Direito Constitucional', tipo: 'decoreba' },
    { id: '2', nome: 'Raciocínio Lógico', tipo: 'raciocinio' },
    { id: '3', nome: 'Direito Administrativo', tipo: 'decoreba' },
    { id: '4', nome: 'Engenharia de Software', tipo: 'raciocinio' },
    { id: '5', nome: 'Ética Pública', tipo: 'decoreba' },
  ];

  it('alterna disciplinas decoreba e raciocinio', () => {
    const seq = generateCycleSequence(disciplinas);
    expect(seq).toHaveLength(5);

    // Tipos devem alternar
    expect(seq[0].tipo).toBe('decoreba');
    expect(seq[1].tipo).toBe('raciocinio');
    expect(seq[2].tipo).toBe('decoreba');
    expect(seq[3].tipo).toBe('raciocinio');
    expect(seq[4].tipo).toBe('decoreba');
  });

  it('detecta repetições consecutivas de mesma carga e gera avisos claros com motivação neuropsicológica', () => {
    const desbalanceadas: { id: string; nome: string; tipo: TipoDisciplina }[] = [
      { id: '1', nome: 'Dir 1', tipo: 'decoreba' },
      { id: '2', nome: 'Dir 2', tipo: 'decoreba' },
      { id: '3', nome: 'Dir 3', tipo: 'decoreba' },
      { id: '4', nome: 'Prog 1', tipo: 'raciocinio' },
    ];

    const result = planFullCycle(desbalanceadas, 30, 3);
    expect(result.avisos.length).toBeGreaterThan(0);
    expect(result.avisos[0].mensagem).toContain('decoreba em sequência');
    expect(result.avisos[0].mensagem).toContain('Motivação neuropsicológica');
    expect(result.avisos[0].motivacao).toBeDefined();
    expect(result.avisos[0].motivacao?.areaCerebral).toContain('Hipocampo');
    expect(result.principioInterleaving).toBeDefined();
  });

  it('detecta choque consecutivo de decoreba + decoreba com diagnóstico hipocampal', () => {
    const slots = [
      { disciplina_id: 'd1', disciplina_nome: 'Direito Penal', tipo: 'decoreba' as const, ordem: 1 },
      { disciplina_id: 'd2', disciplina_nome: 'Direito Tributário', tipo: 'decoreba' as const, ordem: 2 },
      { disciplina_id: 'd3', disciplina_nome: 'Estatística', tipo: 'raciocinio' as const, ordem: 3 },
    ];

    const choques = analyzeCycleClashes(slots);
    expect(choques).toHaveLength(1);
    expect(choques[0].tipo).toBe('decoreba');
    expect(choques[0].disciplina1).toBe('Direito Penal');
    expect(choques[0].disciplina2).toBe('Direito Tributário');
    expect(choques[0].motivacao.tipo).toBe('decoreba_dupla');
    expect(choques[0].motivacao.titulo).toContain('Choque Hipocampal');
    expect(choques[0].motivacao.mecanismo).toContain('interferência proativa');
  });

  it('detecta choque consecutivo de raciocinio + raciocinio com fadiga do córtex pré-frontal', () => {
    const slots = [
      { disciplina_id: 'd1', disciplina_nome: 'Direito Constitucional', tipo: 'decoreba' as const, ordem: 1 },
      { disciplina_id: 'd2', disciplina_nome: 'Raciocínio Lógico', tipo: 'raciocinio' as const, ordem: 2 },
      { disciplina_id: 'd3', disciplina_nome: 'Banco de Dados', tipo: 'raciocinio' as const, ordem: 3 },
    ];

    const choques = analyzeCycleClashes(slots);
    expect(choques).toHaveLength(1);
    expect(choques[0].tipo).toBe('raciocinio');
    expect(choques[0].disciplina1).toBe('Raciocínio Lógico');
    expect(choques[0].disciplina2).toBe('Banco de Dados');
    expect(choques[0].motivacao.tipo).toBe('raciocinio_duplo');
    expect(choques[0].motivacao.titulo).toContain('Córtex Pré-Frontal Dorsolateral');
    expect(choques[0].motivacao.areaCerebral).toContain('DLPFC');
  });

  it('gera tabela de ciclo de tamanho N x N (3x3 = 9 slots) para mentorado com 3h livres', () => {
    const plano = planFullCycle(disciplinas, 30, 3);
    expect(plano.slotsSequencia).toHaveLength(9);
    expect(plano.totalSlots).toBe(9);
    expect(plano.tamanhoMatriz).toBe('3x3');
    expect(plano.diasPorVolta).toBe(3);
    // 6 dias / 3 dias = 2.0 voltas/semana (mínimo da metodologia atingido)
    expect(plano.voltasPorSemana).toBe(2.0);
    expect(plano.metaSemanalAtingida).toBe(true);
  });

  it('dimensiona matriz para 2x2 (4 slots) e 4x4 (16 slots) com cálculo de giro semanal', () => {
    const plano2h = planFullCycle(disciplinas, 30, 2);
    expect(plano2h.slotsSequencia).toHaveLength(4);
    expect(plano2h.tamanhoMatriz).toBe('2x2');
    expect(plano2h.voltasPorSemana).toBe(3.0);
    expect(plano2h.metaSemanalAtingida).toBe(true);

    const plano4h = planFullCycle(disciplinas, 30, 4);
    expect(plano4h.slotsSequencia).toHaveLength(16);
    expect(plano4h.tamanhoMatriz).toBe('4x4');
    expect(plano4h.voltasPorSemana).toBe(1.5);
    expect(plano4h.metaSemanalAtingida).toBe(false);
  });
});

