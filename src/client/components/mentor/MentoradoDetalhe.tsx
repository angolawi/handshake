import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Check, BarChart2, Shield, Settings2, BookOpen } from 'lucide-react';
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
        <>
          {/* Métricas do Aluno */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="lab">Sessões</div>
              <div className="d font-bold text-3xl text-[#14162B] mt-1">14 de 15</div>
              <div className="text-sm text-[#5B607A] mt-1">últimos 7 dias</div>
            </div>
            <div className="card p-5">
              <div className="lab">Revisão noturna</div>
              <div className="d font-bold text-3xl text-[#14162B] mt-1">6 de 7</div>
              <div className="text-sm text-[#5B607A] mt-1">últimos 7 dias</div>
            </div>
            <div className="card p-5">
              <div className="lab">Questões entre reuniões</div>
              <div className="d font-bold text-3xl text-[#17603A] mt-1">22 · 82%</div>
              <div className="text-sm text-[#5B607A] mt-1">desde a reunião anterior</div>
            </div>
          </div>

          {/* Grid: Tabela de Disciplinas & Galeria de Resumos */}
          <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-start">
            {/* Tabela de Disciplinas com Ação de Override de Fase (lg:col-span-6) */}
            <div className="card lg:col-span-6 overflow-hidden">
              <div className="p-4 border-b border-[#EEF0F7] bg-[#FAFAFC] flex justify-between items-center text-xs font-semibold text-[#5B607A]">
                <span className="lab">Disciplina</span>
                <span className="lab">Fase</span>
                <span className="lab">Tópicos</span>
                <span className="lab text-right">Ação</span>
              </div>

              <div className="divide-y divide-[#EEF0F7] text-sm">
                {[
                  { id: 'disc_estado', nome: 'Estado, Democracia, Direitos e Ciência Política', fase: 1, topicos: '3/14', acerto: '87%', pct: 21 },
                  { id: 'disc_evidencias', nome: 'Fundamentos de Evidências, Dados e IA', fase: 1, topicos: '2/9', acerto: '100%', pct: 22 },
                  { id: 'disc_transparencia', nome: 'Fundamentos de Transparência, Ouvidoria e Participação', fase: 1, topicos: '4/16', acerto: '—', pct: 25 },
                  { id: 'disc_persist', nome: 'Persistência, Integração e Proteção de Dados', fase: 1, topicos: '1/12', acerto: '—', pct: 8 },
                  { id: 'disc_eng_soft', nome: 'Engenharia de Software e Programação', fase: 2, topicos: '7/10', acerto: '76%', pct: 70 },
                ].map((item) => (
                  <div key={item.id} className="p-3.5 px-4 flex items-center justify-between gap-3">
                    <div className="flex-1 font-semibold text-[#14162B] text-xs md:text-sm truncate">
                      {item.nome}
                    </div>
                    <span className={`chip ${item.fase === 2 ? 'f2' : 'f1'} text-xs shrink-0`}>
                      Fase {item.fase}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="bar w-12">
                        <i style={{ width: `${item.pct}%` }} />
                      </div>
                      <span className="text-xs text-[#5B607A]">{item.topicos}</span>
                    </div>
                    <button
                      onClick={() => {
                        setDiscOverrideId(item.id);
                        setDiscOverrideNome(item.nome);
                        setFaseNova(item.fase === 1 ? 2 : 1);
                        setShowModalOverrideFase(true);
                      }}
                      className="text-xs font-semibold text-[#4338CA] hover:underline shrink-0"
                    >
                      Alterar fase
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Galeria de Resumos Recentes e Comentários (lg:col-span-5) */}
            <div className="card lg:col-span-5 p-5 flex flex-col gap-4">
              <h3 className="d font-bold text-xl text-[#14162B]">Resumos recentes</h3>

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
        </>
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
