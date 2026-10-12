-- Esquema Relacional Plataforma Handshake (SQLite)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuario (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  papel TEXT NOT NULL CHECK(papel IN ('mentor', 'mentorado')),
  excluido_em TEXT
);

CREATE TABLE IF NOT EXISTS convite (
  id TEXT PRIMARY KEY,
  mentor_id TEXT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expira_em TEXT NOT NULL,
  aceito_em TEXT
);

CREATE TABLE IF NOT EXISTS mentorado (
  id TEXT PRIMARY KEY,
  usuario_id TEXT UNIQUE NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  mentor_id TEXT NOT NULL REFERENCES usuario(id),
  fim_mentoria TEXT NOT NULL,
  dia_corte_semana INTEGER NOT NULL, -- 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  fuso TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  duracoes_override TEXT, -- JSON com customizações de tempos
  consentimento_em TEXT
);

CREATE TABLE IF NOT EXISTS auditoria (
  id TEXT PRIMARY KEY,
  autor_id TEXT NOT NULL REFERENCES usuario(id),
  mentorado_id TEXT NOT NULL REFERENCES mentorado(id) ON DELETE CASCADE,
  entidade TEXT NOT NULL,
  campo TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS edital (
  id TEXT PRIMARY KEY,
  mentor_id TEXT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  banca TEXT NOT NULL,
  versao INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS grupo (
  id TEXT PRIMARY KEY,
  edital_id TEXT NOT NULL REFERENCES edital(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  questoes_prova INTEGER NOT NULL DEFAULT 0,
  peso INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS disciplina (
  id TEXT PRIMARY KEY,
  edital_id TEXT NOT NULL REFERENCES edital(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  grupo_id TEXT NOT NULL REFERENCES grupo(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK(tipo IN ('decoreba', 'raciocinio')),
  ordem INTEGER NOT NULL DEFAULT 0,
  arquivado_em TEXT
);

CREATE TABLE IF NOT EXISTS topico (
  id TEXT PRIMARY KEY,
  disciplina_id TEXT NOT NULL REFERENCES disciplina(id) ON DELETE CASCADE,
  pai_id TEXT REFERENCES topico(id) ON DELETE CASCADE,
  numeracao TEXT NOT NULL,
  texto TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  arquivado_em TEXT
);

CREATE TABLE IF NOT EXISTS matricula (
  id TEXT PRIMARY KEY,
  mentorado_id TEXT NOT NULL REFERENCES mentorado(id) ON DELETE CASCADE,
  edital_id TEXT NOT NULL REFERENCES edital(id) ON DELETE CASCADE,
  atribuido_em TEXT NOT NULL,
  removido_em TEXT,
  UNIQUE(mentorado_id, edital_id)
);

CREATE TABLE IF NOT EXISTS ciclo (
  id TEXT PRIMARY KEY,
  matricula_id TEXT NOT NULL REFERENCES matricula(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL DEFAULT 1,
  inicio TEXT NOT NULL,
  duracao_dias INTEGER NOT NULL DEFAULT 30,
  slots_por_dia INTEGER NOT NULL DEFAULT 3
);

CREATE TABLE IF NOT EXISTS ciclo_slot (
  id TEXT PRIMARY KEY,
  ciclo_id TEXT NOT NULL REFERENCES ciclo(id) ON DELETE CASCADE,
  disciplina_id TEXT NOT NULL REFERENCES disciplina(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rodada (
  id TEXT PRIMARY KEY,
  ciclo_id TEXT NOT NULL REFERENCES ciclo(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  cor TEXT,
  UNIQUE(ciclo_id, numero)
);

CREATE TABLE IF NOT EXISTS sessao (
  id TEXT PRIMARY KEY,
  matricula_id TEXT NOT NULL REFERENCES matricula(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL REFERENCES ciclo_slot(id) ON DELETE CASCADE,
  topico_id TEXT NOT NULL REFERENCES topico(id) ON DELETE CASCADE,
  fase INTEGER NOT NULL CHECK(fase IN (1, 2, 3)),
  status TEXT NOT NULL CHECK(status IN ('em_andamento', 'concluida', 'interrompida')),
  inicio TEXT NOT NULL,
  fim TEXT,
  duracoes_aplicadas TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessao_etapa (
  id TEXT PRIMARY KEY,
  sessao_id TEXT NOT NULL REFERENCES sessao(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  inicio TEXT NOT NULL,
  fim TEXT,
  segundos_pausados INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lancamento_questao (
  id TEXT PRIMARY KEY,
  matricula_id TEXT NOT NULL REFERENCES matricula(id) ON DELETE CASCADE,
  topico_id TEXT NOT NULL REFERENCES topico(id) ON DELETE CASCADE,
  sessao_id TEXT REFERENCES sessao(id) ON DELETE SET NULL,
  fase INTEGER NOT NULL CHECK(fase IN (1, 2, 3)),
  data TEXT NOT NULL,
  certas INTEGER NOT NULL,
  resolvidas INTEGER NOT NULL,
  origem TEXT NOT NULL CHECK(origem IN ('sessao', 'manual'))
);

CREATE TABLE IF NOT EXISTS resumo_foto (
  id TEXT PRIMARY KEY,
  sessao_id TEXT NOT NULL REFERENCES sessao(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  enviada_em TEXT NOT NULL,
  expira_em TEXT NOT NULL,
  excluida_em TEXT
);

CREATE TABLE IF NOT EXISTS comentario_resumo (
  id TEXT PRIMARY KEY,
  foto_id TEXT NOT NULL REFERENCES resumo_foto(id) ON DELETE CASCADE,
  autor_id TEXT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS progresso_topico (
  id TEXT PRIMARY KEY,
  matricula_id TEXT NOT NULL REFERENCES matricula(id) ON DELETE CASCADE,
  topico_id TEXT NOT NULL REFERENCES topico(id) ON DELETE CASCADE,
  fase INTEGER NOT NULL CHECK(fase IN (1, 2, 3)),
  inicio TEXT,
  conclusao TEXT,
  UNIQUE(matricula_id, topico_id, fase)
);

CREATE TABLE IF NOT EXISTS fase_disciplina (
  id TEXT PRIMARY KEY,
  matricula_id TEXT NOT NULL REFERENCES matricula(id) ON DELETE CASCADE,
  disciplina_id TEXT NOT NULL REFERENCES disciplina(id) ON DELETE CASCADE,
  fase_atual INTEGER NOT NULL DEFAULT 1 CHECK(fase_atual IN (1, 2, 3)),
  override_por TEXT REFERENCES usuario(id),
  override_em TEXT,
  UNIQUE(matricula_id, disciplina_id)
);

CREATE TABLE IF NOT EXISTS controle_celula (
  id TEXT PRIMARY KEY,
  rodada_id TEXT NOT NULL REFERENCES rodada(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL REFERENCES ciclo_slot(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  cor TEXT NOT NULL,
  feito_em TEXT NOT NULL,
  UNIQUE(rodada_id, slot_id, data)
);

CREATE TABLE IF NOT EXISTS controle_dia (
  id TEXT PRIMARY KEY,
  mentorado_id TEXT NOT NULL REFERENCES mentorado(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  revisao_noturna INTEGER NOT NULL DEFAULT 0,
  UNIQUE(mentorado_id, data)
);

CREATE TABLE IF NOT EXISTS revisao_mensal (
  id TEXT PRIMARY KEY,
  mentorado_id TEXT NOT NULL REFERENCES mentorado(id) ON DELETE CASCADE,
  mes_referencia TEXT NOT NULL,
  feita_em TEXT NOT NULL,
  UNIQUE(mentorado_id, mes_referencia)
);
