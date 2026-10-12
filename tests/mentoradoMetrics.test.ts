import { describe, it, expect, beforeEach } from 'vitest';
import { runSeed } from '../src/server/db/seed.js';
import { getMentoradoComprehensiveMetrics } from '../src/server/services/mentoradoMetricsService.js';
import { dbHelper } from '../src/server/db/database.js';

describe('mentoradoMetricsService', () => {
  beforeEach(() => {
    runSeed();
  });

  it('calcula nota líquida Cebraspe e taxa de aproveitamento bruto e líquido', () => {
    const metricas = getMentoradoComprehensiveMetrics('ment_marina');

    expect(metricas.notaLiquida).toBeDefined();
    expect(metricas.notaLiquida.totalCertas).toBeGreaterThan(0);
    expect(metricas.notaLiquida.totalResolvidas).toBeGreaterThan(0);
    expect(metricas.notaLiquida.totalErradas).toBe(
      metricas.notaLiquida.totalResolvidas - metricas.notaLiquida.totalCertas
    );
    expect(metricas.notaLiquida.metodoCobranca).toBe('certo_errado');
    expect(metricas.notaLiquida.fatorPenalidade).toBe(1.0);

    // Nota líquida = certas - (erradas * 1.0)
    const esperadaLiquida =
      metricas.notaLiquida.totalCertas - metricas.notaLiquida.totalErradas * 1.0;
    expect(metricas.notaLiquida.notaLiquida).toBe(Math.max(0, esperadaLiquida));
    expect(metricas.notaLiquida.aproveitamentoBrutoPct).toBeGreaterThan(0);
  });

  it('calcula cobertura do edital e contagem de tópicos folha', () => {
    const metricas = getMentoradoComprehensiveMetrics('ment_marina');

    expect(metricas.coberturaEdital).toBeDefined();
    expect(metricas.coberturaEdital.totalTopicosFolha).toBeGreaterThan(0);
    expect(metricas.coberturaEdital.topicosConcluidos).toBeGreaterThan(0);
    expect(metricas.coberturaEdital.coberturaPct).toBeGreaterThan(0);
    expect(metricas.coberturaEdital.diasAteFimMentoria).toBeGreaterThan(0);
  });

  it('calcula polaridade cognitiva comparando Decoreba e Raciocínio', () => {
    const metricas = getMentoradoComprehensiveMetrics('ment_marina');

    expect(metricas.equilibrioCognitivo).toBeDefined();
    expect(metricas.equilibrioCognitivo.decoreba.totalDisciplinas).toBeGreaterThan(0);
    expect(metricas.equilibrioCognitivo.raciocinio.totalDisciplinas).toBeGreaterThan(0);
    expect(metricas.equilibrioCognitivo.decoreba.questoesResolvidas).toBeGreaterThan(0);
    expect(['equilibrado', 'melhor_decoreba', 'melhor_raciocinio']).toContain(
      metricas.equilibrioCognitivo.polaridadeDominante
    );
  });

  it('calcula estrutura matricial do ciclo e frequência semanal esperada (6 / N)', () => {
    const metricas = getMentoradoComprehensiveMetrics('ment_marina');

    expect(metricas.giroCiclo).toBeDefined();
    expect(metricas.giroCiclo.slotsPorDia).toBe(3);
    expect(metricas.giroCiclo.tamanhoMatriz).toBe('3x3');
    expect(metricas.giroCiclo.diasPorVolta).toBe(3);
    expect(metricas.giroCiclo.voltasPorSemanaEsperadas).toBe(2.0);
  });

  it('calcula taxa de adesão à revisão noturna diária e status de revisão mensal', () => {
    const metricas = getMentoradoComprehensiveMetrics('ment_marina');

    expect(metricas.aderenciaRevisoes).toBeDefined();
    expect(metricas.aderenciaRevisoes.diasComEstudoUltimos30Dias).toBeGreaterThan(0);
    expect(metricas.aderenciaRevisoes.taxaRevisaoNoturnaPct).toBeGreaterThanOrEqual(0);
    expect(typeof metricas.aderenciaRevisoes.revisaoMensalFeita).toBe('boolean');
  });

  it('gera pauta inteligente da reunião semanal com insights pedagógicos', () => {
    const metricas = getMentoradoComprehensiveMetrics('ment_marina');

    expect(Array.isArray(metricas.pautaReuniaoSemanal)).toBe(true);
    // Pelo menos um item de pauta gerado
    expect(metricas.pautaReuniaoSemanal.length).toBeGreaterThan(0);

    for (const item of metricas.pautaReuniaoSemanal) {
      expect(['critico', 'atencao', 'positivo', 'sono_revisao']).toContain(item.tipo);
      expect(item.titulo.length).toBeGreaterThan(0);
      expect(item.descricao.length).toBeGreaterThan(0);
    }
  });

  it('lista disciplinas reais do edital com progresso e acerto individual', () => {
    const metricas = getMentoradoComprehensiveMetrics('ment_marina');

    expect(metricas.disciplinasDetalhadas.length).toBeGreaterThan(0);
    const primeira = metricas.disciplinasDetalhadas[0];
    expect(primeira.id).toBeDefined();
    expect(primeira.nome).toBeDefined();
    expect(primeira.grupoNome).toBeDefined();
    expect(['decoreba', 'raciocinio']).toContain(primeira.tipo);
    expect(primeira.faseAtual).toBeGreaterThanOrEqual(1);
  });
});
