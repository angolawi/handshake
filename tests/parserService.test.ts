import { describe, it, expect } from 'vitest';
import { detectPastedWords, autoFixPastedWords, parseEditalText } from '../src/server/services/parserService.js';

describe('parserService', () => {
  it('detecta palavras coladas geradas por PDFs', () => {
    const text = 'Transparência ativa e Portal daTransparência como meios.';
    const detected = detectPastedWords(text);

    expect(detected).toHaveLength(1);
    expect(detected[0].original).toBe('daTransparência');
    expect(detected[0].sugestao).toBe('da Transparência');
  });

  it('corrige automaticamente palavras coladas com autoFixPastedWords', () => {
    const text = 'Portal daTransparência e deDados';
    const fixed = autoFixPastedWords(text);
    expect(fixed).toBe('Portal da Transparência e de Dados');
  });

  it('faz o parse de edital padrão CEBRASPE e gera hierarquia de tópicos', () => {
    const raw = `FUNDAMENTOS DE TRANSPARÊNCIA: 1 Acesso à informação. 1.1 Transparência ativa e passiva. 1.1.1 Pedidos de acesso. 2 Proteção de dados. 2.1 Dados pessoais sensíveis.`;
    const parsed = parseEditalText(raw);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].nome).toBe('FUNDAMENTOS DE TRANSPARÊNCIA');

    const topicos = parsed[0].topicos;
    expect(topicos).toHaveLength(2); // Nós raiz 1 e 2

    // Raiz 1
    expect(topicos[0].numeracao).toBe('1');
    expect(topicos[0].texto).toBe('Acesso à informação');
    expect(topicos[0].filhos).toHaveLength(1); // 1.1

    // Filho 1.1
    expect(topicos[0].filhos[0].numeracao).toBe('1.1');
    expect(topicos[0].filhos[0].texto).toBe('Transparência ativa e passiva');
    expect(topicos[0].filhos[0].filhos).toHaveLength(1); // 1.1.1
    expect(topicos[0].filhos[0].filhos[0].numeracao).toBe('1.1.1');

    // Raiz 2
    expect(topicos[1].numeracao).toBe('2');
    expect(topicos[1].texto).toBe('Proteção de dados');
    expect(topicos[1].filhos).toHaveLength(1); // 2.1
  });

  it('anota warning em nó com palavra colada', () => {
    const raw = `1 Acesso ao Portal daTransparência.`;
    const parsed = parseEditalText(raw);

    expect(parsed[0].topicos[0].warnings).toBeDefined();
    expect(parsed[0].topicos[0].warnings?.[0].original).toBe('daTransparência');
  });
});
