import { describe, it, expect } from 'vitest';
import { calcularPontuacaoLiquida } from '../src/server/services/aggregationService.js';
import { initDb, dbHelper } from '../src/server/db/database.js';

describe('Cálculo de Pontuação Líquida e Métodos de Cobrança (Edital)', () => {
  it('calcula pontuação líquida padrão CEBRASPE (1 errada anula 1 certa)', () => {
    // 120 itens: 100 certos e 20 errados
    const res = calcularPontuacaoLiquida({
      certas: 100,
      resolvidas: 120,
      peso: 1.0,
      metodoCobranca: 'certo_errado',
      fatorPenalidade: 1.0,
    });

    expect(res.certas).toBe(100);
    expect(res.erradas).toBe(20);
    expect(res.pontuacaoBruta).toBe(100);
    expect(res.pontuacaoLiquida).toBe(80); // 100 - 20
    expect(res.taxaAcerto).toBe(83); // 100 / 120 = 83%
    expect(res.aproveitamentoLiquido).toBe(67); // 80 / 120 = 67%
  });

  it('calcula pontuação no modelo FGV / Múltipla Escolha (sem anulação por erro)', () => {
    // 80 questões: 70 certas e 10 erradas
    const res = calcularPontuacaoLiquida({
      certas: 70,
      resolvidas: 80,
      peso: 1.0,
      metodoCobranca: 'multipla_escolha',
      fatorPenalidade: 0.0,
    });

    expect(res.certas).toBe(70);
    expect(res.erradas).toBe(10);
    expect(res.pontuacaoBruta).toBe(70);
    expect(res.pontuacaoLiquida).toBe(70); // Não desconta os erros
    expect(res.taxaAcerto).toBe(88); // 70 / 80 = 87.5% -> 88%
    expect(res.aproveitamentoLiquido).toBe(88);
  });

  it('calcula pontuação com penalidade parcial (ex: 2 erradas anulam 1 certa, fator = 0.5)', () => {
    // 100 questões: 80 certas e 20 erradas com fator 0.5
    const res = calcularPontuacaoLiquida({
      certas: 80,
      resolvidas: 100,
      peso: 1.0,
      metodoCobranca: 'certo_errado',
      fatorPenalidade: 0.5,
    });

    // 80 - (20 * 0.5) = 80 - 10 = 70
    expect(res.pontuacaoLiquida).toBe(70);
    expect(res.aproveitamentoLiquido).toBe(70);
  });

  it('calcula pontuação ponderada com peso maior para o grupo/disciplina', () => {
    // Conhecimentos Específicos com peso 2.0
    // 40 questões: 30 certas e 10 erradas
    const res = calcularPontuacaoLiquida({
      certas: 30,
      resolvidas: 40,
      peso: 2.0,
      metodoCobranca: 'certo_errado',
      fatorPenalidade: 1.0,
    });

    // Certas: 30 * 2 = 60
    // Penalidade: 10 * 2 * 1.0 = 20
    // Líquida: 60 - 20 = 40
    expect(res.pontuacaoBruta).toBe(60);
    expect(res.pontuacaoLiquida).toBe(40);
    expect(res.aproveitamentoLiquido).toBe(50); // 40 / (40 * 2 = 80) = 50%
  });

  it('lida com pontuação líquida negativa quando erros superam acertos', () => {
    const res = calcularPontuacaoLiquida({
      certas: 10,
      resolvidas: 50,
      peso: 1.0,
      metodoCobranca: 'certo_errado',
      fatorPenalidade: 1.0,
    });

    // 10 - 40 = -30
    expect(res.pontuacaoLiquida).toBe(-30);
    expect(res.aproveitamentoLiquido).toBe(0); // Não exibe % negativa de aproveitamento
  });

  it('persiste e recupera edital no banco com regras completas de cobrança e pesos', () => {
    initDb();

    const mentorId = 'usr_mentor_gleyson';
    const editalId = `edital_teste_fgv_${Date.now()}`;

    // 1. Cria edital FGV
    dbHelper.run(
      `INSERT INTO edital (id, mentor_id, nome, banca, versao, metodo_cobranca, fator_penalidade, pontuacao_total, nota_minima_aprovacao)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)`,
      editalId,
      mentorId,
      'Auditor Fiscal - FGV',
      'FGV',
      'multipla_escolha',
      0.0,
      80.0,
      48.0
    );

    // 2. Cria grupos com pesos
    const grp1Id = `grp1_${Date.now()}`;
    const grp2Id = `grp2_${Date.now()}`;

    dbHelper.run(
      `INSERT INTO grupo (id, edital_id, nome, ordem, questoes_prova, peso, nota_minima_grupo)
       VALUES (?, ?, ?, 1, 30, 1.0, 15.0)`,
      grp1Id,
      editalId,
      'Módulo 1 - Básicas'
    );

    dbHelper.run(
      `INSERT INTO grupo (id, edital_id, nome, ordem, questoes_prova, peso, nota_minima_grupo)
       VALUES (?, ?, ?, 2, 50, 2.0, 30.0)`,
      grp2Id,
      editalId,
      'Módulo 2 - Específicas'
    );

    // 3. Cria disciplina com peso e estimativa
    const discId = `disc_test_${Date.now()}`;
    dbHelper.run(
      `INSERT INTO disciplina (id, edital_id, nome, grupo_id, tipo, ordem, peso, questoes_estimadas)
       VALUES (?, ?, ?, ?, 'raciocinio', 1, 2.0, 25)`,
      discId,
      editalId,
      'Direito Tributário',
      grp2Id
    );

    // 4. Consulta e valida
    const editalDb = dbHelper.get(`SELECT * FROM edital WHERE id = ?`, editalId);
    expect(editalDb).toBeDefined();
    expect(editalDb.banca).toBe('FGV');
    expect(editalDb.metodo_cobranca).toBe('multipla_escolha');
    expect(editalDb.fator_penalidade).toBe(0.0);
    expect(editalDb.pontuacao_total).toBe(80.0);
    expect(editalDb.nota_minima_aprovacao).toBe(48.0);

    const gruposDb = dbHelper.all(`SELECT * FROM grupo WHERE edital_id = ? ORDER BY ordem ASC`, editalId);
    expect(gruposDb.length).toBe(2);
    expect(gruposDb[0].peso).toBe(1.0);
    expect(gruposDb[1].peso).toBe(2.0);

    const discDb = dbHelper.get(`SELECT * FROM disciplina WHERE id = ?`, discId);
    expect(discDb.nome).toBe('Direito Tributário');
    expect(discDb.peso).toBe(2.0);
    expect(discDb.questoes_estimadas).toBe(25);
  });
});

