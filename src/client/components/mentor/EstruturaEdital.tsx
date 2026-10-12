import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface EstruturaEditalProps {
  editalId?: string;
  onAdicionarDisciplina?: () => void;
}

export const EstruturaEdital: React.FC<EstruturaEditalProps> = ({
  editalId = 'edital_cgu',
  onAdicionarDisciplina,
}) => {
  const [loading, setLoading] = useState(true);
  const [edital, setEdital] = useState<any>(null);
  const [grupos, setGrupos] = useState<any[]>([]);

  // Novo grupo formulário
  const [novoGrupoNome, setNovoGrupoNome] = useState('');
  const [novoGrupoQuestoes, setNovoGrupoQuestoes] = useState('40');
  const [novoGrupoPeso, setNovoGrupoPeso] = useState('1');
  const [criandoGrupo, setCriandoGrupo] = useState(false);

  const fetchEstrutura = () => {
    fetch(`/api/editais/${editalId}/estrutura`)
      .then(res => res.json())
      .then(data => {
        setEdital(data.edital);
        setGrupos(data.grupos || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEstrutura();
  }, [editalId]);

  if (loading) {
    return <div className="p-8 text-center text-[#5B607A]">Carregando estrutura do edital...</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1280px] mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="d font-bold text-3xl md:text-4xl text-[#14162B] tracking-tight">
            {edital?.nome || 'Concurso CGU'}
          </h1>
          <div className="text-base text-[#5B607A] mt-1">
            Banca {edital?.banca || 'CEBRASPE'} · estrutura do edital
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
        {grupos.map(g => (
          <div key={g.id} className="card overflow-hidden">
            <div className="p-4 px-5 flex items-center justify-between border-b border-[#EEF0F7] bg-[#FAFAFC]">
              <div className="flex items-center gap-3">
                <span className="text-[#8A8FA8] text-sm tracking-widest select-none">⋮⋮</span>
                <h3 className="d font-bold text-xl text-[#14162B]">{g.nome}</h3>
                <span className="chip f1 text-xs">
                  {g.questoes_prova} questões · peso {g.peso}
                </span>
              </div>
            </div>

            <div className="divide-y divide-[#EEF0F7]">
              {g.disciplinas?.map((d: any) => (
                <div key={d.id} className="p-3.5 px-5 flex items-center justify-between hover:bg-[#F9FAFC] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-[#8A8FA8] text-xs tracking-widest select-none">⋮⋮</span>
                    <span className="font-semibold text-sm text-[#14162B]">{d.nome}</span>
                  </div>
                  <span className={`chip ${d.tipo === 'decoreba' ? 'dec' : 'rac'} text-xs`}>
                    {d.tipo}
                  </span>
                </div>
              ))}
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

        {/* Card: Criação de Novo Grupo */}
        <div className="card border-2 border-dashed border-[#C9CCE3] p-5 flex flex-col gap-3">
          <h3 className="d font-bold text-xl text-[#14162B]">Novo grupo</h3>
          <p className="text-xs text-[#5B607A]">
            Os grupos seguem a divisão do edital. Eles reúnem disciplinas e definem quantas questões e qual peso o grupo tem na prova.
          </p>

          <div className="flex flex-wrap items-end gap-3 mt-1">
            <div className="flex-2 min-w-[200px]">
              <label className="lab block mb-1">Nome do grupo</label>
              <input
                type="text"
                placeholder="Ex.: Conhecimentos Gerais"
                value={novoGrupoNome}
                onChange={e => setNovoGrupoNome(e.target.value)}
                className="fld"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="lab block mb-1">Questões na prova</label>
              <input
                type="number"
                value={novoGrupoQuestoes}
                onChange={e => setNovoGrupoQuestoes(e.target.value)}
                className="fld"
              />
            </div>
            <div className="flex-1 min-w-[100px]">
              <label className="lab block mb-1">Peso</label>
              <input
                type="number"
                value={novoGrupoPeso}
                onChange={e => setNovoGrupoPeso(e.target.value)}
                className="fld"
              />
            </div>
            <button
              onClick={() => {
                if (!novoGrupoNome.trim()) return;
                alert(`Grupo "${novoGrupoNome}" configurado com sucesso.`);
                setNovoGrupoNome('');
              }}
              className="btn btn-primary h-11 shrink-0"
            >
              Criar grupo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
