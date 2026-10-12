// Tokens visuais e paleta de cores Handshake

export interface CorRodada {
  nome: string;
  hex: string;
  rotulo: string;
}

export const PALETA_RODADA: CorRodada[] = [
  { nome: 'coral', hex: '#FFB4A2', rotulo: 'Coral' },
  { nome: 'ambar', hex: '#FFD166', rotulo: 'Âmbar' },
  { nome: 'lima', hex: '#D4E157', rotulo: 'Lima' },
  { nome: 'menta', hex: '#86E3B0', rotulo: 'Menta' },
  { nome: 'turquesa', hex: '#6FD3D3', rotulo: 'Turquesa' },
  { nome: 'azul_claro', hex: '#8EC5FF', rotulo: 'Azul-claro' },
  { nome: 'lavanda', hex: '#A9A6FF', rotulo: 'Lavanda' },
  { nome: 'lilas', hex: '#D7A8FF', rotulo: 'Lilás' },
  { nome: 'rosa', hex: '#FF9FCB', rotulo: 'Rosa' },
  { nome: 'areia', hex: '#C9B79C', rotulo: 'Areia' },
];

export const CORES = {
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  border: '#E3E5F3',
  borderLight: '#D9DCEB',
  ink: '#14162B',
  inkSecondary: '#5B607A',
  accent: '#4338CA',
  accentLight: '#8B86E8',
  accentSoft: '#E4E5FB',
  accentSoftText: '#2F2A9E',
  highlight: '#FFD84D',
  decoreba: '#D3E3F5',
  raciocinio: '#FFF2CC',
  fase1: '#EEEFF6',
  fase2: '#FDE8D2',
  fase3: '#FBDADA',
  weekend: '#E4E6EE',
  meeting: '#BFE5C8',
};
