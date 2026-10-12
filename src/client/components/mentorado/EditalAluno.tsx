import React, { useState, useEffect } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { DisciplinaTopicos } from './DisciplinaTopicos.js';

interface EditalAlunoProps {
  matriculaId: string;
  isMobile?: boolean;
}

export const EditalAluno: React.FC<EditalAlunoProps> = ({ matriculaId, isMobile = false }) => {
  const [loading, setLoading] = useState(true);
  const [edital, setEdital] = useState<any>(null);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [disciplinaSelecionadaId, setDisciplinaSelecionadaId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/matriculas/${matriculaId}/edital`)
      .then(res => res.json())
      .then(data => {
        if (data.edital) {
          setEdital(data.edital);
          setGrupos(data.grupos || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [matriculaId]);

  if (loading) {
    return <div className="p-8 text-center text-[#5B607A]">Carregando edital...</div>;
  }

  // Se o aluno clicou em uma matéria, renderiza a árvore de tópicos
  if (disciplinaSelecionadaId) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => setDisciplinaSelecionadaId(null)}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#4338CA] hover:underline p-4 md:px-8 pb-0"
        >
          <ArrowLeft size={16} />
          <span>Voltar para todas as disciplinas</span>
        </button>
        <DisciplinaTopicos
          matriculaId={matriculaId}
          disciplinaId={disciplinaSelecionadaId}
          isMobile={isMobile}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 p-4 md:p-8 max-w-[1080px] mx-auto`}>
      <div>
        <h1 className="d font-bold text-3xl md:text-4xl text-[#14162B] tracking-tight">
          {edital?.nome || 'Concurso CGU'}
        </h1>
        <div className="text-base text-[#5B607A] mt-1">
          Banca {edital?.banca || 'CEBRASPE'} · disciplinas agrupadas pelo edital
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {grupos.map(g => (
          <div key={g.id} className="card overflow-hidden">
            <div className="p-4 px-5 flex items-center justify-between border-b border-[#EEF0F7] bg-[#FDFDFE]">
              <div className="flex items-center gap-3">
                <h3 className="d font-bold text-xl text-[#14162B]">{g.nome}</h3>
                <span className="chip f1 text-xs">
                  {g.questoes_prova} questões · peso {g.peso}
                </span>
              </div>
            </div>

            <div className="divide-y divide-[#EEF0F7]">
              {g.disciplinas?.map((d: any) => {
                const isFase2 = d.fase_atual === 2;
                const isFase3 = d.fase_atual === 3;
                const isDec = d.tipo === 'decoreba';

                return (
                  <div
                    key={d.id}
                    onClick={() => setDisciplinaSelecionadaId(d.id)}
                    className="p-4 px-5 flex items-center justify-between hover:bg-[#F9FAFC] cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col gap-1 pr-4">
                      <span
                        className={`font-semibold text-base leading-snug ${
                          isFase3 ? 'text-[#C62828]' : isFase2 ? 'text-[#B45309]' : 'text-[#14162B]'
                        }`}
                      >
                        {d.nome}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`chip ${isDec ? 'dec' : 'rac'}`}>
                          {d.tipo}
                        </span>
                        <span
                          className={`chip ${
                            isFase3 ? 'f3' : isFase2 ? 'f2' : 'f1'
                          }`}
                        >
                          Fase {d.fase_atual}
                        </span>
                        {d.no_ciclo && (
                          <span className="chip bg-[#E4E5FB] text-[#2F2A9E]">
                            no ciclo
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight size={20} className="text-[#8A8FA8] shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
