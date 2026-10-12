import React, { useState, useEffect } from 'react';
import {
  Check,
  AlertCircle,
  Sparkles,
  Info,
  ChevronDown,
  ChevronRight,
  Layers,
  BookOpen,
  Trash2,
  Wand2,
  FileText,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { TipoDisciplina } from '../../../shared/types.js';

interface EditalParserProps {
  editalId?: string;
  onSalvo?: () => void;
}

interface ParsedDisciplineState {
  idTemp: string;
  nome: string;
  grupoSugerido: string;
  grupoIdSelecionado: string;
  tipoSugerido: TipoDisciplina;
  topicos: any[];
  totalTopicos: number;
  totalAvisos: number;
  expandido: boolean;
}

export const EditalParser: React.FC<EditalParserProps> = ({ editalId = 'edital_cgu', onSalvo }) => {
  const [grupos, setGrupos] = useState<any[]>([]);
  const [editalNome, setEditalNome] = useState('Concurso CGU');
  const [salvando, setSalvando] = useState(false);
  const [salvoSucesso, setSalvoSucesso] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  const exemploCebraspe = `CONHECIMENTOS BÁSICOS
LÍNGUA PORTUGUESA: 1 Compreensão e interpretação de textos de gêneros variados. 2 Reconhecimento de tipos e gêneros textuais. 3 Domínio da ortografia oficial. 4 Domínio dos mecanismos de coesão textual. 4.1 Emprego de elementos de referenciação, substituição e repetição, de conectores e de outros elementos de sequenciação textual. 4.2 Emprego de tempos e modos verbais. 5 Domínio da estrutura morfossintática do período. 5.1 Emprego das classes de palavras. 5.2 Relações de coordenação entre orações e entre termos da oração. 5.3 Relações de subordinação entre orações e entre termos da oração. 5.4 Emprego dos sinais de pontuação. 5.5 Concordância verbal e nominal. 5.6 Regência verbal e nominal. 5.7 Emprego do sinal indicativo de crase. 5.8 Colocação dos pronomes átonos. 6 Reescrita de frases e parágrafos do texto. 6.1 Significação das palavras. 6.2 Substituição de palavras ou de trechos de texto. 6.3 Reorganização da estrutura de orações e de períodos do texto. 6.4 Reescrita de textos de diferentes gêneros e níveis de formalidade.
DIREITO CONSTITUCIONAL: 1 Constituição da República Federativa do Brasil de 1988. 1.1 Princípios fundamentais. 2 Aplicabilidade das normas constitucionais. 2.1 Normas de eficácia plena, contida e limitada. 2.2 Normas programáticas. 3 Direitos e garantias fundamentais. 3.1 Direitos e deveres individuais e coletivos, direito à vida, à liberdade, à igualdade, à segurança e à propriedade. 3.2 Direitos sociais, nacionalidade, cidadania, direitos políticos, partidos políticos. 4 Organização do Estado. 4.1 Organização político-administrativa da República Federativa do Brasil, Estado federal brasileiro, União, estados, Distrito Federal, municípios e territórios. 5 Administração Pública. 5.1 Disposições gerais, servidores públicos. 6 Organização dos Poderes. 6.1 Poder Executivo, atribuições e responsabilidades do Presidente da República. 6.2 Poder Legislativo, estrutura, funcionamento e atribuições. 6.3 Poder Judiciário, disposições gerais, órgãos do Poder Judiciário. 7 Funções essenciais à Justiça. 7.1 Ministério Público, Advocacia Pública, Defensoria Pública.`;

  const [rawText, setRawText] = useState(exemploCebraspe);
  const [disciplinas, setDisciplinas] = useState<ParsedDisciplineState[]>([]);
  const [gruposDetectados, setGruposDetectados] = useState<string[]>([]);
  const [parseando, setParseando] = useState(false);

  // Seleção e Destino do Edital
  const [editaisLista, setEditaisLista] = useState<any[]>([]);
  const [targetEditalId, setTargetEditalId] = useState<string>(editalId || '');
  const [criarNovoEdital, setCriarNovoEdital] = useState(false);
  const [novoNomeEdital, setNovoNomeEdital] = useState('Concurso CGU');
  const [bancaNova, setBancaNova] = useState('CEBRASPE');

  // Carrega lista de editais e resolve o edital de destino
  useEffect(() => {
    fetch('/api/editais')
      .then(res => res.json())
      .then(lista => {
        const editais = Array.isArray(lista) ? lista : [];
        setEditaisLista(editais);

        if (editais.length === 0) {
          setCriarNovoEdital(true);
          setTargetEditalId('');
        } else {
          const encontrado = editais.find(e => e.id === editalId);
          if (encontrado) {
            setTargetEditalId(encontrado.id);
            setEditalNome(encontrado.nome);
            setCriarNovoEdital(false);
          } else {
            setTargetEditalId(editais[0].id);
            setEditalNome(editais[0].nome);
            setCriarNovoEdital(false);
          }
        }
      })
      .catch(console.error);
  }, [editalId]);

  // Carrega estrutura de grupos existentes quando targetEditalId muda
  useEffect(() => {
    if (!targetEditalId || criarNovoEdital) {
      setGrupos([]);
      return;
    }

    fetch(`/api/editais/${targetEditalId}/estrutura`)
      .then(res => res.json())
      .then(data => {
        if (data.edital) setEditalNome(data.edital.nome);
        if (data.grupos && data.grupos.length > 0) {
          setGrupos(data.grupos);
        } else {
          setGrupos([]);
        }
      })
      .catch(console.error);
  }, [targetEditalId, criarNovoEdital]);

  // Chama o parser no backend ao alterar o texto ou carregar
  useEffect(() => {
    if (!rawText.trim()) {
      setDisciplinas([]);
      setGruposDetectados([]);
      return;
    }

    setParseando(true);
    const timer = setTimeout(() => {
      fetch('/api/editais/parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.disciplinas) {
            const list: ParsedDisciplineState[] = data.disciplinas.map((d: any, idx: number) => {
              // Encontra grupo correspondente no edital se houver
              const matchedGroup = grupos.find(
                g => g.nome.toLowerCase().trim() === (d.grupoSugerido || '').toLowerCase().trim()
              );

              return {
                idTemp: d.idTemp || `disc_${idx + 1}`,
                nome: d.nome,
                grupoSugerido: d.grupoSugerido || 'Conhecimentos Gerais',
                grupoIdSelecionado: matchedGroup?.id || '',
                tipoSugerido: d.tipoSugerido || 'decoreba',
                topicos: d.topicos || [],
                totalTopicos: d.totalTopicos || 0,
                totalAvisos: d.totalAvisos || 0,
                expandido: idx === 0, // Primeiro expandido por padrão
              };
            });

            setDisciplinas(list);
            const nomesGrupos = Array.from(new Set(list.map(d => d.grupoSugerido)));
            setGruposDetectados(nomesGrupos);
          }
        })
        .catch(console.error)
        .finally(() => setParseando(false));
    }, 350);

    return () => clearTimeout(timer);
  }, [rawText, grupos]);

  // Limpeza de Ruídos de PDF
  const handleLimparRuidos = () => {
    fetch('/api/editais/parser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText, cleanNoise: true }),
    })
      .then(res => res.json())
      .then(() => {
        // Aplica regex local de limpeza no textarea
        const cleaned = rawText
          .replace(/(?:Página|Pág\.?|página)\s+\d+(?:\s+de\s+\d+)?/gi, '')
          .replace(/\bfls?\.?\s*\d+\b/gi, '')
          .replace(/^\s*\d+\s*$/gm, '')
          .replace(/(?:CEBRASPE|FGV|FCC|VUNESP)\s*[–-]\s*[^.\n]+?(?:\r?\n|$)/gi, '')
          .replace(/[ \t]+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        setRawText(cleaned);
      })
      .catch(console.error);
  };

  // Autocorreção de palavras coladas
  const handleCorrigirPalavrasColadas = () => {
    const fixed = rawText.replace(/([a-zà-ÿ])([A-ZÀ-Ý])/g, '$1 $2');
    setRawText(fixed);
  };

  // Correção pontual de palavra colada
  const handleCorrigirPalavraPontual = (original: string, sugestao: string) => {
    const updated = rawText.replace(new RegExp(original, 'g'), sugestao);
    setRawText(updated);
  };

  // Alterna expansão de uma disciplina
  const toggleExpand = (idTemp: string) => {
    setDisciplinas(prev =>
      prev.map(d => (d.idTemp === idTemp ? { ...d, expandido: !d.expandido } : d))
    );
  };

  // Atualiza campo de uma disciplina
  const handleUpdateDisciplina = (
    idTemp: string,
    field: keyof ParsedDisciplineState,
    value: any
  ) => {
    setDisciplinas(prev =>
      prev.map(d => (d.idTemp === idTemp ? { ...d, [field]: value } : d))
    );
  };

  // Salva todo o lote no edital
  const handleSalvarEditalCompleto = async () => {
    if (disciplinas.length === 0) return;
    setSalvando(true);

    const payload = {
      novoEditalNome: criarNovoEdital ? novoNomeEdital : undefined,
      banca: criarNovoEdital ? bancaNova : undefined,
      disciplinas: disciplinas.map(d => ({
        nome: d.nome,
        grupoId: d.grupoIdSelecionado || undefined,
        nomeGrupo: d.grupoSugerido,
        tipo: d.tipoSugerido,
        topicos: d.topicos,
      })),
    };

    const targetEndpointId = criarNovoEdital ? 'novo' : (targetEditalId || 'novo');

    try {
      const res = await fetch(`/api/editais/${targetEndpointId}/salvar-lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.ok) {
          setMensagemSucesso(
            `${data.disciplinasCriadas} matérias e ${data.topicosCriados} tópicos importados com sucesso!`
          );
          setSalvoSucesso(true);
          if (data.editalId) {
            setTargetEditalId(data.editalId);
            setCriarNovoEdital(false);
          }
          setTimeout(() => {
            setSalvoSucesso(false);
            if (onSalvo) onSalvo();
          }, 1800);
        } else {
          alert(data.error || 'Erro ao importar disciplinas');
        }
      } else {
        const text = await res.text();
        alert(`Erro retornado pelo servidor (${res.status}): ${text.substring(0, 150)}`);
      }
    } catch (e: any) {
      console.error('Erro na gravação em lote:', e);
      alert(e?.message || 'Erro de conexão ao salvar edital.');
    } finally {
      setSalvando(false);
    }
  };

  const totalTopicosGeral = disciplinas.reduce((acc, d) => acc + d.totalTopicos, 0);
  const totalAvisosGeral = disciplinas.reduce((acc, d) => acc + d.totalAvisos, 0);

  // Renderizador recursivo de nós na árvore
  const renderPreviewNode = (node: any, level: number = 0) => {
    const indent = level === 0 ? 'pl-0' : level === 1 ? 'pl-4' : level === 2 ? 'pl-8' : 'pl-12';
    return (
      <div key={node.numeracao} className="flex flex-col py-1.5 border-b border-[#F0F1F5] last:border-b-0 text-xs">
        <div className={`flex items-baseline gap-2 ${indent} leading-snug`}>
          <span className="min-w-[28px] shrink-0 font-bold text-[#14162B] tabular-nums">
            {node.numeracao}
          </span>
          <span className="text-[#33384F]">{node.texto}</span>
        </div>

        {node.warnings?.map((w: any, idx: number) => (
          <div
            key={idx}
            className="ml-6 mt-1.5 p-1.5 px-2.5 rounded-lg bg-[#FFF4D6] border border-[#FFE9B8] text-[11px] flex flex-wrap items-center justify-between gap-1.5 text-[#7A4B00]"
          >
            <span>
              Palavra colada: <b>“{w.original}”</b> → <b>“{w.sugestao}”</b>
            </span>
            <button
              onClick={() => handleCorrigirPalavraPontual(w.original, w.sugestao)}
              className="btn btn-primary h-6 px-2 text-[10px]"
            >
              Corrigir
            </button>
          </div>
        ))}

        {node.filhos?.map((child: any) => renderPreviewNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1340px] mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="chip f1 text-xs font-bold">Importação Automática</span>
            <span className="text-xs text-[#5B607A]">Padrão CEBRASPE & FGV</span>
          </div>
          <h1 className="d font-bold text-3xl md:text-4xl text-[#14162B] tracking-tight">
            Separador de edital
          </h1>
          <div className="text-base text-[#5B607A] mt-1">
            {editalNome} · cole o conteúdo integral e o sistema separa blocos, matérias e tópicos
          </div>
        </div>

        <div className="flex items-center gap-2">
          {salvoSucesso ? (
            <span className="chip ok py-2.5 px-4 text-sm font-semibold flex items-center gap-1.5 animate-pulse">
              <Check size={16} /> {mensagemSucesso}
            </span>
          ) : (
            <button
              onClick={handleSalvarEditalCompleto}
              disabled={salvando || disciplinas.length === 0}
              className="btn btn-primary h-12 px-6 font-semibold flex items-center gap-2 shadow-sm"
            >
              {salvando ? (
                <>Salvando edital...</>
              ) : (
                <>
                  <Check size={18} />
                  <span>
                    Salvar {disciplinas.length > 0 ? `${disciplinas.length} matérias` : 'edital'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* SELETOR DE EDITAL DE DESTINO */}
      <div className="card p-5 bg-white border border-[#D9DCEB] flex flex-col gap-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-[#14162B] flex items-center gap-2">
              <Layers size={16} className="text-[#4338CA]" />
              Edital de Destino
            </h3>
            <p className="text-xs text-[#5B607A]">
              Selecione o edital que receberá as matérias e tópicos importados ou cadastre um novo edital.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextVal = !criarNovoEdital;
                setCriarNovoEdital(nextVal);
                if (nextVal) {
                  setEditalNome(novoNomeEdital);
                } else {
                  const sel = editaisLista.find(ed => ed.id === targetEditalId);
                  if (sel) setEditalNome(sel.nome);
                }
              }}
              className={`btn text-xs h-8 px-3 ${criarNovoEdital ? 'btn-primary' : 'btn-outline'}`}
            >
              {criarNovoEdital ? 'Usar Edital Existente' : '+ Criar Novo Edital'}
            </button>
          </div>
        </div>

        {criarNovoEdital ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F0F1F5]">
            <div>
              <label className="lab block mb-1 text-[11px]">
                Nome do Novo Edital / Concurso:
              </label>
              <input
                type="text"
                value={novoNomeEdital}
                onChange={e => {
                  setNovoNomeEdital(e.target.value);
                  setEditalNome(e.target.value || 'Novo Edital');
                }}
                placeholder="Ex: Auditor Federal CGU 2026"
                className="fld h-9 text-xs"
              />
            </div>
            <div>
              <label className="lab block mb-1 text-[11px]">
                Banca Examinadora:
              </label>
              <input
                type="text"
                value={bancaNova}
                onChange={e => setBancaNova(e.target.value)}
                placeholder="Ex: CEBRASPE, FGV, FCC"
                className="fld h-9 text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-[#F0F1F5] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="lab shrink-0 text-xs">
              Edital ativo:
            </label>
            <select
              value={targetEditalId}
              onChange={e => {
                const id = e.target.value;
                setTargetEditalId(id);
                const sel = editaisLista.find(ed => ed.id === id);
                if (sel) setEditalNome(sel.nome);
              }}
              className="fld h-9 text-xs flex-1"
            >
              {editaisLista.length === 0 ? (
                <option value="">Nenhum edital cadastrado</option>
              ) : (
                editaisLista.map(ed => (
                  <option key={ed.id} value={ed.id}>
                    {ed.nome} {ed.banca ? `(${ed.banca})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        )}
      </div>

      {/* BANNER DE RECOMENDAÇÕES E ORIENTAÇÕES DE OURO */}
      <div className="card p-5 bg-gradient-to-r from-[#F7F8FE] via-[#FFFFFF] to-[#F5F8FF] border border-[#D9DCEB] flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[#2F2A9E]">
          <Sparkles size={18} className="text-[#4338CA]" />
          <h3 className="font-bold text-base text-[#14162B]">
            Orientações de Ouro para Cópia e Extração Perfeita
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Dica 1: Tratamento Mínimo */}
          <div className="p-3.5 rounded-xl bg-white border border-[#E2E5F1] flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-[#EFEFFD] text-[#4338CA] flex items-center justify-center shrink-0 mt-0.5">
              <FileText size={16} />
            </div>
            <div className="flex-1 text-xs">
              <b className="text-[#14162B] block mb-1">
                1. Tratamento Mínimo Recomendado
              </b>
              <p className="text-[#5B607A] leading-relaxed">
                Ao copiar de arquivos PDF, remova <b>números de página</b> (ex: <i>"Página 12 de 45"</i>), 
                cabeçalhos institucionais e rodapés repetidos, pois eles cortam frases e quebram a árvore de tópicos.
              </p>
            </div>
          </div>

          {/* Card Dica 2: Versão VLibras / Acessível Cebraspe */}
          <div className="p-3.5 rounded-xl bg-white border border-[#D1E7DD] flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] text-[#1E7E34] flex items-center justify-center shrink-0 mt-0.5">
              <HelpCircle size={16} />
            </div>
            <div className="flex-1 text-xs">
              <b className="text-[#0F5132] block mb-1">
                2. Dica de Ouro CEBRASPE: Versão VLibras / Acessível
              </b>
              <p className="text-[#5B607A] leading-relaxed">
                Em editais da banca <b>CEBRASPE</b>, copie preferencialmente da <b>versão em texto / VLibras</b> 
                disponível na página do concurso. Ela não possui colunas divididas, vem em fluxo linear contínuo 
                e sem cabeçalhos quebrados.
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Ações Rápidas de Limpeza */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#EDEFF6]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLimparRuidos}
              className="btn btn-secondary h-8 px-3 text-xs flex items-center gap-1.5"
              title="Remove automaticamente números de página e cabeçalhos comuns detectados"
            >
              <Wand2 size={13} className="text-[#4338CA]" />
              <span>Limpar Ruídos Comuns</span>
            </button>

            <button
              onClick={handleCorrigirPalavrasColadas}
              className="btn btn-secondary h-8 px-3 text-xs flex items-center gap-1.5"
              title="Corrige palavras com minúscula+maiúscula unidas por OCR (ex: daTransparência -> da Transparência)"
            >
              <Sparkles size={13} className="text-[#92400E]" />
              <span>Corrigir Palavras Coladas</span>
            </button>

            <button
              onClick={() => setRawText(exemploCebraspe)}
              className="btn btn-secondary h-8 px-3 text-xs flex items-center gap-1.5 text-[#2F2A9E]"
            >
              <span>Carregar Exemplo CEBRASPE</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#5B607A]">
            <span>Caracteres: <b>{rawText.length.toLocaleString()}</b></span>
            <span>·</span>
            <span>Linhas: <b>{rawText.split('\n').length}</b></span>
            <button
              onClick={() => setRawText('')}
              className="text-[#D32F2F] hover:underline ml-2 flex items-center gap-1"
            >
              <Trash2 size={12} /> Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Texto do Edital à esquerda / Dashboard de Matérias à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Texto Bruto (5 colunas) */}
        <div className="lg:col-span-5 card p-5 flex flex-col gap-3 min-h-[560px]">
          <div className="flex justify-between items-center">
            <h3 className="d font-bold text-lg text-[#14162B]">Texto integral do edital</h3>
            {parseando && (
              <span className="text-xs text-[#4338CA] animate-pulse flex items-center gap-1">
                <Sparkles size={12} /> Processando...
              </span>
            )}
          </div>
          <p className="text-xs text-[#5B607A]">
            Cole o edital completo. O motor detecta automaticamente grupos, disciplinas iniciadas por dois pontos (ex: <i>DISCIPLINA: 1 Tópico...</i>) e toda a hierarquia numérica.
          </p>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            className="fld flex-1 min-h-[460px] p-3 text-xs leading-relaxed resize-none font-mono"
            placeholder="Cole o edital aqui..."
          />
        </div>

        {/* Coluna Direita: Dashboard Estruturado de Matérias (7 colunas) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Card de Resumo das Descobertas */}
          <div className="card p-4 px-5 bg-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFEFFD] text-[#4338CA] flex items-center justify-center font-bold text-base">
                {disciplinas.length}
              </div>
              <div>
                <b className="text-sm text-[#14162B] block">
                  {disciplinas.length === 1 ? '1 matéria detectada' : `${disciplinas.length} matérias detectadas`}
                </b>
                <span className="text-xs text-[#5B607A]">
                  Distribuídas em {gruposDetectados.length} grupos · {totalTopicosGeral} tópicos e subtópicos
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {totalAvisosGeral > 0 ? (
                <span className="chip wn text-xs flex items-center gap-1">
                  <AlertCircle size={14} />
                  <span>{totalAvisosGeral} avisos de OCR</span>
                </span>
              ) : (
                <span className="chip ok text-xs flex items-center gap-1">
                  <Check size={14} />
                  <span>Texto validado</span>
                </span>
              )}
            </div>
          </div>

          {/* Lista de Disciplinas por Grupo */}
          <div className="flex flex-col gap-3">
            {disciplinas.length === 0 ? (
              <div className="card p-12 text-center text-sm text-[#8A8FA8] flex flex-col items-center gap-3">
                <BookOpen size={32} className="text-[#C9CCE3]" />
                <p>Nenhuma disciplina identificada ainda. Cole o conteúdo do edital ao lado.</p>
              </div>
            ) : (
              disciplinas.map((disc, idx) => (
                <div
                  key={disc.idTemp}
                  className="card overflow-hidden border border-[#D9DCEB] transition-all hover:border-[#B5BAE0]"
                >
                  {/* Cabeçalho da Disciplina */}
                  <div
                    className="p-3.5 px-4 bg-[#FAFAFC] border-b border-[#EDEFF6] flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
                    onClick={() => toggleExpand(disc.idTemp)}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-[220px]">
                      <button
                        type="button"
                        className="text-[#5B607A] hover:text-[#14162B] p-0.5"
                      >
                        {disc.expandido ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                      <span className="chip f1 text-[11px] font-bold">#{idx + 1}</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-[#14162B]">
                          {disc.nome}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-[#5B607A] mt-0.5">
                          <span className="chip gr text-[10px]">{disc.grupoSugerido}</span>
                          <span>·</span>
                          <span>{disc.totalTopicos} tópicos</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <span
                        className={`chip text-xs font-semibold ${
                          disc.tipoSugerido === 'raciocinio' ? 'rac' : 'dec'
                        }`}
                      >
                        {disc.tipoSugerido === 'raciocinio' ? 'Raciocínio' : 'Decoreba'}
                      </span>

                      {disc.totalAvisos > 0 && (
                        <span className="chip wn text-xs">
                          {disc.totalAvisos} aviso(s)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Corpo Expansível da Disciplina */}
                  {disc.expandido && (
                    <div className="p-4 bg-white flex flex-col gap-4">
                      {/* Configurações Rápidas da Disciplina */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-[#F8F9FD] rounded-xl border border-[#EDEFF6]">
                        {/* Nome Editável */}
                        <div className="md:col-span-1">
                          <label className="lab block mb-1 text-[11px]">Nome da Matéria</label>
                          <input
                            type="text"
                            value={disc.nome}
                            onChange={e =>
                              handleUpdateDisciplina(disc.idTemp, 'nome', e.target.value)
                            }
                            className="fld h-9 text-xs"
                          />
                        </div>

                        {/* Grupo Destino */}
                        <div className="md:col-span-1">
                          <label className="lab block mb-1 text-[11px]">Grupo do Edital</label>
                          <select
                            value={disc.grupoIdSelecionado}
                            onChange={e =>
                              handleUpdateDisciplina(disc.idTemp, 'grupoIdSelecionado', e.target.value)
                            }
                            className="fld h-9 text-xs"
                          >
                            <option value="">
                              + Criar grupo "{disc.grupoSugerido}"
                            </option>
                            {grupos.map(g => (
                              <option key={g.id} value={g.id}>
                                {g.nome} (peso {g.peso})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Tipo Cognitivo */}
                        <div className="md:col-span-1">
                          <label className="lab block mb-1 text-[11px]">Tipo da Matéria</label>
                          <div className="flex border border-[#D9DCEB] rounded-xl overflow-hidden h-9 bg-white">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateDisciplina(disc.idTemp, 'tipoSugerido', 'decoreba')
                              }
                              className={`flex-1 font-semibold text-xs transition-colors ${
                                disc.tipoSugerido === 'decoreba'
                                  ? 'bg-[#E4E5FB] text-[#2F2A9E]'
                                  : 'text-[#5B607A] hover:bg-[#F5F6FA]'
                              }`}
                            >
                              Decoreba
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateDisciplina(disc.idTemp, 'tipoSugerido', 'raciocinio')
                              }
                              className={`flex-1 font-semibold text-xs border-l border-[#D9DCEB] transition-colors ${
                                disc.tipoSugerido === 'raciocinio'
                                  ? 'bg-[#FFF2CC] text-[#6B4F00]'
                                  : 'text-[#5B607A] hover:bg-[#F5F6FA]'
                              }`}
                            >
                              Raciocínio
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Árvore de Tópicos e Subtópicos */}
                      <div className="border border-[#F0F1F5] rounded-xl p-3 bg-white max-h-[300px] overflow-y-auto">
                        <div className="text-[11px] font-bold text-[#4338CA] uppercase tracking-wider mb-2">
                          Estrutura de Tópicos e Subtópicos ({disc.topicos.length} raízes · {disc.totalTopicos} itens)
                        </div>
                        <div className="flex flex-col">
                          {disc.topicos.map((topico: any) => renderPreviewNode(topico, 0))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Botão de Ação Inferior */}
          {disciplinas.length > 0 && (
            <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F8F9FD] border border-[#D9DCEB]">
              <div className="text-xs text-[#5B607A]">
                Pronto para importar <b>{disciplinas.length} matérias</b> e{' '}
                <b>{totalTopicosGeral} tópicos</b> no edital <b>{editalNome}</b>.
              </div>
              <button
                onClick={handleSalvarEditalCompleto}
                disabled={salvando}
                className="btn btn-primary h-11 px-6 font-semibold flex items-center gap-2 shrink-0"
              >
                {salvando ? (
                  <>Importando dados...</>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Importar Todas as {disciplinas.length} Disciplinas</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
