import React from 'react';
import { Logo } from './Logo.js';
import { Monitor, Smartphone, UserCheck, ShieldAlert, LogOut } from 'lucide-react';

export type ViewMode = 'auto' | 'desktop' | 'mobile';

export interface HeaderUser {
  nome: string;
  email: string;
  papel: 'mentor' | 'mentorado';
}

interface HeaderProps {
  currentUser: HeaderUser;
  onLogout: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  viewMode,
  onViewModeChange,
}) => {
  const isMentor = currentUser.papel === 'mentor';

  return (
    <header className="bg-white border-b border-[#E3E5F3] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-sm z-50">
      <div className="flex items-center gap-3">
        <Logo size={24} textSize="text-xl" />
        <span className="hidden md:inline-block text-xs text-[#5B607A] border-l border-[#E3E5F3] pl-3">
          Metodologia Gleyson Azevedo
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Seletor de Modo de Visualização */}
        <div className="flex items-center bg-[#F5F6FA] border border-[#E3E5F3] rounded-lg p-0.5">
          <button
            onClick={() => onViewModeChange('desktop')}
            title="Forçar visualização Web Desktop (1280px)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'desktop' ? 'bg-white text-[#14162B] shadow-xs' : 'text-[#5B607A] hover:text-[#14162B]'
            }`}
          >
            <Monitor size={14} />
            <span className="hidden sm:inline">Web (1280px)</span>
          </button>
          <button
            onClick={() => onViewModeChange('mobile')}
            title="Simular visualização Mobile (390px)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'mobile' ? 'bg-white text-[#14162B] shadow-xs' : 'text-[#5B607A] hover:text-[#14162B]'
            }`}
          >
            <Smartphone size={14} />
            <span className="hidden sm:inline">Mobile (390px)</span>
          </button>
          <button
            onClick={() => onViewModeChange('auto')}
            title="Responsivo automático"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'auto' ? 'bg-white text-[#14162B] shadow-xs' : 'text-[#5B607A] hover:text-[#14162B]'
            }`}
          >
            Auto
          </button>
        </div>

        {/* Perfil Autenticado & Botão Sair */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E3E5F3]">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                isMentor ? 'bg-[#E4E5FB] text-[#2F2A9E]' : 'bg-[#E0F2FE] text-[#0369A1]'
              }`}
            >
              {isMentor ? <ShieldAlert size={14} /> : <UserCheck size={14} />}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[#14162B] leading-tight">
                {currentUser.nome}
              </span>
              <span className="text-[10px] text-[#5B607A] leading-tight">
                {isMentor ? 'Mentor' : 'Mentorado'}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Encerrar sessão"
            className="btn btn-secondary h-8 px-2.5 text-xs text-[#DC2626] hover:bg-[#FEE2E2] hover:border-[#FCA5A5] flex items-center gap-1 ml-1"
          >
            <LogOut size={13} />
            <span className="hidden md:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
