import React from 'react';

interface BottomNavProps {
  role: 'mentor' | 'mentorado';
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ role, activeTab, onTabChange }) => {
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
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E3E5F3] flex items-center justify-around z-40 px-2 max-w-[420px] mx-auto">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`min-h-[44px] flex-1 flex items-center justify-center text-[15px] transition-colors ${
              isActive ? 'font-bold text-[#14162B]' : 'font-medium text-[#5B607A]'
            }`}
          >
            {isActive ? <span className="hl">{tab.label}</span> : tab.label}
          </button>
        );
      })}
    </nav>
  );
};
