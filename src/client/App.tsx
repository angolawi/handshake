import React, { useState, useEffect } from 'react';
import { Header, ViewMode, HeaderUser } from './components/common/Header.js';
import { Sidebar } from './components/common/Sidebar.js';
import { BottomNav } from './components/common/BottomNav.js';

// Telas de Autenticação e Onboarding
import { LandingPage } from './components/landing/LandingPage.js';
import { LoginView } from './components/auth/LoginView.js';
import { ConviteAceitarView } from './components/auth/ConviteAceitarView.js';

// Telas do Mentorado
import { SessaoEstudo } from './components/mentorado/SessaoEstudo.js';
import { ControleMatriz } from './components/mentorado/ControleMatriz.js';
import { EditalAluno } from './components/mentorado/EditalAluno.js';
import { RevisaoHub } from './components/mentorado/RevisaoHub.js';

// Telas do Mentor
import { MentorPainel } from './components/mentor/MentorPainel.js';
import { EstruturaEdital } from './components/mentor/EstruturaEdital.js';
import { EditalParser } from './components/mentor/EditalParser.js';
import { PlanejarCiclo } from './components/mentor/PlanejarCiclo.js';
import { ConvitesGerenciar } from './components/mentor/ConvitesGerenciar.js';

interface UserSession extends HeaderUser {
  id: string;
  matriculaId?: string;
  mentoradoId?: string;
  editalId?: string;
}

export const App: React.FC = () => {
  // Autenticação e Sessão
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [inviteToken, setInviteToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token');
    }
    return null;
  });

  // Modo de visualização para visitantes não autenticados
  const [publicView, setPublicView] = useState<'landing' | 'login'>('landing');

  // Modo de visualização de tela (auto, desktop ou mobile simulado)
  const [viewMode, setViewMode] = useState<ViewMode>('auto');
  
  // Abas segregadas por papel
  const [tabMentorado, setTabMentorado] = useState('hoje');
  const [tabMentor, setTabMentor] = useState('mentorados');

  // Modo sub-tela de edição de edital no mentor
  const [mentorSubScreen, setMentorSubScreen] = useState<'estrutura' | 'parser'>('estrutura');
  const [selectedEditalId, setSelectedEditalId] = useState('edital_cgu');

  // Identificação do Mentorado (para carregar ciclos e sessões)
  const [matriculaId, setMatriculaId] = useState('mat_marina_cgu');

  // Checagem de sessão ativa no carregamento inicial
  useEffect(() => {
    const token = localStorage.getItem('handshake_token');
    if (!token) {
      setCarregandoAuth(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Sessão expirada');
        return res.json();
      })
      .then(data => {
        if (data.usuario) {
          setCurrentUser(data.usuario);
          if (data.usuario.matriculaId) {
            setMatriculaId(data.usuario.matriculaId);
          }
          if (data.usuario.editalId) {
            setSelectedEditalId(data.usuario.editalId);
          }
        } else {
          localStorage.removeItem('handshake_token');
          setCurrentUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('handshake_token');
        setCurrentUser(null);
      })
      .finally(() => {
        setCarregandoAuth(false);
      });
  }, []);

  const limparTokenUrl = () => {
    setInviteToken(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      const newPath = url.pathname === '/convite' || url.pathname === '/entrar' ? '/' : url.pathname;
      window.history.replaceState({}, '', newPath + (url.search ? url.search : ''));
    }
  };

  const handleLoginSucesso = (token: string, usuario: any) => {
    localStorage.setItem('handshake_token', token);
    setCurrentUser(usuario);
    if (usuario.matriculaId) {
      setMatriculaId(usuario.matriculaId);
    }
    if (usuario.editalId) {
      setSelectedEditalId(usuario.editalId);
    }
    limparTokenUrl();
  };

  const handleLogout = () => {
    const token = localStorage.getItem('handshake_token');
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      }).catch(console.error);
    }
    localStorage.removeItem('handshake_token');
    setCurrentUser(null);
    setPublicView('landing');
    setTabMentorado('hoje');
    setTabMentor('mentorados');
  };

  // Se estiver carregando sessão existente
  if (carregandoAuth) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4">
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#2F2A9E] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-[#5B607A]">Verificando autenticação...</span>
        </div>
      </div>
    );
  }

  // Se houver um token de convite na URL, exibe tela de ativação/onboarding
  if (inviteToken) {
    return (
      <ConviteAceitarView
        token={inviteToken}
        onLoginSucesso={handleLoginSucesso}
        onVoltarLogin={limparTokenUrl}
      />
    );
  }

  // Se não estiver autenticado, exibe Landing Page ou tela de Login
  if (!currentUser) {
    if (publicView === 'landing') {
      return (
        <LandingPage
          onEntrar={() => setPublicView('login')}
        />
      );
    }
    return (
      <LoginView
        onLoginSucesso={handleLoginSucesso}
        onAbrirConviteToken={(token) => setInviteToken(token)}
        onVoltarLanding={() => setPublicView('landing')}
      />
    );
  }

  // Papel estritamente determinado pelo usuário autenticado
  const currentRole = currentUser.papel;
  const activeTab = currentRole === 'mentor' ? tabMentor : tabMentorado;

  const handleTabChange = (tab: string) => {
    if (currentRole === 'mentor') {
      setTabMentor(tab);
      if (tab === 'editais') setMentorSubScreen('estrutura');
    } else {
      setTabMentorado(tab);
    }
  };

  // Renderiza o conteúdo exclusivo do papel autenticado
  const renderContent = (isMobileView: boolean) => {
    if (currentRole === 'mentorado') {
      return (
        <>
          <div className={tabMentorado === 'hoje' ? 'block' : 'hidden'}>
            <SessaoEstudo
              matriculaId={matriculaId}
              isMobile={isMobileView}
              onConcluirSessao={() => setTabMentorado('controle')}
            />
          </div>
          <div className={tabMentorado === 'edital' ? 'block' : 'hidden'}>
            {tabMentorado === 'edital' && <EditalAluno matriculaId={matriculaId} isMobile={isMobileView} />}
          </div>
          <div className={tabMentorado === 'controle' ? 'block' : 'hidden'}>
            {tabMentorado === 'controle' && <ControleMatriz matriculaId={matriculaId} isMobile={isMobileView} />}
          </div>
          <div className={tabMentorado === 'revisoes' ? 'block' : 'hidden'}>
            {tabMentorado === 'revisoes' && <RevisaoHub matriculaId={matriculaId} />}
          </div>
        </>
      );
    } else {
      switch (tabMentor) {
        case 'mentorados':
          return <MentorPainel onAbrirConvite={() => setTabMentor('convites')} />;
        case 'editais':
          if (mentorSubScreen === 'parser') {
            return <EditalParser editalId={selectedEditalId} onSalvo={() => setMentorSubScreen('estrutura')} />;
          }
          return (
            <EstruturaEdital
              editalId={selectedEditalId}
              onSelectEdital={setSelectedEditalId}
              onAdicionarDisciplina={() => setMentorSubScreen('parser')}
            />
          );
        case 'ciclos':
          return <PlanejarCiclo onPublicado={() => setTabMentor('mentorados')} />;
        case 'convites':
          return <ConvitesGerenciar />;
        default:
          return <MentorPainel onAbrirConvite={() => setTabMentor('convites')} />;
      }
    }
  };

  // Se o usuário selecionou simulação Mobile (390px viewport frame)
  if (viewMode === 'mobile') {
    return (
      <div className="min-h-screen bg-[#E5E7EB] flex flex-col">
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <div className="flex-1 flex items-center justify-center p-4">
          {/* Mockup de dispositivo mobile 390px x 844px */}
          <div className="w-[390px] h-[844px] bg-[#F5F6FA] rounded-[44px] shadow-2xl border-[10px] border-[#1F2937] overflow-hidden flex flex-col relative">
            {/* Dynamic Island / Notch */}
            <div className="w-28 h-6 bg-[#1F2937] rounded-full mx-auto mt-2 shrink-0 z-50" />

            {/* Conteúdo rolável do app */}
            <div className="flex-1 overflow-y-auto pb-16">
              {renderContent(true)}
            </div>

            {/* Menu inferior do mobile */}
            <BottomNav
              role={currentRole}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </div>
        </div>
      </div>
    );
  }

  // Visualização Desktop ou Auto-responsivo
  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex-1 flex min-w-0">
        {/* Sidebar desktop: sempre visível em modo desktop, ou a partir de md: em modo auto */}
        <div className={viewMode === 'desktop' ? 'block' : 'hidden md:block'}>
          <Sidebar
            role={currentRole}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>

        {/* Área Principal de Conteúdo */}
        <main className="flex-1 min-w-0 pb-16 md:pb-0 overflow-x-hidden">
          {renderContent(false)}
        </main>
      </div>

      {/* Menu Inferior mobile: visível apenas quando em modo auto em telas pequenas */}
      {viewMode === 'auto' && (
        <div className="md:hidden">
          <BottomNav
            role={currentRole}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      )}
    </div>
  );
};
