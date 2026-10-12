import React, { useState } from 'react';
import { Mail, Check, Copy } from 'lucide-react';

export const ConvitesGerenciar: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [fimMentoria, setFimMentoria] = useState('2027-04-30');
  const [diaCorte, setDiaCorte] = useState('2'); // Terça
  const [gerando, setGerando] = useState(false);
  const [linkConvite, setLinkConvite] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const handleGerarConvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setGerando(true);
    setTimeout(() => {
      const token = Math.random().toString(36).substring(2, 12);
      setLinkConvite(`https://handshake.local/convite?token=${token}&email=${encodeURIComponent(email)}`);
      setGerando(false);
    }, 400);
  };

  const handleCopiarLink = () => {
    if (!linkConvite) return;
    navigator.clipboard.writeText(linkConvite);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[800px] mx-auto">
      <div>
        <h1 className="d font-bold text-3xl md:text-4xl text-[#14162B] tracking-tight">Convites de Mentoria</h1>
        <div className="text-base text-[#5B607A] mt-1">
          Vincule novos mentorados com prazo de mentoria e dia da reunião
        </div>
      </div>

      <div className="card p-6 flex flex-col gap-5">
        <h3 className="d font-bold text-xl text-[#14162B]">Novo Convite</h3>
        <p className="text-xs text-[#5B607A]">
          O convite gera um link seguro com token temporário. Ao aceitar, o mentorado dá consentimento LGPD e fica vinculado unicamente a você.
        </p>

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
              <label className="lab block mb-1">Fim da Mentoria (base LGPD de fotos)</label>
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
            {gerando ? 'Gerando link...' : 'Gerar link de convite'}
          </button>
        </form>

        {linkConvite && (
          <div className="mt-4 p-4 rounded-xl bg-[#F0F1FA] border border-[#E4E5FB] flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#2F2A9E] flex items-center gap-1.5">
              <Mail size={14} /> Link gerado com sucesso para {email}:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={linkConvite}
                className="fld text-xs font-mono bg-white flex-1"
              />
              <button
                type="button"
                onClick={handleCopiarLink}
                className="btn border border-[#D9DCEB] h-11 px-3 text-xs flex items-center gap-1 shrink-0"
              >
                {copiado ? <Check size={14} className="text-[#3FA66B]" /> : <Copy size={14} />}
                <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
