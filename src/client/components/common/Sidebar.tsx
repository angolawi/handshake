import React from 'react';
import { Logo } from './Logo.js';

interface SidebarProps {
  role: 'mentor' | 'mentorado';
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, onTabChange }) => {
  const mentoradoTabs = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'edital', label: 'Edital' },
    { id: 'controle', label: 'Controle' },
    { id: 'revisoes', label: 'Revisões' },
  ];

  const mentorTabs = [
    { id: 'mentorados', label: 'Mentorados' },
    { id: 'editais', label: 'Editais' },
    { id: 'ciclos', label: 'Ciclos' },
    { id: 'convites', label: 'Convites' },
  ];

  const tabs = role === 'mentor' ? mentorTabs : mentoradoTabs;

  return (
    <aside className="w-[232px] shrink-0 bg-white border-r border-[#E3E5F3] p-7 px-4 flex flex-col gap-1 box-border select-none min-h-screen">
      <div className="px-3 pb-6 flex flex-col gap-1">
        <Logo size={26} textSize="text-2xl" />
        <span className="text-xs text-[#5B607A] mt-0.5">
          {role === 'mentor' ? 'Visão do mentor' : 'Área do mentorado'}
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`h-11 text-left text-[15px] px-3 rounded-xl transition-colors font-medium ${
                isActive
                  ? 'text-[#14162B] font-semibold bg-[#F0F1FA]'
                  : 'text-[#5B607A] hover:bg-[#F5F6FA] hover:text-[#14162B]'
              }`}
            >
              {isActive ? <span className="hl">{tab.label}</span> : tab.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
