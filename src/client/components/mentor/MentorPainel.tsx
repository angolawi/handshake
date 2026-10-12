import React, { useState, useEffect } from 'react';
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MentoradoDetalhe } from './MentoradoDetalhe.js';

interface MentorPainelProps {
  onAbrirConvite?: () => void;
}

export const MentorPainel: React.FC<MentorPainelProps> = ({ onAbrirConvite }) => {
  const [loading, setLoading] = useState(true);
  const [mentorados, setMentorados] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>({ reunioesSemana: 6, precisamAtencao: 2, revisaoNoturnaTaxa: 78 });
  const [mentoradoSelecionadoId, setMentoradoSelecionadoId] = useState<string | null>(null);

  const fetchPainel = () => {
    fetch('/api/mentor/painel')
      .then(res => res.json())
      .then(data => {
        setMentorados(data.mentorados || []);
        if (data.resumo) setResumo(data.resumo);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPainel();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-[#5B607A]">Carregando painel do mentor...</div>;
  }

  if (mentoradoSelecionadoId) {
    return (
      <MentoradoDetalhe
        mentoradoId={mentoradoSelecionadoId}
        onVoltar={() => setMentoradoSelecionadoId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1280px] mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="d font-bold text-3xl md:text-4xl text-[#14162B] tracking-tight">Mentorados</h1>
          <div className="text-base text-[#5B607A] mt-1">
            Últimos 7 dias · acompanhamento e aderência
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onAbrirConvite} className="btn btn-primary h-11 flex items-center gap-2">
            <UserPlus size={16} />
            <span>Convidar mentorado</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="lab">Reuniões esta semana</div>
          <div className="d font-bold text-4xl text-[#14162B] mt-1">{resumo.reunioesSemana}</div>
          <div className="text-sm text-[#5B607A] mt-1">ter: 3 · qui: 2 · sex: 1</div>
        </div>

        <div className="card p-5">
          <div className="lab">Precisam de atenção</div>
          <div className="d font-bold text-4xl text-[#C62828] mt-1">{resumo.precisamAtencao}</div>
          <div className="text-sm text-[#5B607A] mt-1">sem sessão há 3 dias ou sem questões</div>
        </div>

        <div className="card p-5">
          <div className="lab">Revisão noturna feita</div>
          <div className="d font-bold text-4xl text-[#17603A] mt-1">{resumo.revisaoNoturnaTaxa}%</div>
          <div className="text-sm text-[#5B607A] mt-1">dos dias com estudo concluído</div>
        </div>
      </div>

      {/* Tabela dos Mentorados com Rastreador dos 7 Dias */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#EEF0F7] bg-[#FAFAFC] text-xs">
                <th className="p-3.5 px-5 lab">Mentorado</th>
                <th className="p-3.5 lab">Edital</th>
                <th className="p-3.5 lab text-center">seg · dom</th>
                <th className="p-3.5 lab text-center">Sessões</th>
                <th className="p-3.5 lab text-center">Acerto</th>
                <th className="p-3.5 lab">Reunião</th>
                <th className="p-3.5 px-5 lab">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF0F7] text-sm">
              {mentorados.map(m => {
                const isAlerta = m.situacao === 'alerta';
                return (
                  <tr
                    key={m.id}
                    onClick={() => setMentoradoSelecionadoId(m.id)}
                    className="hover:bg-[#F9FAFC] cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 px-5 font-semibold text-[#14162B]">{m.nome}</td>
                    <td className="p-3.5 text-[#5B607A]">{m.edital_nome}</td>

                    {/* Quadradinhos seg..dom */}
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1">
                        {m.semana_dias?.map((dia: any, idx: number) => {
                          const bg = dia.estudado
                            ? '#8EC5FF'
                            : dia.fim_de_semana
                            ? '#E4E6EE'
                            : '#FFFFFF';
                          const border = dia.estudado
                            ? '#8EC5FF'
                            : dia.fim_de_semana
                            ? '#E4E6EE'
                            : '#D9DCEB';
                          return (
                            <span
                              key={idx}
                              title={`${dia.dia_semana}: ${dia.estudado ? 'Estudou' : 'Sem estudo'}`}
                              style={{ backgroundColor: bg, borderColor: border }}
                              className="w-4 h-6 rounded border inline-block"
                            />
                          );
                        })}
                      </div>
                    </td>

                    <td className="p-3.5 text-center font-medium tabular-nums">
                      {m.sessoes_realizadas}/{m.sessoes_planejadas}
                    </td>

                    <td className="p-3.5 text-center font-semibold tabular-nums">
                      {m.taxa_acerto !== null ? `${m.taxa_acerto}%` : '—'}
                    </td>

                    <td className="p-3.5">
                      <span className="chip gr font-medium">{m.data_reuniao_proxima}</span>
                    </td>

                    <td className="p-3.5 px-5">
                      {isAlerta ? (
                        <span className="chip wn flex items-center gap-1 w-fit">
                          <AlertCircle size={12} />
                          <span>{m.motivo_alerta || 'Atenção'}</span>
                        </span>
                      ) : (
                        <span className="chip ok flex items-center gap-1 w-fit">
                          <CheckCircle2 size={12} />
                          <span>Em dia</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
