import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  Check,
  BarChart2,
  Shield,
  Settings2,
  BookOpen,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Brain,
  Layers,
  TrendingUp,
  Target,
} from 'lucide-react';
import { RelatorioReuniaoSemanal } from './RelatorioReuniaoSemanal.js';

interface MentoradoDetalheProps {
  mentoradoId: string;
  onVoltar: () => void;
}

export const MentoradoDetalhe: React.FC<MentoradoDetalheProps> = ({ mentoradoId, onVoltar }) => {
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'questoes_semanais' | 'auditoria'>('geral');
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [fotoSelecionadaId, setFotoSelecionadaId] = useState<string | null>(null);
  const [comentando, setComentando] = useState(false);
  const [comentarioSucesso, setComentarioSucesso] = useState(false);

  // Modal de ajuste de tempos (HU-1.4)
  const [showModalTempos, setShowModalTempos] = useState(false);
  const [fase1Estudo, setFase1Estudo] = useState('45');
  const [fase1Teste, setFase1Teste] = useState('10');
  const [fase1Recorde, setFase1Recorde] = useState('5');
  const [salvandoTempos, setSalvandoTempos] = useState(false);

  // Modal de override de fase pelo mentor (HU-4.5)
  const [showModalOverrideFase, setShowModalOverrideFase] = useState(false);
  const [discOverrideId, setDiscOverrideId] = useState<string>('disc_estado');
  const [discOverrideNome, setDiscOverrideNome] = useState<string>('Estado, Democracia');
  const [faseNova, setFaseNova] = useState<number>(2);
  const [salvandoOverride, setSalvandoOverride] = useState(false);

  // Modal de troca de Edital (HU-2.7)
  const [showModalMudarEdital, setShowModalMudarEdital] = useState(false);
  const [editaisDisponiveis, setEditaisDisponiveis] = useState<any[]>([]);
  const [novoEditalId, setNovoEditalId] = useState('');
  const [salvandoEdital, setSalvandoEdital] = useState(false);

  const fetchDetalhes = () => {
    fetch(`/api/mentorados/${mentoradoId}`)
      .then(res => res.json())
      .then(d => {
        setDados(d);
        if (d.resumos && d.resumos.length > 0 && !fotoSelecionadaId) {
          setFotoSelecionadaId(d.resumos[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetalhes();
  }, [mentoradoId]);

  const handleEnviarComentario = async () => {
    if (!comentarioTexto.trim() || !fotoSelecionadaId) return;
    setComentando(true);

    try {
      const res = await fetch(`/api/resumos/${fotoSelecionadaId}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autorId: 'usr_mentor_gleyson',
          texto: comentarioTexto.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setComentarioTexto('');
        setComentarioSucesso(true);
        setTimeout(() => setComentarioSucesso(false), 2000);
        fetchDetalhes();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setComentando(false);
    }
  };

  const handleSalvarTempos = async () => {
    setSalvandoTempos(true);
    try {
      await fetch(`/api/mentorados/${mentoradoId}/tempos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duracoes: {
            fase1: {
              estudoMin: Number(fase1Estudo),
              testeMin: Number(fase1Teste),
              recordeMin: Number(fase1Recorde),
              descansoMin: 15,
            },
          },
          mentorId: 'usr_mentor_gleyson',
        }),
      });
      setShowModalTempos(false);
      fetchDetalhes();
    } catch (e) {
      console.error(e);
    } finally {
      setSalvandoTempos(false);
    }
  };

  const handleSalvarOverrideFase = async () => {
    setSalvandoOverride(true);
    try {
      await fetch('/api/mentor/override-fase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: 'usr_mentor_gleyson',
          matriculaId: dados?.matricula?.id || 'mat_marina_cgu',
          disciplinaId: discOverrideId,
          faseNova,
        }),
      });
      setShowModalOverrideFase(false);
      fetchDetalhes();
    } catch (e) {
      console.error(e);
    } finally {
      setSalvandoOverride(false);
    }
  };

  const handleAbrirMudarEdital = async () => {
    try {
      const res = await fetch('/api/editais');
      const data = await res.json();
      setEditaisDisponiveis(data || []);
      setNovoEditalId(dados?.matricula?.edital_id || data[0]?.id || '');
      setShowModalMudarEdital(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSalvarEdital = async () => {
    if (!novoEditalId) return;
    setSalvandoEdital(true);
    try {
      await fetch('/api/matriculas/atribuir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentoradoId,
          editalId: novoEditalId,
          mentorId: 'usr_mentor_gleyson',
        }),
      });
      setShowModalMudarEdital(false);
      fetchDetalhes();
    } catch (e) {
      console.error(e);
    } finally {
      setSalvandoEdital(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#5B607A]">Carregando dados do aluno...</div>;
  }

  const mentorado = dados?.mentorado;
  const auditorias = dados?.auditorias || [];
  const resumos = dados?.resumos || [];
  const matriculaId = dados?.matricula?.id || 'mat_marina_cgu';
  const metricas = dados?.metricas;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1280px] mx-auto">
      {/* Botão Voltar */}
      <button
        onClick={onVoltar}
        className="flex items-center gap-1.5 text-sm font-semibold text-[#4338CA] hover:underline w-fit"
      >
        <ArrowLeft size={16} />
        <span>Voltar para painel de mentorados</span>
      </button>

      {/* Cabeçalho do Mentorado */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="lab">Mentorado · {dados?.matricula?.edital_nome || 'CGU'}</div>
          <h1 className="d font-bold text-3xl md:text-4xl text-[#14162B] tracking-tight mt-1">
            {mentorado?.nome}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="chip gr font-medium">reunião às terças</span>
            <span className="chip f1 font-medium">
              mentoria até {mentorado?.fim_mentoria ? mentorado.fim_mentoria.split('-').reverse().join('/') : '30/04/2027'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleAbrirMudarEdital} className="btn flex items-center gap-1.5">
            <BookOpen size={15} />
            <span>Trocar edital</span>
          </button>
          <button onClick={() => setShowModalTempos(true)} className="btn flex items-center gap-1.5">
            <Settings2 size={15} />
            <span>Ajustar tempos</span>
          </button>
        </div>
      </div>

      {/* Abas Secundárias do Mentorado */}
      <div className="flex gap-2 border-b border-[#E3E5F3] pb-1">
        <button
          onClick={() => setActiveTab('geral')}
          className={`h-10 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'geral' ? 'border-[#FFD84D] text-[#14162B]' : 'border-transparent text-[#5B607A] hover:text-[#14162B]'
          }`}
        >
          Visão geral
        </button>
        <button
          onClick={() => setActiveTab('questoes_semanais')}
          className={`h-10 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'questoes_semanais' ? 'border-[#FFD84D] text-[#14162B]' : 'border-transparent text-[#5B607A] hover:text-[#14162B]'
          }`}
        >
          <BarChart2 size={15} />
          <span>Questões (Reunião Semanal)</span>
        </button>
        <button
          onClick={() => setActiveTab('auditoria')}
          className={`h-10 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'auditoria' ? 'border-[#FFD84D] text-[#14162B]' : 'border-transparent text-[#5B607A] hover:text-[#14162B]'
          }`}
        >
          <Shield size={15} />
          <span>Histórico de Auditoria</span>
        </button>
      </div>

      {activeTab === 'questoes_semanais' ? (
        <RelatorioReuniaoSemanal matriculaId={matriculaId} />
      ) : activeTab === 'auditoria' ? (
        <div className="card p-5">
          <h3 className="d font-bold text-xl text-[#14162B] mb-2">Auditoria de Edições do Mentor (HU-1.5)</h3>
          <p className="text-xs text-[#5B607A] mb-4">
            Todas as alterações realizadas pelo mentor em dados deste aluno ficam registradas com valores anterior e novo.
          </p>
          <div className="divide-y divide-[#EEF0F7] text-sm">
            {auditorias.map((a: any) => (
              <div key={a.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                <span className="text-[#5B607A] font-medium min-w-[80px]">
                  {a.em ? a.em.slice(8, 10) + '/' + a.em.slice(5, 7) + ' ' + a.em.slice(11, 16) : 'Hoje'}
                </span>
                <span className="flex-1 text-[#14162B] px-3">
                  Entidade <b>{a.entidade}</b> · Campo <code className="bg-[#F0F1FA] text-[#2F2A9E] px-1.5 py-0.5 rounded">{a.campo}</code> alterado de <span className="line-through text-[#8A8FA8]">{a.valor_anterior}</span> para <b>{a.valor_novo}</b>
                </span>
                <span className="text-xs text-[#5B607A] shrink-0 font-medium">{a.autor_nome || 'Gleyson'}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* 1. PAUTA INTELIGENTE PARA A REUNIÃO SEMANAL */}
          {metricas?.pautaReuniaoSemanal && metricas.pautaReuniaoSemanal.length > 0 && (
            <div className="card p-5 bg-gradient-to-r from-[#FAFBFD] to-[#F5F7FC] border border-[#E3E5F3] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 border-b border-[#EEF0F7] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="d font-bold text-lg text-[#14162B] flex items-center gap-2">
                      <span>Pauta Inteligente para a Reunião Semanal</span>
                      <span className="chip gr text-[10px] font-bold">Diagnóstico em Tempo Real</span>
                    </h3>
                    <p className="text-xs text-[#5B607A]">
                      Principais tópicos pedagógicos identificados pelo sistema para o mentor debater com o aluno
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#5B607A] font-semibold self-start sm:self-auto">
                  {metricas.pautaReuniaoSemanal.length} ponto(s) prioritário(s)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {metricas.pautaReuniaoSemanal.map((item: any, idx: number) => {
                  const isCritico = item.tipo === 'critico';
                  const isSono = item.tipo === 'sono_revisao';
                  const isPositivo = item.tipo === 'positivo';

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex flex-col gap-1.5 transition ${
                        isCritico
                          ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
                          : isSono
                          ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                          : isPositivo
                          ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                          : 'bg-[#FFF7ED] border-[#FFEDD5] text-[#9A3412]'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        {isCritico ? (
                          <AlertCircle size={16} className="shrink-0 text-red-600" />
                        ) : isSono ? (
                          <Clock size={16} className="shrink-0 text-amber-600" />
                        ) : isPositivo ? (
                          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                        ) : (
                          <AlertTriangle size={16} className="shrink-0 text-orange-600" />
                        )}
                        <span>{item.titulo}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90 pl-6">
                        {item.descricao}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. PAINEL DE 4 MÉTRICAS EXECUTIVAS */}
          {metricas && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Nota Líquida Projetada Cebraspe */}
              <div className="card p-5 flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#5B607A] font-semibold">
                    <span className="lab">Nota Líquida Projetada</span>
                    <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {metricas.notaLiquida.metodoCobranca === 'certo_errado' ? 'Cebraspe' : 'Geral'}
                    </span>
                  </div>
                  <div className="d font-bold text-3xl text-[#14162B] mt-1.5">
                    {metricas.notaLiquida.notaLiquida}{' '}
                    <span className="text-sm font-normal text-[#5B607A]">
                      ({metricas.notaLiquida.aproveitamentoLiquidoPct}%)
                    </span>
                  </div>
                  <div className="text-xs text-[#5B607A] mt-1">
                    Bruto: <strong>{metricas.notaLiquida.aproveitamentoBrutoPct}%</strong> ({metricas.notaLiquida.totalCertas}/{metricas.notaLiquida.totalResolvidas})
                    {metricas.notaLiquida.fatorPenalidade > 0 && (
                      <span className="text-red-700 block text-[11px] mt-0.5">
                        Penalidade: -{metricas.notaLiquida.totalErradas * metricas.notaLiquida.fatorPenalidade} pts ({metricas.notaLiquida.totalErradas} erradas)
                      </span>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-[#EEF0F7]">
                  {metricas.notaLiquida.atingiuCorteGeral ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Check size={12} /> Acima do corte ({metricas.notaLiquida.notaMinimaAprovacao} pts)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <AlertTriangle size={12} /> Abaixo do corte ({metricas.notaLiquida.notaMinimaAprovacao} pts)
                    </span>
                  )}
                </div>
              </div>

              {/* Card 2: Cobertura do Edital & Pace */}
              <div className="card p-5 flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#5B607A] font-semibold">
                    <span className="lab">Cobertura do Edital</span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      Fase 1
                    </span>
                  </div>
                  <div className="d font-bold text-3xl text-[#14162B] mt-1.5">
                    {metricas.coberturaEdital.coberturaPct}%
                  </div>
                  <div className="text-xs text-[#5B607A] mt-1">
                    <strong>{metricas.coberturaEdital.topicosConcluidos}</strong> de{' '}
                    <strong>{metricas.coberturaEdital.totalTopicosFolha}</strong> tópicos folha
                    <span className="block text-[11px] text-indigo-700 mt-0.5 font-semibold">
                      Ritmo: {metricas.coberturaEdital.velocidadeSemanalTopicos} tópicos / semana
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#EEF0F7]">
                  {metricas.coberturaEdital.emDiaComCronograma ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Check size={12} /> No prazo ({metricas.coberturaEdital.diasAteFimMentoria} dias rest.)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      <AlertTriangle size={12} /> Ritmo insuficiente p/ edital
                    </span>
                  )}
                </div>
              </div>

              {/* Card 3: Giro Real do Ciclo de Estudos */}
              <div className="card p-5 flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#5B607A] font-semibold">
                    <span className="lab">Giro do Ciclo</span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      Matriz {metricas.giroCiclo.tamanhoMatriz}
                    </span>
                  </div>
                  <div className="d font-bold text-3xl text-[#14162B] mt-1.5">
                    {metricas.giroCiclo.voltasPorSemanaRealizadas}{' '}
                    <span className="text-sm font-normal text-[#5B607A]">voltas/sem</span>
                  </div>
                  <div className="text-xs text-[#5B607A] mt-1">
                    Carga: <strong>{metricas.giroCiclo.slotsPorDia}h/dia</strong> ({metricas.giroCiclo.diasPorVolta} dias p/ volta)
                    <span className="block text-[11px] text-[#5B607A] mt-0.5">
                      Meta: &gt;= {metricas.giroCiclo.voltasPorSemanaEsperadas}x/sem (Gleyson Azevedo)
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#EEF0F7]">
                  {metricas.giroCiclo.metaSemanalAtingida ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Check size={12} /> Meta metodológica OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <AlertTriangle size={12} /> Abaixo de 2.0 voltas/sem
                    </span>
                  )}
                </div>
              </div>

              {/* Card 4: Aderência às Revisões */}
              <div className="card p-5 flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#5B607A] font-semibold">
                    <span className="lab">Aderência a Revisões</span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      Sinaptogênese
                    </span>
                  </div>
                  <div className="d font-bold text-3xl text-[#14162B] mt-1.5">
                    {metricas.aderenciaRevisoes.taxaRevisaoNoturnaPct}%{' '}
                    <span className="text-sm font-normal text-[#5B607A]">Noturna</span>
                  </div>
                  <div className="text-xs text-[#5B607A] mt-1">
                    <strong>{metricas.aderenciaRevisoes.diasComRevisaoNoturnaUltimos30Dias}</strong> de{' '}
                    <strong>{metricas.aderenciaRevisoes.diasComEstudoUltimos30Dias}</strong> dias com estudo
                    <span className="block text-[11px] text-[#5B607A] mt-0.5">
                      Revisão Mensal (1º FDS):{' '}
                      <strong>{metricas.aderenciaRevisoes.revisaoMensalFeita ? 'Cumprida' : 'Pendente'}</strong>
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#EEF0F7]">
                  {metricas.aderenciaRevisoes.revisaoMensalFeita ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Check size={12} /> Revisão Mensal OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <AlertTriangle size={12} /> Mensal pendente ({metricas.aderenciaRevisoes.mesReferenciaAtual})
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. CARDS ANALÍTICOS: EQUILÍBRIO COGNITIVO & FUNIL DE FASES */}
          {metricas && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card A: Equilíbrio Cognitivo (Decoreba vs Raciocínio) */}
              <div className="card p-5 flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="d font-bold text-base text-[#14162B] flex items-center gap-2">
                      <Brain size={16} className="text-indigo-600" />
                      <span>Equilíbrio Cognitivo (Decoreba vs Raciocínio)</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                      {metricas.equilibrioCognitivo.polaridadeDominante === 'melhor_decoreba'
                        ? 'Mais forte em Decoreba'
                        : metricas.equilibrioCognitivo.polaridadeDominante === 'melhor_raciocinio'
                        ? 'Mais forte em Raciocínio'
                        : 'Equilibrado'}
                    </span>
                  </div>

                  <p className="text-xs text-[#5B607A] mb-3">
                    Comparativo de acerto em matérias mnemônicas (Decoreba) versus analíticas (Raciocínio)
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {/* Linha Decoreba */}
                    <div className="p-2.5 rounded-xl bg-[#D3E3F5]/40 border border-[#BCD3EE] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="chip dec text-[10px] py-0.5 px-2">Decoreba</span>
                        <span className="text-xs font-semibold text-[#1F3F66]">
                          {metricas.equilibrioCognitivo.decoreba.totalDisciplinas} matérias
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#5B607A]">
                          {metricas.equilibrioCognitivo.decoreba.questoesCertas}/{metricas.equilibrioCognitivo.decoreba.questoesResolvidas} certas
                        </span>
                        <span className="font-bold text-sm text-[#1F3F66]">
                          {metricas.equilibrioCognitivo.decoreba.acertoPct}%
                        </span>
                      </div>
                    </div>

                    {/* Linha Raciocínio */}
                    <div className="p-2.5 rounded-xl bg-[#FFF2CC]/40 border border-[#E8DCB0] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="chip rac text-[10px] py-0.5 px-2">Raciocínio</span>
                        <span className="text-xs font-semibold text-[#6B4F00]">
                          {metricas.equilibrioCognitivo.raciocinio.totalDisciplinas} matérias
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#5B607A]">
                          {metricas.equilibrioCognitivo.raciocinio.questoesCertas}/{metricas.equilibrioCognitivo.raciocinio.questoesResolvidas} certas
                        </span>
                        <span className="font-bold text-sm text-[#6B4F00]">
                          {metricas.equilibrioCognitivo.raciocinio.acertoPct}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[#5B607A] pt-2 border-t border-[#EEF0F7]">
                  💡 <strong>Diagnóstico Neuropsicológico:</strong>{' '}
                  {metricas.equilibrioCognitivo.polaridadeDominante === 'melhor_decoreba'
                    ? 'O mentorado retém bem a legislação, mas sofre perda de rendimento em problemas lógicos. Reforce resolução comentada de exercícios.'
                    : metricas.equilibrioCognitivo.polaridadeDominante === 'melhor_raciocinio'
                    ? 'O mentorado compreende bem sistemas e cálculos, mas sofre decaimento em memorização de normas. Reforce a revisão noturna e mnemônicos.'
                    : 'Excelente balanço sináptico entre retenção hipocampal e raciocínio pré-frontal.'}
                </div>
              </div>

              {/* Card B: Funil de Maturação das Disciplinas */}
              <div className="card p-5 flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="d font-bold text-base text-[#14162B] flex items-center gap-2">
                      <Layers size={16} className="text-indigo-600" />
                      <span>Funil de Maturação das Disciplinas</span>
                    </h4>
                    <span className="text-xs text-[#5B607A] font-semibold">
                      {metricas.funilFases.totalDisciplinas} matérias no edital
                    </span>
                  </div>

                  <p className="text-xs text-[#5B607A] mb-3">
                    Evolução do mentorado da base teórica inicial para a aplicação e manutenção
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-[#EEF0F7] flex flex-col items-center text-center">
                      <span className="chip f1 text-[10px] mb-1">Fase 1</span>
                      <span className="text-2xl font-bold text-[#14162B]">
                        {metricas.funilFases.fase1Teoria}
                      </span>
                      <span className="text-[10px] text-[#5B607A] mt-0.5">Teoria & Base</span>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col items-center text-center">
                      <span className="chip f2 text-[10px] mb-1">Fase 2</span>
                      <span className="text-2xl font-bold text-indigo-700">
                        {metricas.funilFases.fase2Aplicacao}
                      </span>
                      <span className="text-[10px] text-indigo-900 mt-0.5">Aplicação</span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex flex-col items-center text-center">
                      <span className="chip ok text-[10px] mb-1">Fase 3</span>
                      <span className="text-2xl font-bold text-emerald-700">
                        {metricas.funilFases.fase3Manutencao}
                      </span>
                      <span className="text-[10px] text-emerald-900 mt-0.5">Manutenção</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[#5B607A] pt-2 border-t border-[#EEF0F7]">
                  📌 <strong>Meta da Mentoria:</strong> Transicionar o máximo de disciplinas para a Fase 2 (estudo por questões) até a metade do projeto para atingir o pico de retenção.
                </div>
              </div>
            </div>
          )}

          {/* 4. GRID: TABELA DINÂMICA DE DISCIPLINAS & GALERIA DE RESUMOS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Tabela de Disciplinas com Progresso Real (lg:col-span-7) */}
            <div className="card lg:col-span-7 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-[#EEF0F7] bg-[#FAFAFC] flex justify-between items-center text-xs font-semibold text-[#5B607A]">
                <div>
                  <h4 className="font-bold text-sm text-[#14162B]">Disciplinas do Edital</h4>
                  <p className="text-[11px] text-[#5B607A]">
                    Progresso de tópicos e taxa de acerto por matéria
                  </p>
                </div>
                <span className="chip gr text-xs font-semibold">
                  {metricas?.disciplinasDetalhadas?.length || 0} matérias
                </span>
              </div>

              <div className="divide-y divide-[#EEF0F7] text-sm overflow-x-auto">
                {(metricas?.disciplinasDetalhadas && metricas.disciplinasDetalhadas.length > 0
                  ? metricas.disciplinasDetalhadas
                  : [
                      { id: 'disc_estado', nome: 'Estado, Democracia e Ciência Política', grupoNome: 'Básicas', tipo: 'decoreba', faseAtual: 1, topicosConcluidos: 3, totalTopicos: 14, progressoPct: 21, questoesResolvidas: 12, questoesCertas: 10, acertoBrutoPct: 83, acertoLiquidoPct: 67, abaixoDoCorte: false },
                      { id: 'disc_evidencias', nome: 'Fundamentos de Evidências, Dados e IA', grupoNome: 'Complementares', tipo: 'raciocinio', faseAtual: 1, topicosConcluidos: 2, totalTopicos: 9, progressoPct: 22, questoesResolvidas: 5, questoesCertas: 5, acertoBrutoPct: 100, acertoLiquidoPct: 100, abaixoDoCorte: false },
                      { id: 'disc_transparencia', nome: 'Transparência e Participação Social', grupoNome: 'Complementares', tipo: 'decoreba', faseAtual: 1, topicosConcluidos: 4, totalTopicos: 16, progressoPct: 25, questoesResolvidas: 0, questoesCertas: 0, acertoBrutoPct: 0, acertoLiquidoPct: 0, abaixoDoCorte: false },
                      { id: 'disc_persist', nome: 'Persistência e Proteção de Dados', grupoNome: 'Específicas', tipo: 'raciocinio', faseAtual: 1, topicosConcluidos: 1, totalTopicos: 12, progressoPct: 8, questoesResolvidas: 6, questoesCertas: 3, acertoBrutoPct: 50, acertoLiquidoPct: 0, abaixoDoCorte: true },
                      { id: 'disc_eng_soft', nome: 'Engenharia de Software e Programação', grupoNome: 'Específicas', tipo: 'raciocinio', faseAtual: 2, topicosConcluidos: 7, totalTopicos: 10, progressoPct: 70, questoesResolvidas: 25, questoesCertas: 20, acertoBrutoPct: 80, acertoLiquidoPct: 60, abaixoDoCorte: false },
                    ]
                ).map((item: any) => (
                  <div key={item.id} className="p-3.5 px-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-[#14162B] text-xs truncate max-w-[260px]" title={item.nome}>
                          {item.nome}
                        </span>
                        <span className={`chip text-[9px] py-0.2 px-1.5 ${item.tipo === 'decoreba' ? 'dec' : 'rac'}`}>
                          {item.tipo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#5B607A]">
                        <span>{item.grupoNome}</span>
                        <span>·</span>
                        {item.questoesResolvidas > 0 ? (
                          <span className={item.abaixoDoCorte ? 'text-red-700 font-bold' : 'text-[#17603A] font-semibold'}>
                            {item.acertoLiquidoPct}% líq ({item.questoesCertas}/{item.questoesResolvidas})
                            {item.abaixoDoCorte && ' ⚠️ <60%'}
                          </span>
                        ) : (
                          <span className="text-[#8A8FA8]">Sem questões</span>
                        )}
                      </div>
                    </div>

                    <span className={`chip ${item.faseAtual === 2 ? 'f2' : item.faseAtual === 3 ? 'ok' : 'f1'} text-[11px] shrink-0`}>
                      Fase {item.faseAtual}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="bar w-14">
                        <i style={{ width: `${item.progressoPct}%` }} />
                      </div>
                      <span className="text-xs text-[#5B607A] tabular-nums font-medium">
                        {item.topicosConcluidos}/{item.totalTopicos}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setDiscOverrideId(item.id);
                        setDiscOverrideNome(item.nome);
                        setFaseNova(item.faseAtual === 1 ? 2 : item.faseAtual === 2 ? 3 : 1);
                        setShowModalOverrideFase(true);
                      }}
                      className="text-xs font-semibold text-[#4338CA] hover:underline shrink-0"
                      title="Alterar fase da disciplina manualmente (Override do Mentor)"
                    >
                      Alterar fase
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Galeria de Resumos Recentes e Comentários (lg:col-span-5) */}
            <div className="card lg:col-span-5 p-5 flex flex-col gap-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#EEF0F7] pb-2.5">
                <div>
                  <h3 className="d font-bold text-lg text-[#14162B]">Resumos Recentes</h3>
                  <p className="text-xs text-[#5B607A]">Evidências de estudo fotográficas do aluno</p>
                </div>
                <span className="chip gr text-xs font-semibold">{resumos.length} fotos</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {resumos.length > 0 ? (
                  resumos.map((r: any) => (
                    <div
                      key={r.id}
                      onClick={() => setFotoSelecionadaId(r.id)}
                      className={`border rounded-xl p-2 cursor-pointer transition-all ${
                        fotoSelecionadaId === r.id ? 'border-[#4338CA] shadow-xs bg-[#F0F1FA]' : 'border-[#E3E5F3]'
                      }`}
                    >
                      <img
                        src={`/uploads/${r.storage_key}`}
                        alt="Resumo"
                        className="w-full aspect-4/3 object-cover rounded-lg bg-[#EEF0F7]"
                        onError={(e: any) => {
                          e.target.src = 'https://placehold.co/400x300/e4e5fb/2f2a9e?text=Resumo';
                        }}
                      />
                      <div className="text-[11px] text-[#5B607A] mt-1.5 truncate">
                        {r.numeracao} · {r.disciplina_nome}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center text-xs text-[#5B607A] py-6">
                    Nenhum resumo fotográfico enviado ainda.
                  </div>
                )}
              </div>

              {/* Campo de Comentário sobre o Resumo */}
              <div className="flex flex-col gap-2 mt-2 border-t border-[#EEF0F7] pt-4">
                <label className="lab">Orientação sobre o resumo selecionado</label>
                <input
                  type="text"
                  value={comentarioTexto}
                  onChange={e => setComentarioTexto(e.target.value)}
                  placeholder="Escreva um comentário sobre a clareza e síntese do resumo..."
                  className="fld text-sm"
                />
                <div className="flex justify-between items-center mt-1">
                  {comentarioSucesso && (
                    <span className="text-xs text-[#17603A] font-semibold flex items-center gap-1">
                      <Check size={14} /> Comentário registrado!
                    </span>
                  )}
                  <button
                    onClick={handleEnviarComentario}
                    disabled={comentando || !comentarioTexto.trim()}
                    className="btn btn-primary h-10 px-4 text-xs ml-auto flex items-center gap-1"
                  >
                    <Send size={12} />
                    <span>Comentar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajustar Tempos (HU-1.4) */}
      {showModalTempos && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 flex flex-col gap-4 shadow-xl">
            <h3 className="d font-bold text-xl text-[#14162B]">Ajustar Tempos (Fase 1)</h3>
            <p className="text-xs text-[#5B607A]">
              Padrão: 45 min estudo, 10 min teste e 5 min recorde. Ajustes personalizados valem apenas para este mentorado.
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="lab block mb-1">Minutos de Estudo</label>
                <input
                  type="number"
                  value={fase1Estudo}
                  onChange={e => setFase1Estudo(e.target.value)}
                  className="fld text-center font-bold"
                />
              </div>
              <div>
                <label className="lab block mb-1">Minutos de Teste (Questões)</label>
                <input
                  type="number"
                  value={fase1Teste}
                  onChange={e => setFase1Teste(e.target.value)}
                  className="fld text-center font-bold"
                />
              </div>
              <div>
                <label className="lab block mb-1">Minutos de Recordação</label>
                <input
                  type="number"
                  value={fase1Recorde}
                  onChange={e => setFase1Recorde(e.target.value)}
                  className="fld text-center font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-2">
              <button onClick={() => setShowModalTempos(false)} className="btn">
                Cancelar
              </button>
              <button onClick={handleSalvarTempos} disabled={salvandoTempos} className="btn btn-primary">
                {salvandoTempos ? 'Salvando...' : 'Salvar ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Override de Fase pelo Mentor (HU-4.5) */}
      {showModalOverrideFase && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 flex flex-col gap-4 shadow-xl">
            <h3 className="d font-bold text-xl text-[#14162B]">Alterar Fase da Disciplina (HU-4.5)</h3>
            <p className="text-xs text-[#5B607A]">
              Como mentor, você pode avançar ou retornar manualmente a fase de <b>{discOverrideNome}</b>. Essa ação gerará um registro de auditoria indelével.
            </p>

            <div>
              <label className="lab block mb-2">Selecione a Nova Fase</label>
              <div className="flex gap-2">
                {[1, 2, 3].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFaseNova(num)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-colors ${
                      faseNova === num
                        ? 'bg-[#E4E5FB] border-[#4338CA] text-[#2F2A9E]'
                        : 'bg-white border-[#D9DCEB] text-[#5B607A]'
                    }`}
                  >
                    Fase {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-3">
              <button onClick={() => setShowModalOverrideFase(false)} className="btn">
                Cancelar
              </button>
              <button onClick={handleSalvarOverrideFase} disabled={salvandoOverride} className="btn btn-primary">
                {salvandoOverride ? 'Gravando...' : 'Confirmar e Auditar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Troca de Edital (HU-2.7) */}
      {showModalMudarEdital && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 flex flex-col gap-4 shadow-xl">
            <h3 className="d font-bold text-xl text-[#14162B]">Atribuir Edital ao Mentorado (HU-2.7)</h3>
            <p className="text-xs text-[#5B607A]">
              Selecione o edital ao qual este aluno será vinculado. A alteração de edital é registrada na trilha de auditoria do aluno.
            </p>

            <div>
              <label className="lab block mb-1.5">Edital Cadastrado</label>
              <select
                value={novoEditalId}
                onChange={e => setNovoEditalId(e.target.value)}
                className="fld w-full text-sm font-semibold"
              >
                {editaisDisponiveis.map(ed => (
                  <option key={ed.id} value={ed.id}>
                    {ed.nome} ({ed.banca}) — {ed.metodo_cobranca === 'certo_errado' ? 'Certo/Errado' : 'Múltipla Escolha'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end mt-3">
              <button onClick={() => setShowModalMudarEdital(false)} className="btn">
                Cancelar
              </button>
              <button onClick={handleSalvarEdital} disabled={salvandoEdital} className="btn btn-primary">
                {salvandoEdital ? 'Salvando...' : 'Confirmar Matrícula'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
