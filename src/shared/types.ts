// Tipos compartilhados da plataforma Handshake

export type PapelUsuario = 'mentor' | 'mentorado';
export type TipoDisciplina = 'decoreba' | 'raciocinio';
export type FaseNumero = 1 | 2 | 3;
export type BancaEdital = 'CEBRASPE' | 'FGV' | 'FCC' | 'VUNESP' | 'CESGRANRIO' | 'Outra';
export type MetodoCobranca = 'certo_errado' | 'multipla_escolha';
export type StatusSessao = 'em_andamento' | 'concluida' | 'interrompida';
export type TipoEtapa = 'estudo' | 'teste' | 'recorde' | 'descanso' | 'revisao' | 'aplicacao';

export interface DuracoesFase {
  estudoMin: number;
  testeMin: number;
  recordeMin: number;
  descansoMin: number;
}

export interface DuracoesConfig {
  fase1: DuracoesFase;
  fase2: {
    revisaoMin: number;
    aplicacaoMin: number;
    revisaoFinalMin: number;
    descansoMin: number;
  };
  fase3: {
    aplicacaoMin: number;
    revisaoMin: number;
    descansoMin: number;
  };
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  excluido_em?: string | null;
}

export interface Convite {
  id: string;
  mentor_id: string;
  email: string;
  token: string;
  expira_em: string;
  aceito_em?: string | null;
}

export interface Mentorado {
  id: string;
  usuario_id: string;
  mentor_id: string;
  fim_mentoria: string;
  dia_corte_semana: number; // 0 = dom, 1 = seg, 2 = ter, etc.
  fuso: string;
  duracoes_override?: string | null; // JSON string de DuracoesConfig
  consentimento_em?: string | null;
  usuario?: Usuario;
}

export interface Auditoria {
  id: string;
  autor_id: string;
  autor_nome?: string;
  mentorado_id: string;
  entidade: string;
  campo: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  em: string;
}

export interface Edital {
  id: string;
  mentor_id: string;
  nome: string;
  banca: string;
  versao: number;
  metodo_cobranca: MetodoCobranca;
  fator_penalidade: number;
  pontuacao_total: number;
  nota_minima_aprovacao: number;
  grupos?: Grupo[];
  total_grupos?: number;
  total_disciplinas?: number;
}

export interface Grupo {
  id: string;
  edital_id: string;
  nome: string;
  ordem: number;
  questoes_prova: number;
  peso: number;
  nota_minima_grupo?: number;
  disciplinas?: Disciplina[];
}

export interface Disciplina {
  id: string;
  edital_id: string;
  nome: string;
  grupo_id: string;
  tipo: TipoDisciplina;
  ordem: number;
  peso?: number;
  questoes_estimadas?: number;
  arquivado_em?: string | null;
  topicos?: Topico[];
  fase_atual?: FaseNumero;
  no_ciclo?: boolean;
}

export interface Topico {
  id: string;
  disciplina_id: string;
  pai_id?: string | null;
  numeracao: string;
  texto: string;
  ordem: number;
  arquivado_em?: string | null;
  filhos?: Topico[];
  // Métricas agregadas ou associadas à matrícula
  inicio?: string | null;
  conclusao?: string | null;
  questoes_certas?: number;
  questoes_resolvidas?: number;
  porcentagem?: number;
  status?: 'pendente' | 'em_andamento' | 'concluido';
}

export interface Matricula {
  id: string;
  mentorado_id: string;
  edital_id: string;
  atribuido_em: string;
  removido_em?: string | null;
  edital?: Edital;
}

export interface Ciclo {
  id: string;
  matricula_id: string;
  numero: number;
  inicio: string;
  duracao_dias: number;
  slots_por_dia: number;
  slots?: CicloSlot[];
  rodadas?: Rodada[];
}

export interface CicloSlot {
  id: string;
  ciclo_id: string;
  disciplina_id: string;
  ordem: number;
  disciplina?: Disciplina;
}

export interface Rodada {
  id: string;
  ciclo_id: string;
  numero: number;
  cor: string | null; // Hex ou nome da paleta de 10 cores
}

export interface Sessao {
  id: string;
  matricula_id: string;
  slot_id: string;
  topico_id: string;
  fase: FaseNumero;
  status: StatusSessao;
  inicio: string;
  fim?: string | null;
  duracoes_aplicadas: string; // JSON
  topico?: Topico;
  slot?: CicloSlot;
  etapas?: SessaoEtapa[];
  resumos?: ResumoFoto[];
}

export interface SessaoEtapa {
  id: string;
  sessao_id: string;
  tipo: TipoEtapa;
  inicio: string;
  fim?: string | null;
  segundos_pausados: number;
}

export interface LancamentoQuestao {
  id: string;
  matricula_id: string;
  topico_id: string;
  sessao_id?: string | null;
  fase: FaseNumero;
  data: string;
  certas: number;
  resolvidas: number;
  origem: 'sessao' | 'manual';
  topico_texto?: string;
  disciplina_nome?: string;
}

export interface ResumoFoto {
  id: string;
  sessao_id: string;
  storage_key: string;
  url?: string;
  enviada_em: string;
  expira_em: string;
  excluida_em?: string | null;
  comentarios?: ComentarioResumo[];
  disciplina_nome?: string;
  topico_texto?: string;
}

export interface ComentarioResumo {
  id: string;
  foto_id: string;
  autor_id: string;
  autor_nome?: string;
  texto: string;
  em: string;
}

export interface ProgressoTopico {
  id: string;
  matricula_id: string;
  topico_id: string;
  fase: FaseNumero;
  inicio?: string | null;
  conclusao?: string | null;
}

export interface FaseDisciplina {
  id: string;
  matricula_id: string;
  disciplina_id: string;
  fase_atual: FaseNumero;
  override_por?: string | null;
  override_em?: string | null;
}

export interface ControleCelula {
  id: string;
  rodada_id: string;
  slot_id: string;
  data: string;
  cor: string;
  feito_em: string;
}

export interface ControleDia {
  id: string;
  mentorado_id: string;
  data: string;
  revisao_noturna: boolean;
}

export interface RevisaoMensal {
  id: string;
  mentorado_id: string;
  mes_referencia: string; // ex: '2026-10'
  feita_em: string;
}

// Resumos de aderência para o painel do Mentor
export interface AderenciaMentorado {
  id: string;
  nome: string;
  email: string;
  edital_nome: string;
  dia_reuniao_nome: string;
  data_reuniao_proxima: string;
  semana_dias: {
    data: string;
    dia_semana: string;
    estudado: boolean;
    fim_de_semana: boolean;
    reuniao: boolean;
  }[];
  sessoes_realizadas: number;
  sessoes_planejadas: number;
  taxa_acerto: number | null;
  situacao: 'ok' | 'alerta';
  motivo_alerta?: string;
}

// Resumo semanal de questões (HU-4.6)
export interface QuestoesSemanais {
  data_corte: string;
  disciplinas: {
    disciplina_id: string;
    disciplina_nome: string;
    grupo_nome: string;
    certas: number;
    resolvidas: number;
    porcentagem: number;
  }[];
  total_certas: number;
  total_resolvidas: number;
  media_geral: number;
}

// Tipos para Parser de Editais e Importação em Lote
export interface ParsedTopicNodeDTO {
  numeracao: string;
  texto: string;
  ordem: number;
  warnings?: {
    tipo: 'palavra_colada';
    original: string;
    sugestao: string;
  }[];
  filhos: ParsedTopicNodeDTO[];
}

export interface ParsedDisciplineDTO {
  idTemp?: string;
  nome: string;
  grupoSugerido?: string;
  tipoSugerido?: TipoDisciplina;
  topicos: ParsedTopicNodeDTO[];
  totalTopicos?: number;
  totalAvisos?: number;
  rawText: string;
}

export interface ParsedFullEditalDTO {
  grupos: {
    nome: string;
    disciplinas: ParsedDisciplineDTO[];
  }[];
  disciplinas: ParsedDisciplineDTO[];
  totalDisciplinas: number;
  totalTopicos: number;
  totalAvisos: number;
}

export interface SalvarLoteDisciplinaItem {
  nome: string;
  grupoId?: string;
  nomeGrupo?: string;
  tipo: TipoDisciplina;
  topicos: ParsedTopicNodeDTO[];
  peso?: number;
  questoesEstimadas?: number;
}

export interface SalvarLoteEditalRequest {
  disciplinas: SalvarLoteDisciplinaItem[];
}

