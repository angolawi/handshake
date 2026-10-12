import React, { useState, useEffect } from 'react';
import { PALETA_RODADA } from '../../theme/tokens.js';
import { Check } from 'lucide-react';

interface ControleMatrizProps {
  matriculaId: string;
  isMobile?: boolean;
}

// Função robusta que determina se uma data pertence ao primeiro fim de semana do seu mês
function isPrimeiroFimDeSemanaDoMes(dataObj: Date): boolean {
  const diaSemana = dataObj.getDay(); // 0 = Domingo, 6 = Sábado
  if (diaSemana !== 0 && diaSemana !== 6) return false;

  const diaMes = dataObj.getDate();
  const ano = dataObj.getFullYear();
  const mes = dataObj.getMonth();

  // Encontra o dia do primeiro sábado do mês
  const primeiroDiaMes = new Date(ano, mes, 1);
  const diaSemanaPrimeiro = primeiroDiaMes.getDay(); // 0 a 6
  // Dias até o primeiro sábado (dia da semana 6):
  const diaPrimeiroSabado = 1 + ((6 - diaSemanaPrimeiro + 7) % 7);

  // O primeiro fim de semana compreende:
  // 1. O primeiro sábado do mês
  // 2. O domingo imediatamente consecutivo ao primeiro sábado
  // 3. Se o mês começou em um domingo (dia 1), esse domingo também é fim de semana inicial
  if (diaSemana === 6 && diaMes === diaPrimeiroSabado) return true;
  if (diaSemana === 0 && diaMes === diaPrimeiroSabado + 1) return true;
  if (diaSemana === 0 && diaMes === 1) return true;

  return false;
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

  // Alterna marcação da célula de disciplina na grade
  const handleToggleCelula = async (slotId: string, dataStr: string) => {
    const key = `${slotId}_${dataStr}`;
    const jaEstudado = celulas.some(c => c.slot_id === slotId && c.data === dataStr);

    // Atualização otimista
    setCelulas(prev => {
      if (jaEstudado) {
        return prev.filter(c => !(c.slot_id === slotId && c.data === dataStr));
      } else {
        return [...prev, { slot_id: slotId, data: dataStr, cor: corSelecionada }];
      }
    });

    try {
      const res = await fetch(`/api/matriculas/${matriculaId}/controle/toggle-celula`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, data: dataStr, cor: corSelecionada }),
      });
      const data = await res.json();
      if (!data.ok) {
        fetchControle();
      }
    } catch {
      fetchControle();
    }
  };

  // Alterna marcação da revisão noturna
  const handleToggleRevisaoNoturna = async (dataStr: string) => {
    const fez = revisaoDias.some(r => r.data === dataStr && r.revisao_noturna === 1);

    setRevisaoDias(prev => {
      if (fez) {
        return prev.map(r => r.data === dataStr ? { ...r, revisao_noturna: 0 } : r);
      } else {
        const existe = prev.some(r => r.data === dataStr);
        if (existe) {
          return prev.map(r => r.data === dataStr ? { ...r, revisao_noturna: 1 } : r);
        } else {
          return [...prev, { data: dataStr, revisao_noturna: 1 }];
        }
      }
    });

    try {
      await fetch(`/api/matriculas/${matriculaId}/controle/toggle-revisao-noturna`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataStr }),
      });
    } catch {
      fetchControle();
    }
  };

  // Alterna marcação da revisão mensal
  const handleToggleRevisaoMensal = async (dataStr: string) => {
    const mesRef = dataStr.slice(0, 7);
    const fez = revisoesMensais.some(r => r.mes_referencia === mesRef);

    setRevisoesMensais(prev => {
      if (fez) {
        return prev.filter(r => r.mes_referencia !== mesRef);
      } else {
        return [...prev, { mes_referencia: mesRef, feita_em: dataStr }];
      }
    });

    try {
      await fetch(`/api/matriculas/${matriculaId}/controle/toggle-revisao-mensal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataStr, mesReferencia: mesRef }),
      });
    } catch {
      fetchControle();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#5B607A]">Carregando grade de controle...</div>;
  }

  // Gera os 30 dias de forma segura e imune a offset de UTC
  const [anoIni, mesIni, diaIni] = (ciclo?.inicio || '2026-10-09').split('-').map(Number);
  const diasCols: { dataStr: string; label: string; isFimDeSemana: boolean; isReuniao: boolean; isHoje: boolean }[] = [];
  const hoje = new Date();
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

  for (let i = 0; i < (ciclo?.duracao_dias || 30); i++) {
    const curDate = new Date(anoIni, mesIni - 1, diaIni + i);
    const dStr = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, '0')}-${String(curDate.getDate()).padStart(2, '0')}`;
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
            <span>estudado (clique para marcar)</span>
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
            Vale até o fim da rodada para todas as matérias marcadas.
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

          {/* Linhas das Disciplinas do Ciclo (Clicáveis para Marcar/Desmarcar) */}
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
                      onClick={() => handleToggleCelula(s.id, dia.dataStr)}
                      title={`${s.nome} · ${dia.label} ${isDone ? '(Concluído - clique para desmarcar)' : '(Clique para marcar como estudado)'}`}
                      className={`cl transition-all cursor-pointer hover:ring-2 hover:ring-[#4338CA]/30 ${
                        isDone
                          ? 'border-transparent text-white'
                          : dia.isFimDeSemana
                          ? 'bg-[#E4E6EE] border-[#E4E6EE] hover:bg-[#D5D8E2]'
                          : 'bg-white hover:bg-[#F5F6FA]'
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
                  onClick={() => handleToggleRevisaoNoturna(dia.dataStr)}
                  title={`Revisão Noturna · ${dia.label} ${fez ? '(Concluída - clique para desmarcar)' : '(Clique para marcar)'}`}
                  className={`cl cursor-pointer transition-all hover:ring-2 hover:ring-[#4338CA]/30 ${
                    fez
                      ? 'bg-[#8EC5FF] border-[#8EC5FF]'
                      : dia.isFimDeSemana
                      ? 'bg-[#E4E6EE] hover:bg-[#D5D8E2]'
                      : 'bg-white hover:bg-[#F5F6FA]'
                  }`}
                >
                  {fez && <Check size={14} className="stroke-[3] text-white" />}
                </div>
              );
            })}
          </div>

          {/* Linha de Revisão Mensal (Células SOMENTE no 1º fim de semana do mês; demais dias em branco) */}
          <div className="g">
            <div className="lb bg-[#6FA8DC] text-[#14162B] text-xs font-bold">
              Revisão Mensal (1º fds)
            </div>
            {diasCols.map(dia => {
              const [ano, mes, diaMes] = dia.dataStr.split('-').map(Number);
              const curD = new Date(ano, mes - 1, diaMes);
              const isFirstWeekend = isPrimeiroFimDeSemanaDoMes(curD);

              // Os demais dias ficam rigorosamente em branco (sem caixa visual nem borda)
              if (!isFirstWeekend) {
                return (
                  <div
                    key={dia.dataStr}
                    className="cl border-transparent bg-transparent pointer-events-none select-none"
                  />
                );
              }

              const mesRef = dia.dataStr.slice(0, 7);
              const fezMensal = revisoesMensais.some(r => r.mes_referencia === mesRef);

              return (
                <div
                  key={dia.dataStr}
                  onClick={() => handleToggleRevisaoMensal(dia.dataStr)}
                  title={`Revisão Mensal (1º fds) · ${dia.label} ${fezMensal ? '(Concluída - clique para desmarcar)' : '(Clique para marcar)'}`}
                  className={`cl border-2 border-[#6FA8DC] cursor-pointer transition-all hover:ring-2 hover:ring-[#4338CA]/30 ${
                    fezMensal
                      ? 'bg-[#6FA8DC] text-white'
                      : 'bg-white hover:bg-[#F0F7FF]'
                  }`}
                >
                  {fezMensal && <Check size={14} className="stroke-[3] text-white" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
