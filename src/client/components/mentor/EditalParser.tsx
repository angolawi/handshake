import React, { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface EditalParserProps {
  editalId?: string;
  onSalvo?: () => void;
}

export const EditalParser: React.FC<EditalParserProps> = ({ editalId = 'edital_cgu', onSalvo }) => {
  const [grupos, setGrupos] = useState<any[]>([]);
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState('');
  const [tipoDisciplina, setTipoDisciplina] = useState<'decoreba' | 'raciocinio'>('decoreba');
  
  // Texto padrão da especificação
  const defaultText = `FUNDAMENTOS DE TRANSPARÊNCIA, OUVIDORIA E PARTICIPAÇÃO SOCIAL: 1 Acesso à informação. 1.1 Transparência ativa e passiva; finalidade de pedidos e recursos; publicidade como regra e motivação das restrições. 1.2 Distinção conceitual entre informação classificada, sigilos previstos em lei, informação pessoal e documento preparatório; acesso parcial e comunicação clara da decisão. 2 Transparência e proteção de dados. 2.1 Compatibilização entre acesso à informação e proteção de dados pessoais; finalidade, necessidade e salvaguardas. 2.2 Diferença entre dados pessoais e dados pessoais sensíveis; noções de tarjamento, anonimização e risco de reidentificação. 3 Ouvidoria e proteção das pessoas. 4 Participação e melhoria de serviços. 4.2 Recorrências em manifestações como sinais de problemas. 4.2.1 Subnotificação. 4.3 Transparência ativa, dados abertos e Portal daTransparência como meios de acesso e controle; qualidade, atualização, cobertura e limites da informação.`;

  const [rawText, setRawText] = useState(defaultText);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [salvoSucesso, setSalvoSucesso] = useState(false);

  // Carrega grupos do edital
  useEffect(() => {
    fetch(`/api/editais/${editalId}/estrutura`)
      .then(res => res.json())
      .then(data => {
        if (data.grupos && data.grupos.length > 0) {
          setGrupos(data.grupos);
          setGrupoSelecionadoId(data.grupos[1]?.id || data.grupos[0]?.id); // Padrão Complementares
        }
      })
      .catch(console.error);
  }, [editalId]);

  // Chama o parser no backend ao alterar o texto
  useEffect(() => {
    if (!rawText.trim()) {
      setParsedData([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch('/api/editais/parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      })
        .then(res => res.json())
        .then(data => {
          setParsedData(data || []);
        })
        .catch(console.error);
    }, 300);

    return () => clearTimeout(timer);
  }, [rawText]);

  // Correção de palavra colada
  const handleCorrigirPalavra = (original: string, sugestao: string) => {
    const updated = rawText.replace(new RegExp(original, 'g'), sugestao);
    setRawText(updated);
  };

  const handleSalvar = async () => {
    if (parsedData.length === 0 || !grupoSelecionadoId) return;
    setSalvando(true);

    const primeira = parsedData[0];
    try {
      const res = await fetch(`/api/editais/${editalId}/salvar-disciplina`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupoId: grupoSelecionadoId,
          nome: primeira.nome || 'Fundamentos de Transparência',
          tipo: tipoDisciplina,
          topicos: primeira.topicos || [],
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSalvoSucesso(true);
        setTimeout(() => {
          setSalvoSucesso(false);
          if (onSalvo) onSalvo();
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
    }
  };

  // Contagem de avisos
  let totalAvisos = 0;
  const countWarnings = (nodes: any[]) => {
    for (const n of nodes) {
      if (n.warnings) totalAvisos += n.warnings.length;
      if (n.filhos) countWarnings(n.filhos);
    }
  };
  if (parsedData.length > 0 && parsedData[0].topicos) {
    countWarnings(parsedData[0].topicos);
  }

  // Renderizador recursivo dos tópicos na pré-visualização
  const renderPreviewNode = (node: any, level: number = 0) => {
    const indent = level === 0 ? 'pl-0' : level === 1 ? 'pl-5' : 'pl-9';
    return (
      <div key={node.numeracao} className="flex flex-col py-1.5 border-b border-[#F0F1F5] last:border-b-0 text-sm">
        <div className={`flex items-baseline gap-2 ${indent} leading-snug`}>
          <b className="min-w-[32px] shrink-0 text-[#14162B]">{node.numeracao}</b>
          <span className="text-[#14162B]">{node.texto}</span>
        </div>

        {/* Alerta de Palavra Colada */}
        {node.warnings?.map((w: any, idx: number) => (
          <div
            key={idx}
            className="ml-8 mt-2 p-2 px-3 rounded-xl bg-[#FFF4D6] border border-[#FFE9B8] text-xs flex flex-wrap items-center justify-between gap-2 text-[#7A4B00]"
          >
            <span>
              Palavra colada: <b>“{w.original}”</b> → <b>“{w.sugestao}”</b>
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => handleCorrigirPalavra(w.original, w.sugestao)}
                className="btn btn-primary h-7 px-2.5 text-xs"
              >
                Corrigir
              </button>
            </div>
          </div>
        ))}

        {node.filhos?.map((child: any) => renderPreviewNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1280px] mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="d font-bold text-3xl md:text-4xl text-[#14162B] tracking-tight">Editar edital</h1>
          <div className="text-base text-[#5B607A] mt-1">
            Concurso CGU · adicionar ou retificar disciplina
          </div>
        </div>

        <div className="flex gap-2">
          {salvoSucesso ? (
            <span className="chip ok py-2 px-4 text-sm font-semibold flex items-center gap-1.5">
              <Check size={16} /> Salvo com sucesso!
            </span>
          ) : (
            <button onClick={handleSalvar} disabled={salvando} className="btn btn-primary h-11">
              {salvando ? 'Salvando...' : 'Salvar disciplina'}
            </button>
          )}
        </div>
      </div>

      {/* Seleção de Grupo e Tipo da Disciplina */}
      <div className="card p-4 px-5 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="lab block mb-1">Grupo do Edital</label>
          <select
            value={grupoSelecionadoId}
            onChange={e => setGrupoSelecionadoId(e.target.value)}
            className="fld"
          >
            {grupos.map(g => (
              <option key={g.id} value={g.id}>
                {g.nome} ({g.questoes_prova} questões · peso {g.peso})
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[240px]">
          <label className="lab block mb-1">Tipo da Disciplina</label>
          <div className="flex border border-[#D9DCEB] rounded-xl overflow-hidden h-11 bg-white">
            <button
              type="button"
              onClick={() => setTipoDisciplina('decoreba')}
              className={`flex-1 font-semibold text-sm transition-colors ${
                tipoDisciplina === 'decoreba'
                  ? 'bg-[#E4E5FB] text-[#2F2A9E]'
                  : 'text-[#5B607A] hover:bg-[#F5F6FA]'
              }`}
            >
              Decoreba
            </button>
            <button
              type="button"
              onClick={() => setTipoDisciplina('raciocinio')}
              className={`flex-1 font-semibold text-sm border-l border-[#D9DCEB] transition-colors ${
                tipoDisciplina === 'raciocinio'
                  ? 'bg-[#FFF2CC] text-[#6B4F00]'
                  : 'text-[#5B607A] hover:bg-[#F5F6FA]'
              }`}
            >
              Raciocínio
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Texto do Edital à esquerda / Pré-visualização à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Coluna Esquerda: Texto Bruto */}
        <div className="card p-5 flex flex-col gap-3 min-h-[460px]">
          <h3 className="d font-bold text-xl text-[#14162B]">Texto do edital</h3>
          <p className="text-xs text-[#5B607A]">
            Cole o conteúdo programático padrão CEBRASPE ou FGV. O sistema identifica automaticamente a hierarquia e palavras coladas.
          </p>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            className="fld flex-1 min-h-[380px] p-3 text-sm leading-relaxed resize-none font-mono"
            placeholder="Ex: FUNDAMENTOS DE TRANSPARÊNCIA: 1 Tópico. 1.1 Subtópico..."
          />
        </div>

        {/* Coluna Direita: Árvore Pré-visualizada */}
        <div className="card p-5 flex flex-col gap-3 min-h-[460px]">
          <div className="flex justify-between items-center">
            <h3 className="d font-bold text-xl text-[#14162B]">Pré-visualização</h3>
            {totalAvisos > 0 ? (
              <span className="chip wn text-xs flex items-center gap-1">
                <AlertCircle size={14} />
                <span>{totalAvisos} {totalAvisos === 1 ? 'aviso para revisar' : 'avisos para revisar'}</span>
              </span>
            ) : (
              <span className="chip ok text-xs">Árvore validada</span>
            )}
          </div>

          {parsedData.length > 0 ? (
            <div className="overflow-y-auto max-h-[440px] pr-2">
              <div className="lab text-[#4338CA] mb-2">{parsedData[0].nome}</div>
              <div className="flex flex-col">
                {parsedData[0].topicos?.map((t: any) => renderPreviewNode(t, 0))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[#8A8FA8]">
              Nenhum tópico identificado. Cole o texto do edital ao lado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
