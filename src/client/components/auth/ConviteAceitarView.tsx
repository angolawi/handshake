import React, { useState, useEffect } from 'react';
import { Logo } from '../common/Logo.js';
import { Check, ShieldCheck, AlertCircle, ArrowRight, Lock, User, Calendar } from 'lucide-react';

interface ConviteAceitarViewProps {
  token: string;
  onLoginSucesso: (token: string, usuario: any) => void;
  onVoltarLogin: () => void;
}

export const ConviteAceitarView: React.FC<ConviteAceitarViewProps> = ({
  token,
  onLoginSucesso,
  onVoltarLogin,
}) => {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [conviteData, setConviteData] = useState<any>(null);

  // Formulário de Onboarding
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [consentimento, setConsentimento] = useState(false);
  const [submetendo, setSubmetendo] = useState(false);

  useEffect(() => {
    if (!token) {
      setErro('Token de convite não encontrado.');
      setCarregando(false);
      return;
    }

    fetch(`/api/auth/magic-link/validar?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setErro(data.error);
        } else if (data.tipo === 'login' && data.token && data.usuario) {
          // Já é login direto, redireciona para a aplicação
          onLoginSucesso(data.token, data.usuario);
        } else if (data.tipo === 'convite' && data.convite) {
          setConviteData(data.convite);
          setNome(data.convite.nome || '');
        }
      })
      .catch(() => {
        setErro('Erro de conexão ao validar o convite.');
      })
      .finally(() => {
        setCarregando(false);
      });
  }, [token, onLoginSucesso]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentimento) {
      alert('Você deve aceitar o termo de consentimento LGPD para ativar sua conta.');
      return;
    }
    if (senha.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmaSenha) {
      alert('As senhas digitadas não coincidem.');
      return;
    }

    setSubmetendo(true);
    setErro(null);

    try {
      const res = await fetch('/api/auth/convite/aceitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          senha,
          consentimento: true,
          nome: nome.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        onLoginSucesso(data.token, data.usuario);
      } else {
        setErro(data.error || 'Erro ao ativar conta.');
      }
    } catch {
      setErro('Erro de comunicação com o servidor.');
    } finally {
      setSubmetendo(false);
    }
  };

  const diasSemanaNomes = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[540px] flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-1">
          <Logo size={36} textSize="text-3xl" />
          <p className="text-sm text-[#5B607A]">
            Ativação de Convite de Mentoria
          </p>
        </div>

        <div className="card p-6 md:p-8 bg-white border border-[#D9DCEB] shadow-sm flex flex-col gap-5">
          {carregando ? (
            <div className="py-12 text-center text-sm text-[#5B607A]">
              Validando seu convite...
            </div>
          ) : erro ? (
            <div className="flex flex-col gap-4 text-center py-6">
              <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#14162B]">Link de Convite Inválido</h3>
                <p className="text-xs text-[#5B607A] mt-1">{erro}</p>
              </div>
              <button
                type="button"
                onClick={onVoltarLogin}
                className="btn btn-primary h-11 text-xs mx-auto px-6 mt-2"
              >
                Ir para a Página de Login
              </button>
            </div>
          ) : conviteData ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Resumo do Mentor e Mentoria */}
              <div className="p-4 rounded-xl bg-[#F0F1FA] border border-[#E4E5FB] flex flex-col gap-2">
                <span className="text-xs font-bold text-[#2F2A9E] flex items-center gap-1.5">
                  <ShieldCheck size={16} /> Você foi convidado para a Mentoria
                </span>
                <div className="text-xs text-[#14162B]">
                  Mentor: <b>{conviteData.mentorNome}</b>
                </div>
                <div className="text-xs text-[#5B607A] flex flex-wrap gap-x-4 gap-y-1">
                  <span>Reunião semanal: <b>{diasSemanaNomes[conviteData.diaCorteSemana] || 'Terça-feira'}</b></span>
                  <span>Término previsto: <b>{new Date(conviteData.fimMentoria).toLocaleDateString('pt-BR')}</b></span>
                </div>
              </div>

              {/* Dados do Aluno */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="lab block mb-1 text-xs">Seu Nome Completo</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Seu nome"
                    className="fld h-10 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="lab block mb-1 text-xs">E-mail Cadastrado</label>
                  <input
                    type="email"
                    value={conviteData.email}
                    disabled
                    className="fld h-10 text-xs bg-[#F5F6FA] text-[#8A8FA8] cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="lab block mb-1 text-xs">Crie sua Senha</label>
                    <input
                      type="password"
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="fld h-10 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="lab block mb-1 text-xs">Confirme sua Senha</label>
                    <input
                      type="password"
                      value={confirmaSenha}
                      onChange={e => setConfirmaSenha(e.target.value)}
                      placeholder="Repita a senha"
                      className="fld h-10 text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Termo de Consentimento LGPD (HU-1.2) */}
              <div className="p-3.5 rounded-xl bg-[#FAFAFC] border border-[#E3E5F3] flex flex-col gap-2">
                <div className="text-xs font-semibold text-[#14162B] flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#4338CA]" />
                  <span>Política de Privacidade e Proteção de Dados (LGPD)</span>
                </div>
                <div className="text-[11px] text-[#5B607A] leading-relaxed max-h-[80px] overflow-y-auto pr-1">
                  Seus dados de estudo, registros de cronômetro, resolução de questões e eventuais fotos de anotações
                  serão processados única e exclusivamente pelo seu mentor para fins pedagógicos durante o período da mentoria
                  (até {new Date(conviteData.fimMentoria).toLocaleDateString('pt-BR')}), em total conformidade com a Lei nº 13.709/2018 (LGPD).
                </div>
                <label className="flex items-start gap-2 pt-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentimento}
                    onChange={e => setConsentimento(e.target.checked)}
                    className="mt-0.5 rounded border-[#D9DCEB] text-[#4338CA] focus:ring-[#4338CA]"
                    required
                  />
                  <span className="text-[11px] font-medium text-[#14162B] leading-tight">
                    Declaro que li e aceito os termos da mentoria e consinto com o tratamento dos meus dados de estudo.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submetendo}
                className="btn btn-primary h-11 font-semibold flex items-center justify-center gap-2 shadow-xs"
              >
                {submetendo ? 'Ativando conta...' : 'Ativar Minha Conta e Começar a Estudar'}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
};
