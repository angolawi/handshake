import React, { useState, useEffect } from 'react';
import { Mail, Check, Copy, ExternalLink, UserPlus, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ConvitesGerenciar: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [fimMentoria, setFimMentoria] = useState('2027-04-30');
  const [diaCorte, setDiaCorte] = useState('2'); // Terça
  const [gerando, setGerando] = useState(false);
  const [linkConvite, setLinkConvite] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [convites, setConvites] = useState<any[]>([]);
  const [carregandoConvites, setCarregandoConvites] = useState(true);

  const fetchConvites = () => {
    const token = localStorage.getItem('handshake_token');
    fetch('/api/convites', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setConvites(data);
        }
      })
      .catch(console.error)
      .finally(() => setCarregandoConvites(false));
  };

  useEffect(() => {
    fetchConvites();
  }, []);

  const handleGerarConvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setGerando(true);
    setErro(null);

    const token = localStorage.getItem('handshake_token');

    try {
      const res = await fetch('/api/convites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          fimMentoria,
          diaCorte: Number(diaCorte),
          editalId: 'edital_cgu',
        }),
      });

      const data = await res.json();
      if (res.ok && data.magicLink) {
        setLinkConvite(data.magicLink);
        setNome('');
        setEmail('');
        fetchConvites();
      } else {
        setErro(data.error || 'Erro ao gerar convite.');
      }
    } catch {
      setErro('Erro de comunicação com o servidor.');
    } finally {
      setGerando(false);
    }
  };

  const handleCopiarLink = (link: string, id: string = 'recente') => {
    navigator.clipboard.writeText(link);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const diasSemanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[960px] mx-auto">
      <div>
        <h1 className="d font-bold text-3xl md:text-4xl text-[#14162B] tracking-tight">Convites de Mentoria</h1>
        <div className="text-base text-[#5B607A] mt-1">
          Vincule novos mentorados com prazo de mentoria, dia de reunião e link seguro de onboarding
        </div>
      </div>

      {/* Card de Criação */}
      <div className="card p-6 flex flex-col gap-5 border border-[#D9DCEB]">
        <div className="flex items-center gap-2">
          <UserPlus size={20} className="text-[#4338CA]" />
          <h3 className="d font-bold text-xl text-[#14162B]">Novo Convite</h3>
        </div>
        <p className="text-xs text-[#5B607A]">
          O convite gera um Magic Link seguro com token. Ao abrir o link, o aluno aceita a política LGPD, <b>define sua própria senha de acesso</b> e fica vinculado unicamente a você.
        </p>

        {erro && (
          <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-xs text-[#991B1B]">
            {erro}
          </div>
        )}

        <form onSubmit={handleGerarConvite} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="lab block mb-1">Nome do mentorado</label>
              <input
                type="text"
                placeholder="Ex.: Carlos Mendes"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="fld"
                required
              />
            </div>
            <div>
              <label className="lab block mb-1">E-mail</label>
              <input
                type="email"
                placeholder="carlos@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="fld"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="lab block mb-1">Fim da Mentoria (base LGPD)</label>
              <input
                type="date"
                value={fimMentoria}
                onChange={e => setFimMentoria(e.target.value)}
                className="fld"
                required
              />
            </div>
            <div>
              <label className="lab block mb-1">Dia de Corte Semanal (Reunião)</label>
              <select
                value={diaCorte}
                onChange={e => setDiaCorte(e.target.value)}
                className="fld"
              >
                <option value="1">Segunda-feira</option>
                <option value="2">Terça-feira</option>
                <option value="3">Quarta-feira</option>
                <option value="4">Quinta-feira</option>
                <option value="5">Sexta-feira</option>
                <option value="6">Sábado</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={gerando} className="btn btn-primary h-11 w-fit mt-1">
            {gerando ? 'Gerando link...' : 'Gerar Magic Link de Convite'}
          </button>
        </form>

        {linkConvite && (
          <div className="mt-2 p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex flex-col gap-2">
            <span className="text-xs font-bold text-[#166534] flex items-center gap-1.5">
              <Check size={14} /> Convite emitido com sucesso! Envie o link abaixo ao mentorado:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={linkConvite}
                className="fld text-xs font-mono bg-white flex-1 h-10"
              />
              <button
                type="button"
                onClick={() => handleCopiarLink(linkConvite, 'recente')}
                className="btn btn-secondary h-10 px-3 text-xs flex items-center gap-1 shrink-0"
              >
                {copiadoId === 'recente' ? <Check size={14} className="text-[#3FA66B]" /> : <Copy size={14} />}
                <span>{copiadoId === 'recente' ? 'Copiado!' : 'Copiar'}</span>
              </button>
              <a
                href={linkConvite}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary h-10 px-3 text-xs flex items-center gap-1 shrink-0"
                title="Abrir página de ativação do aluno"
              >
                <ExternalLink size={14} />
                <span>Testar como Aluno</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Histórico de Convites Emitidos */}
      <div className="card p-6 flex flex-col gap-4 border border-[#D9DCEB]">
        <div className="flex items-center justify-between">
          <h3 className="d font-bold text-xl text-[#14162B]">Convites Emitidos</h3>
          <span className="text-xs text-[#5B607A]">{convites.length} convite(s) registrados</span>
        </div>

        {carregandoConvites ? (
          <div className="py-8 text-center text-xs text-[#5B607A]">Carregando convites...</div>
        ) : convites.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8A8FA8]">
            Nenhum convite emitido até o momento.
          </div>
        ) : (
          <div className="divide-y divide-[#EEF0F7] overflow-x-auto">
            {convites.map(c => {
              const link = c.magicLink;
              const isAceito = c.status === 'aceito';
              const isExpirado = c.status === 'expirado';

              return (
                <div key={c.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-col min-w-[200px]">
                    <span className="font-bold text-[#14162B]">{c.nome || 'Sem nome informado'}</span>
                    <span className="text-[#5B607A]">{c.email}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[#5B607A]">
                      Reunião: <b>{diasSemanaNomes[c.dia_corte_semana] || 'Ter'}</b>
                    </span>
                    <span className="text-[#5B607A]">
                      Fim: <b>{new Date(c.fim_mentoria).toLocaleDateString('pt-BR')}</b>
                    </span>

                    <span
                      className={`chip text-[11px] font-semibold flex items-center gap-1 ${
                        isAceito ? 'ok' : isExpirado ? 'wn' : 'f1'
                      }`}
                    >
                      {isAceito ? (
                        <>
                          <CheckCircle2 size={12} /> Aceito
                        </>
                      ) : isExpirado ? (
                        <>
                          <AlertTriangle size={12} /> Expirado
                        </>
                      ) : (
                        <>
                          <Clock size={12} /> Pendente
                        </>
                      )}
                    </span>
                  </div>

                  {!isAceito && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopiarLink(link, c.id)}
                        className="btn btn-secondary h-8 px-2.5 text-xs flex items-center gap-1"
                      >
                        {copiadoId === c.id ? <Check size={12} className="text-[#3FA66B]" /> : <Copy size={12} />}
                        <span>{copiadoId === c.id ? 'Copiado' : 'Copiar Link'}</span>
                      </button>
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn border border-[#D9DCEB] h-8 px-2.5 text-xs flex items-center gap-1 hover:bg-[#F5F6FA]"
                      >
                        <ExternalLink size={12} />
                        <span>Abrir</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
