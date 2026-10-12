import React from 'react';
import { Logo } from './Logo.js';
import { Monitor, Smartphone, UserCheck, ShieldAlert } from 'lucide-react';

export type ViewMode = 'auto' | 'desktop' | 'mobile';

interface HeaderProps {
  currentRole: 'mentor' | 'mentorado';
  onRoleChange: (role: 'mentor' | 'mentorado') => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentMentoradoNome: string;
  onMentoradoChange?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  viewMode,
  onViewModeChange,
  currentMentoradoNome,
}) => {
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

        {/* Seletor de Papel / Persona */}
        <div className="flex items-center bg-[#F5F6FA] border border-[#E3E5F3] rounded-lg p-0.5">
          <button
            onClick={() => onRoleChange('mentorado')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              currentRole === 'mentorado'
                ? 'bg-[#4338CA] text-white shadow-xs'
                : 'text-[#5B607A] hover:text-[#14162B]'
            }`}
          >
            <UserCheck size={14} />
            <span>Mentorado ({currentMentoradoNome})</span>
          </button>
          <button
            onClick={() => onRoleChange('mentor')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              currentRole === 'mentor'
                ? 'bg-[#4338CA] text-white shadow-xs'
                : 'text-[#5B607A] hover:text-[#14162B]'
            }`}
          >
            <ShieldAlert size={14} />
            <span>Mentor (Gleyson)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
