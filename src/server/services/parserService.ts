// Serviço de Parser de Editais CEBRASPE e FGV

export interface ParsedTopicNode {
  numeracao: string;
  texto: string;
  ordem: number;
  warnings?: {
    tipo: 'palavra_colada';
    original: string;
    sugestao: string;
  }[];
  filhos: ParsedTopicNode[];
}

export interface ParsedDisciplineResult {
  nome: string;
  topicos: ParsedTopicNode[];
  rawText: string;
}

/**
 * Detecta palavras coladas como "daTransparência", "eAtuação", "deDireito" etc.
 * Padrão comum em PDFs onde a quebra de linha ou OCR uniu minúscula + maiúscula.
 */
export function detectPastedWords(text: string): { original: string; sugestao: string }[] {
  // Regex que busca palavras completas com transição minúscula -> maiúscula (ex: daTransparência)
  const wordRegex = /\b([a-zà-ÿ]+)([A-ZÀ-Ý][a-zà-ÿA-ZÀ-Ý]*)\b/g;
  const results: { original: string; sugestao: string }[] = [];
  let match;

  while ((match = wordRegex.exec(text)) !== null) {
    results.push({
      original: match[0],
      sugestao: `${match[1]} ${match[2]}`,
    });
  }

  return results;
}

/**
 * Corrige automaticamente palavras coladas no texto
 */
export function autoFixPastedWords(text: string): string {
  return text.replace(/([a-zà-ÿ])([A-ZÀ-Ý])/g, '$1 $2');
}

/**
 * Faz o parsing de texto de edital no padrão:
 * "NOME DA DISCIPLINA: 1 Tópico. 1.1 Subtópico. 1.1.1 Subtópico do subtópico..."
 */
export function parseEditalText(input: string): ParsedDisciplineResult[] {
  if (!input || !input.trim()) return [];

  const results: ParsedDisciplineResult[] = [];
  
  // Normaliza quebras de linha e múltiplos espaços
  const normalized = input.replace(/\r\n/g, '\n').replace(/\n+/g, ' ').trim();

  // Verifica se há separação por "DISCIPLINA:" ou se é uma única disciplina
  // Exemplo: "ESTADO, DEMOCRACIA: 1 Estado... LÍNGUA PORTUGUESA: 1 Compreensão..."
  const disciplineRegex = /([A-ZÀ-Ý0-9\s,\-_/]+?):\s*([0-9]+(?:\.[0-9]+)*\s+[^:]+?)(?=(?:[A-ZÀ-Ý0-9\s,\-_/]+:\s*[0-9]+)|$)/g;
  
  let match: RegExpExecArray | null;
  let hasDisciplines = false;

  while ((match = disciplineRegex.exec(normalized)) !== null) {
    hasDisciplines = true;
    const nome = match[1].trim();
    const content = match[2].trim();
    const topicos = parseTopicsFromText(content);
    results.push({
      nome,
      topicos,
      rawText: content,
    });
  }

  // Se não encontrou o padrão "NOME:", tenta interpretar o texto inteiro como uma disciplina
  if (!hasDisciplines) {
    // Se começar com texto antes de ":" ou de "1 "
    const colonIndex = normalized.indexOf(':');
    let nome = 'Disciplina Sem Título';
    let content = normalized;

    if (colonIndex > 0 && colonIndex < 80) {
      nome = normalized.slice(0, colonIndex).trim();
      content = normalized.slice(colonIndex + 1).trim();
    } else {
      const firstNumMatch = normalized.match(/\b([0-9]+(?:\.[0-9]+)*)\s+/);
      if (firstNumMatch && firstNumMatch.index !== undefined && firstNumMatch.index > 0) {
        nome = normalized.slice(0, firstNumMatch.index).trim() || 'Disciplina';
        content = normalized.slice(firstNumMatch.index).trim();
      }
    }

    const topicos = parseTopicsFromText(content);
    results.push({
      nome,
      topicos,
      rawText: content,
    });
  }

  return results;
}

/**
 * Extrai tópicos e subtópicos preservando hierarquia X -> X.Y -> X.Y.Z
 */
export function parseTopicsFromText(text: string): ParsedTopicNode[] {
  // Regex para capturar numerações como "1 ", "1.1 ", "1.1.2 ", etc.
  // Seguido pelo texto até o próximo número ou fim da string
  const topicRegex = /(?:^|\s)([0-9]+(?:\.[0-9]+)*)\s+([\s\S]*?)(?=(?:\s[0-9]+(?:\.[0-9]+)*\s)|$)/g;
  
  const flatNodes: { numeracao: string; texto: string; level: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = topicRegex.exec(text)) !== null) {
    const numeracao = m[1].trim();
    let topicText = m[2].trim();
    
    // Remove ponto final solto no fim do item
    if (topicText.endsWith('.')) {
      topicText = topicText.slice(0, -1).trim();
    }

    // Nível de profundidade baseado na quantidade de pontos (ex: "1" = 1, "1.1" = 2, "1.1.1" = 3)
    const level = numeracao.split('.').length;

    flatNodes.push({
      numeracao,
      texto: topicText,
      level,
    });
  }

  // Constrói árvore hierárquica
  return buildTreeFromFlatNodes(flatNodes);
}

function buildTreeFromFlatNodes(flatNodes: { numeracao: string; texto: string; level: number }[]): ParsedTopicNode[] {
  const rootNodes: ParsedTopicNode[] = [];
  const stack: { node: ParsedTopicNode; level: number }[] = [];

  let globalOrder = 0;

  for (const item of flatNodes) {
    globalOrder++;
    const warnings = detectPastedWords(item.texto).map(w => ({
      tipo: 'palavra_colada' as const,
      original: w.original,
      sugestao: w.sugestao,
    }));

    const node: ParsedTopicNode = {
      numeracao: item.numeracao,
      texto: item.texto,
      ordem: globalOrder,
      warnings: warnings.length > 0 ? warnings : undefined,
      filhos: [],
    };

    // Ajusta a pilha para o nível pai adequado
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      rootNodes.push(node);
    } else {
      stack[stack.length - 1].node.filhos.push(node);
    }

    stack.push({ node, level: item.level });
  }

  return rootNodes;
}
