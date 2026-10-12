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
  idTemp?: string;
  nome: string;
  grupoSugerido?: string;
  tipoSugerido?: 'decoreba' | 'raciocinio';
  topicos: ParsedTopicNode[];
  totalTopicos?: number;
  totalAvisos?: number;
  rawText: string;
}

export interface ParsedFullEditalResult {
  grupos: {
    nome: string;
    disciplinas: ParsedDisciplineResult[];
  }[];
  disciplinas: ParsedDisciplineResult[];
  totalDisciplinas: number;
  totalTopicos: number;
  totalAvisos: number;
}

/**
 * Limpa ruídos comuns em editais copiados de PDF (números de página, cabeçalhos e rodapés repetitivos)
 */
export function cleanEditalNoise(text: string): string {
  if (!text) return '';

  return text
    // Remove "Página X de Y", "Pág. X", "página X" etc.
    .replace(/(?:Página|Pág\.?|página)\s+\d+(?:\s+de\s+\d+)?/gi, '')
    // Remove números de folha como "fls. 12" ou "fl. 5"
    .replace(/\bfls?\.?\s*\d+\b/gi, '')
    // Remove linhas com apenas números (geralmente paginação isolada no rodapé)
    .replace(/^\s*\d+\s*$/gm, '')
    // Remove cabeçalhos repetitivos de bancas (ex: "CEBRASPE – CONCURSO PÚBLICO...")
    .replace(/(?:CEBRASPE|FGV|FCC|VUNESP)\s*[–-]\s*[^.\n]+?(?:\r?\n|$)/gi, '')
    // Normaliza múltiplos espaços
    .replace(/[ \t]+/g, ' ')
    // Normaliza múltiplas quebras de linha
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Detecta palavras coladas como "daTransparência", "eAtuação", "deDireito" etc.
 * Padrão comum em PDFs onde a quebra de linha ou OCR uniu minúscula + maiúscula.
 */
export function detectPastedWords(text: string): { original: string; sugestao: string }[] {
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
 * Heurística para sugerir o tipo da disciplina (raciocínio vs decoreba)
 */
export function inferTipoDisciplina(nome: string): 'decoreba' | 'raciocinio' {
  const raciocinioPattern = /(programação|software|sistemas|dados|computação|raciocínio|estatística|lógica|matemática|contabilidade|arquitetura)/i;
  return raciocinioPattern.test(nome) ? 'raciocinio' : 'decoreba';
}

/**
 * Parser inteligente de edital completo (várias seções e disciplinas no padrão CEBRASPE / FGV)
 */
export function parseFullEdital(input: string): ParsedFullEditalResult {
  if (!input || !input.trim()) {
    return {
      grupos: [],
      disciplinas: [],
      totalDisciplinas: 0,
      totalTopicos: 0,
      totalAvisos: 0,
    };
  }

  // Normaliza quebras de linha
  const raw = input.replace(/\r\n/g, '\n');

  // Identifica cabeçalhos de disciplina:
  // Padrão: [Nome da Disciplina]: 1 [Texto]
  const disciplineHeaderRegex = /([A-Za-zÀ-ÿ0-9\s,\-_/–—\(\)]+?):\s*(?=1(?:\.1)?\s+[A-Za-zÀ-ÿ])/g;

  const matches: { index: number; headerRaw: string; contentStart: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = disciplineHeaderRegex.exec(raw)) !== null) {
    matches.push({
      index: m.index,
      headerRaw: m[1],
      contentStart: disciplineHeaderRegex.lastIndex,
    });
  }

  // Se não encontrou o padrão com múltiplos cabeçalhos, recorre ao parser unitário
  if (matches.length === 0) {
    const singleResults = parseEditalText(input);
    const mappedDisciplines: ParsedDisciplineResult[] = singleResults.map((d, idx) => {
      const topicosCount = countAllTopics(d.topicos);
      const warningsCount = countAllWarnings(d.topicos);
      return {
        idTemp: `temp_disc_${idx + 1}`,
        nome: d.nome,
        grupoSugerido: 'Geral',
        tipoSugerido: inferTipoDisciplina(d.nome),
        topicos: d.topicos,
        totalTopicos: topicosCount,
        totalAvisos: warningsCount,
        rawText: d.rawText,
      };
    });

    return {
      grupos: mappedDisciplines.length > 0 ? [{ nome: 'Geral', disciplinas: mappedDisciplines }] : [],
      disciplinas: mappedDisciplines,
      totalDisciplinas: mappedDisciplines.length,
      totalTopicos: mappedDisciplines.reduce((acc, d) => acc + (d.totalTopicos || 0), 0),
      totalAvisos: mappedDisciplines.reduce((acc, d) => acc + (d.totalAvisos || 0), 0),
    };
  }

  let currentGroup = 'Conhecimentos Básicos';
  const groupMap = new Map<string, ParsedDisciplineResult[]>();
  const allDisciplines: ParsedDisciplineResult[] = [];

  const groupPattern = /(?:(?:[0-9]+(?:\.[0-9]+)*\s+)?(?:CONHECIMENTOS\s+[A-Za-zÀ-ÿ]+|(?:e\s+)?conhecimentos\s+espec[ií]ficos|M[ÓO]DULO\s+[0-9IVXLCDM]+|BLOCO\s+[0-9IVXLCDM]+))/gi;

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];

    const rawContent = next ? raw.slice(cur.contentStart, next.index) : raw.slice(cur.contentStart);
    let headerText = cur.headerRaw.trim();

    // Verifica se antes do nome da matéria há menção a um novo grupo/bloco
    let foundGroup: string | null = null;
    let gMatch: RegExpExecArray | null;
    while ((gMatch = groupPattern.exec(headerText)) !== null) {
      let gName = gMatch[0].trim();
      if (/conhecimentos\s+espec[ií]ficos/i.test(gName)) {
        gName = 'Conhecimentos Específicos';
      } else if (/conhecimentos\s+complementares/i.test(gName)) {
        gName = 'Conhecimentos Complementares';
      } else if (/conhecimentos\s+b[aá]sicos/i.test(gName)) {
        gName = 'Conhecimentos Básicos';
      } else {
        // Remove numeração inicial
        gName = gName.replace(/^[0-9]+(?:\.[0-9]+)*\s+/, '').trim();
      }
      foundGroup = gName;
    }

    if (foundGroup) {
      currentGroup = foundGroup;
      // Remove o texto do grupo do cabeçalho da disciplina
      headerText = headerText.replace(/(?:^|\n).*?CONHECIMENTOS\s+[A-Za-zÀ-ÿ]+/gi, '');
      headerText = headerText.replace(/(?:^|\n).*?(?:e\s+)?conhecimentos\s+espec[ií]ficos/gi, '');
      headerText = headerText.replace(/^[0-9]+(?:\.[0-9]+)*\s+[^\n]*\n?/g, '');
    }

    // Limpa pontuações soltas e linhas em branco no nome da disciplina
    headerText = headerText.replace(/^[\s\n\r\.\-_;]+|[\s\n\r\.\-_;]+$/g, '').trim();
    const lines = headerText.split('\n').map(l => l.trim()).filter(Boolean);
    const discName = lines[lines.length - 1] || `Disciplina ${i + 1}`;

    const topicos = parseTopicsFromText(rawContent.trim());
    const totalTopicos = countAllTopics(topicos);
    const totalAvisos = countAllWarnings(topicos);

    const discResult: ParsedDisciplineResult = {
      idTemp: `disc_temp_${i + 1}`,
      nome: discName,
      grupoSugerido: currentGroup,
      tipoSugerido: inferTipoDisciplina(discName),
      topicos,
      totalTopicos,
      totalAvisos,
      rawText: rawContent.trim(),
    };

    allDisciplines.push(discResult);

    if (!groupMap.has(currentGroup)) {
      groupMap.set(currentGroup, []);
    }
    groupMap.get(currentGroup)!.push(discResult);
  }

  const gruposFormatted = Array.from(groupMap.entries()).map(([nome, disciplinas]) => ({
    nome,
    disciplinas,
  }));

  return {
    grupos: gruposFormatted,
    disciplinas: allDisciplines,
    totalDisciplinas: allDisciplines.length,
    totalTopicos: allDisciplines.reduce((acc, d) => acc + (d.totalTopicos || 0), 0),
    totalAvisos: allDisciplines.reduce((acc, d) => acc + (d.totalAvisos || 0), 0),
  };
}

/**
 * Faz o parsing de texto de edital (compatível com chamadas legadas de disciplina única)
 */
export function parseEditalText(input: string): ParsedDisciplineResult[] {
  if (!input || !input.trim()) return [];

  // Se tiver múltiplos cabeçalhos, utiliza o parseFullEdital
  const disciplineHeaderRegex = /([A-Za-zÀ-ÿ0-9\s,\-_/–—\(\)]+?):\s*(?=1(?:\.1)?\s+[A-Za-zÀ-ÿ])/g;
  const matches = input.match(disciplineHeaderRegex);
  if (matches && matches.length > 1) {
    const full = parseFullEdital(input);
    return full.disciplinas;
  }

  const normalized = input.replace(/\r\n/g, '\n').trim();

  // Verifica se há separação por ":" antes de "1 "
  let nome = 'Disciplina Sem Título';
  let content = normalized;

  const colonMatch = normalized.match(/([A-Za-zÀ-ÿ0-9\s,\-_/–—\(\)]+?):\s*(?=1(?:\.1)?\s+[A-Za-zÀ-ÿ])/);
  if (colonMatch && colonMatch.index !== undefined) {
    nome = colonMatch[1].replace(/^[0-9]+(?:\.[0-9]+)*\s+/, '').trim();
    content = normalized.slice(colonMatch.index + colonMatch[0].length).trim();
  } else {
    const colonIndex = normalized.indexOf(':');
    if (colonIndex > 0 && colonIndex < 100) {
      nome = normalized.slice(0, colonIndex).trim();
      content = normalized.slice(colonIndex + 1).trim();
    } else {
      const firstNumMatch = normalized.match(/\b([0-9]+(?:\.[0-9]+)*)\s+/);
      if (firstNumMatch && firstNumMatch.index !== undefined && firstNumMatch.index > 0) {
        nome = normalized.slice(0, firstNumMatch.index).trim() || 'Disciplina';
        content = normalized.slice(firstNumMatch.index).trim();
      }
    }
  }

  // Limpa nome
  nome = nome.replace(/^[\s\n\r\.\-_;]+|[\s\n\r\.\-_;]+$/g, '').trim();

  const topicos = parseTopicsFromText(content);
  return [
    {
      nome,
      topicos,
      rawText: content,
    },
  ];
}

/**
 * Extrai tópicos e subtópicos preservando hierarquia e excluindo números de artigos/leis
 */
export function parseTopicsFromText(text: string): ParsedTopicNode[] {
  if (!text || !text.trim()) return [];

  // Padrão que identifica tokens de tópicos válidos:
  // Precedidos por início de texto, ponto final ou nova linha
  // Seguidos por número e Letra Maiúscula
  const tokenRegex = /(?:^|\.|\n)\s*([0-9]+(?:\.[0-9]+)*)\s+([A-ZÀ-Ý])/g;

  interface TokenPosition {
    num: string;
    level: number;
    parts: number[];
    startPos: number;
  }

  const validTokens: TokenPosition[] = [];
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    const num = match[1];
    const fullMatch = match[0];
    const numPos = match.index + fullMatch.indexOf(num);

    const parts = num.split('.').map(p => Number(p));
    // Se alguma parte não for número válido
    if (parts.some(n => isNaN(n) || n <= 0)) continue;

    const level = parts.length;

    // Validação de coerência sequencial para descartar números de artigos de leis (ex: '10 da Lei', '18 a 21')
    if (validTokens.length > 0) {
      const prev = validTokens[validTokens.length - 1];
      const prevRoot = prev.parts[0];
      const currentRoot = parts[0];

      // Se for tópico de primeiro nível (ex: 2, 3, 4...)
      if (level === 1) {
        // Tópico raiz deve ser consecutivo ao anterior ou próximo
        if (currentRoot > prevRoot + 2 || currentRoot < prevRoot) {
          // Salto inverossímil (ex: pulou de 3 para 10 ou 18), descarta
          continue;
        }
      } else {
        // Se for subtópico (ex: 3.1, 3.2, 4.2.1)
        // A raiz do subtópico DEVE coincidir com a raiz atual
        if (currentRoot !== prevRoot) {
          continue;
        }
      }
    } else {
      // O primeiro tópico deve ser 1 ou 1.1
      if (parts[0] !== 1) continue;
    }

    validTokens.push({
      num,
      level,
      parts,
      startPos: numPos,
    });
  }

  // Se não encontrou pelo validador rígido, faz fallback para o método flexível
  if (validTokens.length === 0) {
    return fallbackParseTopics(text);
  }

  // Fatiar o texto de cada tópico
  const flatNodes: { numeracao: string; texto: string; level: number }[] = [];

  for (let i = 0; i < validTokens.length; i++) {
    const cur = validTokens[i];
    const next = validTokens[i + 1];

    // O texto começa logo após a numeração
    const textStart = cur.startPos + cur.num.length;
    let nodeText = next ? text.slice(textStart, next.startPos) : text.slice(textStart);

    // Limpa pontuação final solta
    nodeText = nodeText.trim();
    if (nodeText.endsWith('.')) {
      nodeText = nodeText.slice(0, -1).trim();
    }

    flatNodes.push({
      numeracao: cur.num,
      texto: nodeText,
      level: cur.level,
    });
  }

  return buildTreeFromFlatNodes(flatNodes);
}

/**
 * Fallback simples quando o formato não possui pontuação rígida
 */
function fallbackParseTopics(text: string): ParsedTopicNode[] {
  const topicRegex = /(?:^|\s)([0-9]+(?:\.[0-9]+)*)\s+([\s\S]*?)(?=(?:\s[0-9]+(?:\.[0-9]+)*\s)|$)/g;
  const flatNodes: { numeracao: string; texto: string; level: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = topicRegex.exec(text)) !== null) {
    const numeracao = m[1].trim();
    let topicText = m[2].trim();
    if (topicText.endsWith('.')) topicText = topicText.slice(0, -1).trim();
    flatNodes.push({
      numeracao,
      texto: topicText,
      level: numeracao.split('.').length,
    });
  }

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

function countAllTopics(nodes: ParsedTopicNode[]): number {
  let count = 0;
  for (const n of nodes) {
    count++;
    if (n.filhos && n.filhos.length > 0) {
      count += countAllTopics(n.filhos);
    }
  }
  return count;
}

function countAllWarnings(nodes: ParsedTopicNode[]): number {
  let count = 0;
  for (const n of nodes) {
    if (n.warnings) count += n.warnings.length;
    if (n.filhos && n.filhos.length > 0) {
      count += countAllWarnings(n.filhos);
    }
  }
  return count;
}
