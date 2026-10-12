import { describe, it, expect } from 'vitest';
import { generateCycleSequence, planFullCycle } from '../src/server/services/cycleService.js';
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

  it('detecta repetições consecutivas de mesma carga e gera avisos claros', () => {
    const desbalanceadas: { id: string; nome: string; tipo: TipoDisciplina }[] = [
      { id: '1', nome: 'Dir 1', tipo: 'decoreba' },
      { id: '2', nome: 'Dir 2', tipo: 'decoreba' },
      { id: '3', nome: 'Dir 3', tipo: 'decoreba' },
      { id: '4', nome: 'Prog 1', tipo: 'raciocinio' },
    ];

    const result = planFullCycle(desbalanceadas, 30, 3);
    expect(result.avisos.length).toBeGreaterThan(0);
    expect(result.avisos[0].mensagem).toContain('decoreba em sequência');
  });
});
