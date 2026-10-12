import React, { useState, useEffect, useRef } from 'react';
import { Camera, Check, AlertCircle, Play, Pause, ChevronRight, X } from 'lucide-react';
import { Topico, CicloSlot } from '../../../shared/types.js';

interface SessaoEstudoProps {
  matriculaId: string;
  isMobile?: boolean;
  onConcluirSessao?: () => void;
}

export const SessaoEstudo: React.FC<SessaoEstudoProps> = ({ matriculaId, isMobile = false, onConcluirSessao }) => {
  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState<CicloSlot | null>(null);
  const [topico, setTopico] = useState<Topico | null>(null);
  const [fase, setFase] = useState<number>(1);

  // Etapas da Fase 1 por padrão
  const etapasFase1 = [
    { id: 'estudo', nome: 'Estudo', duracaoMin: 45 },
    { id: 'teste', nome: 'Teste', duracaoMin: 10 },
    { id: 'recorde', nome: 'Recorde', duracaoMin: 5 },
    { id: 'descanso', nome: 'Descanso', duracaoMin: 15 },
  ];

  const etapasFase2 = [
    { id: 'revisao', nome: 'Revisão', duracaoMin: 20 },
    { id: 'aplicacao', nome: 'Aplicação', duracaoMin: 35 },
    { id: 'recorde', nome: 'Revisão final', duracaoMin: 5 },
    { id: 'descanso', nome: 'Descanso', duracaoMin: 15 },
  ];

  const etapasFase3 = [
    { id: 'aplicacao', nome: 'Aplicação (Questões)', duracaoMin: 60 },
    { id: 'recorde', nome: 'Revisão', duracaoMin: 5 },
    { id: 'descanso', nome: 'Descanso', duracaoMin: 15 },
  ];

  const etapas = fase === 1 ? etapasFase1 : fase === 2 ? etapasFase2 : etapasFase3;
  const [etapaIdx, setEtapaIdx] = useState(0);

  // Cronômetro baseado em timestamp
  const etapaAtual = etapas[etapaIdx] || etapas[0];
  const duracaoSegundosTotal = etapaAtual.duracaoMin * 60;
  const [segundosRestantes, setSegundosRestantes] = useState(duracaoSegundosTotal);
  const [isPaused, setIsPaused] = useState(false);
  const targetTimeRef = useRef<number>(Date.now() + duracaoSegundosTotal * 1000);

  // Upload de foto do resumo com compressão client-side
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoError, setFotoError] = useState<string | null>(null);

  // Modal de Conclusão / Registro de Questões
  const [showModalConclusao, setShowModalConclusao] = useState(false);
  const [questoesCertas, setQuestoesCertas] = useState('5');
  const [questoesResolvidas, setQuestoesResolvidas] = useState('5');
  const [concluiuTopico, setConcluiuTopico] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sessaoConcluidaSucesso, setSessaoConcluidaSucesso] = useState(false);

  // Carrega próxima sessão da matrícula
  useEffect(() => {
    fetch(`/api/matriculas/${matriculaId}/proxima-sessao`)
      .then(res => res.json())
      .then(data => {
        if (data.slot) {
          setSlot(data.slot);
          setFase(data.fase || 1);
          setTopico(data.topico || null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [matriculaId]);

  // Atualiza tempo restante e targetTime ao mudar de etapa
  useEffect(() => {
    const totalSeg = etapaAtual.duracaoMin * 60;
    setSegundosRestantes(totalSeg);
    targetTimeRef.current = Date.now() + totalSeg * 1000;
  }, [etapaIdx, etapaAtual.duracaoMin]);

  // Loop do cronômetro resistente a segundo plano
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((targetTimeRef.current - Date.now()) / 1000));
      setSegundosRestantes(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Avança de etapa se não for a última
        if (etapaIdx < etapas.length - 1) {
          setEtapaIdx(prev => prev + 1);
        } else {
          setShowModalConclusao(true);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPaused, etapaIdx, etapas.length]);

  const togglePause = () => {
    if (isPaused) {
      // Retomando
      targetTimeRef.current = Date.now() + segundosRestantes * 1000;
      setIsPaused(false);
    } else {
      // Pausando
      setIsPaused(true);
    }
  };

  const proximaEtapa = () => {
    if (etapaIdx < etapas.length - 1) {
      setEtapaIdx(prev => prev + 1);
    } else {
      // Fim das etapas, abrir encerramento
      setShowModalConclusao(true);
    }
  };

  // Compressão de foto no navegador via Canvas (máx 1600px, qualidade ~80%)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                  type: 'image/jpeg',
                });
                setFotoFile(compressedFile);
                setFotoPreview(canvas.toDataURL('image/jpeg', 0.8));
              }
            },
            'image/jpeg',
            0.8
          );
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFinalizarSessao = async () => {
    if (fase === 1 && !fotoFile) {
      setFotoError('Na Fase 1, o envio de ao menos uma foto do resumo é obrigatório.');
      return;
    }

    if (Number(questoesCertas) > Number(questoesResolvidas)) {
      setFotoError('Questões certas não podem superar as resolvidas.');
      return;
    }

    setSalvando(true);
    setFotoError(null);

    const formData = new FormData();
    formData.append('matriculaId', matriculaId);
    formData.append('slotId', slot?.id || '');
    formData.append('topicoId', topico?.id || '');
    formData.append('fase', String(fase));
    formData.append('certas', questoesCertas);
    formData.append('resolvidas', questoesResolvidas);
    formData.append('concluiuTopico', String(concluiuTopico));
    if (fotoFile) {
      formData.append('foto', fotoFile);
    }

    try {
      const res = await fetch('/api/sessoes/encerrar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        setSessaoConcluidaSucesso(true);
        setTimeout(() => {
          setShowModalConclusao(false);
          setSessaoConcluidaSucesso(false);
          if (onConcluirSessao) onConcluirSessao();
        }, 1500);
      } else {
        setFotoError(data.error || 'Erro ao salvar sessão');
      }
    } catch (err: any) {
      setFotoError(err.message || 'Erro de conexão');
    } finally {
      setSalvando(false);
    }
  };

  // Cálculos do anel SVG
  const minutosTotais = etapaAtual.duracaoMin;
  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const tempoFormatado = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  const fracaoProgresso = 1 - (segundosRestantes / duracaoSegundosTotal);
  
  // Raio e perímetro
  const radius = isMobile ? 104 : 122;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - fracaoProgresso);

  if (loading) {
    return <div className="p-8 text-center text-[#5B607A]">Carregando sessão de estudo...</div>;
  }

  return (
    <div className={`flex flex-col gap-6 ${isMobile ? 'max-w-[390px] mx-auto p-4 pb-20' : 'max-w-[1080px] mx-auto p-8'}`}>
      {/* Cabeçalho da Sessão */}
      <div className="flex justify-between items-start">
        <div>
          <div className="lab">
            Fase {fase} · {slot?.disciplina?.tipo === 'raciocinio' ? 'Raciocínio' : 'Decoreba'}
          </div>
          <h1 className="d font-bold text-2xl md:text-3xl text-[#14162B] mt-1 tracking-tight leading-tight">
            {topico?.texto || 'Recorrências em manifestações como sinais de problemas'}
          </h1>
          <div className="text-sm md:text-base text-[#5B607A] mt-1">
            {slot?.disciplina?.nome || 'Fundamentos de Transparência, Ouvidoria e Participação Social'} · {topico?.numeracao || '4.2'}
          </div>
        </div>
      </div>

      {/* Grid Principal: Cronômetro à esquerda e Etapas/Upload à direita */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-11'} gap-6 items-start`}>
        {/* Card do Cronômetro em Anel */}
        <div className={`card p-6 md:p-8 flex flex-col items-center gap-6 ${isMobile ? '' : 'md:col-span-5'}`}>
          <div className={`relative ${isMobile ? 'w-[240px] h-[240px]' : 'w-[280px] h-[280px]'}`}>
            <svg
              width={isMobile ? 240 : 280}
              height={isMobile ? 240 : 280}
              viewBox={isMobile ? '0 0 240 240' : '0 0 280 280'}
              className="transform -rotate-90"
              aria-hidden="true"
            >
              {/* Anel de fundo */}
              <circle
                cx={isMobile ? 120 : 140}
                cy={isMobile ? 120 : 140}
                r={radius}
                fill="none"
                stroke="#E3E5F3"
                strokeWidth={isMobile ? 10 : 12}
              />
              {/* Anel de progresso índigo */}
              <circle
                cx={isMobile ? 120 : 140}
                cy={isMobile ? 120 : 140}
                r={radius}
                fill="none"
                stroke="#4338CA"
                strokeWidth={isMobile ? 10 : 12}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-linear"
              />
            </svg>

            {/* Texto central do cronômetro */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`d font-bold tracking-tight text-[#14162B] tabular-nums ${isMobile ? 'text-5xl' : 'text-6xl'}`}>
                {tempoFormatado}
              </span>
              <span className="text-sm text-[#5B607A] mt-1">
                restantes de {minutosTotais} min ({etapaAtual.nome})
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 w-full">
            <button
              onClick={togglePause}
              className="flex-1 h-12 rounded-xl border border-[#D9DCEB] bg-white text-[#14162B] font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#F5F6FA]"
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
              {isPaused ? 'Retomar' : 'Pausar'}
            </button>
            <button
              onClick={proximaEtapa}
              className="flex-2 h-12 rounded-xl border-none text-white font-semibold text-base bg-[#4338CA] flex items-center justify-center gap-1 hover:opacity-90"
            >
              <span>{etapaIdx < etapas.length - 1 ? `Ir para ${etapas[etapaIdx + 1].nome}` : 'Concluir estudo'}</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Coluna Direita: Roteiro por Etapas e Fotos */}
        <div className={`flex flex-col gap-4 ${isMobile ? '' : 'md:col-span-6'}`}>
          {/* Seletor Visual de Etapas */}
          <div className="flex flex-col gap-2">
            {etapas.map((etp, idx) => {
              const isCurrent = idx === etapaIdx;
              const isDone = idx < etapaIdx;
              return (
                <div
                  key={etp.id}
                  onClick={() => setEtapaIdx(idx)}
                  className={`flex items-center justify-between p-3.5 px-4 rounded-xl border text-[15px] cursor-pointer transition-colors ${
                    isCurrent
                      ? 'bg-[#E4E5FB] border-[#E4E5FB] text-[#2F2A9E] font-semibold'
                      : isDone
                      ? 'bg-white border-[#E3E5F3] text-[#14162B]'
                      : 'bg-white border-[#E3E5F3] text-[#5B607A]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isDone ? <Check size={16} className="text-[#3FA66B]" /> : <span className="w-4 h-4 rounded-full border border-current text-xs flex items-center justify-center">{idx + 1}</span>}
                    <span>{etp.nome}</span>
                  </div>
                  <span className={isCurrent ? 'text-[#2F2A9E]' : 'text-[#5B607A]'}>
                    {etp.duracaoMin} min
                  </span>
                </div>
              );
            })}
          </div>

          {/* Card: Lembrete da Fase */}
          <div className="card p-4">
            <div className="lab">Nesta fase ({etapaAtual.nome})</div>
            <p className="text-[15px] text-[#14162B] mt-1.5 leading-relaxed">
              {fase === 1 && etapaAtual.id === 'estudo' && 'Estude o assunto e produza seu próprio resumo à mão. Ao final, envie ao menos uma foto dele.'}
              {fase === 1 && etapaAtual.id === 'teste' && 'Teste o conhecimento através de questões e enriqueça seu material com dados importantes.'}
              {fase === 1 && etapaAtual.id === 'recorde' && 'Tente recordar ativamente os pontos principais anotados no resumo sem consultar.'}
              {etapaAtual.id === 'descanso' && 'Faça uma pausa de 15 a 20 min com a mente em modo difuso (evite telas e redes sociais).'}
              {fase === 2 && 'Revise os resumos prévios e aplique respondendo baterias de questões.'}
              {fase === 3 && 'Dedicatória integral à resolução de questões com montagem de caderno de erros.'}
            </p>
          </div>

          {/* Área de Envio da Foto do Resumo (Obrigatória na Fase 1) */}
          <div className="border-2 border-dashed border-[#C9CCE3] rounded-2xl p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Foto do resumo" className="w-14 h-14 object-cover rounded-lg border border-[#E3E5F3]" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#F0F1FA] text-[#4338CA] flex items-center justify-center shrink-0">
                  <Camera size={22} />
                </div>
              )}
              <div>
                <div className="font-semibold text-[15px] text-[#14162B]">
                  Foto do resumo {fotoFile && <span className="text-[#3FA66B] font-bold text-xs ml-2">✓ Selecionada</span>}
                </div>
                <div className="text-xs text-[#5B607A] mt-0.5">
                  {fase === 1 ? '1 foto obrigatória' : 'Opcional'} · não fotografe documentos pessoais
                </div>
              </div>
            </div>

            <label className="btn border border-[#D9DCEB] text-[#4338CA] hover:bg-[#F5F6FA] cursor-pointer text-sm shrink-0">
              {fotoFile ? 'Trocar foto' : 'Enviar foto'}
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" />
            </label>
          </div>

          {fotoError && (
            <div className="p-3 bg-[#FFF4D6] border border-[#FFE9B8] rounded-xl text-xs text-[#7A4B00] flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{fotoError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Conclusão da Sessão e Lançamento de Questões */}
      {showModalConclusao && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <div className="lab">Conclusão da Sessão</div>
                <h3 className="d font-bold text-xl text-[#14162B] mt-0.5">Registrar Desempenho</h3>
              </div>
              <button onClick={() => setShowModalConclusao(false)} className="text-[#5B607A] hover:text-[#14162B]">
                <X size={20} />
              </button>
            </div>

            {sessaoConcluidaSucesso ? (
              <div className="p-6 text-center flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#CFEBD8] text-[#17603A] flex items-center justify-center">
                  <Check size={24} />
                </div>
                <h4 className="font-bold text-lg text-[#14162B]">Sessão Gravada!</h4>
                <p className="text-sm text-[#5B607A]">Controle matricial e progresso atualizados com sucesso.</p>
              </div>
            ) : (
              <>
                <div className="card p-3.5 bg-[#F5F6FA]">
                  <div className="text-xs text-[#5B607A]">{slot?.disciplina?.nome}</div>
                  <div className="font-semibold text-sm text-[#14162B] mt-0.5">{topico?.numeracao} {topico?.texto}</div>
                </div>

                {/* Campos Certas e Resolvidas */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="lab block mb-1">Certas</label>
                    <input
                      type="number"
                      min="0"
                      value={questoesCertas}
                      onChange={e => setQuestoesCertas(e.target.value)}
                      className="fld text-center text-xl font-bold tabular-nums"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="lab block mb-1">Resolvidas</label>
                    <input
                      type="number"
                      min="0"
                      value={questoesResolvidas}
                      onChange={e => setQuestoesResolvidas(e.target.value)}
                      className="fld text-center text-xl font-bold tabular-nums"
                    />
                  </div>
                </div>

                {/* Barra de Taxa de Acerto Instantânea */}
                <div className="card p-3">
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="d font-bold text-lg text-[#14162B]">
                      {Number(questoesResolvidas) > 0
                        ? `${Math.round((Number(questoesCertas) / Number(questoesResolvidas)) * 100)}%`
                        : '0%'}
                    </span>
                    <span className="text-xs text-[#5B607A]">taxa de acerto neste teste</span>
                  </div>
                  <div className="bar mt-2">
                    <i
                      style={{
                        width: `${Number(questoesResolvidas) > 0 ? Math.min(100, Math.round((Number(questoesCertas) / Number(questoesResolvidas)) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Status do Tópico (HU-3.10) */}
                <div>
                  <label className="lab block mb-1.5">Progresso do Tópico</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConcluiuTopico(true)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold ${
                        concluiuTopico
                          ? 'bg-[#E4E5FB] border-[#4338CA] text-[#2F2A9E]'
                          : 'bg-white border-[#D9DCEB] text-[#5B607A]'
                      }`}
                    >
                      Concluí o tópico
                    </button>
                    <button
                      type="button"
                      onClick={() => setConcluiuTopico(false)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold ${
                        !concluiuTopico
                          ? 'bg-[#E4E5FB] border-[#4338CA] text-[#2F2A9E]'
                          : 'bg-white border-[#D9DCEB] text-[#5B607A]'
                      }`}
                    >
                      Continuo depois
                    </button>
                  </div>
                </div>

                {fotoError && (
                  <div className="p-2.5 bg-[#FFF4D6] border border-[#FFE9B8] rounded-xl text-xs text-[#7A4B00]">
                    {fotoError}
                  </div>
                )}

                <button
                  onClick={handleFinalizarSessao}
                  disabled={salvando}
                  className="btn btn-primary h-12 w-full justify-center text-base"
                >
                  {salvando ? 'Gravando no Controle...' : 'Gravar Sessão e Fechar'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
