import React, { useState, useEffect } from 'react';
import { Moon, Calendar, Check, Printer, Image as ImageIcon } from 'lucide-react';

interface RevisaoHubProps {
  matriculaId: string;
}

export const RevisaoHub: React.FC<RevisaoHubProps> = ({ matriculaId }) => {
  const [activeTab, setActiveTab] = useState<'noturna' | 'mensal'>('noturna');
  const [loading, setLoading] = useState(true);
  const [fotosHoje, setFotosHoje] = useState<any[]>([]);
  const [revisaoNoturnaFeita, setRevisaoNoturnaFeita] = useState(false);
  const [marcando, setMarcando] = useState(false);

  const fetchRevisoes = () => {
    fetch(`/api/matriculas/${matriculaId}/revisoes`)
      .then(res => res.json())
      .then(data => {
        setFotosHoje(data.fotosHoje || []);
        setRevisaoNoturnaFeita(data.revisaoNoturnaFeita || false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRevisoes();
  }, [matriculaId]);

  const handleMarcarNoturna = async () => {
    setMarcando(true);
    try {
      await fetch(`/api/matriculas/${matriculaId}/revisao-noturna`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setRevisaoNoturnaFeita(true);
    } catch (e) {
      console.error(e);
    } finally {
      setMarcando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1080px] mx-auto">
      <div>
        <h1 className="d font-bold text-3xl md:text-4xl text-[#14162B] tracking-tight">Revisões</h1>
        <div className="text-base text-[#5B607A] mt-1">
          Fixação ativa baseada na metodologia Gleyson Azevedo
        </div>
      </div>

      {/* Seletor de Tipo de Revisão */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab('noturna')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
            activeTab === 'noturna'
              ? 'bg-[#14162B] text-white shadow-xs'
              : 'bg-white border border-[#E3E5F3] text-[#5B607A] hover:text-[#14162B]'
          }`}
        >
          <Moon size={16} />
          <span>Revisão Noturna (Diária)</span>
        </button>
        <button
          onClick={() => setActiveTab('mensal')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
            activeTab === 'mensal'
              ? 'bg-[#14162B] text-white shadow-xs'
              : 'bg-white border border-[#E3E5F3] text-[#5B607A] hover:text-[#14162B]'
          }`}
        >
          <Calendar size={16} />
          <span>Revisão Mensal (1º final de semana)</span>
        </button>
      </div>

      {activeTab === 'noturna' ? (
        <div className="flex flex-col gap-6">
          <div className="card p-5 bg-[#F8F9FD] border-[#D9DCEB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="lab text-[#4338CA]">Roteiro Noturno (15 a 20 min antes de dormir)</div>
              <h3 className="d font-bold text-xl text-[#14162B] mt-1">Relembre os resumos produzidos hoje</h3>
              <p className="text-sm text-[#5B607A] mt-1 max-w-xl">
                Percorra os resumos fotográficos do dia para sinalizar ao cérebro que o conteúdo estudado é prioritário para consolidação durante o sono.
              </p>
            </div>
            {revisaoNoturnaFeita ? (
              <span className="chip ok py-2 px-4 text-sm font-semibold flex items-center gap-1.5 shrink-0">
                <Check size={16} /> Revisão de hoje concluída
              </span>
            ) : (
              <button
                onClick={handleMarcarNoturna}
                disabled={marcando}
                className="btn btn-primary h-11 shrink-0"
              >
                <Check size={16} className="mr-1" />
                {marcando ? 'Salvando...' : 'Marcar como feita'}
              </button>
            )}
          </div>

          {/* Galeria de Fotos do Dia */}
          <div className="card p-6">
            <h3 className="d font-bold text-lg text-[#14162B] mb-4">
              Material Produzido Hoje ({fotosHoje.length} {fotosHoje.length === 1 ? 'resumo' : 'resumos'})
            </h3>

            {fotosHoje.length === 0 ? (
              <div className="p-8 text-center text-[#5B607A] border-2 border-dashed border-[#E3E5F3] rounded-xl flex flex-col items-center gap-2">
                <ImageIcon size={32} className="text-[#8A8FA8]" />
                <p>Nenhuma foto de resumo enviada hoje ainda.</p>
                <span className="text-xs">Ao concluir uma sessão de estudo, suas anotações aparecerão aqui automaticamente.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fotosHoje.map((foto, idx) => (
                  <div key={foto.id || idx} className="border border-[#E3E5F3] rounded-xl p-3 bg-white flex flex-col gap-2">
                    <img
                      src={`/uploads/${foto.storage_key}`}
                      alt="Resumo do dia"
                      className="w-full h-44 object-cover rounded-lg border border-[#EEF0F7]"
                      onError={(e: any) => {
                        e.target.src = 'https://placehold.co/400x300/e4e5fb/2f2a9e?text=Resumo+Manuscrito';
                      }}
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#4338CA]">{foto.disciplina_nome}</span>
                      <div className="text-sm font-medium text-[#14162B] truncate">{foto.topico_texto}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="card p-5 bg-[#F8F9FD] border-[#D9DCEB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="lab text-[#4338CA]">Revisão Mensal (1º Final de Semana do Mês)</div>
              <h3 className="d font-bold text-xl text-[#14162B] mt-1">Compilação de todos os resumos do mês anterior</h3>
              <p className="text-sm text-[#5B607A] mt-1 max-w-xl">
                Não é necessário resolver questões. Basta tentar relembrar os resumos e reproduzir manualmente o que houver esquecido.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="btn border border-[#D9DCEB] text-[#14162B] h-11 shrink-0 flex items-center gap-2"
            >
              <Printer size={16} />
              <span>Exportar PDF / Imprimir</span>
            </button>
          </div>

          <div className="card p-6">
            <h3 className="d font-bold text-lg text-[#14162B] mb-2">Compilado de Outubro/2026</h3>
            <p className="text-sm text-[#5B607A] mb-4">
              Todos os resumos manuscritos catalogados e indexados por matéria para revisão global.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['Persistência 1.2', 'Estado 1.1.2', 'Evidências 1', 'Transparência 4.2'].map((item, i) => (
                <div key={i} className="border border-[#E3E5F3] rounded-xl p-3 bg-white text-center">
                  <div className="aspect-4/3 rounded-lg bg-[#F0F1FA] border border-[#E3E5F3] flex items-center justify-center text-xs text-[#5B607A] mb-2">
                    Resumo #{i + 1}
                  </div>
                  <div className="text-xs font-semibold text-[#14162B]">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
