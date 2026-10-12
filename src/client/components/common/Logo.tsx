import React from 'react';

interface LogoProps {
  size?: number;
  textSize?: string;
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 26, textSize = 'text-2xl', showSubtitle = false }) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
          <path d="M24 13.6 A12 12 0 0 1 24 34.4 A12 12 0 0 1 24 13.6 Z" fill="#FFD84D" />
          <circle cx="18" cy="24" r="12" fill="none" stroke="#4338CA" strokeWidth="4" />
          <circle cx="30" cy="24" r="12" fill="none" stroke="#8B86E8" strokeWidth="4" />
        </svg>
        <span className={`d font-bold tracking-tight text-[#14162B] ${textSize} leading-none`}>
          hand<span className="hl">shake</span>
        </span>
      </div>
      {showSubtitle && (
        <span className="text-xs text-[#5B607A] mt-1">Mentor e aluno, em sincronia.</span>
      )}
    </div>
  );
};
