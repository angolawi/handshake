import React, { useState, useEffect } from 'react';
import { Lock, Check } from 'lucide-react';
import { Topico } from '../../../shared/types.js';

interface DisciplinaTopicosProps {
  matriculaId: string;
  disciplinaId: string;
  isMobile?: boolean;
}

export const DisciplinaTopicos: React.FC<DisciplinaTopicosProps> = ({
  matriculaId,
  disciplinaId,
  isMobile = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [disciplina, setDisciplina] = useState<any>(null);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [topicoSelecionado, setTopicoSelecionado] = useState<Topico | null>(null);

  // Painel de registro de questões
  const [certas, setCertas] = useState('1');
  const [resolvidas, setResolvidas] = useState('2');
  const [dataLancamento, setDataLancamento] = useState(new Date().toISOString().slice(0, 10));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [historicoLancamentos, setHistoricoLancamentos] = useState<any[]>([]);

  const fetchDados = () => {
    fetch(`/api/matriculas/${matriculaId}/disciplinas/${disciplinaId}`)
      .then(res => res.json())
      .then(data => {
        if (data.disciplina) {
          setDisciplina(data.disciplina);
          setTopicos(data.topicos || []);
          // Se nenhum tópico estiver selecionado, seleciona o primeiro nó folha
          if (!topicoSelecionado && data.topicos?.length > 0) {
            findFirstLeaf(data.topicos);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const findFirstLeaf = (nodes: Topico[]) => {
    for (const n of nodes) {
      if (!n.filhos || n.filhos.length === 0) {
        setTopicoSelecionado(n);
        return;
      }
      findFirstLeaf(n.filhos);
    }
  };

  useEffect(() => {
    fetchDados();
  }, [matriculaId, disciplinaId]);

  const handleSalvarLancamento = async () => {
    if (!topicoSelecionado) return;
    const nCertas = Number(certas);
    const nResolvidas = Number(resolvidas);

    if (nCertas > nResolvidas) {
      setErro('Certas não pode superar resolvidas');
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const res = await fetch('/api/questoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matriculaId,
          topicoId: topicoSelecionado.id,
          fase: disciplina?.fase_atual || 1,
          data: dataLancamento,
          certas: nCertas,
          resolvidas: nResolvidas,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.lancamentos) {
          setHistoricoLancamentos(data.lancamentos);
        }
        fetchDados();
      } else {
        setErro(data.error || 'Erro ao salvar');
      }
    } catch (e: any) {
      setErro(e.message || 'Erro de rede');
    } finally {
      setSalvando(false);
    }
  };

  // Renderização recursiva da árvore de tópicos
  const renderTopicRow = (t: Topico, level: number = 0) => {
    const isLeaf = !t.filhos || t.filhos.length === 0;
    const isSelected = topicoSelecionado?.id === t.id;
    const paddingLeft = level === 0 ? 0 : level === 1 ? 18 : 36;
    const hasQuestions = (t.questoes_resolvidas || 0) > 0;

    return (
      <React.Fragment key={t.id}>
        <div
          onClick={() => isLeaf && setTopicoSelecionado(t)}
          className={`tr-row transition-colors ${isLeaf ? 'cursor-pointer hover:bg-[#FFFDF4]' : 'bg-[#FAFAFC]'} ${
            isSelected ? 'outline-2 outline-[#4338CA] -outline-offset-2 bg-[#FFFDF4]' : ''
          }`}
        >
          {/* Título com indentação */}
          <div style={{ paddingLeft: `${paddingLeft}px` }} className="text-sm leading-snug">
            <b className="inline-block min-w-[34px] font-semibold text-[#14162B]">{t.numeracao}</b>
            <span className={isLeaf ? 'text-[#14162B]' : 'font-semibold text-[#14162B]'}>{t.texto}</span>
          </div>

          {/* Início */}
          <div className="text-xs text-[#5B607A] text-center">{t.inicio || '—'}</div>

          {/* Conclusão */}
          <div className="text-xs text-[#5B607A] text-center">{t.conclusao || '—'}</div>

          {/* Questões */}
          <div className="flex items-center justify-end gap-2 text-right">
            {hasQuestions ? (
              <>
                <div className="bar w-10 shrink-0">
                  <i style={{ width: `${t.porcentagem || 0}%` }} />
                </div>
                <span className="text-xs text-[#5B607A] tabular-nums">
                  {t.questoes_certas}/{t.questoes_resolvidas}
                </span>
                <b className="text-xs text-[#17603A] min-w-[32px]">{t.porcentagem}%</b>
              </>
            ) : (
              <span className="text-xs text-[#8A8FA8]">—</span>
            )}
          </div>
        </div>

        {t.filhos?.map(child => renderTopicRow(child, level + 1))}
      </React.Fragment>
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-[#5B607A]">Carregando tópicos da disciplina...</div>;
  }

  const faseAtual = disciplina?.fase_atual || 1;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1280px] mx-auto">
      {/* Cabeçalho da Disciplina */}
      <div>
        <div className="lab">Disciplina · {disciplina?.grupo_nome || 'Básicas'}</div>
        <h1 className="d font-bold text-3xl md:text-4xl text-[#14162B] tracking-tight mt-1">
          {disciplina?.nome}
        </h1>
      </div>

      {/* Abas de Fase com Três Estados (HU-4.3): Atual, Concluída e Futura Bloqueada */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={`h-11 px-5 rounded-full text-[15px] font-semibold transition-colors ${
            faseAtual === 1
              ? 'bg-[#E4E5FB] text-[#2F2A9E]'
              : faseAtual > 1
              ? 'bg-[#CFEBD8] text-[#17603A] flex items-center gap-1.5'
              : 'border border-dashed border-[#C9CCE3] text-[#8A8FA8]'
          }`}
        >
          {faseAtual > 1 && <Check size={16} />}
          <span>Fase 1 {faseAtual === 1 ? '· atual' : '· concluída'}</span>
        </button>

        <button
          disabled={faseAtual < 2}
          className={`h-11 px-5 rounded-full text-[15px] font-semibold transition-colors flex items-center gap-1.5 ${
            faseAtual === 2
              ? 'bg-[#E4E5FB] text-[#2F2A9E]'
              : faseAtual > 2
              ? 'bg-[#CFEBD8] text-[#17603A]'
              : 'border border-dashed border-[#C9CCE3] bg-[#F0F1F5] text-[#8A8FA8] cursor-not-allowed'
          }`}
        >
          {faseAtual < 2 && <Lock size={14} />}
          {faseAtual > 2 && <Check size={16} />}
          <span>Fase 2 {faseAtual === 2 ? '· atual' : ''}</span>
        </button>

        <button
          disabled={faseAtual < 3}
          className={`h-11 px-5 rounded-full text-[15px] font-semibold transition-colors flex items-center gap-1.5 ${
            faseAtual === 3
              ? 'bg-[#E4E5FB] text-[#2F2A9E]'
              : 'border border-dashed border-[#C9CCE3] bg-[#F0F1F5] text-[#8A8FA8] cursor-not-allowed'
          }`}
        >
          {faseAtual < 3 && <Lock size={14} />}
          <span>Fase 3 {faseAtual === 3 ? '· atual' : ''}</span>
        </button>
      </div>
      <div className="text-xs text-[#5B607A] -mt-3">
        As fases seguintes são liberadas quando todos os tópicos forem cumpridos, ou pelo mentor.
      </div>

      {/* Grid Principal: Árvore de Tópicos à esquerda e Painel de Lançamento à direita */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Tabela de Tópicos */}
        <div className="card flex-1 min-w-0 overflow-hidden w-full">
          {/* Cabeçalho da Tabela */}
          <div className="tr-row border-t-0 pt-3.5 pb-2 text-xs font-semibold text-[#5B607A]">
            <div className="lab">Conteúdo</div>
            <div className="text-center">Início</div>
            <div className="text-center">Conclusão</div>
            <div className="text-right">Questões</div>
          </div>

          {/* Faixa da Disciplina (Totalizador) */}
          <div className="tr-row bg-[#D3E3F5] border-t border-[#BCD3EE] py-3 text-xs">
            <div className="font-bold uppercase tracking-wider text-[#1F3F66] truncate">
              {disciplina?.nome}
            </div>
            <div />
            <div />
            <div className="flex items-center justify-end gap-2 text-right">
              <div className="bar w-11">
                <i style={{ width: `${disciplina?.porcentagem || 0}%` }} />
              </div>
              <span className="font-semibold text-[#1F3F66] tabular-nums">
                {disciplina?.total_certas}/{disciplina?.total_resolvidas}
              </span>
              <b className="text-sm text-[#17603A] min-w-[34px]">{disciplina?.porcentagem}%</b>
            </div>
          </div>

          {/* Linhas Hierárquicas */}
          <div className="divide-y divide-[#EEF0F7]">
            {topicos.map(t => renderTopicRow(t, 0))}
          </div>
        </div>

        {/* Painel Lateral de Registro de Questões */}
        {topicoSelecionado && (
          <div className="card w-full lg:w-[340px] shrink-0 p-5 flex flex-col gap-4">
            <div>
              <h3 className="d font-bold text-xl text-[#14162B] tracking-tight">Registrar questões</h3>
              <div className="text-xs text-[#5B607A] mt-1">
                {disciplina?.nome} · Fase {faseAtual}
              </div>
              <div className="text-sm font-semibold text-[#14162B] mt-1 leading-snug">
                {topicoSelecionado.numeracao} {topicoSelecionado.texto}
              </div>
            </div>

            {/* Inputs Certas e Resolvidas */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="lab block mb-1">Certas</label>
                <input
                  type="number"
                  min="0"
                  value={certas}
                  onChange={e => setCertas(e.target.value)}
                  className="fld h-14 text-2xl font-bold text-center tabular-nums"
                />
              </div>
              <div className="flex-1">
                <label className="lab block mb-1">Resolvidas</label>
                <input
                  type="number"
                  min="0"
                  value={resolvidas}
                  onChange={e => setResolvidas(e.target.value)}
                  className="fld h-14 text-2xl font-bold text-center tabular-nums"
                />
              </div>
            </div>

            {/* Pré-visualização da Porcentagem */}
            <div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="d font-bold text-2xl text-[#14162B]">
                  {Number(resolvidas) > 0 ? `${Math.round((Number(certas) / Number(resolvidas)) * 100)}%` : '0%'}
                </span>
                <span className="text-xs text-[#5B607A]">neste lançamento</span>
              </div>
              <div className="bar mt-1.5">
                <i
                  style={{
                    width: `${Number(resolvidas) > 0 ? Math.min(100, Math.round((Number(certas) / Number(resolvidas)) * 100)) : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs text-[#5B607A] block mt-1.5">
                Certas não pode superar resolvidas.
              </span>
            </div>

            {/* Campo de Data */}
            <div>
              <label className="lab block mb-1">Data</label>
              <input
                type="date"
                value={dataLancamento}
                onChange={e => setDataLancamento(e.target.value)}
                className="fld"
              />
            </div>

            {erro && <div className="text-xs text-[#C62828] bg-[#FBDADA] p-2 rounded-lg">{erro}</div>}

            {/* Totais do Tópico */}
            <div className="border-t border-[#EEF0F7] pt-2 flex justify-between items-center text-sm">
              <span className="text-[#5B607A]">Total do tópico</span>
              <span className="font-bold text-[#17603A]">
                {(topicoSelecionado.questoes_certas || 0) + Number(certas)}/
                {(topicoSelecionado.questoes_resolvidas || 0) + Number(resolvidas)}
              </span>
            </div>

            <button
              onClick={handleSalvarLancamento}
              disabled={salvando}
              className="btn btn-primary h-12 w-full justify-center text-base mt-2"
            >
              {salvando ? 'Salvando...' : 'Salvar lançamento'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
