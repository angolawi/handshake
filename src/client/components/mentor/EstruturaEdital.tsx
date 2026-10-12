import React, { useState, useEffect } from 'react';
import {
  Plus,
  Award,
  CheckCircle,
  Scale,
  Trash2,
  Layers,
  BookOpen,
  AlertTriangle,
  X,
  Check,
  ArrowRightLeft,
  ArrowUp,
  ArrowDown,
  FolderInput,
  GripVertical,
} from 'lucide-react';
import { CriarEditalModal } from './CriarEditalModal.js';

interface EstruturaEditalProps {
  editalId?: string;
  onAdicionarDisciplina?: () => void;
  onSelectEdital?: (id: string) => void;
}

export const EstruturaEdital: React.FC<EstruturaEditalProps> = ({
  editalId = 'edital_cgu',
  onAdicionarDisciplina,
  onSelectEdital,
}) => {
  const [loading, setLoading] = useState(true);
  const [currentEditalId, setCurrentEditalId] = useState(editalId);
  const [editaisLista, setEditaisLista] = useState<any[]>([]);
  const [edital, setEdital] = useState<any>(null);
  const [grupos, setGrupos] = useState<any[]>([]);

  // Modal de criação de novo edital
  const [modalCriarAberto, setModalCriarAberto] = useState(false);

  // Modal de remoção de edital
  const [modalRemoverAberto, setModalRemoverAberto] = useState(false);
  const [removendoEdital, setRemovendoEdital] = useState(false);
  const [infoExclusao, setInfoExclusao] = useState<{
    matriculasAtivas: number;
    totalGrupos: number;
    totalDisciplinas: number;
    podeExcluirDireto: boolean;
  } | null>(null);
  const [confirmouForcar, setConfirmouForcar] = useState(false);
  const [erroRemocao, setErroRemocao] = useState<string | null>(null);
  const [removidoSucesso, setRemovidoSucesso] = useState(false);

  // Formulário de novo grupo rápido
  const [novoGrupoNome, setNovoGrupoNome] = useState('');
  const [novoGrupoQuestoes, setNovoGrupoQuestoes] = useState('40');
  const [novoGrupoPeso, setNovoGrupoPeso] = useState('1');
  const [novoGrupoCorte, setNovoGrupoCorte] = useState('15');
  const [salvandoGrupo, setSalvandoGrupo] = useState(false);

  // Estados de Movimentação de Disciplinas entre Grupos
  const [draggedDisc, setDraggedDisc] = useState<{ id: string; nome: string; grupoId: string } | null>(null);
  const [dragOverGrupoId, setDragOverGrupoId] = useState<string | null>(null);
  const [movingDiscId, setMovingDiscId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [menuAbertoDiscId, setMenuAbertoDiscId] = useState<string | null>(null);

  // Modal para mover para novo grupo criado sob demanda
  const [modalNovoGrupoParaDisc, setModalNovoGrupoParaDisc] = useState<{ discId: string; discNome: string } | null>(null);
  const [nomeNovoGrupoMover, setNomeNovoGrupoMover] = useState('');
  const [questoesNovoGrupoMover, setQuestoesNovoGrupoMover] = useState('30');
  const [pesoNovoGrupoMover, setPesoNovoGrupoMover] = useState('1.5');
  const [corteNovoGrupoMover, setCorteNovoGrupoMover] = useState('10');
  const [criandoGrupoMover, setCriandoGrupoMover] = useState(false);

  // Carrega lista de editais
  const fetchEditais = async () => {
    try {
      const res = await fetch('/api/editais');
      const data = await res.json();
      setEditaisLista(data || []);
      return data || [];
    } catch (e) {
      console.error('Erro ao buscar lista de editais:', e);
      return [];
    }
  };

  const fetchEstrutura = (targetId: string) => {
    if (!targetId) {
      setLoading(false);
      setEdital(null);
      setGrupos([]);
      return;
    }

    setLoading(true);
    fetch(`/api/editais/${targetId}/estrutura`)
      .then(res => res.json())
      .then(data => {
        setEdital(data.edital);
        setGrupos(data.grupos || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEditais().then(lista => {
      if (lista.length > 0) {
        const existe = lista.find((e: any) => e.id === editalId);
        const inicial = existe ? editalId : lista[0].id;
        setCurrentEditalId(inicial);
        fetchEstrutura(inicial);
        if (onSelectEdital) onSelectEdital(inicial);
      } else {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (editalId && editalId !== currentEditalId) {
      setCurrentEditalId(editalId);
      fetchEstrutura(editalId);
    }
  }, [editalId]);

  // Fecha o menu de mover ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setMenuAbertoDiscId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleMudarEdital = (newId: string) => {
    setCurrentEditalId(newId);
    fetchEstrutura(newId);
    if (onSelectEdital) onSelectEdital(newId);
  };

  const handleEditalCriado = (novo: any) => {
    fetchEditais();
    if (novo?.id) {
      handleMudarEdital(novo.id);
    }
  };

  // Abre a modal de remoção e consulta dados de impacto
  const handleAbrirModalRemover = async () => {
    if (!currentEditalId) return;
    setErroRemocao(null);
    setConfirmouForcar(false);
    setModalRemoverAberto(true);

    try {
      const res = await fetch(`/api/editais/${currentEditalId}/pode-excluir`);
      const data = await res.json();
      if (res.ok) {
        setInfoExclusao(data);
      } else {
        setInfoExclusao({
          matriculasAtivas: 0,
          totalGrupos: grupos.length,
          totalDisciplinas: grupos.reduce((acc, g) => acc + (g.disciplinas?.length || 0), 0),
          podeExcluirDireto: true,
        });
      }
    } catch (e) {
      console.error(e);
      setInfoExclusao({
        matriculasAtivas: 0,
        totalGrupos: grupos.length,
        totalDisciplinas: grupos.reduce((acc, g) => acc + (g.disciplinas?.length || 0), 0),
        podeExcluirDireto: true,
      });
    }
  };

  // Executa a exclusão definitiva do edital
  const handleConfirmarExclusaoEdital = async () => {
    if (!currentEditalId) return;
    setRemovendoEdital(true);
    setErroRemocao(null);

    try {
      const forcarParam = confirmouForcar ? '?forcar=true' : '';
      const res = await fetch(`/api/editais/${currentEditalId}${forcarParam}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setRemovidoSucesso(true);
        setTimeout(async () => {
          setRemovidoSucesso(false);
          setModalRemoverAberto(false);

          // Atualiza lista de editais
          const novaLista = await fetchEditais();
          if (novaLista.length > 0) {
            handleMudarEdital(novaLista[0].id);
          } else {
            setCurrentEditalId('');
            setEdital(null);
            setGrupos([]);
            if (onSelectEdital) onSelectEdital('');
          }
        }, 1200);
      } else {
        setErroRemocao(data.error || 'Erro ao excluir o edital.');
      }
    } catch (e: any) {
      console.error(e);
      setErroRemocao('Erro de conexão ao excluir o edital.');
    } finally {
      setRemovendoEdital(false);
    }
  };

  const handleCriarGrupo = async () => {
    if (!novoGrupoNome.trim()) {
      alert('Informe o nome do grupo.');
      return;
    }
    setSalvandoGrupo(true);
    try {
      const res = await fetch(`/api/editais/${currentEditalId}/grupos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoGrupoNome.trim(),
          questoes_prova: Number(novoGrupoQuestoes) || 0,
          peso: Number(novoGrupoPeso) || 1.0,
          nota_minima_grupo: Number(novoGrupoCorte) || 0.0,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setNovoGrupoNome('');
        fetchEstrutura(currentEditalId);
      } else {
        alert(data.error || 'Erro ao criar grupo');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao conectar com o servidor');
    } finally {
      setSalvandoGrupo(false);
    }
  };

  // Exibe toast temporário
  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg(prev => (prev === msg ? null : prev));
    }, 4000);
  };

  // Move uma disciplina para um grupo existente
  const handleMoverDisciplina = async (discId: string, targetGrupoId: string, targetGrupoNome: string) => {
    setMovingDiscId(discId);
    setMenuAbertoDiscId(null);
    try {
      const res = await fetch(`/api/disciplinas/${discId}/mover-grupo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novoGrupoId: targetGrupoId }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showFeedback(`Disciplina movida para "${targetGrupoNome}" com sucesso!`);
        fetchEstrutura(currentEditalId);
      } else {
        alert(data.error || 'Erro ao mover disciplina.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao mover disciplina.');
    } finally {
      setMovingDiscId(null);
    }
  };

  // Cria novo grupo e move a disciplina para ele
  const handleCriarGrupoEMover = async () => {
    if (!modalNovoGrupoParaDisc || !nomeNovoGrupoMover.trim()) return;
    setCriandoGrupoMover(true);
    try {
      const res = await fetch(`/api/disciplinas/${modalNovoGrupoParaDisc.discId}/mover-grupo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novoGrupoNome: nomeNovoGrupoMover.trim(),
          novoGrupoQuestoes: Number(questoesNovoGrupoMover) || 0,
          novoGrupoPeso: Number(pesoNovoGrupoMover) || 1.0,
          novoGrupoCorte: Number(corteNovoGrupoMover) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showFeedback(`Novo grupo "${nomeNovoGrupoMover.trim()}" criado e disciplina movida com sucesso!`);
        setModalNovoGrupoParaDisc(null);
        setNomeNovoGrupoMover('');
        fetchEstrutura(currentEditalId);
      } else {
        alert(data.error || 'Erro ao criar grupo e mover disciplina.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao criar grupo.');
    } finally {
      setCriandoGrupoMover(false);
    }
  };

  // Reordena disciplinas dentro do mesmo grupo (subir / descer)
  const handleReordenarNoGrupo = async (grupoId: string, discIndex: number, direcao: 'up' | 'down') => {
    const grupo = grupos.find(g => g.id === grupoId);
    if (!grupo || !grupo.disciplinas) return;

    const discs = [...grupo.disciplinas];
    const targetIndex = direcao === 'up' ? discIndex - 1 : discIndex + 1;
    if (targetIndex < 0 || targetIndex >= discs.length) return;

    const temp = discs[discIndex];
    discs[discIndex] = discs[targetIndex];
    discs[targetIndex] = temp;

    setGrupos(prev =>
      prev.map(g => (g.id === grupoId ? { ...g, disciplinas: discs } : g))
    );

    try {
      await fetch(`/api/grupos/${grupoId}/reordenar-disciplinas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disciplinaIds: discs.map(d => d.id) }),
      });
    } catch (e) {
      console.error('Erro ao reordenar disciplinas no grupo:', e);
      fetchEstrutura(currentEditalId);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1280px] mx-auto">
      {/* Barra Superior de Seleção de Editais */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E3E5F3] shadow-xs">
        <div className="flex items-center gap-3">
          <Layers size={20} className="text-[#4338CA]" />
          <div>
            <div className="text-xs text-[#5B607A] font-medium">Edital Selecionado</div>
            {editaisLista.length > 0 ? (
              <select
                value={currentEditalId}
                onChange={e => handleMudarEdital(e.target.value)}
                className="font-bold text-base text-[#14162B] bg-transparent cursor-pointer outline-hidden hover:text-[#4338CA] transition-colors"
              >
                {editaisLista.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.nome} ({e.banca})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-base text-[#5B607A]">Nenhum edital cadastrado</span>
            )}
          </div>
        </div>

        <button
          onClick={() => setModalCriarAberto(true)}
          className="btn btn-primary h-10 px-4 text-xs flex items-center gap-1.5"
        >
          <Plus size={15} />
          <span>+ Novo Edital</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#5B607A]">Carregando estrutura do edital...</div>
      ) : !edital ? (
        <div className="card p-12 text-center flex flex-col items-center gap-3 border-2 border-dashed border-[#C9CCE3]">
          <Layers size={40} className="text-slate-400" />
          <h2 className="d font-bold text-2xl text-[#14162B]">Nenhum edital disponível</h2>
          <p className="text-sm text-[#5B607A] max-w-md">
            Você não possui nenhum edital cadastrado no momento. Crie um novo edital ou importe via PDF/Texto.
          </p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setModalCriarAberto(true)}
              className="btn btn-primary h-10 px-5 text-xs font-semibold"
            >
              + Criar Novo Edital
            </button>
            {onAdicionarDisciplina && (
              <button
                onClick={onAdicionarDisciplina}
                className="btn border border-indigo-200 text-indigo-700 bg-indigo-50 h-10 px-5 text-xs font-semibold"
              >
                Importar Edital (Parser)
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Cabeçalho do Edital Ativo */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="chip f1 font-bold text-xs uppercase tracking-wider">
                  Banca {edital?.banca || 'CEBRASPE'}
                </span>
                <span
                  className={`chip text-xs font-semibold ${
                    edital?.metodo_cobranca === 'certo_errado' ? 'wn' : 'ok'
                  }`}
                >
                  {edital?.metodo_cobranca === 'certo_errado'
                    ? `Certo/Errado (Penalidade: ${edital?.fator_penalidade || 1.0}x)`
                    : 'Múltipla Escolha (sem anulação)'}
                </span>
                <span className="chip gr text-xs">
                  Pontuação Total: <b>{edital?.pontuacao_total || 120} pts</b>
                </span>
                <span className="chip text-xs border border-[#C9CCE3]">
                  Corte Geral: <b>{edital?.nota_minima_aprovacao || 60} pts</b>
                </span>
              </div>

              <h1 className="d font-bold text-3xl md:text-4xl text-[#14162B] tracking-tight">
                {edital?.nome || 'Concurso CGU'}
              </h1>
              <div className="text-sm text-[#5B607A] mt-1">
                Versão {edital?.versao || 1} · {grupos.length} grupos ·{' '}
                {grupos.reduce((acc, g) => acc + (g.disciplinas?.length || 0), 0)} disciplinas cadastradas
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleAbrirModalRemover}
                className="btn border border-red-200 text-red-700 bg-red-50/70 hover:bg-red-50 hover:border-red-300 h-11 px-4 flex items-center gap-1.5 font-semibold text-xs transition"
                title="Remover este edital e seus grupos"
              >
                <Trash2 size={16} className="text-red-600" />
                <span>Remover Edital</span>
              </button>

              <button
                onClick={onAdicionarDisciplina}
                className="btn btn-primary h-11 flex items-center gap-1.5 font-semibold shadow-sm text-xs"
              >
                <Plus size={16} />
                <span>Importar Edital / Adicionar Disciplina</span>
              </button>
            </div>
          </div>

          {/* Grupos Cadastrados */}
          <div className="flex flex-col gap-6">
            {grupos.map((g, idx) => {
              const isDragTarget = dragOverGrupoId === g.id;

              return (
                <div
                  key={g.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedDisc && draggedDisc.grupoId !== g.id) {
                      setDragOverGrupoId(g.id);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (dragOverGrupoId === g.id) setDragOverGrupoId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedDisc && draggedDisc.grupoId !== g.id) {
                      handleMoverDisciplina(draggedDisc.id, g.id, g.nome);
                    }
                    setDraggedDisc(null);
                    setDragOverGrupoId(null);
                  }}
                  className={`card overflow-hidden transition-all duration-200 ${
                    isDragTarget
                      ? 'border-2 border-[#4338CA] bg-[#F8F9FE] shadow-lg ring-4 ring-indigo-100/70'
                      : ''
                  }`}
                >
                  <div className="p-4 px-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF0F7] bg-[#FAFAFC]">
                    <div className="flex items-center gap-3">
                      <span className="chip f1 text-xs font-bold">P{idx + 1}</span>
                      <h3 className="d font-bold text-xl text-[#14162B]">{g.nome}</h3>
                      <span className="chip gr text-xs font-semibold">
                        {g.questoes_prova} questões · peso {g.peso}
                      </span>
                      {g.nota_minima_grupo > 0 && (
                        <span className="chip text-xs text-[#5B607A]">
                          Mínimo do Bloco: {g.nota_minima_grupo} pts
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Banner de Indicação de Soltura */}
                  {isDragTarget && (
                    <div className="p-2.5 bg-[#EEF2FF] border-b border-[#D8DEF9] text-[#2F2A9E] text-xs font-bold text-center flex items-center justify-center gap-2 animate-pulse">
                      <ArrowDown size={14} className="animate-bounce" />
                      <span>Solte aqui para mover a matéria "{draggedDisc?.nome}" para {g.nome}</span>
                    </div>
                  )}

                  <div className="divide-y divide-[#EEF0F7]">
                    {g.disciplinas?.map((d: any, dIdx: number) => {
                      const isDraggingThis = draggedDisc?.id === d.id;
                      const isMovingThis = movingDiscId === d.id;

                      return (
                        <div
                          key={d.id}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', d.id);
                            setDraggedDisc({ id: d.id, nome: d.nome, grupoId: g.id });
                          }}
                          onDragEnd={() => {
                            setDraggedDisc(null);
                            setDragOverGrupoId(null);
                          }}
                          className={`p-3.5 px-5 flex items-center justify-between transition-colors relative ${
                            isDraggingThis
                              ? 'opacity-30 bg-indigo-50 border-2 border-dashed border-[#4338CA]'
                              : 'hover:bg-[#F9FAFC]'
                          } ${isMovingThis ? 'animate-pulse bg-indigo-50/50' : ''}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Alça de Arraste */}
                            <div
                              className="cursor-grab active:cursor-grabbing text-[#8A8FA8] hover:text-[#4338CA] p-1 rounded hover:bg-slate-100 flex items-center justify-center"
                              title="Clique e arraste para outro grupo"
                            >
                              <GripVertical size={16} />
                            </div>

                            {/* Botões de Reordenação no Grupo */}
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                type="button"
                                disabled={dIdx === 0}
                                onClick={() => handleReordenarNoGrupo(g.id, dIdx, 'up')}
                                className={`p-0.5 rounded transition ${
                                  dIdx === 0
                                    ? 'text-slate-200 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                                }`}
                                title="Subir ordem"
                              >
                                <ArrowUp size={11} />
                              </button>
                              <button
                                type="button"
                                disabled={dIdx === (g.disciplinas?.length || 1) - 1}
                                onClick={() => handleReordenarNoGrupo(g.id, dIdx, 'down')}
                                className={`p-0.5 rounded transition ${
                                  dIdx === (g.disciplinas?.length || 1) - 1
                                    ? 'text-slate-200 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                                }`}
                                title="Descer ordem"
                              >
                                <ArrowDown size={11} />
                              </button>
                            </div>

                            <div className="min-w-0 truncate">
                              <span className="font-semibold text-sm text-[#14162B] mr-2">
                                {d.nome}
                              </span>
                              {d.total_topicos !== undefined && (
                                <span className="text-xs text-[#8A8FA8]">
                                  ({d.total_topicos} tópicos)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {d.questoes_estimadas > 0 && (
                              <span className="text-xs text-[#5B607A] tabular-nums hidden sm:inline">
                                ~{d.questoes_estimadas} questões
                              </span>
                            )}
                            {d.peso !== undefined && d.peso !== g.peso && (
                              <span className="chip text-xs">peso {d.peso}</span>
                            )}
                            <span className={`chip ${d.tipo === 'decoreba' ? 'dec' : 'rac'} text-xs`}>
                              {d.tipo}
                            </span>

                            {/* Botão e Menu Dropdown "Mover" */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuAbertoDiscId(menuAbertoDiscId === d.id ? null : d.id);
                                }}
                                disabled={isMovingThis}
                                className={`btn text-xs h-7 px-2.5 bg-white hover:bg-indigo-50 border border-[#D9DCEB] flex items-center gap-1.5 shadow-2xs transition-colors ${
                                  menuAbertoDiscId === d.id ? 'border-[#4338CA] text-[#4338CA] bg-indigo-50/50' : 'text-[#5B607A]'
                                }`}
                                title="Mover disciplina para outro grupo"
                              >
                                <ArrowRightLeft size={12} className="text-[#4338CA]" />
                                <span className="hidden sm:inline">Mover</span>
                              </button>

                              {menuAbertoDiscId === d.id && (
                                <div
                                  className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-[#D9DCEB] py-2 z-50 text-left animate-in fade-in zoom-in-95 duration-150"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-3 py-1 text-[11px] font-bold text-[#8A8FA8] uppercase tracking-wider border-b border-[#F0F1F5] mb-1">
                                    Mover para outro grupo
                                  </div>

                                  <div className="max-h-48 overflow-y-auto divide-y divide-[#F5F6FA]">
                                    {grupos
                                      .filter(other => other.id !== g.id)
                                      .map(other => (
                                        <button
                                          key={other.id}
                                          type="button"
                                          onClick={() => handleMoverDisciplina(d.id, other.id, other.nome)}
                                          className="w-full text-left px-3 py-2 text-xs hover:bg-[#EEF2FF] hover:text-[#4338CA] flex items-center justify-between transition-colors group"
                                        >
                                          <span className="font-medium text-[#14162B] group-hover:text-[#4338CA] truncate pr-2">
                                            {other.nome}
                                          </span>
                                          <span className="chip gr text-[10px] shrink-0">
                                            peso {other.peso}
                                          </span>
                                        </button>
                                      ))}

                                    {grupos.filter(other => other.id !== g.id).length === 0 && (
                                      <div className="px-3 py-2 text-xs text-[#8A8FA8] italic">
                                        Nenhum outro grupo cadastrado.
                                      </div>
                                    )}
                                  </div>

                                  <div className="pt-1.5 mt-1 border-t border-[#F0F1F5] px-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMenuAbertoDiscId(null);
                                        setModalNovoGrupoParaDisc({ discId: d.id, discNome: d.nome });
                                        setNomeNovoGrupoMover('');
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 text-xs text-[#4338CA] hover:bg-indigo-50 font-semibold rounded-lg flex items-center gap-1.5"
                                    >
                                      <Plus size={13} />
                                      <span>+ Mover para Novo Grupo...</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {(!g.disciplinas || g.disciplinas.length === 0) && (
                      <div
                        className={`p-6 text-center text-xs transition-all ${
                          isDragTarget
                            ? 'bg-indigo-50/70 border-2 border-dashed border-[#4338CA] text-[#2F2A9E] font-bold rounded-xl m-3'
                            : 'text-[#8A8FA8]'
                        }`}
                      >
                        {isDragTarget ? (
                          <div className="flex flex-col items-center gap-1.5 animate-pulse">
                            <FolderInput size={22} className="text-[#4338CA]" />
                            <span>Solte aqui para mover a matéria para este grupo vazio!</span>
                          </div>
                        ) : (
                          'Nenhuma disciplina cadastrada neste grupo ainda. Arraste matérias para cá ou clique em adicionar.'
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-3 px-5 border-t border-[#EEF0F7] bg-[#FDFDFE]">
                    <button
                      onClick={onAdicionarDisciplina}
                      className="text-xs font-semibold text-[#4338CA] hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} />
                      <span>Adicionar disciplina neste grupo</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Card: Criação de Novo Grupo com Persistência */}
            <div className="card border-2 border-dashed border-[#C9CCE3] p-5 flex flex-col gap-3">
              <h3 className="d font-bold text-xl text-[#14162B]">Adicionar novo grupo ao edital</h3>
              <p className="text-xs text-[#5B607A]">
                Os grupos dividem a prova conforme o edital oficial, definindo a quantidade de questões, pesos e notas de corte do bloco.
              </p>

              <div className="flex flex-wrap items-end gap-3 mt-1">
                <div className="flex-2 min-w-[200px]">
                  <label className="lab block mb-1">Nome do grupo</label>
                  <input
                    type="text"
                    placeholder="Ex.: Conhecimentos Especializados"
                    value={novoGrupoNome}
                    onChange={e => setNovoGrupoNome(e.target.value)}
                    className="fld w-full"
                  />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="lab block mb-1">Questões na prova</label>
                  <input
                    type="number"
                    value={novoGrupoQuestoes}
                    onChange={e => setNovoGrupoQuestoes(e.target.value)}
                    className="fld w-full"
                  />
                </div>
                <div className="flex-1 min-w-[80px]">
                  <label className="lab block mb-1">Peso</label>
                  <input
                    type="number"
                    step="0.5"
                    value={novoGrupoPeso}
                    onChange={e => setNovoGrupoPeso(e.target.value)}
                    className="fld w-full"
                  />
                </div>
                <div className="flex-1 min-w-[90px]">
                  <label className="lab block mb-1">Corte Bloco</label>
                  <input
                    type="number"
                    value={novoGrupoCorte}
                    onChange={e => setNovoGrupoCorte(e.target.value)}
                    className="fld w-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCriarGrupo}
                  disabled={salvandoGrupo}
                  className="btn btn-primary h-11 shrink-0 px-5 text-sm"
                >
                  {salvandoGrupo ? 'Salvando...' : 'Criar grupo'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de Confirmação de Exclusão de Edital */}
      {modalRemoverAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between border-b border-[#EEF0F7] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="d font-bold text-xl text-[#14162B]">Remover Edital</h3>
                  <p className="text-xs text-[#5B607A]">
                    {edital?.nome} ({edital?.banca})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalRemoverAberto(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo / Avisos */}
            {removidoSucesso ? (
              <div className="py-8 text-center flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Check size={24} />
                </div>
                <h4 className="font-bold text-base text-[#14162B]">Edital excluído com sucesso!</h4>
                <p className="text-xs text-[#5B607A]">Atualizando painel do mentor...</p>
              </div>
            ) : (
              <>
                <div className="text-xs text-[#5B607A] leading-relaxed flex flex-col gap-3">
                  <p>
                    Tem certeza de que deseja remover este edital? Esta ação excluirá os{' '}
                    <strong>{infoExclusao?.totalGrupos ?? grupos.length} grupos</strong> e as{' '}
                    <strong>
                      {infoExclusao?.totalDisciplinas ??
                        grupos.reduce((acc, g) => acc + (g.disciplinas?.length || 0), 0)}{' '}
                      disciplinas
                    </strong>{' '}
                    cadastradas nele.
                  </p>

                  {infoExclusao && infoExclusao.matriculasAtivas > 0 ? (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-2 text-amber-900">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                        <span>
                          {infoExclusao.matriculasAtivas} mentorado(s) matriculado(s) neste edital!
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-800">
                        A remoção deste edital desvinculará os alunos matriculados e removerá os ciclos de estudos e sessões vinculadas a este edital.
                      </p>
                      <label className="flex items-start gap-2 mt-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={confirmouForcar}
                          onChange={e => setConfirmouForcar(e.target.checked)}
                          className="mt-0.5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                        />
                        <span className="font-semibold text-xs text-red-700">
                          Estou ciente e confirmo a exclusão forçada deste edital e de seus vínculos.
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-[#5B607A]">
                      Nenhum mentorado está atualmente matriculado neste edital. A exclusão é segura e definitiva.
                    </div>
                  )}

                  {erroRemocao && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                      {erroRemocao}
                    </div>
                  )}
                </div>

                {/* Rodapé / Botões */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EEF0F7]">
                  <button
                    onClick={() => setModalRemoverAberto(false)}
                    disabled={removendoEdital}
                    className="btn h-10 px-4 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmarExclusaoEdital}
                    disabled={
                      removendoEdital ||
                      (Boolean(infoExclusao && infoExclusao.matriculasAtivas > 0) && !confirmouForcar)
                    }
                    className="btn h-10 px-4 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 border-0 flex items-center gap-1.5 shadow-sm"
                  >
                    {removendoEdital ? (
                      'Excluindo...'
                    ) : (
                      <>
                        <Trash2 size={14} />
                        <span>Excluir Edital Definitivamente</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Criação de Edital */}
      <CriarEditalModal
        isOpen={modalCriarAberto}
        onClose={() => setModalCriarAberto(false)}
        onEditalCriado={handleEditalCriado}
      />

      {/* Modal: Mover para Novo Grupo Sob Demanda */}
      {modalNovoGrupoParaDisc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-[#EEF0F7] pb-3">
              <div>
                <h3 className="d font-bold text-lg text-[#14162B]">
                  Mover para Novo Grupo
                </h3>
                <p className="text-xs text-[#5B607A] mt-0.5">
                  Criar um novo grupo e transferir <b>{modalNovoGrupoParaDisc.discNome}</b>
                </p>
              </div>
              <button
                onClick={() => setModalNovoGrupoParaDisc(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="lab block mb-1">Nome do Novo Grupo</label>
                <input
                  type="text"
                  value={nomeNovoGrupoMover}
                  onChange={e => setNomeNovoGrupoMover(e.target.value)}
                  placeholder="Ex.: Conhecimentos Especializados"
                  className="fld w-full"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="lab block mb-1 text-[11px]">Questões</label>
                  <input
                    type="number"
                    value={questoesNovoGrupoMover}
                    onChange={e => setQuestoesNovoGrupoMover(e.target.value)}
                    className="fld w-full text-xs"
                  />
                </div>
                <div>
                  <label className="lab block mb-1 text-[11px]">Peso</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pesoNovoGrupoMover}
                    onChange={e => setPesoNovoGrupoMover(e.target.value)}
                    className="fld w-full text-xs"
                  />
                </div>
                <div>
                  <label className="lab block mb-1 text-[11px]">Corte</label>
                  <input
                    type="number"
                    value={corteNovoGrupoMover}
                    onChange={e => setCorteNovoGrupoMover(e.target.value)}
                    className="fld w-full text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EEF0F7]">
              <button
                type="button"
                onClick={() => setModalNovoGrupoParaDisc(null)}
                className="btn btn-outline text-xs h-9 px-4"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCriarGrupoEMover}
                disabled={criandoGrupoMover || !nomeNovoGrupoMover.trim()}
                className="btn btn-primary text-xs h-9 px-4 font-semibold flex items-center gap-1.5"
              >
                {criandoGrupoMover ? (
                  'Criando...'
                ) : (
                  <>
                    <Check size={14} />
                    <span>Criar e Mover</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de Notificação de Sucesso */}
      {feedbackMsg && (
        <div className="fixed bottom-6 right-6 bg-[#14162B] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold z-50 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
