// Serviço de Geração e Otimização de Ciclos de Estudo

import { Disciplina, TipoDisciplina } from '../../shared/types.js';

export interface CycleSlotDraft {
  disciplina_id: string;
  disciplina_nome: string;
  tipo: TipoDisciplina;
  ordem: number;
}

export interface CycleWarning {
  dia: number;
  mensagem: string;
  disciplinas: string[];
}

export interface GeneratedCycleResult {
  slotsSequencia: CycleSlotDraft[];
  totalSlots: number;
  duracaoDias: number;
  slotsPorDia: number;
  totalDecoreba: number;
  totalRaciocinio: number;
  avisos: CycleWarning[];
}

/**
 * Sugere uma sequência de disciplinas para o ciclo intercalando Decoreba e Raciocínio.
 */
export function generateCycleSequence(
  disciplinas: { id: string; nome: string; tipo: TipoDisciplina }[]
): CycleSlotDraft[] {
  if (!disciplinas || disciplinas.length === 0) return [];

  const decorebas = disciplinas.filter(d => d.tipo === 'decoreba');
  const raciocinios = disciplinas.filter(d => d.tipo === 'raciocinio');

  const sequencia: CycleSlotDraft[] = [];
  let decIdx = 0;
  let racIdx = 0;
  let ordem = 1;

  // Decide quem começa (o grupo com mais disciplinas ou decoreba por padrão)
  let pickDecoreba = decorebas.length >= raciocinios.length;

  while (decIdx < decorebas.length || racIdx < raciocinios.length) {
    if (pickDecoreba && decIdx < decorebas.length) {
      sequencia.push({
        disciplina_id: decorebas[decIdx].id,
        disciplina_nome: decorebas[decIdx].nome,
        tipo: 'decoreba',
        ordem: ordem++,
      });
      decIdx++;
      if (racIdx < raciocinios.length) pickDecoreba = false;
    } else if (!pickDecoreba && racIdx < raciocinios.length) {
      sequencia.push({
        disciplina_id: raciocinios[racIdx].id,
        disciplina_nome: raciocinios[racIdx].nome,
        tipo: 'raciocinio',
        ordem: ordem++,
      });
      racIdx++;
      if (decIdx < decorebas.length) pickDecoreba = true;
    } else if (decIdx < decorebas.length) {
      sequencia.push({
        disciplina_id: decorebas[decIdx].id,
        disciplina_nome: decorebas[decIdx].nome,
        tipo: 'decoreba',
        ordem: ordem++,
      });
      decIdx++;
    } else if (racIdx < raciocinios.length) {
      sequencia.push({
        disciplina_id: raciocinios[racIdx].id,
        disciplina_nome: raciocinios[racIdx].nome,
        tipo: 'raciocinio',
        ordem: ordem++,
      });
      racIdx++;
    }
  }

  return sequencia;
}

/**
 * Analisa a sequência e detecta repetições consecutivas de mesma carga cognitiva
 */
export function analyzeCycleWarnings(
  sequencia: CycleSlotDraft[],
  slotsPorDia: number = 3,
  duracaoDias: number = 30
): CycleWarning[] {
  const avisos: CycleWarning[] = [];
  if (sequencia.length < 2) return avisos;

  // Itera pelos dias simulados do ciclo
  let slotPointer = 0;
  for (let dia = 1; dia <= Math.min(duracaoDias, 7); dia++) {
    const slotsDoDia: CycleSlotDraft[] = [];
    for (let s = 0; s < slotsPorDia; s++) {
      slotsDoDia.push(sequencia[slotPointer % sequencia.length]);
      slotPointer++;
    }

    // Verifica repetição dentro do dia
    for (let i = 0; i < slotsDoDia.length - 1; i++) {
      if (slotsDoDia[i].tipo === slotsDoDia[i + 1].tipo) {
        avisos.push({
          dia,
          mensagem: `Dia ${dia} tem duas disciplinas ${slotsDoDia[i].tipo} em sequência (${slotsDoDia[i].disciplina_nome} e ${slotsDoDia[i + 1].disciplina_nome}). Você pode manter assim.`,
          disciplinas: [slotsDoDia[i].disciplina_nome, slotsDoDia[i + 1].disciplina_nome],
        });
      }
    }
  }

  return avisos;
}

/**
 * Gera o plano de ciclo completo
 */
export function planFullCycle(
  disciplinas: { id: string; nome: string; tipo: TipoDisciplina }[],
  duracaoDias: number = 30,
  slotsPorDia: number = 3
): GeneratedCycleResult {
  const sequencia = generateCycleSequence(disciplinas);
  const avisos = analyzeCycleWarnings(sequencia, slotsPorDia, duracaoDias);

  const totalDecoreba = sequencia.filter(s => s.tipo === 'decoreba').length;
  const totalRaciocinio = sequencia.filter(s => s.tipo === 'raciocinio').length;

  return {
    slotsSequencia: sequencia,
    totalSlots: sequencia.length,
    duracaoDias,
    slotsPorDia,
    totalDecoreba,
    totalRaciocinio,
    avisos,
  };
}
