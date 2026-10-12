import React, { useState } from 'react';
import { Logo } from '../common/Logo.js';
import { ShieldAlert, UserCheck, Key, Mail, ArrowRight, Sparkles, AlertCircle, Check, Copy, ArrowLeft } from 'lucide-react';

interface LoginViewProps {
  onLoginSucesso: (token: string, usuario: any) => void;
  onAbrirConviteToken?: (token: string) => void;
  onVoltarLanding?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSucesso, onVoltarLanding }) => {
  const [tabAtiva, setTabAtiva] = useState<'mentor' | 'mentorado'>('mentor');

  // Estado do Mentor
  const [mentorEmail, setMentorEmail] = useState('');
  const [mentorSenha, setMentorSenha] = useState('');
  const [mentorErro, setMentorErro] = useState<string | null>(null);
  const [mentorCarregando, setMentorCarregando] = useState(false);

  // Estado do Mentorado
  const [alunoEmail, setAlunoEmail] = useState('');
  const [alunoSenha, setAlunoSenha] = useState('');
  const [alunoErro, setAlunoErro] = useState<string | null>(null);
  const [alunoCarregando, setAlunoCarregando] = useState(false);

  // Modo Magic Link para Mentorado
  const [modoMagicLink, setModoMagicLink] = useState(false);
  const [magicLinkGerado, setMagicLinkGerado] = useState<string | null>(null);
  const [magicLinkCopiado, setMagicLinkCopiado] = useState(false);

  // Preenche credenciais oficiais do Mentor
  const handlePreencherMentorPadrao = () => {
    setMentorEmail('gleysonazevedo@gmail.com');
    setMentorSenha('Gleyson!Handshake01');
    setMentorErro(null);
  };

  // Login do Mentor
  const handleLoginMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    setMentorErro(null);
    setMentorCarregando(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mentorEmail, senha: mentorSenha }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        onLoginSucesso(data.token, data.usuario);
      } else {
        setMentorErro(data.error || 'Credenciais inválidas.');
      }
    } catch {
      setMentorErro('Erro de conexão ao autenticar.');
    } finally {
      setMentorCarregando(false);
    }
  };

  // Login do Mentorado com Senha
  const handleLoginAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlunoErro(null);
    setAlunoCarregando(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: alunoEmail, senha: alunoSenha }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        onLoginSucesso(data.token, data.usuario);
      } else {
        setAlunoErro(data.error || 'Credenciais inválidas.');
      }
    } catch {
      setAlunoErro('Erro de conexão ao autenticar.');
    } finally {
      setAlunoCarregando(false);
    }
  };

  // Solicitar Magic Link
  const handleSolicitarMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlunoErro(null);
    setAlunoCarregando(true);

    try {
      const res = await fetch('/api/auth/magic-link/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: alunoEmail }),
      });
      const data = await res.json();
      if (res.ok && data.magicLink) {
        setMagicLinkGerado(data.magicLink);
      } else {
        setAlunoErro(data.error || 'Não foi possível gerar o Magic Link.');
      }
    } catch {
      setAlunoErro('Erro de conexão ao solicitar Magic Link.');
    } finally {
      setAlunoCarregando(false);
    }
  };

  // Atalho para entrar como aluno pré-cadastrado no seed
  const handleLoginAlunoDemo = (email: string) => {
    setAlunoEmail(email);
    setAlunoSenha('Aluno!123456');
    setModoMagicLink(false);
    setAlunoErro(null);
  };

  const handleCopiarMagicLink = () => {
    if (!magicLinkGerado) return;
    navigator.clipboard.writeText(magicLinkGerado);
    setMagicLinkCopiado(true);
    setTimeout(() => setMagicLinkCopiado(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[480px] flex flex-col gap-6">
        {onVoltarLanding && (
          <div>
            <button
              type="button"
              onClick={onVoltarLanding}
              className="inline-flex items-center gap-1.5 text-xs text-[#5B607A] hover:text-[#14162B] font-medium transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Voltar à apresentação</span>
            </button>
          </div>
        )}

        {/* Logo e Título */}
        <div className="flex flex-col items-center text-center gap-2">
          <Logo size={36} textSize="text-3xl" />
          <p className="text-sm text-[#5B607A]">
            Controle e Mentoria de Estudos de Alto Rendimento
          </p>
        </div>

        {/* Card Principal de Autenticação */}
        <div className="card p-6 md:p-8 bg-white border border-[#D9DCEB] shadow-sm flex flex-col gap-6">
          {/* Seletor de Perfil Segregado */}
          <div className="flex bg-[#F0F1FA] p-1 rounded-xl border border-[#E4E5FB]">
            <button
              type="button"
              onClick={() => {
                setTabAtiva('mentor');
                setMentorErro(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                tabAtiva === 'mentor'
                  ? 'bg-white text-[#4338CA] shadow-xs'
                  : 'text-[#5B607A] hover:text-[#14162B]'
              }`}
            >
              <ShieldAlert size={16} />
              <span>Acesso Mentor</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTabAtiva('mentorado');
                setAlunoErro(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                tabAtiva === 'mentorado'
                  ? 'bg-white text-[#4338CA] shadow-xs'
                  : 'text-[#5B607A] hover:text-[#14162B]'
              }`}
            >
              <UserCheck size={16} />
              <span>Área do Aluno</span>
            </button>
          </div>

          {/* FORMULÁRIO DO MENTOR */}
          {tabAtiva === 'mentor' && (
            <form onSubmit={handleLoginMentor} className="flex flex-col gap-4">
              <div>
                <h2 className="font-bold text-lg text-[#14162B]">Entrar como Mentor</h2>
                <p className="text-xs text-[#5B607A] mt-0.5">
                  Acesse o painel para gerenciar editais, ciclos e mentorados.
                </p>
              </div>

              {mentorErro && (
                <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-xs text-[#991B1B] flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{mentorErro}</span>
                </div>
              )}

              <div>
                <label className="lab block mb-1 text-xs">E-mail do Mentor</label>
                <input
                  type="email"
                  value={mentorEmail}
                  onChange={e => setMentorEmail(e.target.value)}
                  placeholder="gleysonazevedo@gmail.com"
                  className="fld h-11 text-sm"
                  required
                />
              </div>

              <div>
                <label className="lab block mb-1 text-xs">Senha</label>
                <input
                  type="password"
                  value={mentorSenha}
                  onChange={e => setMentorSenha(e.target.value)}
                  placeholder="••••••••••••"
                  className="fld h-11 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={mentorCarregando}
                className="btn btn-primary h-11 font-semibold flex items-center justify-center gap-2 mt-2 shadow-xs"
              >
                {mentorCarregando ? 'Autenticando...' : 'Entrar no Painel do Mentor'}
                <ArrowRight size={16} />
              </button>

              {/* Dica de preenchimento rápido */}
              <div className="pt-3 border-t border-[#EEF0F7] flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handlePreencherMentorPadrao}
                  className="text-xs text-[#4338CA] hover:underline flex items-center gap-1.5 font-medium justify-center"
                >
                  <Sparkles size={13} />
                  <span>Usar credenciais oficiais de Gleyson Azevedo</span>
                </button>
              </div>
            </form>
          )}

          {/* FORMULÁRIO DO MENTORADO */}
          {tabAtiva === 'mentorado' && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-bold text-lg text-[#14162B]">Área do Mentorado</h2>
                <p className="text-xs text-[#5B607A] mt-0.5">
                  Acesse seu cronograma diário, sessões de estudo e ciclo ativo.
                </p>
              </div>

              {alunoErro && (
                <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-xs text-[#991B1B] flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{alunoErro}</span>
                </div>
              )}

              {!modoMagicLink ? (
                /* Login tradicional com E-mail e Senha */
                <form onSubmit={handleLoginAluno} className="flex flex-col gap-4">
                  <div>
                    <label className="lab block mb-1 text-xs">Seu E-mail</label>
                    <input
                      type="email"
                      value={alunoEmail}
                      onChange={e => setAlunoEmail(e.target.value)}
                      placeholder="aluno@exemplo.com"
                      className="fld h-11 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="lab text-xs">Sua Senha</label>
                      <button
                        type="button"
                        onClick={() => {
                          setModoMagicLink(true);
                          setMagicLinkGerado(null);
                        }}
                        className="text-[11px] text-[#4338CA] hover:underline"
                      >
                        Esqueci / Entrar com Magic Link
                      </button>
                    </div>
                    <input
                      type="password"
                      value={alunoSenha}
                      onChange={e => setAlunoSenha(e.target.value)}
                      placeholder="••••••••"
                      className="fld h-11 text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={alunoCarregando}
                    className="btn btn-primary h-11 font-semibold flex items-center justify-center gap-2 mt-1 shadow-xs"
                  >
                    {alunoCarregando ? 'Entrando...' : 'Entrar na Área do Aluno'}
                    <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                /* Solicitação de Magic Link por E-mail */
                <form onSubmit={handleSolicitarMagicLink} className="flex flex-col gap-4">
                  <div className="p-3 bg-[#F0F1FA] rounded-xl text-xs text-[#2F2A9E] flex gap-2">
                    <Mail size={16} className="shrink-0 mt-0.5" />
                    <span>
                      Digite o e-mail cadastrado ou convidado pelo seu mentor para receber o Magic Link de acesso imediato sem senha.
                    </span>
                  </div>

                  <div>
                    <label className="lab block mb-1 text-xs">E-mail Cadastrado</label>
                    <input
                      type="email"
                      value={alunoEmail}
                      onChange={e => setAlunoEmail(e.target.value)}
                      placeholder="aluno@exemplo.com"
                      className="fld h-11 text-sm"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setModoMagicLink(false)}
                      className="btn btn-secondary h-11 flex-1 text-xs"
                    >
                      Voltar ao Login com Senha
                    </button>
                    <button
                      type="submit"
                      disabled={alunoCarregando}
                      className="btn btn-primary h-11 flex-1 text-xs font-semibold"
                    >
                      {alunoCarregando ? 'Gerando...' : 'Receber Magic Link'}
                    </button>
                  </div>

                  {magicLinkGerado && (
                    <div className="mt-2 p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex flex-col gap-2">
                      <span className="text-xs font-bold text-[#166534] flex items-center gap-1.5">
                        <Check size={14} /> Magic Link gerado com sucesso:
                      </span>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          readOnly
                          value={magicLinkGerado}
                          className="fld h-9 text-xs font-mono bg-white flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleCopiarMagicLink}
                          className="btn btn-secondary h-9 px-2.5 text-xs flex items-center gap-1 shrink-0"
                        >
                          {magicLinkCopiado ? <Check size={13} className="text-[#3FA66B]" /> : <Copy size={13} />}
                          <span>{magicLinkCopiado ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                      <a
                        href={magicLinkGerado}
                        className="btn btn-primary h-9 text-xs font-semibold text-center mt-1"
                      >
                        Acessar Agora com este Link
                      </a>
                    </div>
                  )}
                </form>
              )}

              {/* Atalhos rápidos de teste com alunos do Seed */}
              <div className="pt-3 border-t border-[#EEF0F7] flex flex-col gap-1.5">
                <span className="text-[11px] text-[#8A8FA8] text-center block">
                  Atalhos de homologação (alunos pré-cadastrados):
                </span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleLoginAlunoDemo('marina@handshake.local')}
                    className="chip text-[11px] hover:bg-[#E4E5FB] transition-colors"
                  >
                    Marina R. (marina@...)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoginAlunoDemo('rafael@handshake.local')}
                    className="chip text-[11px] hover:bg-[#E4E5FB] transition-colors"
                  >
                    Rafael S. (rafael@...)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoginAlunoDemo('lucas@handshake.local')}
                    className="chip text-[11px] hover:bg-[#E4E5FB] transition-colors"
                  >
                    Lucas M. (lucas@...)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
