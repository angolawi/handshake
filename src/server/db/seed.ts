// Carga Inicial (Seed) para a plataforma Handshake

import { initDb, dbHelper } from './database.js';
import { hashPassword, MENTOR_DEFAULT_EMAIL, MENTOR_DEFAULT_SENHA } from '../services/authService.js';

export function runSeed() {
  initDb();

  // Limpa tabelas para garantir estado limpo
  dbHelper.exec(`
    DELETE FROM revisao_mensal;
    DELETE FROM controle_dia;
    DELETE FROM controle_celula;
    DELETE FROM comentario_resumo;
    DELETE FROM resumo_foto;
    DELETE FROM lancamento_questao;
    DELETE FROM sessao_etapa;
    DELETE FROM sessao;
    DELETE FROM rodada;
    DELETE FROM ciclo_slot;
    DELETE FROM ciclo;
    DELETE FROM fase_disciplina;
    DELETE FROM progresso_topico;
    DELETE FROM matricula;
    DELETE FROM topico;
    DELETE FROM disciplina;
    DELETE FROM grupo;
    DELETE FROM edital;
    DELETE FROM auditoria;
    DELETE FROM mentorado;
    DELETE FROM convite;
    DELETE FROM sessao_auth;
    DELETE FROM usuario;
  `);

  const mentorId = 'usr_mentor_gleyson';
  const marinaId = 'usr_aluno_marina';
  const rafaelId = 'usr_aluno_rafael';
  const camilaId = 'usr_aluno_camila';
  const beatrizId = 'usr_aluno_beatriz';
  const lucasId = 'usr_aluno_lucas';
  const tiagoId = 'usr_aluno_tiago';

  const senhaAlunoHash = hashPassword('Aluno!123456');
  const senhaMentorHash = hashPassword(MENTOR_DEFAULT_SENHA);

  // 1. Usuários
  dbHelper.run(`INSERT INTO usuario (id, nome, email, papel, senha_hash) VALUES (?, ?, ?, ?, ?)`, mentorId, 'Gleyson Azevedo', MENTOR_DEFAULT_EMAIL, 'mentor', senhaMentorHash);
  dbHelper.run(`INSERT INTO usuario (id, nome, email, papel, senha_hash) VALUES (?, ?, ?, ?, ?)`, marinaId, 'Marina R.', 'marina@handshake.local', 'mentorado', senhaAlunoHash);
  dbHelper.run(`INSERT INTO usuario (id, nome, email, papel, senha_hash) VALUES (?, ?, ?, ?, ?)`, rafaelId, 'Rafael S.', 'rafael@handshake.local', 'mentorado', senhaAlunoHash);
  dbHelper.run(`INSERT INTO usuario (id, nome, email, papel, senha_hash) VALUES (?, ?, ?, ?, ?)`, camilaId, 'Camila P.', 'camila@handshake.local', 'mentorado', senhaAlunoHash);
  dbHelper.run(`INSERT INTO usuario (id, nome, email, papel, senha_hash) VALUES (?, ?, ?, ?, ?)`, beatrizId, 'Beatriz L.', 'beatriz@handshake.local', 'mentorado', senhaAlunoHash);
  dbHelper.run(`INSERT INTO usuario (id, nome, email, papel, senha_hash) VALUES (?, ?, ?, ?, ?)`, lucasId, 'Lucas M.', 'lucas@handshake.local', 'mentorado', senhaAlunoHash);
  dbHelper.run(`INSERT INTO usuario (id, nome, email, papel, senha_hash) VALUES (?, ?, ?, ?, ?)`, tiagoId, 'Tiago A.', 'tiago@handshake.local', 'mentorado', senhaAlunoHash);

  // 2. Perfis de Mentorado
  const mentMarinaId = 'ment_marina';
  const mentRafaelId = 'ment_rafael';
  const mentCamilaId = 'ment_camila';
  const mentBeatrizId = 'ment_beatriz';
  const mentLucasId = 'ment_lucas';
  const mentTiagoId = 'ment_tiago';

  dbHelper.run(`INSERT INTO mentorado (id, usuario_id, mentor_id, fim_mentoria, dia_corte_semana, consentimento_em) VALUES (?, ?, ?, ?, ?, ?)`, mentMarinaId, marinaId, mentorId, '2027-04-30', 2, '2026-10-01T10:00:00Z');
  dbHelper.run(`INSERT INTO mentorado (id, usuario_id, mentor_id, fim_mentoria, dia_corte_semana, consentimento_em) VALUES (?, ?, ?, ?, ?, ?)`, mentRafaelId, rafaelId, mentorId, '2027-04-30', 2, '2026-10-01T10:00:00Z');
  dbHelper.run(`INSERT INTO mentorado (id, usuario_id, mentor_id, fim_mentoria, dia_corte_semana, consentimento_em) VALUES (?, ?, ?, ?, ?, ?)`, mentCamilaId, camilaId, mentorId, '2027-04-30', 2, '2026-10-01T10:00:00Z');
  dbHelper.run(`INSERT INTO mentorado (id, usuario_id, mentor_id, fim_mentoria, dia_corte_semana, consentimento_em) VALUES (?, ?, ?, ?, ?, ?)`, mentBeatrizId, beatrizId, mentorId, '2027-04-30', 4, '2026-10-01T10:00:00Z');
  dbHelper.run(`INSERT INTO mentorado (id, usuario_id, mentor_id, fim_mentoria, dia_corte_semana, consentimento_em) VALUES (?, ?, ?, ?, ?, ?)`, mentLucasId, lucasId, mentorId, '2027-04-30', 4, '2026-10-01T10:00:00Z');
  dbHelper.run(`INSERT INTO mentorado (id, usuario_id, mentor_id, fim_mentoria, dia_corte_semana, consentimento_em) VALUES (?, ?, ?, ?, ?, ?)`, mentTiagoId, tiagoId, mentorId, '2027-04-30', 5, '2026-10-01T10:00:00Z');

  // 3. Edital Concurso CGU
  const editalCguId = 'edital_cgu';
  dbHelper.run(`INSERT INTO edital (id, mentor_id, nome, banca, versao) VALUES (?, ?, ?, ?, ?)`, editalCguId, mentorId, 'Concurso CGU', 'CEBRASPE', 1);

  // 4. Grupos do Edital
  const grBasicasId = 'grp_basicas';
  const grComplId = 'grp_complementares';
  const grEspecId = 'grp_especificas';

  dbHelper.run(`INSERT INTO grupo (id, edital_id, nome, ordem, questoes_prova, peso) VALUES (?, ?, ?, ?, ?, ?)`, grBasicasId, editalCguId, 'Básicas', 1, 40, 1);
  dbHelper.run(`INSERT INTO grupo (id, edital_id, nome, ordem, questoes_prova, peso) VALUES (?, ?, ?, ?, ?, ?)`, grComplId, editalCguId, 'Complementares', 2, 40, 1);
  dbHelper.run(`INSERT INTO grupo (id, edital_id, nome, ordem, questoes_prova, peso) VALUES (?, ?, ?, ?, ?, ?)`, grEspecId, editalCguId, 'Específicas', 3, 90, 2);

  // 5. Disciplinas
  const discEstado = 'disc_estado';
  const discSociedade = 'disc_sociedade';
  const discEtica = 'disc_etica';
  const discAdm = 'disc_adm';

  const discGov = 'disc_governanca';
  const discTransp = 'disc_transparencia';
  const discDirPub = 'disc_dir_publico';
  const discEvid = 'disc_evidencias';
  const discAudit = 'disc_auditoria';

  const discEngSoft = 'disc_eng_soft';
  const discArqSist = 'disc_arq_sist';
  const discPersist = 'disc_persist';
  const discDevSeg = 'disc_dev_seg';

  // Básicas
  dbHelper.run(`INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?)`, discEstado, editalCguId, 'Estado, Democracia, Direitos e Ciência Política', grBasicasId, 'decoreba', 1);
  dbHelper.run(`INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?)`, discSociedade, editalCguId, 'Sociedade brasileira, Desigualdades, Diversidade e Desenvolvimento', grBasicasId, 'decoreba', 2);
  dbHelper.run(`INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?)`, discEtica, editalCguId, 'Ética Pública e Responsabilidade Profissional', grBasicasId, 'decoreba', 3);
  dbHelper.run(`INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?)`, discAdm, editalCguId, 'Administração Pública e Fundamentos de Políticas Públicas', grBasicasId, 'decoreba', 4);

  // Complementares
  dbHelper.run(`INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?)`, discGov, editalCguId, 'Fundamentos de Governança, Riscos, Integridade Pública e Privada', grComplId, 'decoreba', 1);
  dbHelper.run(`INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?)`, discTransp, editalCguId, 'Fundamentos de Transparência, Ouvidoria e Participação Social', grComplId, 'decoreba', 2);
  dbHelper.run(`INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?)`, discDirPub, editalCguId, 'Fundamentos de Direito Público Aplicado, Controle e Responsabilização', grComplId, 'decoreba', 3);
  dbHelper.run(`INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?)`, discEvid, editalCguId, 'Fundamentos de Evidências, Dados e IA', grComplId, 'raciocinio', 4);
  dbHelper.run(`INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?)`, discAudit, editalCguId, 'Fundamentos de Auditoria Governamental e Atuação Integrada da CGU', grComplId, 'decoreba', 5);

  // Específicas
  dbHelper.run(`INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?)`, discEngSoft, editalCguId, 'Engenharia de Software e Programação', grEspecId, 'raciocinio', 1);
  dbHelper.run(`INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?)`, discArqSist, editalCguId, 'Arquitetura e Integração de Sistemas', grEspecId, 'raciocinio', 2);
  dbHelper.run(`INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?)`, discPersist, editalCguId, 'Persistência, Integração e Proteção de Dados', grEspecId, 'raciocinio', 3);
  dbHelper.run(`INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?)`, discDevSeg, editalCguId, 'Desenvolvimento Seguro, Qualidade e Gestão da Entrega', grEspecId, 'raciocinio', 4);

  // 6. Tópicos de "Estado, Democracia..."
  const top1 = 'top_est_1';
  const top1_1 = 'top_est_1_1';
  const top1_1_1 = 'top_est_1_1_1';
  const top1_1_2 = 'top_est_1_1_2';
  const top2 = 'top_est_2';
  const top2_1 = 'top_est_2_1';
  const top2_1_1 = 'top_est_2_1_1';
  const top2_1_2 = 'top_est_2_1_2';
  const top2_1_3 = 'top_est_2_1_3';
  const top3 = 'top_est_3';
  const top3_1 = 'top_est_3_1';
  const top3_1_1 = 'top_est_3_1_1';

  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, top1, discEstado, null, '1', 'Estado e legitimidade.', 1);
  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, top1_1, discEstado, top1, '1.1', 'Estado, governo e administração.', 2);
  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, top1_1_1, discEstado, top1_1, '1.1.1', 'Autoridade, legitimidade e poder.', 3);
  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, top1_1_2, discEstado, top1_1, '1.1.2', 'Interesse público, pluralismo e conflitos distributivos.', 4);

  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, top2, discEstado, null, '2', 'Democracia e representação.', 5);
  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, top2_1, discEstado, top2, '2.1', 'Representação e participação.', 6);
  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, top2_1_1, discEstado, top2_1, '2.1.1', 'Responsabilização democrática.', 7);
  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, top2_1_2, discEstado, top2_1, '2.1.2', 'Relações entre Executivo, Legislativo e Judiciário.', 8);
  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, top2_1_3, discEstado, top2_1, '2.1.3', 'Governabilidade e controles recíprocos.', 9);

  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, top3, discEstado, null, '3', 'Federalismo e capacidades estatais.', 10);
  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, top3_1, discEstado, top3, '3.1', 'Autonomia, coordenação e cooperação federativa.', 11);
  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, top3_1_1, discEstado, top3_1, '3.1.1', 'Capacidades administrativas e políticas.', 12);

  // Tópicos de Transparência
  const topTr4_2 = 'top_tr_4_2';
  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, 'top_tr_1', discTransp, null, '1', 'Acesso à informação.', 1);
  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, 'top_tr_2', discTransp, null, '2', 'Transparência e proteção de dados.', 2);
  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, 'top_tr_4', discTransp, null, '4', 'Participação e melhoria de serviços.', 3);
  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, topTr4_2, discTransp, 'top_tr_4', '4.2', 'Recorrências em manifestações como sinais de problemas.', 4);
  dbHelper.run(`INSERT INTO topico (id, disciplina_id, pai_id, numeracao, texto, ordem) VALUES (?, ?, ?, ?, ?, ?)`, 'top_tr_4_2_1', discTransp, topTr4_2, '4.2.1', 'Subnotificação.', 5);

  // 7. Matrícula da Marina no Concurso CGU
  const matMarinaId = 'mat_marina_cgu';
  dbHelper.run(`INSERT INTO matricula (id, mentorado_id, edital_id, atribuido_em) VALUES (?, ?, ?, ?)`, matMarinaId, mentMarinaId, editalCguId, '2026-10-01T00:00:00Z');

  // Fases das disciplinas da Marina
  dbHelper.run(`INSERT INTO fase_disciplina (id, matricula_id, disciplina_id, fase_atual) VALUES (?, ?, ?, ?)`, 'fase_est', matMarinaId, discEstado, 1);
  dbHelper.run(`INSERT INTO fase_disciplina (id, matricula_id, disciplina_id, fase_atual) VALUES (?, ?, ?, ?)`, 'fase_evid', matMarinaId, discEvid, 1);
  dbHelper.run(`INSERT INTO fase_disciplina (id, matricula_id, disciplina_id, fase_atual) VALUES (?, ?, ?, ?)`, 'fase_transp', matMarinaId, discTransp, 1);
  dbHelper.run(`INSERT INTO fase_disciplina (id, matricula_id, disciplina_id, fase_atual) VALUES (?, ?, ?, ?)`, 'fase_persist', matMarinaId, discPersist, 1);
  dbHelper.run(`INSERT INTO fase_disciplina (id, matricula_id, disciplina_id, fase_atual) VALUES (?, ?, ?, ?)`, 'fase_engsoft', matMarinaId, discEngSoft, 2); // Exemplo de fase 2

  // 8. Ciclo 01 da Marina
  const ciclo01Id = 'ciclo_marina_01';
  dbHelper.run(`INSERT INTO ciclo (id, matricula_id, numero, inicio, duracao_dias, slots_por_dia) VALUES (?, ?, ?, ?, ?, ?)`, ciclo01Id, matMarinaId, 1, '2026-10-09', 30, 3);

  // Slots do Ciclo 01 (intercalando decoreba e raciocínio conforme o mockup)
  const slotDiscs = [
    { id: 'slot_1', dId: discEstado, o: 1 },
    { id: 'slot_2', dId: discEvid, o: 2 },
    { id: 'slot_3', dId: discAudit, o: 3 },
    { id: 'slot_4', dId: discPersist, o: 4 },
    { id: 'slot_5', dId: discTransp, o: 5 },
    { id: 'slot_6', dId: discSociedade, o: 6 },
    { id: 'slot_7', dId: discGov, o: 7 },
    { id: 'slot_8', dId: discDevSeg, o: 8 },
    { id: 'slot_9', dId: discDirPub, o: 9 },
  ];

  for (const s of slotDiscs) {
    dbHelper.run(`INSERT INTO ciclo_slot (id, ciclo_id, disciplina_id, ordem) VALUES (?, ?, ?, ?)`, s.id, ciclo01Id, s.dId, s.o);
  }

  // Rodada 1 com cor Azul-claro (#8EC5FF)
  const rodada1Id = 'rodada_01';
  dbHelper.run(`INSERT INTO rodada (id, ciclo_id, numero, cor) VALUES (?, ?, ?, ?)`, rodada1Id, ciclo01Id, 1, '#8EC5FF');

  // Preenchimentos de Controle para Marina (dias 10, 11, 12 out)
  dbHelper.run(`INSERT INTO controle_celula (id, rodada_id, slot_id, data, cor, feito_em) VALUES (?, ?, ?, ?, ?, ?)`, 'cel_1', rodada1Id, 'slot_1', '2026-10-10', '#8EC5FF', '2026-10-10T11:00:00Z');
  dbHelper.run(`INSERT INTO controle_celula (id, rodada_id, slot_id, data, cor, feito_em) VALUES (?, ?, ?, ?, ?, ?)`, 'cel_2', rodada1Id, 'slot_2', '2026-10-10', '#8EC5FF', '2026-10-10T15:00:00Z');
  dbHelper.run(`INSERT INTO controle_celula (id, rodada_id, slot_id, data, cor, feito_em) VALUES (?, ?, ?, ?, ?, ?)`, 'cel_3', rodada1Id, 'slot_3', '2026-10-10', '#8EC5FF', '2026-10-10T18:00:00Z');
  dbHelper.run(`INSERT INTO controle_celula (id, rodada_id, slot_id, data, cor, feito_em) VALUES (?, ?, ?, ?, ?, ?)`, 'cel_4', rodada1Id, 'slot_4', '2026-10-11', '#8EC5FF', '2026-10-11T10:00:00Z');
  dbHelper.run(`INSERT INTO controle_celula (id, rodada_id, slot_id, data, cor, feito_em) VALUES (?, ?, ?, ?, ?, ?)`, 'cel_5', rodada1Id, 'slot_5', '2026-10-11', '#8EC5FF', '2026-10-11T14:00:00Z');

  // Revisões Noturnas
  dbHelper.run(`INSERT INTO controle_dia (id, mentorado_id, data, revisao_noturna) VALUES (?, ?, ?, ?)`, 'cd_1', mentMarinaId, '2026-10-10', 1);
  dbHelper.run(`INSERT INTO controle_dia (id, mentorado_id, data, revisao_noturna) VALUES (?, ?, ?, ?)`, 'cd_2', mentMarinaId, '2026-10-11', 1);

  // 9. Lançamentos de Questões e Progresso de Tópicos
  dbHelper.run(`INSERT INTO progresso_topico (id, matricula_id, topico_id, fase, inicio, conclusao) VALUES (?, ?, ?, ?, ?, ?)`, 'prg_1', matMarinaId, top1, 1, '2026-10-10', null);
  dbHelper.run(`INSERT INTO progresso_topico (id, matricula_id, topico_id, fase, inicio, conclusao) VALUES (?, ?, ?, ?, ?, ?)`, 'prg_2', matMarinaId, top1_1, 1, '2026-10-10', null);
  dbHelper.run(`INSERT INTO progresso_topico (id, matricula_id, topico_id, fase, inicio, conclusao) VALUES (?, ?, ?, ?, ?, ?)`, 'prg_3', matMarinaId, top1_1_1, 1, '2026-10-10', '2026-10-11');
  dbHelper.run(`INSERT INTO progresso_topico (id, matricula_id, topico_id, fase, inicio, conclusao) VALUES (?, ?, ?, ?, ?, ?)`, 'prg_4', matMarinaId, top1_1_2, 1, '2026-10-10', null);

  // Questões lançadas para Marina
  dbHelper.run(`INSERT INTO lancamento_questao (id, matricula_id, topico_id, fase, data, certas, resolvidas, origem) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    'lq_1', matMarinaId, top1_1_1, 1, '2026-10-10', 5, 5, 'sessao');
  dbHelper.run(`INSERT INTO lancamento_questao (id, matricula_id, topico_id, fase, data, certas, resolvidas, origem) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    'lq_2', matMarinaId, top1_1_2, 1, '2026-10-10', 3, 3, 'sessao');
  dbHelper.run(`INSERT INTO lancamento_questao (id, matricula_id, topico_id, fase, data, certas, resolvidas, origem) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    'lq_3', matMarinaId, top1_1_2, 1, '2026-10-10', 1, 2, 'manual');
  dbHelper.run(`INSERT INTO lancamento_questao (id, matricula_id, topico_id, fase, data, certas, resolvidas, origem) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    'lq_4', matMarinaId, top1_1, 1, '2026-10-10', 4, 5, 'sessao');

  // 10. Auditorias
  dbHelper.run(`INSERT INTO auditoria (id, autor_id, mentorado_id, entidade, campo, valor_anterior, valor_novo, em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    'aud_1', mentorId, mentMarinaId, 'progresso_topico', 'conclusao', '2026-10-10', '2026-10-11', '2026-10-11T17:30:00Z');
  dbHelper.run(`INSERT INTO auditoria (id, autor_id, mentorado_id, entidade, campo, valor_anterior, valor_novo, em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    'aud_2', mentorId, mentMarinaId, 'mentorado', 'duracoes_override', '45/10/5', '40/10/5', '2026-10-09T09:15:00Z');

  console.log('✅ Banco de dados Handshake populado com sucesso!');
}

if (process.argv[1]?.endsWith('seed.ts')) {
  runSeed();
}
