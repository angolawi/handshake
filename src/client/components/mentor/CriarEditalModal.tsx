import React, { useState } from 'react';
import { X, Plus, Trash2, Check, HelpCircle, Layers, BookOpen, Award, ShieldAlert } from 'lucide-react';
import { MetodoCobranca, TipoDisciplina } from '../../../shared/types.js';

interface GrupoForm {
  id: string;
  nome: string;
  peso: number;
  questoes_prova: number;
  nota_minima_grupo: number;
  disciplinas: {
    id: string;
    nome: string;
    tipo: TipoDisciplina;
    peso: number;
    questoes_estimadas: number;
  }[];
}

interface CriarEditalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditalCriado: (edital: any) => void;
}

export const CriarEditalModal: React.FC<CriarEditalModalProps> = ({ isOpen, onClose, onEditalCriado }) => {
  const [nome, setNome] = useState('');
  const [banca, setBanca] = useState('CEBRASPE');
  const [bancaCustom, setBancaCustom] = useState('');
  const [metodoCobranca, setMetodoCobranca] = useState<MetodoCobranca>('certo_errado');
  const [fatorPenalidade, setFatorPenalidade] = useState('1.0');
  const [pontuacaoTotal, setPontuacaoTotal] = useState('120');
  const [notaMinimaAprovacao, setNotaMinimaAprovacao] = useState('60');

  // Grupos e disciplinas dinâmicos
  const [grupos, setGrupos] = useState<GrupoForm[]>([
    {
      id: 'grp_1',
      nome: 'Conhecimentos Básicos',
      peso: 1.0,
      questoes_prova: 50,
      nota_minima_grupo: 15,
      disciplinas: [
        { id: 'd_1', nome: 'Língua Portuguesa', tipo: 'raciocinio', peso: 1.0, questoes_estimadas: 15 },
        { id: 'd_2', nome: 'Direito Constitucional', tipo: 'decoreba', peso: 1.0, questoes_estimadas: 10 },
      ],
    },
    {
      id: 'grp_2',
      nome: 'Conhecimentos Específicos',
      peso: 2.0,
      questoes_prova: 70,
      nota_minima_grupo: 35,
      disciplinas: [
        { id: 'd_3', nome: 'Auditoria Governamental', tipo: 'decoreba', peso: 2.0, questoes_estimadas: 25 },
        { id: 'd_4', nome: 'Contabilidade Pública', tipo: 'raciocinio', peso: 2.0, questoes_estimadas: 20 },
      ],
    },
  ]);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const bancasPredefinidas = ['CEBRASPE', 'FGV', 'FCC', 'VUNESP', 'CESGRANRIO', 'Outra'];

  const handleBancaSelect = (selectedBanca: string) => {
    setBanca(selectedBanca);
    if (selectedBanca === 'CEBRASPE') {
      setMetodoCobranca('certo_errado');
      setFatorPenalidade('1.0');
      setPontuacaoTotal('120');
      setNotaMinimaAprovacao('60');
    } else if (['FGV', 'FCC', 'VUNESP', 'CESGRANRIO'].includes(selectedBanca)) {
      setMetodoCobranca('multipla_escolha');
      setFatorPenalidade('0.0');
      setPontuacaoTotal('80');
      setNotaMinimaAprovacao('48');
    }
  };

  const handleAddGrupo = () => {
    const newId = `grp_${Date.now()}`;
    setGrupos([
      ...grupos,
      {
        id: newId,
        nome: `Grupo ${grupos.length + 1}`,
        peso: 1.0,
        questoes_prova: 30,
        nota_minima_grupo: 10,
        disciplinas: [],
      },
    ]);
  };

  const handleRemoveGrupo = (gId: string) => {
    if (grupos.length <= 1) {
      alert('O edital deve conter pelo menos 1 grupo.');
      return;
    }
    setGrupos(grupos.filter(g => g.id !== gId));
  };

  const handleUpdateGrupo = (gId: string, field: keyof GrupoForm, val: any) => {
    setGrupos(grupos.map(g => (g.id === gId ? { ...g, [field]: val } : g)));
  };

  const handleAddDisciplina = (gId: string) => {
    setGrupos(
      grupos.map(g => {
        if (g.id !== gId) return g;
        const newDisc = {
          id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          nome: '',
          tipo: 'decoreba' as TipoDisciplina,
          peso: g.peso,
          questoes_estimadas: 10,
        };
        return { ...g, disciplinas: [...g.disciplinas, newDisc] };
      })
    );
  };

  const handleUpdateDisciplina = (gId: string, dId: string, field: string, val: any) => {
    setGrupos(
      grupos.map(g => {
        if (g.id !== gId) return g;
        return {
          ...g,
          disciplinas: g.disciplinas.map(d => (d.id === dId ? { ...d, [field]: val } : d)),
        };
      })
    );
  };

  const handleRemoveDisciplina = (gId: string, dId: string) => {
    setGrupos(
      grupos.map(g => {
        if (g.id !== gId) return g;
        return { ...g, disciplinas: g.disciplinas.filter(d => d.id !== dId) };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Por favor, informe o nome do edital / concurso.');
      return;
    }

    const bancaFinal = banca === 'Outra' ? (bancaCustom.trim() || 'Outra') : banca;
    setSalvando(true);
    setErro(null);

    try {
      const res = await fetch('/api/editais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          banca: bancaFinal,
          metodo_cobranca: metodoCobranca,
          fator_penalidade: metodoCobranca === 'certo_errado' ? Number(fatorPenalidade) || 1.0 : 0.0,
          pontuacao_total: Number(pontuacaoTotal) || 120,
          nota_minima_aprovacao: Number(notaMinimaAprovacao) || 60,
          mentorId: 'usr_mentor_gleyson',
          grupos: grupos.map((g, idx) => ({
            nome: g.nome.trim() || `Grupo ${idx + 1}`,
            ordem: idx + 1,
            peso: Number(g.peso) || 1.0,
            questoes_prova: Number(g.questoes_prova) || 0,
            nota_minima_grupo: Number(g.nota_minima_grupo) || 0,
            disciplinas: g.disciplinas
              .filter(d => d.nome.trim().length > 0)
              .map((d, dIdx) => ({
                nome: d.nome.trim(),
                tipo: d.tipo,
                ordem: dIdx + 1,
                peso: Number(d.peso) || Number(g.peso) || 1.0,
                questoes_estimadas: Number(d.questoes_estimadas) || 0,
              })),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao criar edital');
      }

      onEditalCriado(data.edital);
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Falha na comunicação com o servidor');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#D9DCEB] w-full max-w-3xl max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho do Modal */}
        <div className="p-6 border-b border-[#EEF0F7] flex items-center justify-between bg-[#FAFAFC]">
          <div>
            <div className="lab flex items-center gap-1.5 text-[#4338CA]">
              <Layers size={14} />
              <span>Novo Edital de Concurso</span>
            </div>
            <h2 className="d font-bold text-2xl text-[#14162B] mt-0.5">Criar e Configurar Edital</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#5B607A] hover:bg-[#EEF0F7] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {erro && (
            <div className="p-4 rounded-xl bg-[#FDE8E8] text-[#9B1C1C] text-sm flex items-center gap-2">
              <ShieldAlert size={18} className="shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* Seção 1: Identificação Básica */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-base text-[#14162B] flex items-center gap-2">
              <BookOpen size={16} className="text-[#4338CA]" />
              <span>1. Identificação do Concurso & Banca</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="lab block mb-1.5">Nome do Cargo / Concurso *</label>
                <input
                  type="text"
                  placeholder="Ex: Auditor-Fiscal da Receita Federal"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="fld w-full"
                  required
                />
              </div>

              <div>
                <label className="lab block mb-1.5">Banca Examinadora</label>
                <div className="flex flex-wrap gap-1.5">
                  {bancasPredefinidas.map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleBancaSelect(b)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        banca === b
                          ? 'bg-[#14162B] text-white shadow-xs'
                          : 'bg-[#F2F3F9] text-[#5B607A] hover:bg-[#E5E7F2]'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                {banca === 'Outra' && (
                  <input
                    type="text"
                    placeholder="Nome da banca..."
                    value={bancaCustom}
                    onChange={e => setBancaCustom(e.target.value)}
                    className="fld w-full mt-2 text-xs"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Seção 2: Método de Cobrança & Pontuação */}
          <div className="flex flex-col gap-4 p-4 rounded-xl bg-[#F8F9FD] border border-[#EEF0F7]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#14162B] flex items-center gap-2">
                <Award size={16} className="text-[#4338CA]" />
                <span>2. Regras de Cobrança & Pontuação da Prova</span>
              </h3>
              <span className="text-xs text-[#5B607A]">Calcula nota líquida nos simulados</span>
            </div>

            {/* Seleção do Método */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                onClick={() => {
                  setMetodoCobranca('certo_errado');
                  setFatorPenalidade('1.0');
                }}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  metodoCobranca === 'certo_errado'
                    ? 'border-[#4338CA] bg-white shadow-xs'
                    : 'border-[#E3E5F3] bg-white/50 hover:border-[#C9CCE3]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#14162B]">Certo ou Errado</span>
                  {metodoCobranca === 'certo_errado' && (
                    <span className="w-5 h-5 rounded-full bg-[#4338CA] text-white flex items-center justify-center text-xs">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5B607A] mt-1">
                  Estilo <b>CEBRASPE</b>: cada item errado desconta pontos dos acertos (penalidade configurável).
                </p>
              </div>

              <div
                onClick={() => {
                  setMetodoCobranca('multipla_escolha');
                  setFatorPenalidade('0.0');
                }}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  metodoCobranca === 'multipla_escolha'
                    ? 'border-[#4338CA] bg-white shadow-xs'
                    : 'border-[#E3E5F3] bg-white/50 hover:border-[#C9CCE3]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#14162B]">Múltipla Escolha</span>
                  {metodoCobranca === 'multipla_escolha' && (
                    <span className="w-5 h-5 rounded-full bg-[#4338CA] text-white flex items-center justify-center text-xs">
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5B607A] mt-1">
                  Estilo <b>FGV / FCC / VUNESP</b>: apenas questões certas somam pontos, sem anulação por erro.
                </p>
              </div>
            </div>

            {/* Detalhes de Pontos e Penalidade */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="lab block mb-1">
                  {metodoCobranca === 'certo_errado' ? 'Fator de Penalidade' : 'Penalidade por Erro'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="2"
                    value={fatorPenalidade}
                    onChange={e => setFatorPenalidade(e.target.value)}
                    disabled={metodoCobranca === 'multipla_escolha'}
                    className={`fld w-full ${metodoCobranca === 'multipla_escolha' ? 'bg-[#EEF0F7] opacity-60' : ''}`}
                  />
                </div>
                <span className="text-[11px] text-[#5B607A] mt-0.5 block">
                  {metodoCobranca === 'certo_errado'
                    ? fatorPenalidade === '1.0' || fatorPenalidade === '1'
                      ? '1 errada anula 1 certa'
                      : `${fatorPenalidade}x desconto por erro`
                    : 'Sem desconto por erro'}
                </span>
              </div>

              <div>
                <label className="lab block mb-1">Pontuação Total da Prova</label>
                <input
                  type="number"
                  value={pontuacaoTotal}
                  onChange={e => setPontuacaoTotal(e.target.value)}
                  className="fld w-full"
                />
                <span className="text-[11px] text-[#5B607A] mt-0.5 block">Ex: 120 ou 80 pontos</span>
              </div>

              <div>
                <label className="lab block mb-1">Nota Mínima (Corte Geral)</label>
                <input
                  type="number"
                  value={notaMinimaAprovacao}
                  onChange={e => setNotaMinimaAprovacao(e.target.value)}
                  className="fld w-full"
                />
                <span className="text-[11px] text-[#5B607A] mt-0.5 block">Mínimo para aprovação</span>
              </div>
            </div>
          </div>

          {/* Seção 3: Grupos e Pesos */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#14162B] flex items-center gap-2">
                  <Layers size={16} className="text-[#4338CA]" />
                  <span>3. Grupos de Disciplinas e Pesos</span>
                </h3>
                <p className="text-xs text-[#5B607A]">
                  Defina os blocos de provas, seus respectivos pesos e disciplinas associadas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddGrupo}
                className="btn btn-secondary text-xs h-9 flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Adicionar Grupo</span>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {grupos.map((g, gIdx) => (
                <div key={g.id} className="card p-4 bg-[#FFFFFF] border border-[#D9DCEB]">
                  {/* Linha do Grupo */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EEF0F7]">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <span className="chip f1 text-xs">P{gIdx + 1}</span>
                      <input
                        type="text"
                        value={g.nome}
                        onChange={e => handleUpdateGrupo(g.id, 'nome', e.target.value)}
                        placeholder="Nome do grupo..."
                        className="font-bold text-sm text-[#14162B] bg-transparent border-b border-dashed border-[#C9CCE3] focus:border-[#4338CA] outline-hidden px-1 py-0.5"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#5B607A]">Peso:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={g.peso}
                          onChange={e => handleUpdateGrupo(g.id, 'peso', Number(e.target.value))}
                          className="w-16 fld py-1 text-xs text-center"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#5B607A]">Questões:</span>
                        <input
                          type="number"
                          value={g.questoes_prova}
                          onChange={e => handleUpdateGrupo(g.id, 'questoes_prova', Number(e.target.value))}
                          className="w-16 fld py-1 text-xs text-center"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#5B607A]">Corte Bloco:</span>
                        <input
                          type="number"
                          value={g.nota_minima_grupo}
                          onChange={e => handleUpdateGrupo(g.id, 'nota_minima_grupo', Number(e.target.value))}
                          className="w-16 fld py-1 text-xs text-center"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveGrupo(g.id)}
                        className="text-[#8A8FA8] hover:text-[#C62828] p-1 transition-colors"
                        title="Remover este grupo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Disciplinas deste Grupo */}
                  <div className="pt-3 flex flex-col gap-2">
                    <div className="text-[11px] font-semibold text-[#8A8FA8] uppercase tracking-wider">
                      Disciplinas no grupo ({g.disciplinas.length})
                    </div>

                    {g.disciplinas.map(d => (
                      <div
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-[#FAFAFC] border border-[#EEF0F7] text-xs"
                      >
                        <input
                          type="text"
                          value={d.nome}
                          onChange={e => handleUpdateDisciplina(g.id, d.id, 'nome', e.target.value)}
                          placeholder="Nome da disciplina..."
                          className="fld py-1 flex-1 min-w-[150px] text-xs"
                        />

                        <select
                          value={d.tipo}
                          onChange={e => handleUpdateDisciplina(g.id, d.id, 'tipo', e.target.value)}
                          className="fld py-1 text-xs w-28"
                        >
                          <option value="decoreba">Decoreba</option>
                          <option value="raciocinio">Raciocínio</option>
                        </select>

                        <div className="flex items-center gap-1">
                          <span className="text-[#5B607A]">Peso:</span>
                          <input
                            type="number"
                            step="0.5"
                            value={d.peso}
                            onChange={e => handleUpdateDisciplina(g.id, d.id, 'peso', Number(e.target.value))}
                            className="w-14 fld py-1 text-xs text-center"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[#5B607A]">Qtd Est.:</span>
                          <input
                            type="number"
                            value={d.questoes_estimadas}
                            onChange={e => handleUpdateDisciplina(g.id, d.id, 'questoes_estimadas', Number(e.target.value))}
                            className="w-14 fld py-1 text-xs text-center"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDisciplina(g.id, d.id)}
                          className="text-[#8A8FA8] hover:text-[#C62828] p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddDisciplina(g.id)}
                      className="text-xs text-[#4338CA] hover:underline font-semibold flex items-center gap-1 mt-1 w-fit"
                    >
                      <Plus size={13} />
                      <span>Adicionar disciplina neste grupo</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé / Ações */}
          <div className="pt-4 border-t border-[#EEF0F7] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="btn h-11 px-5 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="btn btn-primary h-11 px-6 text-sm flex items-center gap-2"
            >
              {salvando ? (
                <span>Salvando edital...</span>
              ) : (
                <>
                  <Check size={16} />
                  <span>Criar Edital Completo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
