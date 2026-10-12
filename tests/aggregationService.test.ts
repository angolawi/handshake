import { describe, it, expect, beforeEach } from 'vitest';
import { aggregateTopicMetrics } from '../src/server/services/aggregationService.js';
import { Topico } from '../src/shared/types.js';

describe('aggregationService', () => {
  it('agrega metricas de folhas para pais corretamente', () => {
    const rootTopic: Topico = {
      id: 'root',
      disciplina_id: 'disc1',
      numeracao: '1',
      texto: 'Tópico Raiz',
      ordem: 1,
      filhos: [
        {
          id: 'child1',
          disciplina_id: 'disc1',
          pai_id: 'root',
          numeracao: '1.1',
          texto: 'Subtópico 1',
          ordem: 2,
          filhos: [],
        },
        {
          id: 'child2',
          disciplina_id: 'disc1',
          pai_id: 'root',
          numeracao: '1.2',
          texto: 'Subtópico 2',
          ordem: 3,
          filhos: [],
        },
      ],
    };

    const metricsMap = new Map<string, { certas: number; resolvidas: number }>();
    metricsMap.set('child1', { certas: 4, resolvidas: 5 }); // 80%
    metricsMap.set('child2', { certas: 6, resolvidas: 10 }); // 60%

    const total = aggregateTopicMetrics(rootTopic, metricsMap);

    expect(total.certas).toBe(10);
    expect(total.resolvidas).toBe(15);
    expect(rootTopic.questoes_certas).toBe(10);
    expect(rootTopic.questoes_resolvidas).toBe(15);
    expect(rootTopic.porcentagem).toBe(67); // 10/15 = 66.67% -> 67%
  });
});
