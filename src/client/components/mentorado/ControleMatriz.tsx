import React, { useState, useEffect } from 'react';
import { PALETA_RODADA } from '../../theme/tokens.js';
import { Check } from 'lucide-react';

interface ControleMatrizProps {
  matriculaId: string;
  isMobile?: boolean;
}

export const ControleMatriz: React.FC<ControleMatrizProps> = ({ matriculaId, isMobile = false }) => {
  const [loading, setLoading] = useState(true);
  const [ciclo, setCiclo] = useState<any>(null);
  const [rodada, setRodada] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [celulas, setCelulas] = useState<any[]>([]);
  const [diaReuniao, setDiaReuniao] = useState<number>(2); // 2 = Terça
  const [revisaoDias, setRevisaoDias] = useState<any[]>([]);
  const [revisoesMensais, setRevisoesMensais] = useState<any[]>([]);
  const [corSelecionada, setCorSelecionada] = useState<string>('#8EC5FF');

  const fetchControle = () => {
    fetch(`/api/matriculas/${matriculaId}/controle`)
      .then(res => res.json())
      .then(data => {
        if (data.ciclo) {
          setCiclo(data.ciclo);
          setRodada(data.rodada);
          setSlots(data.slots || []);
          setCelulas(data.celulas || []);
          setDiaReuniao(data.diaReuniaoSemana ?? 2);
          setRevisaoDias(data.revisaoDias || []);
          setRevisoesMensais(data.revisoesMensais || []);
          if (data.rodada?.cor) {
            setCorSelecionada(data.rodada.cor);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchControle();
  }, [matriculaId]);

  const handleMudarCorRodada = async (hex: string) => {
    setCorSelecionada(hex);
    try {
      await fetch(`/api/matriculas/${matriculaId}/controle/cor-rodada`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cor: hex }),
      });
      fetchControle();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#5B607A]">Carregando grade de controle...</div>;
  }

  // Gera os 30 dias a partir da data de início do ciclo
  const dataInicioStr = ciclo?.inicio || '2026-10-09';
  const diasCols: { dataStr: string; label: string; isFimDeSemana: boolean; isReuniao: boolean; isHoje: boolean }[] = [];
  const dCursor = new Date(dataInicioStr);
  const hojeStr = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < (ciclo?.duracao_dias || 30); i++) {
    const curDate = new Date(dCursor);
    curDate.setDate(curDate.getDate() + i);
    const dStr = curDate.toISOString().slice(0, 10);
    const dayOfWeek = curDate.getDay();
    const diaMes = curDate.getDate();
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

    diasCols.push({
      dataStr: dStr,
      label: `${diaMes} ${meses[curDate.getMonth()]}`,
      isFimDeSemana: dayOfWeek === 0 || dayOfWeek === 6,
      isReuniao: dayOfWeek === diaReuniao,
      isHoje: dStr === hojeStr,
    });
  }

  // Mapa de células preenchidas: `slotId_dataStr` -> cor
  const celulaMap = new Map<string, string>();
  celulas.forEach(c => {
    celulaMap.set(`${c.slot_id}_${c.data}`, c.cor);
  });

  // Mapa de revisão noturna
  const revNoturnaMap = new Set(revisaoDias.filter(r => r.revisao_noturna === 1).map(r => r.data));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1440px] mx-auto overflow-hidden">
      {/* Cabeçalho e Legenda */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="d font-bold text-3xl md:text-4xl text-[#14162B] tracking-tight">Controle</h1>
          <div className="text-[#5B607A] text-base mt-1">
            Ciclo {String(ciclo?.numero || 1).padStart(2, '0')} · iniciado em {ciclo?.inicio ? ciclo.inicio.split('-').reverse().slice(0, 2).join('/') : '09/10'} · {ciclo?.duracao_dias || 30} dias
          </div>
        </div>

        {/* Legenda visual */}
        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-[#3A3F5C]">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#D3E3F5] inline-block border border-[#BCD3EE]" />
            <span>decoreba</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#FFF2CC] inline-block border border-[#E8DCB0]" />
            <span>raciocínio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded inline-block" style={{ backgroundColor: corSelecionada }} />
            <span>estudado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#E4E6EE] inline-block border border-[#D5D8E2]" />
            <span>fim de semana</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#BFE5C8] border border-[#7FC48E] inline-block" />
            <span>reunião</span>
          </div>
        </div>
      </div>

      {/* Paleta das 10 Cores da Rodada (HU-4.1) */}
      <div className="card p-4 px-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-base text-[#14162B]">
            Cor da rodada {rodada?.numero || 1}
          </div>
          <div className="text-xs text-[#5B607A] mt-0.5">
            Vale até o fim da rodada para todas as matérias concluídas.
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {PALETA_RODADA.map(cor => {
            const isSelected = corSelecionada.toLowerCase() === cor.hex.toLowerCase();
            return (
              <button
                key={cor.nome}
                onClick={() => handleMudarCorRodada(cor.hex)}
                title={cor.rotulo}
                className="w-9 h-9 rounded-full shrink-0 transition-transform hover:scale-105"
                style={{
                  backgroundColor: cor.hex,
                  outline: isSelected ? '2px solid #14162B' : 'none',
                  outlineOffset: '2px',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Tabela Matricial com Rolagem Horizontal Suave */}
      <div className="card p-2 md:p-3 overflow-x-auto">
        <div className="min-w-[1100px]">
          {/* Cabeçalho das Colunas: Vazio à esquerda + 30 dias */}
          <div className="g mb-1">
            <div className="lb text-xs uppercase text-[#5B607A] font-bold">Disciplinas do Ciclo</div>
            {diasCols.map(dia => {
              let headerClass = 'hd';
              if (dia.isReuniao) headerClass += ' mt';
              else if (dia.isFimDeSemana) headerClass += ' wk';
              if (dia.isHoje) headerClass += ' td';

              return (
                <div key={dia.dataStr} className={headerClass}>
                  <span>{dia.label}</span>
                </div>
              );
            })}
          </div>

          {/* Linhas das Disciplinas do Ciclo */}
          {slots.map(s => {
            const isDec = s.tipo === 'decoreba';
            return (
              <div key={s.id} className="g">
                {/* Nome da Disciplina */}
                <div className={`lb text-xs font-semibold truncate ${isDec ? 'bg-[#D3E3F5] text-[#1F3F66]' : 'bg-[#FFF2CC] text-[#6B4F00]'}`} title={s.nome}>
                  <span className="truncate">{s.nome}</span>
                </div>

                {/* 30 Células do Dia */}
                {diasCols.map(dia => {
                  const key = `${s.id}_${dia.dataStr}`;
                  const corEstudo = celulaMap.get(key);
                  const isDone = !!corEstudo;

                  return (
                    <div
                      key={dia.dataStr}
                      className={`cl transition-colors ${
                        isDone
                          ? 'border-transparent text-white'
                          : dia.isFimDeSemana
                          ? 'bg-[#E4E6EE] border-[#E4E6EE]'
                          : 'bg-white'
                      }`}
                      style={{
                        backgroundColor: isDone ? corEstudo : undefined,
                      }}
                    >
                      {isDone && <Check size={14} className="stroke-[3] text-white" />}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Separador e Linha de Revisão Noturna */}
          <div className="h-2" />
          <div className="g">
            <div className="lb bg-[#14162B] text-white text-xs font-bold">
              Revisão Noturna
            </div>
            {diasCols.map(dia => {
              const fez = revNoturnaMap.has(dia.dataStr);
              return (
                <div
                  key={dia.dataStr}
                  className={`cl ${
                    fez
                      ? 'bg-[#8EC5FF] border-[#8EC5FF]'
                      : dia.isFimDeSemana
                      ? 'bg-[#E4E6EE]'
                      : 'bg-white'
                  }`}
                >
                  {fez && <Check size={14} className="stroke-[3] text-white" />}
                </div>
              );
            })}
          </div>

          {/* Linha de Revisão Mensal */}
          <div className="g">
            <div className="lb bg-[#6FA8DC] text-[#14162B] text-xs font-bold">
              Revisão Mensal (1º fds)
            </div>
            {diasCols.map(dia => {
              // Verifica se cai no primeiro fim de semana
              const curD = new Date(dia.dataStr);
              const isFirstWeekend = (curD.getDay() === 0 || curD.getDay() === 6) && curD.getDate() <= 7;
              return (
                <div
                  key={dia.dataStr}
                  className={`cl ${
                    isFirstWeekend ? 'border-2 border-[#6FA8DC] bg-white' : dia.isFimDeSemana ? 'bg-[#E4E6EE]' : 'bg-white'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
