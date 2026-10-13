import React, { useState, useEffect } from 'react';
import { QuestoesSemanais } from '../../../shared/types.js';

interface RelatorioReuniaoSemanalProps {
  matriculaId: string;
}

export const RelatorioReuniaoSemanal: React.FC<RelatorioReuniaoSemanalProps> = ({ matriculaId }) => {
  const [loading, setLoading] = useState(true);
  const [relatorios, setRelatorios] = useState<QuestoesSemanais[]>([]);

  useEffect(() => {
    if (!matriculaId) {
      setLoading(false);
      setRelatorios([]);
      return;
    }
    fetch(`/api/matriculas/${matriculaId}/questoes-semanais`)
      .then(res => res.json())
      .then(data => {
        setRelatorios(data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [matriculaId]);

  if (loading) {
    return <div className="p-8 text-center text-[#5B607A]">Carregando relatório semanal...</div>;
  }

  if (relatorios.length === 0) {
    return (
      <div className="card p-8 text-center text-[#5B607A]">
        Nenhum corte semanal acumulado com questões resolvidas ainda.
      </div>
    );
  }

  // Agrupa disciplinas únicas de todos os cortes
  const mapaDisciplinas = new Map<string, { nome: string; grupo: string }>();
  relatorios.forEach(r => {
    r.disciplinas.forEach(d => {
      if (!mapaDisciplinas.has(d.disciplina_id)) {
        mapaDisciplinas.set(d.disciplina_id, { nome: d.disciplina_nome, grupo: d.grupo_nome });
      }
    });
  });

  const disciplinasLista = Array.from(mapaDisciplinas.entries());

  return (
    <div className="card overflow-hidden">
      <div className="p-4 px-5 border-b border-[#EEF0F7] bg-[#FAFAFC]">
        <h3 className="d font-bold text-xl text-[#14162B]">
          Acompanhamento de Questões por Reunião Semanal (HU-4.6)
        </h3>
        <p className="text-xs text-[#5B607A] mt-1">
          Quantidades acumuladas cumulativamente por data de corte semanal (terças-feiras). A Semana 2 inclui a Semana 1.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px] text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-[#EEF0F7] bg-[#F8F9FD]">
              <th className="p-3 px-4 lab" rowSpan={2}>Disciplinas</th>
              {relatorios.map(r => (
                <th key={r.data_corte} colSpan={3} className="p-2 text-center border-l border-[#EEF0F7] font-semibold text-[#14162B]">
                  Relação de questões até {r.data_corte.split('-').reverse().slice(0, 2).join('/')}
                </th>
              ))}
            </tr>
            <tr className="border-b border-[#EEF0F7] bg-[#FAFAFC] text-[11px] text-[#5B607A]">
              {relatorios.map(r => (
                <React.Fragment key={r.data_corte}>
                  <th className="p-2 text-center border-l border-[#EEF0F7]">Certas</th>
                  <th className="p-2 text-center">Resolvidas</th>
                  <th className="p-2 text-center">%</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#EEF0F7]">
            {disciplinasLista.map(([discId, discInfo]) => (
              <tr key={discId} className="hover:bg-[#F9FAFC] transition-colors">
                <td className="p-3 px-4 font-semibold text-[#14162B] max-w-[260px] truncate" title={discInfo.nome}>
                  {discInfo.nome}
                </td>
                {relatorios.map(r => {
                  const d = r.disciplinas.find(x => x.disciplina_id === discId);
                  return (
                    <React.Fragment key={r.data_corte}>
                      <td className="p-2 text-center border-l border-[#EEF0F7] tabular-nums">
                        {d ? d.certas : '—'}
                      </td>
                      <td className="p-2 text-center tabular-nums">
                        {d ? d.resolvidas : '—'}
                      </td>
                      <td className="p-2 text-center font-bold text-[#17603A] tabular-nums">
                        {d ? `${d.porcentagem}%` : '—'}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>

          {/* Rodapé: Totais e Médias */}
          <tfoot>
            <tr className="border-t-2 border-[#14162B] bg-[#F8F9FD] font-bold text-xs sm:text-sm">
              <td className="p-3 px-4 text-[#14162B]">Total Geral</td>
              {relatorios.map(r => (
                <React.Fragment key={r.data_corte}>
                  <td className="p-2 text-center border-l border-[#EEF0F7] text-[#14162B] tabular-nums">
                    {r.total_certas}
                  </td>
                  <td className="p-2 text-center text-[#14162B] tabular-nums">
                    {r.total_resolvidas}
                  </td>
                  <td className="p-2 text-center text-[#17603A] tabular-nums">
                    {r.media_geral}%
                  </td>
                </React.Fragment>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
