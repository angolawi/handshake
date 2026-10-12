import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  Check,
  AlertTriangle,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Trash2,
  Brain,
  Plus,
  Search,
  X,
  Info,
  Sparkles,
  Layers,
  ArrowRightLeft,
  Table,
  Calendar,
} from 'lucide-react';

interface PlanejarCicloProps {
  matriculaId?: string;
  onPublicado?: () => void;
}

interface SlotItem {
  disciplina_id: string;
  disciplina_nome: string;
  tipo: 'decoreba' | 'raciocinio';
  ordem: number;
}

interface DisciplinaEdital {
  id: string;
  nome: string;
  tipo: 'decoreba' | 'raciocinio';
  peso?: number;
}

interface NeuroMotivation {
  tipo: 'decoreba_dupla' | 'raciocinio_duplo';
  titulo: string;
  areaCerebral: string;
  mecanismo: string;
  impacto: string;
  recomendacao: string;
}

const NEURO_DATA: Record<'decoreba_dupla' | 'raciocinio_duplo', NeuroMotivation> = {
  decoreba_dupla: {
    tipo: 'decoreba_dupla',
    titulo: 'Choque Hipocampal: Interferência Proativa & Retroativa',
    areaCerebral: 'Hipocampo e Córtex Temporal Medial (Memória Declarativa)',
    mecanismo:
      'A sucessão de dois blocos densos de memorização semântica (leis, normas, prazos, jurisprudência e regimentos) satura a memória declarativa. O primeiro conteúdo compete com a retenção do segundo (interferência proativa), enquanto os novos detalhes dispersam traços mnemônicos recentes antes da consolidação sináptica (interferência retroativa).',
    impacto:
      'Fadiga mnemônica severa, confusão entre prazos de matérias distintas e decaimento acelerado da retenção na curva de esquecimento de Ebbinghaus.',
    recomendacao:
      'Intercale com uma disciplina analítica ou lógica (Raciocínio Lógico, Engenharia, Estatística) para conferir repouso sináptico ao hipocampo enquanto o córtex pré-frontal assume o comando.',
  },
  raciocinio_duplo: {
    tipo: 'raciocinio_duplo',
    titulo: 'Fadiga do Córtex Pré-Frontal Dorsolateral (DLPFC)',
    areaCerebral: 'Córtex Pré-Frontal Dorsolateral (DLPFC) & Sistema Dopaminérgico',
    mecanismo:
      'Disciplinas analíticas demandam resolução contínua de problemas e recrutamento intensivo da memória de trabalho (working memory). Blocos consecutivos esgotam rapidamente os estoques de glicose cerebral e provocam depleção de neurotransmissores como dopamina e noradrenalina, vitais para a atenção sustentada.',
    impacto:
      'Queda acentuada na velocidade de processamento, disparo de "erros bobos" em cálculos e algoritmos, e sensação precoce de saturação cognitiva.',
    recomendacao:
      'Intercale com uma disciplina de leitura conceitual ou normativa (Decoreba) para descarregar o córtex pré-frontal e ativar redes neurais semântico-temporais em ritmo reflexivo.',
  },
};

export const PlanejarCiclo: React.FC<PlanejarCicloProps> = ({
  matriculaId = 'mat_marina_cgu',
  onPublicado,
}) => {
  const [loading, setLoading] = useState(true);
  const [editalNome, setEditalNome] = useState('Concurso CGU');
  const [editalId, setEditalId] = useState('edital_cgu');
  const [dataInicio, setDataInicio] = useState('2026-11-08');
  const [slotsPorDia, setSlotsPorDia] = useState('3');
  const [duracaoDias, setDuracaoDias] = useState('30');
  const [publicando, setPublicando] = useState(false);
  const [publicadoSucesso, setPublicadoSucesso] = useState(false);

  // Sequência ativa e disciplinas reais do edital
  const [slotsSequencia, setSlotsSequencia] = useState<SlotItem[]>([]);
  const [todasDisciplinas, setTodasDisciplinas] = useState<DisciplinaEdital[]>([]);

  // Filtros da paleta lateral
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'decoreba' | 'raciocinio'>('todos');
  const [buscaDisciplina, setBuscaDisciplina] = useState('');

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Modal Neuropsicológico
  const [modalNeuroAberto, setModalNeuroAberto] = useState(false);
  const [focoNeuroTipo, setFocoNeuroTipo] = useState<'geral' | 'decoreba_dupla' | 'raciocinio_duplo'>('geral');

  // Orientação da Tabela Matricial N x N (Dias nas Linhas vs Dias nas Colunas)
  const [orientacaoTabela, setOrientacaoTabela] = useState<'dias_linhas' | 'dias_colunas'>('dias_linhas');

  // Carrega sugestão inicial inteligente e todas as disciplinas do edital
  const fetchSugestaoInteligente = () => {
    setLoading(true);
    fetch('/api/ciclos/sugerir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matriculaId,
        editalId,
        slotsPorDia: Number(slotsPorDia) || 3,
        duracaoDias: Number(duracaoDias) || 30,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.slotsSequencia) {
          setSlotsSequencia(data.slotsSequencia);
        }
        if (data.todasDisciplinas) {
          setTodasDisciplinas(data.todasDisciplinas);
        }
        if (data.editalNome) {
          setEditalNome(data.editalNome);
        }
        if (data.editalId) {
          setEditalId(data.editalId);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSugestaoInteligente();
  }, [matriculaId, slotsPorDia]);

  // Contagem de slots por disciplina para exibir na paleta
  const frequenciaPorDisciplina = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const slot of slotsSequencia) {
      mapa.set(slot.disciplina_id, (mapa.get(slot.disciplina_id) || 0) + 1);
    }
    return mapa;
  }, [slotsSequencia]);

  // Disciplinas filtradas para a paleta lateral
  const disciplinasFiltradas = useMemo(() => {
    return todasDisciplinas.filter(d => {
      const matchTipo = filtroTipo === 'todos' || d.tipo === filtroTipo;
      const matchBusca =
        !buscaDisciplina.trim() ||
        d.nome.toLowerCase().includes(buscaDisciplina.toLowerCase());
      return matchTipo && matchBusca;
    });
  }, [todasDisciplinas, filtroTipo, buscaDisciplina]);

  // Identificação em tempo real de choques cognitivos consecutivos
  const choquesCognitivos = useMemo(() => {
    const choques: Array<{
      index1: number;
      index2: number;
      disc1: string;
      disc2: string;
      tipo: 'decoreba' | 'raciocinio';
      chave: 'decoreba_dupla' | 'raciocinio_duplo';
      motivacao: NeuroMotivation;
    }> = [];

    for (let i = 0; i < slotsSequencia.length - 1; i++) {
      const s1 = slotsSequencia[i];
      const s2 = slotsSequencia[i + 1];
      if (s1.tipo === s2.tipo) {
        const chave = s1.tipo === 'decoreba' ? 'decoreba_dupla' : 'raciocinio_duplo';
        choques.push({
          index1: i,
          index2: i + 1,
          disc1: s1.disciplina_nome,
          disc2: s2.disciplina_nome,
          tipo: s1.tipo,
          chave,
          motivacao: NEURO_DATA[chave],
        });
      }
    }
    return choques;
  }, [slotsSequencia]);

  // Ações de Manipulação da Sequência
  const handleAdicionarAoCiclo = (disc: DisciplinaEdital) => {
    setSlotsSequencia(prev => [
      ...prev,
      {
        disciplina_id: disc.id,
        disciplina_nome: disc.nome,
        tipo: disc.tipo,
        ordem: prev.length + 1,
      },
    ]);
  };

  const handleRemoverSlot = (index: number) => {
    setSlotsSequencia(prev => {
      const nova = prev.filter((_, i) => i !== index);
      return nova.map((s, idx) => ({ ...s, ordem: idx + 1 }));
    });
  };

  const handleMoverSlot = (fromIndex: number, direcao: 'cima' | 'baixo') => {
    const targetIndex = direcao === 'cima' ? fromIndex - 1 : fromIndex + 1;
    if (targetIndex < 0 || targetIndex >= slotsSequencia.length) return;

    setSlotsSequencia(prev => {
      const copia = [...prev];
      const [item] = copia.splice(fromIndex, 1);
      copia.splice(targetIndex, 0, item);
      return copia.map((s, idx) => ({ ...s, ordem: idx + 1 }));
    });
  };

  const handleTrocarDisciplinaSlot = (index: number, novaDisciplinaId: string) => {
    const disc = todasDisciplinas.find(d => d.id === novaDisciplinaId);
    if (!disc) return;

    setSlotsSequencia(prev => {
      const copia = [...prev];
      copia[index] = {
        ...copia[index],
        disciplina_id: disc.id,
        disciplina_nome: disc.nome,
        tipo: disc.tipo,
      };
      return copia;
    });
  };

  // Drag and Drop Nativo HTML5
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    // mantido leve para não piscar
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');

    if (data && data.startsWith('palette:')) {
      const discId = data.replace('palette:', '');
      handleTrocarDisciplinaSlot(targetIndex, discId);
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setSlotsSequencia(prev => {
      const copia = [...prev];
      const [movido] = copia.splice(draggedIndex, 1);
      copia.splice(targetIndex, 0, movido);
      return copia.map((s, idx) => ({ ...s, ordem: idx + 1 }));
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const abrirModalNeuro = (tipoFoco: 'geral' | 'decoreba_dupla' | 'raciocinio_duplo') => {
    setFocoNeuroTipo(tipoFoco);
    setModalNeuroAberto(true);
  };

  // Publicar o ciclo customizado no banco de dados
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
          duracaoDias: Number(duracaoDias) || 30,
          slotsPorDia: Number(slotsPorDia) || 3,
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
  const numSlotsPorDia = Math.max(1, Number(slotsPorDia) || 3);
  const totalSlotsEsperados = numSlotsPorDia * numSlotsPorDia;
  const diasPorVolta = numSlotsPorDia;
  const voltasPorSemana = Number((6 / diasPorVolta).toFixed(1));
  const metaSemanalAtingida = voltasPorSemana >= 2.0;
  const totalDiasCiclo = numSlotsPorDia;

  const renderSlotCard = (globalIdx: number) => {
    const slot = slotsSequencia[globalIdx];
    if (!slot) {
      return (
        <div
          onDragOver={e => handleDragOver(e, globalIdx)}
          onDrop={e => handleDrop(e, globalIdx)}
          className="h-full min-h-[110px] p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center gap-1 bg-slate-50/50"
        >
          <span className="text-xs text-slate-400 font-semibold">Slot #{globalIdx + 1} vazio</span>
          <button
            onClick={() => todasDisciplinas[0] && handleAdicionarAoCiclo(todasDisciplinas[0])}
            className="text-[11px] text-indigo-600 font-medium hover:underline flex items-center gap-1"
          >
            <Plus size={12} /> Preencher
          </button>
        </div>
      );
    }

    const isDecoreba = slot.tipo === 'decoreba';
    const isBeingDragged = draggedIndex === globalIdx;
    const isDropTarget = dragOverIndex === globalIdx;
    const choqueComAnterior =
      globalIdx > 0 && slotsSequencia[globalIdx - 1]?.tipo === slot.tipo;
    const tipoChoque = isDecoreba ? 'decoreba_dupla' : 'raciocinio_duplo';

    return (
      <div
        draggable
        onDragStart={e => handleDragStart(e, globalIdx)}
        onDragOver={e => handleDragOver(e, globalIdx)}
        onDragLeave={handleDragLeave}
        onDrop={e => handleDrop(e, globalIdx)}
        onDragEnd={handleDragEnd}
        className={`h-full min-h-[112px] p-2.5 rounded-xl flex flex-col justify-between gap-2 border transition-all duration-150 select-none ${
          isBeingDragged
            ? 'opacity-40 border-dashed border-indigo-400 bg-indigo-50/50'
            : isDropTarget
            ? 'ring-2 ring-indigo-600 bg-indigo-50 shadow-md scale-[1.02]'
            : isDecoreba
            ? 'bg-[#D3E3F5] border-[#BCD3EE] text-[#1F3F66] hover:border-blue-400 shadow-2xs'
            : 'bg-[#FFF2CC] border-[#E8DCB0] text-[#6B4F00] hover:border-amber-400 shadow-2xs'
        }`}
      >
        {/* Topo do Card: Número do Slot + Botões Reordenar/Remover */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing">
            <GripVertical size={14} className="text-slate-500 hover:text-black shrink-0" />
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10 shrink-0">
              #{globalIdx + 1}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleMoverSlot(globalIdx, 'cima')}
              disabled={globalIdx === 0}
              title="Mover para slot anterior"
              className="w-5 h-5 rounded hover:bg-black/10 disabled:opacity-20 disabled:hover:bg-transparent flex items-center justify-center transition text-inherit"
            >
              <ArrowUp size={12} />
            </button>
            <button
              onClick={() => handleMoverSlot(globalIdx, 'baixo')}
              disabled={globalIdx === slotsSequencia.length - 1}
              title="Mover para próximo slot"
              className="w-5 h-5 rounded hover:bg-black/10 disabled:opacity-20 disabled:hover:bg-transparent flex items-center justify-center transition text-inherit"
            >
              <ArrowDown size={12} />
            </button>
            <button
              onClick={() => handleRemoverSlot(globalIdx)}
              title="Remover este slot"
              className="w-5 h-5 rounded hover:bg-red-500/20 text-red-700 flex items-center justify-center transition ml-0.5"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Meio: Dropdown de Disciplina */}
        <div className="my-0.5">
          <select
            value={slot.disciplina_id}
            onChange={e => handleTrocarDisciplinaSlot(globalIdx, e.target.value)}
            className="w-full text-xs font-bold bg-white/70 hover:bg-white rounded-md p-1.5 border border-black/10 text-[#14162B] truncate cursor-pointer focus:outline-indigo-500 leading-snug"
            title="Clique para trocar a disciplina deste slot"
          >
            {todasDisciplinas.map(d => (
              <option key={d.id} value={d.id} className="text-[#14162B] bg-white">
                {d.nome} ({d.tipo})
              </option>
            ))}
          </select>
        </div>

        {/* Rodapé do Card: Badge de Tipo + Alerta de Choque se houver */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-black/5">
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
              isDecoreba ? 'bg-[#BCD3EE] text-[#1F3F66]' : 'bg-[#E8DCB0] text-[#6B4F00]'
            }`}
          >
            {slot.tipo}
          </span>

          {choqueComAnterior && (
            <button
              onClick={() => abrirModalNeuro(tipoChoque)}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-900 border border-amber-500/40 hover:bg-amber-500/40 flex items-center gap-1 transition shrink-0"
              title="Choque cognitivo consecutivo! Clique para ver fundamentação neuropsicológica"
            >
              <AlertTriangle size={11} className="text-amber-700" />
              <span>2x {slot.tipo === 'decoreba' ? 'Dec' : 'Rac'}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1360px] mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="d font-bold text-3xl md:text-4xl text-[#14162B] tracking-tight">Planejar ciclo</h1>
            <span className="chip text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 font-semibold">
              <Sparkles size={13} /> Edição Livre & Drag-and-Drop
            </span>
          </div>
          <div className="text-base text-[#5B607A] mt-1">
            Marina R. · Ciclo 02 · {editalNome}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => abrirModalNeuro('geral')}
            className="btn border border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 h-11 flex items-center gap-2 text-sm font-semibold transition"
          >
            <Brain size={18} className="text-indigo-600" />
            <span>Neurociência do Ciclo</span>
          </button>

          {publicadoSucesso ? (
            <span className="chip ok py-2 px-4 text-sm font-semibold flex items-center gap-1.5 h-11">
              <Check size={16} /> Publicado com sucesso!
            </span>
          ) : (
            <button
              onClick={handlePublicarCiclo}
              disabled={publicando || slotsSequencia.length === 0}
              className="btn btn-primary h-11 px-5 shadow-sm"
            >
              {publicando ? 'Publicando...' : 'Publicar para o aluno'}
            </button>
          )}
        </div>
      </div>

      {/* Controles de Configuração do Ciclo */}
      <div className="card p-4 px-5 flex flex-wrap items-end gap-3 shadow-xs">
        <div className="flex-1 min-w-[200px]">
          <label className="lab block mb-1">Edital Ativo</label>
          <input type="text" readOnly value={editalNome} className="fld bg-[#F9FAFC] font-semibold text-[#14162B]" />
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
            min="1"
            max="10"
            value={slotsPorDia}
            onChange={e => setSlotsPorDia(e.target.value)}
            className="fld text-center font-bold"
          />
        </div>
        <div className="w-32">
          <label className="lab block mb-1">Duração (dias)</label>
          <input
            type="number"
            min="7"
            max="180"
            value={duracaoDias}
            onChange={e => setDuracaoDias(e.target.value)}
            className="fld text-center font-bold"
          />
        </div>
        <button
          onClick={fetchSugestaoInteligente}
          disabled={loading}
          className="btn border border-[#D9DCEB] hover:bg-slate-50 h-11 flex items-center gap-2 shrink-0 text-sm font-semibold"
          title="Regenerar sugestão inicial inteligente com base nas matérias do edital"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Restaurar Sugestão Inteligente</span>
        </button>
      </div>

      {/* Grid Principal: Sequência Reordenável (Esquerda) / Paleta de Disciplinas e Análise (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: Sequência do Ciclo Matricial (lg:col-span-8) */}
        <div className="card lg:col-span-8 p-5 flex flex-col gap-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEF0F7] pb-3">
            <div>
              <h3 className="d font-bold text-xl text-[#14162B] flex items-center gap-2">
                <span>Tabela do ciclo de estudos</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Matriz {numSlotsPorDia}x{numSlotsPorDia} ({slotsSequencia.length} slots)
                </span>
              </h3>
              <p className="text-xs text-[#5B607A] mt-0.5">
                Estrutura matricial dimensionada para a carga diária do aluno. Arraste qualquer slot para mudar a ordem ou altere direto na célula.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5B607A]">
                Distribuição: <strong className="text-[#1F3F66]">{totalDecoreba} Decoreba</strong> /{' '}
                <strong className="text-[#6B4F00]">{totalRaciocinio} Raciocínio</strong>
              </span>
            </div>
          </div>

          {/* Card Pedagógico: Metodologia Gleyson Azevedo & Frequência de Rotação */}
          <div className="bg-[#FAFBFD] border border-[#EEF0F7] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Table size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#14162B] uppercase tracking-wider">
                    Estrutura Matricial do Ciclo ({numSlotsPorDia}x{numSlotsPorDia})
                  </h4>
                  <p className="text-[11px] text-[#5B607A]">
                    Tamanho dimensionado pela carga diária: {numSlotsPorDia} slots/dia × {numSlotsPorDia} dias = {totalSlotsEsperados} slots por volta
                  </p>
                </div>
              </div>

              {/* Botão de Alternar Orientação */}
              <button
                onClick={() =>
                  setOrientacaoTabela(prev => (prev === 'dias_linhas' ? 'dias_colunas' : 'dias_linhas'))
                }
                className="btn text-xs border border-[#D9DCEB] bg-white hover:bg-slate-50 flex items-center gap-2 py-1.5 px-3 self-start sm:self-auto font-semibold shadow-2xs"
                title="Alternar entre orientação Por Linhas (Horizontal) ou Por Colunas (Vertical)"
              >
                <ArrowRightLeft size={13} className="text-indigo-600" />
                <span>
                  Orientação: {orientacaoTabela === 'dias_linhas' ? 'Por Linhas (Horizontal)' : 'Por Colunas (Vertical)'}
                </span>
              </button>
            </div>

            {/* Painel de Métricas Pedagógicas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#EEF0F7]">
              <div className="p-2.5 rounded-xl bg-white border border-[#EEF0F7] flex flex-col">
                <span className="text-[10px] uppercase font-bold text-[#8A8FA8]">Matriz</span>
                <span className="text-sm font-bold text-[#14162B]">
                  {numSlotsPorDia} × {numSlotsPorDia} ({totalSlotsEsperados} slots)
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#EEF0F7] flex flex-col">
                <span className="text-[10px] uppercase font-bold text-[#8A8FA8]">1 Volta Completa</span>
                <span className="text-sm font-bold text-[#14162B]">
                  {diasPorVolta} dias de estudo
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#EEF0F7] flex flex-col">
                <span className="text-[10px] uppercase font-bold text-[#8A8FA8]">Frequência Semanal</span>
                <span className="text-sm font-bold text-indigo-700">
                  {voltasPorSemana} voltas / semana
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#EEF0F7] flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-[#8A8FA8]">Meta Metodologia</span>
                {metaSemanalAtingida ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <Check size={12} /> ≥ 2 voltas/sem
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <AlertTriangle size={12} /> {voltasPorSemana}x (&lt; 2x/sem)
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-[#5B607A] leading-relaxed">
              💡 <strong>Regra de Ouro (Gleyson Azevedo):</strong> O ciclo deve rodar no mínimo{' '}
              <strong>2 vezes por semana</strong> ({voltasPorSemana}x neste plano de {numSlotsPorDia}h/dia). Isso garante que cada disciplina seja revisitada a cada {diasPorVolta} dias, evitando o decaimento sináptico hipocampal e consolidando a retenção de longo prazo.
            </p>
          </div>

          {loading ? (
            <div className="py-16 text-center text-[#5B607A] flex flex-col items-center gap-2">
              <RefreshCw size={24} className="animate-spin text-indigo-600" />
              <p className="text-sm">Carregando e otimizando matriz do ciclo...</p>
            </div>
          ) : slotsSequencia.length === 0 ? (
            <div className="py-16 text-center text-[#5B607A] border-2 border-dashed border-[#E3E5F3] rounded-2xl p-6">
              <Layers size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-[#14162B]">O ciclo está vazio</p>
              <p className="text-xs text-[#5B607A] mt-1">
                Adicione matérias pela paleta ao lado ou clique em Restaurar Sugestão Inteligente.
              </p>
              <button
                onClick={fetchSugestaoInteligente}
                className="btn btn-primary mt-4 h-9 text-xs"
              >
                Gerar Sugestão Automática
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* TABELA MATRICIAL N x N */}
              {orientacaoTabela === 'dias_linhas' ? (
                <div className="overflow-x-auto rounded-xl border border-[#EEF0F7] bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse min-w-[580px] table-fixed">
                    <thead>
                      <tr className="bg-[#FAFBFD] border-b border-[#EEF0F7]">
                        {Array.from({ length: numSlotsPorDia }).map((_, slotIdx) => (
                          <th
                            key={slotIdx}
                            className="py-3 px-3 text-xs font-bold text-[#5B607A] uppercase tracking-wider"
                            style={{ width: `${100 / numSlotsPorDia}%` }}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              <span>Slot {slotIdx + 1} ({slotIdx + 1}ª hora)</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF0F7]">
                      {Array.from({ length: numSlotsPorDia }).map((_, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-slate-50/50">
                          {Array.from({ length: numSlotsPorDia }).map((_, slotIdx) => {
                            const globalIdx = rowIdx * numSlotsPorDia + slotIdx;
                            return (
                              <td
                                key={slotIdx}
                                className="p-2 align-top"
                                style={{ width: `${100 / numSlotsPorDia}%` }}
                              >
                                {renderSlotCard(globalIdx)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#EEF0F7] bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse min-w-[580px] table-fixed">
                    <thead>
                      <tr className="bg-[#FAFBFD] border-b border-[#EEF0F7]">
                        {Array.from({ length: numSlotsPorDia }).map((_, colIdx) => (
                          <th
                            key={colIdx}
                            className="py-3 px-3 text-xs font-bold text-[#5B607A] uppercase tracking-wider"
                            style={{ width: `${100 / numSlotsPorDia}%` }}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              <span>
                                Coluna {colIdx + 1} (Slots {colIdx * numSlotsPorDia + 1} a {(colIdx + 1) * numSlotsPorDia})
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF0F7]">
                      {Array.from({ length: numSlotsPorDia }).map((_, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-slate-50/50">
                          {Array.from({ length: numSlotsPorDia }).map((_, colIdx) => {
                            const globalIdx = colIdx * numSlotsPorDia + rowIdx;
                            return (
                              <td
                                key={colIdx}
                                className="p-2 align-top"
                                style={{ width: `${100 / numSlotsPorDia}%` }}
                              >
                                {renderSlotCard(globalIdx)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Slots adicionais além da matriz N x N (se houver) */}
              {slotsSequencia.length > totalSlotsEsperados && (
                <div className="mt-2 p-3.5 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950">
                      Slots adicionais além da matriz principal ({numSlotsPorDia}x{numSlotsPorDia}):
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded-full">
                      +{slotsSequencia.length - totalSlotsEsperados} slot(s) excedente(s)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {slotsSequencia.slice(totalSlotsEsperados).map((_, extraIdx) => {
                      const globalIdx = totalSlotsEsperados + extraIdx;
                      return <div key={globalIdx}>{renderSlotCard(globalIdx)}</div>;
                    })}
                  </div>
                </div>
              )}

              {/* Resumo de Choques Cognitivos Detectados na Sequência */}
              {choquesCognitivos.length > 0 && (
                <div className="mt-2 p-3.5 bg-[#FEF3C7] border border-[#F59E0B]/50 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-[#92400E] shrink-0" />
                      <span className="text-xs font-bold text-[#92400E]">
                        {choquesCognitivos.length} choque(s) cognitivo(s) consecutivo(s) no ciclo:
                      </span>
                    </div>
                    <button
                      onClick={() => abrirModalNeuro('geral')}
                      className="text-xs font-bold text-[#92400E] underline hover:text-black"
                    >
                      Ver Todas as Justificativas Neuropsicológicas →
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {choquesCognitivos.map((choque, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => abrirModalNeuro(choque.chave)}
                        className="text-[11px] font-semibold bg-white/80 hover:bg-white text-[#92400E] border border-amber-300 rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-2xs transition"
                      >
                        <span>
                          Slot #{choque.index1 + 1} ({choque.disc1}) → Slot #{choque.index2 + 1} ({choque.disc2})
                        </span>
                        <span className="text-[10px] font-bold uppercase opacity-80">
                          [{choque.tipo}]
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: Equilíbrio, Choques e Paleta de Matérias do Edital (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Card: Diagnóstico Cognitivo & Equilíbrio */}
          <div className="card p-5 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="d font-bold text-lg text-[#14162B]">Equilíbrio Cognitivo</h3>
              <button
                onClick={() => abrirModalNeuro('geral')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Brain size={14} />
                <span>Neurociência</span>
              </button>
            </div>

            <div className="flex gap-2">
              <span className="chip dec flex-1 justify-center py-2 text-xs font-semibold">
                {totalDecoreba} Decoreba
              </span>
              <span className="chip rac flex-1 justify-center py-2 text-xs font-semibold">
                {totalRaciocinio} Raciocínio
              </span>
            </div>

            {/* Status do Interleaving */}
            {choquesCognitivos.length === 0 ? (
              <div className="p-3 bg-[#E8F8F0] border border-[#BCE8D0] rounded-xl text-xs text-[#13613A] flex items-center gap-2">
                <Check size={16} className="shrink-0 text-emerald-600" />
                <span>
                  <strong>Excelente Alternância:</strong> O ciclo segue o princípio do <em>Interleaving</em> sem choques de mesma carga consecutiva.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-[#FEF3C7] border border-[#F59E0B]/60 rounded-xl text-xs text-[#92400E] flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                  <span>{choquesCognitivos.length} choque(s) cognitivo(s) detectado(s)</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Disciplinas de mesma polaridade mental foram alocadas em sequência. O mentor tem total autonomia para manter, mas a neurociência sugere alternar.
                </p>
                <button
                  onClick={() => abrirModalNeuro(choquesCognitivos[0].chave)}
                  className="btn h-7 text-xs bg-white text-[#92400E] border border-amber-300 hover:bg-amber-50 mt-1 font-semibold self-start"
                >
                  Entender o Impacto Neuropsicológico
                </button>
              </div>
            )}
          </div>

          {/* Card: Paleta Completa de Disciplinas do Edital */}
          <div className="card p-5 flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="d font-bold text-lg text-[#14162B]">Matérias do Edital</h3>
                <p className="text-xs text-[#5B607A]">
                  Selecione e adicione livremente qualquer matéria ao ciclo.
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {todasDisciplinas.length}
              </span>
            </div>

            {/* Barra de Busca */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8FA8]" />
              <input
                type="text"
                placeholder="Buscar disciplina..."
                value={buscaDisciplina}
                onChange={e => setBuscaDisciplina(e.target.value)}
                className="fld pl-8 text-xs h-9 w-full"
              />
              {buscaDisciplina && (
                <button
                  onClick={() => setBuscaDisciplina('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filtros por Tipo Cognitivo */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setFiltroTipo('todos')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition ${
                  filtroTipo === 'todos'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({todasDisciplinas.length})
              </button>
              <button
                onClick={() => setFiltroTipo('decoreba')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition ${
                  filtroTipo === 'decoreba'
                    ? 'bg-[#1F3F66] text-white'
                    : 'bg-[#D3E3F5] text-[#1F3F66] hover:bg-[#BCD3EE]'
                }`}
              >
                Decoreba ({todasDisciplinas.filter(d => d.tipo === 'decoreba').length})
              </button>
              <button
                onClick={() => setFiltroTipo('raciocinio')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition ${
                  filtroTipo === 'raciocinio'
                    ? 'bg-[#6B4F00] text-white'
                    : 'bg-[#FFF2CC] text-[#6B4F00] hover:bg-[#E8DCB0]'
                }`}
              >
                Raciocínio ({todasDisciplinas.filter(d => d.tipo === 'raciocinio').length})
              </button>
            </div>

            {/* Lista de Disciplinas da Paleta */}
            <div className="divide-y divide-[#EEF0F7] max-h-[460px] overflow-y-auto pr-1">
              {disciplinasFiltradas.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#5B607A]">
                  Nenhuma disciplina encontrada com esse filtro.
                </div>
              ) : (
                disciplinasFiltradas.map(d => {
                  const freq = frequenciaPorDisciplina.get(d.id) || 0;
                  const isDec = d.tipo === 'decoreba';

                  return (
                    <div
                      key={d.id}
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('text/plain', `palette:${d.id}`);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      className="py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/80 px-1 rounded-lg cursor-grab active:cursor-grabbing group"
                      title="Clique em Adicionar ou arraste para qualquer slot da tabela"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 pr-1">
                        <GripVertical size={14} className="text-slate-400 group-hover:text-indigo-600 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-[#14162B] line-clamp-1 leading-snug">
                            {d.nome}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`chip text-[10px] py-0.5 px-1.5 ${isDec ? 'dec' : 'rac'}`}>
                              {d.tipo}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                freq === 0
                                  ? 'bg-slate-100 text-slate-500'
                                  : 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                              }`}
                            >
                              {freq === 0 ? 'Fora do ciclo' : `${freq}x no ciclo`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAdicionarAoCiclo(d)}
                        className="btn h-8 px-2.5 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50 shrink-0 font-semibold flex items-center gap-1"
                        title="Adicionar mais um slot desta matéria ao final da sequência"
                      >
                        <Plus size={14} />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE MOTIVAÇÃO NEUROPSICOLÓGICA */}
      {modalNeuroAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Cabeçalho da Modal */}
            <div className="flex items-start justify-between border-b border-[#EEF0F7] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Brain size={22} />
                </div>
                <div>
                  <h3 className="d font-bold text-xl text-[#14162B]">
                    Fundamentação Neuropsicológica
                  </h3>
                  <p className="text-xs text-[#5B607A]">
                    Base científica sobre o Efeito de Intercalação (*Interleaving Effect*) e fadiga cognitiva.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalNeuroAberto(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo Didático da Modal */}
            <div className="flex flex-col gap-4 text-sm text-[#3A3F5C] leading-relaxed">
              {/* Bloco 1: O Princípio do Interleaving */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-150 rounded-xl">
                <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm mb-1">
                  <Sparkles size={16} className="text-indigo-600" />
                  <span>Princípio da Alternância Cognitiva (Interleaving Effect)</span>
                </div>
                <p className="text-xs text-indigo-950 leading-relaxed">
                  Estudos em neurociência cognitiva (Bjork & Kornell) comprovam que alternar disciplinas conceituais (decoreba) e analíticas (raciocínio) permite que uma rede neural entre em <strong>fase passiva de consolidação</strong> enquanto a outra assume o processamento ativo. Isso aumenta a taxa de retenção a longo prazo em até <strong>43%</strong> e previne a habituação atencional.
                </p>
              </div>

              {/* Bloco 2: Choque Decoreba + Decoreba */}
              <div
                className={`p-4 rounded-xl border transition ${
                  focoNeuroTipo === 'decoreba_dupla'
                    ? 'bg-[#FEF3C7] border-amber-400 ring-2 ring-amber-300'
                    : 'bg-[#FFFBEB] border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-bold text-[#92400E]">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <span>{NEURO_DATA.decoreba_dupla.titulo}</span>
                  </div>
                  <span className="chip dec text-[10px]">Hipocampo</span>
                </div>
                <div className="text-xs text-[#78350F] flex flex-col gap-1.5">
                  <p>
                    <strong>Região envolvida:</strong> {NEURO_DATA.decoreba_dupla.areaCerebral}
                  </p>
                  <p>
                    <strong>Mecanismo biológico:</strong> {NEURO_DATA.decoreba_dupla.mecanismo}
                  </p>
                  <p>
                    <strong>Impacto prático no aluno:</strong> {NEURO_DATA.decoreba_dupla.impacto}
                  </p>
                  <div className="p-2.5 bg-white/70 rounded-lg border border-amber-200 text-[#92400E] font-medium mt-1">
                    💡 <strong>Recomendação:</strong> {NEURO_DATA.decoreba_dupla.recomendacao}
                  </div>
                </div>
              </div>

              {/* Bloco 3: Choque Raciocínio + Raciocínio */}
              <div
                className={`p-4 rounded-xl border transition ${
                  focoNeuroTipo === 'raciocinio_duplo'
                    ? 'bg-[#FFEDD5] border-orange-400 ring-2 ring-orange-300'
                    : 'bg-[#FFF7ED] border-orange-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-bold text-[#9A3412]">
                    <AlertTriangle size={16} className="text-orange-600" />
                    <span>{NEURO_DATA.raciocinio_duplo.titulo}</span>
                  </div>
                  <span className="chip rac text-[10px]">Córtex DLPFC</span>
                </div>
                <div className="text-xs text-[#7C2D12] flex flex-col gap-1.5">
                  <p>
                    <strong>Região envolvida:</strong> {NEURO_DATA.raciocinio_duplo.areaCerebral}
                  </p>
                  <p>
                    <strong>Mecanismo biológico:</strong> {NEURO_DATA.raciocinio_duplo.mecanismo}
                  </p>
                  <p>
                    <strong>Impacto prático no aluno:</strong> {NEURO_DATA.raciocinio_duplo.impacto}
                  </p>
                  <div className="p-2.5 bg-white/70 rounded-lg border border-orange-200 text-[#9A3412] font-medium mt-1">
                    💡 <strong>Recomendação:</strong> {NEURO_DATA.raciocinio_duplo.recomendacao}
                  </div>
                </div>
              </div>

              {/* Nota de Autonomia Total do Mentor */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#5B607A] flex items-start gap-2">
                <Info size={16} className="shrink-0 text-slate-500 mt-0.5" />
                <p>
                  <strong>Autonomia Pedagógica:</strong> Estes avisos são informativos. O mentor tem total autoridade para manter disciplinas consecutivas caso haja um objetivo pedagógico específico (como sprints de aprofundamento ou preparação de reta final).
                </p>
              </div>
            </div>

            {/* Rodapé da Modal */}
            <div className="flex justify-end pt-2 border-t border-[#EEF0F7]">
              <button
                onClick={() => setModalNeuroAberto(false)}
                className="btn btn-primary h-10 px-5 text-sm"
              >
                Entendi, voltar ao planejamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
