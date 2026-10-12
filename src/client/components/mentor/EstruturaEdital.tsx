import React, { useState, useEffect } from 'react';
import { Plus, Award, CheckCircle, Scale, Trash2, Layers, BookOpen } from 'lucide-react';
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

  // Formulário de novo grupo rápido
  const [novoGrupoNome, setNovoGrupoNome] = useState('');
  const [novoGrupoQuestoes, setNovoGrupoQuestoes] = useState('40');
  const [novoGrupoPeso, setNovoGrupoPeso] = useState('1');
  const [novoGrupoCorte, setNovoGrupoCorte] = useState('15');
  const [salvandoGrupo, setSalvandoGrupo] = useState(false);

  // Carrega lista de editais
  const fetchEditais = async () => {
    try {
      const res = await fetch('/api/editais');
      const data = await res.json();
      setEditaisLista(data || []);
    } catch (e) {
      console.error('Erro ao buscar lista de editais:', e);
    }
  };

  const fetchEstrutura = (targetId: string) => {
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
    fetchEditais();
  }, []);

  useEffect(() => {
    setCurrentEditalId(editalId);
    fetchEstrutura(editalId);
  }, [editalId]);

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

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1280px] mx-auto">
      {/* Barra Superior de Seleção de Editais */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E3E5F3] shadow-xs">
        <div className="flex items-center gap-3">
          <Layers size={20} className="text-[#4338CA]" />
          <div>
            <div className="text-xs text-[#5B607A] font-medium">Edital Selecionado</div>
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

            <div className="flex gap-2">
              <button onClick={onAdicionarDisciplina} className="btn btn-primary h-11 flex items-center gap-1.5">
                <Plus size={16} />
                <span>Adicionar disciplina</span>
              </button>
            </div>
          </div>

          {/* Grupos Cadastrados */}
          <div className="flex flex-col gap-6">
            {grupos.map((g, idx) => (
              <div key={g.id} className="card overflow-hidden">
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

                <div className="divide-y divide-[#EEF0F7]">
                  {g.disciplinas?.map((d: any) => (
                    <div
                      key={d.id}
                      className="p-3.5 px-5 flex items-center justify-between hover:bg-[#F9FAFC] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#8A8FA8] text-xs tracking-widest select-none">⋮⋮</span>
                        <div>
                          <span className="font-semibold text-sm text-[#14162B]">{d.nome}</span>
                          {d.total_topicos !== undefined && (
                            <span className="text-xs text-[#8A8FA8] ml-2">
                              ({d.total_topicos} tópicos)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {d.questoes_estimadas > 0 && (
                          <span className="text-xs text-[#5B607A] tabular-nums">
                            ~{d.questoes_estimadas} questões
                          </span>
                        )}
                        {d.peso !== undefined && d.peso !== g.peso && (
                          <span className="chip text-xs">peso {d.peso}</span>
                        )}
                        <span className={`chip ${d.tipo === 'decoreba' ? 'dec' : 'rac'} text-xs`}>
                          {d.tipo}
                        </span>
                      </div>
                    </div>
                  ))}

                  {(!g.disciplinas || g.disciplinas.length === 0) && (
                    <div className="p-5 text-center text-xs text-[#8A8FA8]">
                      Nenhuma disciplina cadastrada neste grupo ainda.
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
            ))}

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

      {/* Modal de Criação de Edital */}
      <CriarEditalModal
        isOpen={modalCriarAberto}
        onClose={() => setModalCriarAberto(false)}
        onEditalCriado={handleEditalCriado}
      />
    </div>
  );
};
