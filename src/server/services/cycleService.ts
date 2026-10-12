// Serviço de Geração e Otimização de Ciclos de Estudo

import { Disciplina, TipoDisciplina } from '../../shared/types.js';

export interface NeuroMotivation {
  tipo: 'decoreba_dupla' | 'raciocinio_duplo';
  titulo: string;
  areaCerebral: string;
  mecanismo: string;
  impacto: string;
  recomendacao: string;
}

export interface CycleClash {
  posicao1: number;
  posicao2: number;
  disciplina1: string;
  disciplina2: string;
  tipo: TipoDisciplina;
  motivacao: NeuroMotivation;
}

export const NEURO_MOTIVATION = {
  decoreba_dupla: {
    tipo: 'decoreba_dupla' as const,
    titulo: 'Choque Hipocampal: Interferência Proativa & Retroativa',
    areaCerebral: 'Hipocampo e Córtex Temporal Medial (Memória Declarativa)',
    mecanismo:
      'A sucessão de dois blocos densos de memorização semântica (leis, normas, prazos e regimentos) satura a memória declarativa. O primeiro conteúdo compete com a retenção do segundo (interferência proativa), enquanto os novos detalhes dispersam traços mnemônicos recentes antes da consolidação sináptica (interferência retroativa).',
    impacto:
      'Fadiga mnemônica severa, confusão entre prazos normativos de matérias distintas e aceleração da curva de esquecimento de Ebbinghaus.',
    recomendacao:
      'Intercale com uma disciplina analítica ou lógica (Raciocínio Lógico, Engenharia, Estatística) para conferir repouso sináptico ao hipocampo enquanto o córtex pré-frontal assume o processamento.',
  },
  raciocinio_duplo: {
    tipo: 'raciocinio_duplo' as const,
    titulo: 'Fadiga do Córtex Pré-Frontal Dorsolateral (DLPFC)',
    areaCerebral: 'Córtex Pré-Frontal Dorsolateral (DLPFC) & Sistema Dopaminérgico',
    mecanismo:
      'Disciplinas analíticas demandam resolução ativa de problemas e recrutamento contínuo da memória de trabalho (working memory). Blocos consecutivos esgotam rapidamente as reservas energéticas de glicose cerebral e provocam depleção de neurotransmissores como dopamina e noradrenalina, responsáveis pela atenção sustentada.',
    impacto:
      'Queda acentuada na velocidade de processamento, disparo de erros bobos em cálculos e comandos lógicos, e sensação de saturação cognitiva.',
    recomendacao:
      'Intercale com uma disciplina de leitura conceitual ou normativa (Decoreba) para descarregar o córtex pré-frontal e ativar redes neurais semântico-temporais em ritmo reflexivo.',
  },
  interleaving_principio: {
    titulo: 'Princípio da Alternância Cognitiva (Interleaving Effect)',
    fundamento: 'Teoria da Aprendizagem Otimizada (Bjork & Kornell) e alternância de redes neurais frontoparietais e temporais.',
    beneficio:
      'Alternar entre matérias de decoreba e raciocínio permite que a rede neural anterior entre em consolidação passiva enquanto uma rede neural ortogonal é ativada. Isso aumenta a taxa de retenção de longo prazo em até 43% e previne a habituação atencional.',
  },
};

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
  tipo?: TipoDisciplina;
  motivacao?: NeuroMotivation;
}

export interface GeneratedCycleResult {
  slotsSequencia: CycleSlotDraft[];
  totalSlots: number;
  duracaoDias: number;
  slotsPorDia: number;
  totalDecoreba: number;
  totalRaciocinio: number;
  avisos: CycleWarning[];
  choques?: CycleClash[];
  principioInterleaving?: typeof NEURO_MOTIVATION.interleaving_principio;
  tamanhoMatriz: string;
  diasPorVolta: number;
  voltasPorSemana: number;
  metaSemanalAtingida: boolean;
}

/**
 * Sugere uma sequência de disciplinas para o ciclo intercalando Decoreba e Raciocínio.
 * Se slotsPorDia for informado, preenche a matriz quadrada N x N (ex: 3x3 = 9 slots).
 */
export function generateCycleSequence(
  disciplinas: { id: string; nome: string; tipo: TipoDisciplina }[],
  slotsPorDia?: number
): CycleSlotDraft[] {
  if (!disciplinas || disciplinas.length === 0) return [];

  const decorebas = disciplinas.filter(d => d.tipo === 'decoreba');
  const raciocinios = disciplinas.filter(d => d.tipo === 'raciocinio');

  const blocoBase: CycleSlotDraft[] = [];
  let decIdx = 0;
  let racIdx = 0;
  let ordem = 1;

  // Decide quem começa (o grupo com mais disciplinas ou decoreba por padrão)
  let pickDecoreba = decorebas.length >= raciocinios.length;

  while (decIdx < decorebas.length || racIdx < raciocinios.length) {
    if (pickDecoreba && decIdx < decorebas.length) {
      blocoBase.push({
        disciplina_id: decorebas[decIdx].id,
        disciplina_nome: decorebas[decIdx].nome,
        tipo: 'decoreba',
        ordem: ordem++,
      });
      decIdx++;
      if (racIdx < raciocinios.length) pickDecoreba = false;
    } else if (!pickDecoreba && racIdx < raciocinios.length) {
      blocoBase.push({
        disciplina_id: raciocinios[racIdx].id,
        disciplina_nome: raciocinios[racIdx].nome,
        tipo: 'raciocinio',
        ordem: ordem++,
      });
      racIdx++;
      if (decIdx < decorebas.length) pickDecoreba = true;
    } else if (decIdx < decorebas.length) {
      blocoBase.push({
        disciplina_id: decorebas[decIdx].id,
        disciplina_nome: decorebas[decIdx].nome,
        tipo: 'decoreba',
        ordem: ordem++,
      });
      decIdx++;
    } else if (racIdx < raciocinios.length) {
      blocoBase.push({
        disciplina_id: raciocinios[racIdx].id,
        disciplina_nome: raciocinios[racIdx].nome,
        tipo: 'raciocinio',
        ordem: ordem++,
      });
      racIdx++;
    }
  }

  // Se slotsPorDia não for informado, retorna o bloco com todas as matérias únicas
  if (!slotsPorDia) {
    return blocoBase;
  }

  const targetSlots = slotsPorDia * slotsPorDia;
  const sequencia: CycleSlotDraft[] = [];

  for (let i = 0; i < targetSlots; i++) {
    const item = blocoBase[i % blocoBase.length];
    sequencia.push({
      disciplina_id: item.disciplina_id,
      disciplina_nome: item.disciplina_nome,
      tipo: item.tipo,
      ordem: i + 1,
    });
  }

  return sequencia;
}

/**
 * Mapeia todos os pontos de choque consecutivo de mesma carga cognitiva
 */
export function analyzeCycleClashes(sequencia: CycleSlotDraft[]): CycleClash[] {
  const clashes: CycleClash[] = [];
  if (!sequencia || sequencia.length < 2) return clashes;

  for (let i = 0; i < sequencia.length - 1; i++) {
    const s1 = sequencia[i];
    const s2 = sequencia[i + 1];
    if (s1.tipo === s2.tipo) {
      const tipoKey = s1.tipo === 'decoreba' ? 'decoreba_dupla' : 'raciocinio_duplo';
      clashes.push({
        posicao1: i + 1,
        posicao2: i + 2,
        disciplina1: s1.disciplina_nome,
        disciplina2: s2.disciplina_nome,
        tipo: s1.tipo,
        motivacao: NEURO_MOTIVATION[tipoKey],
      });
    }
  }

  return clashes;
}

/**
 * Analisa a sequência e detecta repetições consecutivas com fundamentação neuropsicológica
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
        const tipo = slotsDoDia[i].tipo;
        const tipoKey = tipo === 'decoreba' ? 'decoreba_dupla' : 'raciocinio_duplo';
        const motivacao = NEURO_MOTIVATION[tipoKey];

        avisos.push({
          dia,
          mensagem: `Dia ${dia} tem duas disciplinas ${tipo} em sequência (${slotsDoDia[i].disciplina_nome} e ${slotsDoDia[i + 1].disciplina_nome}). Você pode manter assim. Motivação neuropsicológica: ${motivacao.titulo} - ${motivacao.impacto}`,
          disciplinas: [slotsDoDia[i].disciplina_nome, slotsDoDia[i + 1].disciplina_nome],
          tipo,
          motivacao,
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
  const sequencia = generateCycleSequence(disciplinas, slotsPorDia);
  const avisos = analyzeCycleWarnings(sequencia, slotsPorDia, duracaoDias);
  const choques = analyzeCycleClashes(sequencia);

  const totalDecoreba = sequencia.filter(s => s.tipo === 'decoreba').length;
  const totalRaciocinio = sequencia.filter(s => s.tipo === 'raciocinio').length;

  const diasPorVolta = Math.max(1, slotsPorDia);
  const voltasPorSemana = Number((6 / diasPorVolta).toFixed(1));
  const metaSemanalAtingida = voltasPorSemana >= 2.0;

  return {
    slotsSequencia: sequencia,
    totalSlots: sequencia.length,
    duracaoDias,
    slotsPorDia,
    totalDecoreba,
    totalRaciocinio,
    avisos,
    choques,
    principioInterleaving: NEURO_MOTIVATION.interleaving_principio,
    tamanhoMatriz: `${slotsPorDia}x${slotsPorDia}`,
    diasPorVolta,
    voltasPorSemana,
    metaSemanalAtingida,
  };
}
