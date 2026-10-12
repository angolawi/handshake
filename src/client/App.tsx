import React, { useState, useEffect } from 'react';
import { Header, ViewMode } from './components/common/Header.js';
import { Sidebar } from './components/common/Sidebar.js';
import { BottomNav } from './components/common/BottomNav.js';

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

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<'mentor' | 'mentorado'>('mentorado');
  const [viewMode, setViewMode] = useState<ViewMode>('auto');
  
  // Abas
  const [tabMentorado, setTabMentorado] = useState('hoje');
  const [tabMentor, setTabMentor] = useState('mentorados');

  // Modo sub-tela de edição de edital no mentor
  const [mentorSubScreen, setMentorSubScreen] = useState<'estrutura' | 'parser'>('estrutura');
  const [selectedEditalId, setSelectedEditalId] = useState('edital_cgu');

  // Identificação do Mentorado
  const [matriculaId, setMatriculaId] = useState('mat_marina_cgu');
  const [mentoradoNome, setMentoradoNome] = useState('Marina R.');

  useEffect(() => {
    fetch('/api/bootstrap')
      .then(res => res.json())
      .then(data => {
        if (data.matriculaPadraoId) {
          setMatriculaId(data.matriculaPadraoId);
        }
        if (data.mentorados && data.mentorados.length > 0) {
          setMentoradoNome(data.mentorados[0].nome);
        }
      })
      .catch(console.error);
  }, []);

  const activeTab = currentRole === 'mentor' ? tabMentor : tabMentorado;
  const handleTabChange = (tab: string) => {
    if (currentRole === 'mentor') {
      setTabMentor(tab);
      if (tab === 'editais') setMentorSubScreen('estrutura');
    } else {
      setTabMentorado(tab);
    }
  };

  // Renderiza a tela ativa
  const renderContent = (isMobileView: boolean) => {
    if (currentRole === 'mentorado') {
      switch (tabMentorado) {
        case 'hoje':
          return <SessaoEstudo matriculaId={matriculaId} isMobile={isMobileView} onConcluirSessao={() => setTabMentorado('controle')} />;
        case 'edital':
          return <EditalAluno matriculaId={matriculaId} isMobile={isMobileView} />;
        case 'controle':
          return <ControleMatriz matriculaId={matriculaId} isMobile={isMobileView} />;
        case 'revisoes':
          return <RevisaoHub matriculaId={matriculaId} />;
        default:
          return <SessaoEstudo matriculaId={matriculaId} isMobile={isMobileView} />;
      }
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
          return <PlanejarCiclo matriculaId={matriculaId} onPublicado={() => setTabMentor('mentorados')} />;
        case 'convites':
          return <ConvitesGerenciar />;
        default:
          return <MentorPainel />;
      }
    }
  };

  // Se o usuário selecionou simulação Mobile (390px viewport frame)
  if (viewMode === 'mobile') {
    return (
      <div className="min-h-screen bg-[#E5E7EB] flex flex-col">
        <Header
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          currentMentoradoNome={mentoradoNome}
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

  // Se o usuário selecionou visualização Desktop forçada ou Auto-responsivo
  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentMentoradoNome={mentoradoNome}
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
