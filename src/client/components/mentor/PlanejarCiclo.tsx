import React, { useState, useEffect } from 'react';
import { RefreshCw, Check } from 'lucide-react';

interface PlanejarCicloProps {
  matriculaId?: string;
  onPublicado?: () => void;
}

export const PlanejarCiclo: React.FC<PlanejarCicloProps> = ({
  matriculaId = 'mat_marina_cgu',
  onPublicado,
}) => {
  const [loading, setLoading] = useState(true);
  const [editalNome] = useState('Concurso CGU');
  const [dataInicio, setDataInicio] = useState('2026-11-08');
  const [slotsPorDia, setSlotsPorDia] = useState('3');
  const [duracaoDias, setDuracaoDias] = useState('30');
  const [publicando, setPublicando] = useState(false);
  const [publicadoSucesso, setPublicadoSucesso] = useState(false);

  // Sequência de slots sugerida
  const [slotsSequencia, setSlotsSequencia] = useState<any[]>([]);
  const [avisos, setAvisos] = useState<any[]>([]);
  const [disciplinasFora, setDisciplinasFora] = useState<any[]>([]);

  const fetchSugestao = () => {
    setLoading(true);
    fetch('/api/ciclos/sugerir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        editalId: 'edital_cgu',
        slotsPorDia: Number(slotsPorDia),
        duracaoDias: Number(duracaoDias),
      }),
    })
      .then(res => res.json())
      .then(data => {
        setSlotsSequencia(data.slotsSequencia || []);
        setAvisos(data.avisos || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSugestao();
    // Disciplinas fora do ciclo inicial para o card lateral
    setDisciplinasFora([
      { id: 'f1', nome: 'Ética Pública e Responsabilidade Profissional', tipo: 'decoreba' },
      { id: 'f2', nome: 'Administração Pública e Políticas Públicas', tipo: 'decoreba' },
      { id: 'f3', nome: 'Engenharia de Software e Programação', tipo: 'raciocinio', fase: 2 },
      { id: 'f4', nome: 'Arquitetura e Integração de Sistemas', tipo: 'raciocinio', fase: 2 },
    ]);
  }, []);

  const handleAdicionarAoCiclo = (disc: any) => {
    setSlotsSequencia(prev => [
      ...prev,
      {
        disciplina_id: disc.id,
        disciplina_nome: disc.nome,
        tipo: disc.tipo,
        ordem: prev.length + 1,
      },
    ]);
    setDisciplinasFora(prev => prev.filter(d => d.id !== disc.id));
  };

  const handlePublicarCiclo = async () => {
    if (slotsSequencia.length === 0) return;
    setPublicando(true);

    try {
      const res = await fetch('/api/ciclos/publicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matriculaId,
          inicio: dataInicio,
          duracaoDias: Number(duracaoDias),
          slotsPorDia: Number(slotsPorDia),
          slots: slotsSequencia,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPublicadoSucesso(true);
        setTimeout(() => {
          setPublicadoSucesso(false);
          if (onPublicado) onPublicado();
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPublicando(false);
    }
  };

  const totalDecoreba = slotsSequencia.filter(s => s.tipo === 'decoreba').length;
  const totalRaciocinio = slotsSequencia.filter(s => s.tipo === 'raciocinio').length;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1280px] mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="d font-bold text-3xl md:text-4xl text-[#14162B] tracking-tight">Planejar ciclo</h1>
          <div className="text-base text-[#5B607A] mt-1">
            Marina R. · Ciclo 02
          </div>
        </div>

        <div className="flex gap-2">
          {publicadoSucesso ? (
            <span className="chip ok py-2 px-4 text-sm font-semibold flex items-center gap-1.5">
              <Check size={16} /> Publicado com sucesso!
            </span>
          ) : (
            <button
              onClick={handlePublicarCiclo}
              disabled={publicando || slotsSequencia.length === 0}
              className="btn btn-primary h-11"
            >
              {publicando ? 'Publicando...' : 'Publicar para o aluno'}
            </button>
          )}
        </div>
      </div>

      {/* Controles de Configuração do Ciclo */}
      <div className="card p-4 px-5 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="lab block mb-1">Edital</label>
          <input type="text" readOnly value={editalNome} className="fld bg-[#F9FAFC]" />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="lab block mb-1">Data Início</label>
          <input
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
            className="fld"
          />
        </div>
        <div className="w-28">
          <label className="lab block mb-1">Slots/Dia</label>
          <input
            type="number"
            value={slotsPorDia}
            onChange={e => setSlotsPorDia(e.target.value)}
            className="fld text-center font-bold"
          />
        </div>
        <div className="w-32">
          <label className="lab block mb-1">Duração (dias)</label>
          <input
            type="number"
            value={duracaoDias}
            onChange={e => setDuracaoDias(e.target.value)}
            className="fld text-center font-bold"
          />
        </div>
        <button
          onClick={fetchSugestao}
          className="btn border border-[#D9DCEB] h-11 flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw size={15} />
          <span>Nova sugestão</span>
        </button>
      </div>

      {/* Grid: Sequência do Ciclo à esquerda / Equilíbrio e Fora do Ciclo à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-start">
        {/* Sequência do Ciclo (lg:col-span-7) */}
        <div className="card lg:col-span-7 p-5 flex flex-col gap-4">
          <div>
            <h3 className="d font-bold text-xl text-[#14162B]">Sequência do ciclo</h3>
            <p className="text-xs text-[#5B607A] mt-0.5">
              Cada slot dura 1 hora. A sequência se repete circularmente até o fim dos 30 dias.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Agrupa slots em dias para visualização didática */}
            {[0, 1, 2].map(diaIdx => {
              const startSlot = diaIdx * 3;
              const slotsDoDia = slotsSequencia.slice(startSlot, startSlot + 3);

              return (
                <div key={diaIdx} className="flex flex-col gap-2">
                  <div className="text-xs font-bold text-[#5B607A] uppercase tracking-wider">
                    Dia {diaIdx + 1}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {slotsDoDia.map((s, idx) => {
                      const isDec = s.tipo === 'decoreba';
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl flex items-center gap-2 min-h-[56px] border ${
                            isDec ? 'bg-[#D3E3F5] border-[#BCD3EE] text-[#1F3F66]' : 'bg-[#FFF2CC] border-[#E8DCB0] text-[#6B4F00]'
                          }`}
                        >
                          <span className="text-[#8A8FA8] text-xs tracking-widest select-none">⋮⋮</span>
                          <span className="font-semibold text-xs leading-snug line-clamp-2">
                            {s.disciplina_nome}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Equilíbrio e Fora do Ciclo (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Card: Equilíbrio e Avisos */}
          <div className="card p-5 flex flex-col gap-3">
            <h3 className="d font-bold text-xl text-[#14162B]">Equilíbrio</h3>
            <div className="flex gap-2">
              <span className="chip dec">{totalDecoreba} decoreba</span>
              <span className="chip rac">{totalRaciocinio} raciocínio</span>
            </div>

            {avisos.length > 0 && (
              <div className="p-3 bg-[#FFF4D6] border border-[#FFE9B8] rounded-xl text-xs text-[#7A4B00] leading-relaxed">
                {avisos[0].mensagem}
              </div>
            )}
          </div>

          {/* Card: Fora do Ciclo */}
          <div className="card p-5 flex flex-col gap-3">
            <h3 className="d font-bold text-xl text-[#14162B]">Fora do ciclo</h3>
            <p className="text-xs text-[#5B607A]">
              Disciplinas cadastradas no edital que ainda não foram inseridas nesta rodada.
            </p>

            <div className="divide-y divide-[#EEF0F7]">
              {disciplinasFora.map(d => (
                <div key={d.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex flex-col pr-2">
                    <span className="text-xs font-semibold text-[#14162B] line-clamp-1">{d.nome}</span>
                    <div className="flex gap-1.5 mt-0.5">
                      <span className={`chip text-[10px] ${d.tipo === 'decoreba' ? 'dec' : 'rac'}`}>{d.tipo}</span>
                      {d.fase && <span className="chip f2 text-[10px]">Fase {d.fase}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdicionarAoCiclo(d)}
                    className="btn h-8 px-3 text-xs shrink-0"
                  >
                    Adicionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
