import React, { useState } from 'react';
import { Logo } from '../common/Logo.js';
import { PALETA_RODADA } from '../../theme/tokens.js';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Clock,
  Calendar,
  FileText,
  Brain,
  ShieldCheck,
  Layers,
  Lock,
  ChevronRight,
  Play,
  Volume2,
  Moon,
  BookOpen,
  Check,
  Users,
  Award,
} from 'lucide-react';

interface LandingPageProps {
  onEntrar: () => void;
  onLoginDemo?: (email: string, papel: 'mentor' | 'mentorado') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEntrar, onLoginDemo }) => {
  const [corDemoAtiva, setCorDemoAtiva] = useState('#8EC5FF');
  const [celulasMarcadas, setCelulasMarcadas] = useState<Record<string, boolean>>({
    'slot_1_0': true,
    'slot_1_1': true,
    'slot_2_1': true,
    'slot_3_2': true,
    'slot_4_2': true,
  });

  const toggleCelulaDemo = (key: string) => {
    setCelulasMarcadas(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#14162B] flex flex-col font-sans selection:bg-[#FFD84D] selection:text-[#14162B]">
      {/* 1. Header / Navbar Fixo */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E3E5F3] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size={28} textSize="text-2xl" showSubtitle={false} />
          <span className="hidden lg:inline-block text-xs text-[#5B607A] border-l border-[#E3E5F3] pl-3">
            Metodologia Oficial Gleyson Azevedo
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#5B607A]">
          <a href="#metodologia" className="hover:text-[#14162B] transition-colors">Metodologia</a>
          <a href="#pilares" className="hover:text-[#14162B] transition-colors">Pilares</a>
          <a href="#editais" className="hover:text-[#14162B] transition-colors">Parser de Editais</a>
          <a href="#revisoes" className="hover:text-[#14162B] transition-colors">Revisões</a>
          <a href="#credenciais" className="hover:text-[#14162B] transition-colors">Demonstração</a>
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onEntrar}
            className="btn btn-primary h-10 px-5 text-sm font-semibold flex items-center gap-2 shadow-xs"
          >
            <span>Acessar Plataforma</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 md:px-8 max-w-[1240px] mx-auto flex flex-col items-center text-center">
        {/* Badge da Metodologia */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E4E5FB] text-[#2F2A9E] text-xs font-semibold mb-6 border border-[#D9DCEB]">
          <Sparkles size={14} className="text-[#4338CA]" />
          <span>Metodologia Oficial Gleyson Azevedo · Concursos de Alto Nível</span>
        </div>

        {/* Título Principal */}
        <h1 className="d font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#14162B] tracking-tight max-w-4xl leading-[1.08]">
          Mentor e aluno, em <span className="hl">sincronia</span> para aprovação de elite.
        </h1>

        {/* Subtítulo */}
        <p className="text-base sm:text-lg md:text-xl text-[#5B607A] max-w-2xl mt-6 leading-relaxed">
          Ciclos de estudo inteligentes de 30 dias, alternância cognitiva balanceada (<span className="text-[#1F3F66] font-semibold bg-[#D3E3F5] px-1.5 py-0.5 rounded">Decoreba</span> vs <span className="text-[#6B4F00] font-semibold bg-[#FFF2CC] px-1.5 py-0.5 rounded">Raciocínio</span>), cronômetro adaptativo por fases e matriz visual com acompanhamento em tempo real.
        </p>

        {/* Botões de Ação */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mt-8">
          <button
            onClick={onEntrar}
            className="btn btn-primary h-12 px-7 text-base font-semibold flex items-center gap-2 shadow-md hover:scale-[1.02] transition-transform"
          >
            <span>Entrar na Plataforma</span>
            <ArrowRight size={18} />
          </button>
          <a
            href="#metodologia"
            className="btn h-12 px-6 text-base font-semibold bg-white border border-[#D9DCEB] text-[#14162B] hover:bg-[#F5F6FA] flex items-center gap-2"
          >
            <BookOpen size={18} className="text-[#5B607A]" />
            <span>Conhecer a Metodologia</span>
          </a>
        </div>

        {/* 3. Preview Interativo da Matriz de Controle (Mockup Visual) */}
        <div className="w-full max-w-[1080px] mt-12 card p-5 md:p-7 shadow-xl border border-[#D9DCEB] bg-white text-left overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EEF0F7]">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
              <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
              <div className="w-3 h-3 rounded-full bg-[#10B981]" />
              <span className="text-xs font-semibold text-[#5B607A] ml-2">
                Handshake Matrix · Ciclo 01 (Simulação Interativa)
              </span>
            </div>
            {/* Paleta interativa de demonstração */}
            <div className="flex items-center gap-1.5 text-xs text-[#5B607A]">
              <span className="hidden sm:inline">Cor da Rodada:</span>
              {PALETA_RODADA.slice(0, 5).map(c => (
                <button
                  key={c.nome}
                  onClick={() => setCorDemoAtiva(c.hex)}
                  title={c.rotulo}
                  className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.hex,
                    outline: corDemoAtiva === c.hex ? '2px solid #14162B' : 'none',
                    outlineOffset: '1px',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Mini grade interativa com 6 dias */}
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[210px_repeat(6,1fr)] gap-1.5 mb-2 text-xs font-semibold text-[#5B607A]">
                <div>DISCIPLINA</div>
                <div className="text-center p-1 bg-[#F5F6FA] rounded">09 out · sex</div>
                <div className="text-center p-1 bg-[#E4E6EE] rounded">10 out · sáb</div>
                <div className="text-center p-1 bg-[#E4E6EE] rounded">11 out · dom</div>
                <div className="text-center p-1 bg-[#F5F6FA] rounded">12 out · seg</div>
                <div className="text-center p-1 bg-[#BFE5C8] text-[#17603A] rounded">13 out · ter (reunião)</div>
                <div className="text-center p-1 bg-[#F5F6FA] rounded">14 out · qua</div>
              </div>

              {/* Linhas de Disciplinas */}
              {[
                { id: 'slot_1', nome: 'Estado e Ciência Política', tipo: 'decoreba' },
                { id: 'slot_2', nome: 'Evidências, Dados e IA', tipo: 'raciocinio' },
                { id: 'slot_3', nome: 'Auditoria Governamental', tipo: 'decoreba' },
                { id: 'slot_4', nome: 'Desenvolvimento Seguro', tipo: 'raciocinio' },
              ].map(d => {
                const isDec = d.tipo === 'decoreba';
                return (
                  <div key={d.id} className="grid grid-cols-[210px_repeat(6,1fr)] gap-1.5 mb-1.5 items-center">
                    <div className={`p-2 rounded-lg text-xs font-semibold truncate ${isDec ? 'bg-[#D3E3F5] text-[#1F3F66]' : 'bg-[#FFF2CC] text-[#6B4F00]'}`}>
                      {d.nome}
                    </div>
                    {[0, 1, 2, 3, 4, 5].map(diaIdx => {
                      const key = `${d.id}_${diaIdx}`;
                      const isDone = !!celulasMarcadas[key];
                      const isFds = diaIdx === 1 || diaIdx === 2;

                      return (
                        <div
                          key={diaIdx}
                          onClick={() => toggleCelulaDemo(key)}
                          title="Clique para simular a marcação de estudo"
                          className={`h-9 rounded-md border flex items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                            isDone
                              ? 'border-transparent text-white'
                              : isFds
                              ? 'bg-[#E4E6EE] border-[#D5D8E2]'
                              : 'bg-white border-[#E3E5F3] hover:bg-[#F5F6FA]'
                          }`}
                          style={{ backgroundColor: isDone ? corDemoAtiva : undefined }}
                        >
                          {isDone && <Check size={14} className="stroke-[3] text-white" />}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              <div className="mt-3 pt-3 border-t border-[#EEF0F7] flex flex-wrap items-center justify-between text-xs text-[#5B607A]">
                <span>💡 <b>Dica Interativa:</b> Clique em qualquer célula acima para experimentar a marcação com a cor ativa da rodada.</span>
                <span className="font-semibold text-[#4338CA]">Metodologia comprovada por centenas de aprovados</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Seção dos 4 Pilares da Metodologia */}
      <section id="metodologia" className="py-16 md:py-24 bg-white border-y border-[#E3E5F3] px-4 md:px-8">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#4338CA] tracking-wider uppercase">Fundamentos Metodológicos</span>
            <h2 className="d font-bold text-3xl sm:text-4xl md:text-5xl text-[#14162B] mt-2 tracking-tight">
              A ciência da aprovação estruturada em 4 pilares
            </h2>
            <p className="text-[#5B607A] text-base sm:text-lg mt-4">
              Cada funcionalidade do Handshake foi desenvolvida rigorosamente para aplicar a técnica de estudos do mentor Gleyson Azevedo, eliminando improvisações e maximizando a retenção.
            </p>
          </div>

          <div id="pilares" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pilar 1: Ciclos e Matriz */}
            <div className="card p-6 bg-[#F8F9FD] border-[#D9DCEB] flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E4E5FB] text-[#2F2A9E] flex items-center justify-center mb-5">
                  <Layers size={24} />
                </div>
                <h3 className="d font-bold text-xl text-[#14162B]">1. Ciclos e Matriz de 30 Dias</h3>
                <p className="text-sm text-[#5B607A] mt-2.5 leading-relaxed">
                  Alternância inteligente de matérias teóricas (<span className="text-[#1F3F66] font-semibold">Decoreba</span>) e analíticas (<span className="text-[#6B4F00] font-semibold">Raciocínio</span>). Marcação diária com 10 cores de rodadas e sincronia com as reuniões semanais de mentoria.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#D9DCEB] text-xs font-semibold text-[#4338CA] flex items-center gap-1">
                <span>Controle visual de aderência</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Pilar 2: Fases de Aprendizado */}
            <div className="card p-6 bg-[#F8F9FD] border-[#D9DCEB] flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFF2CC] text-[#6B4F00] flex items-center justify-center mb-5">
                  <Brain size={24} />
                </div>
                <h3 className="d font-bold text-xl text-[#14162B]">2. Fases de Aprendizado (1 a 3)</h3>
                <p className="text-sm text-[#5B607A] mt-2.5 leading-relaxed">
                  Cada disciplina avança da <b>Fase 1</b> (Construção: Estudo 45m + Teste 10m + Recorde 5m) para a <b>Fase 2</b> (Refinamento) e <b>Fase 3</b> (Bateria intensiva de questões), respeitando a pontuação líquida.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#D9DCEB] text-xs font-semibold text-[#6B4F00] flex items-center gap-1">
                <span>Avanço automático ou auditado</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Pilar 3: Cronômetro Adaptativo */}
            <div className="card p-6 bg-[#F8F9FD] border-[#D9DCEB] flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#CFEBD8] text-[#17603A] flex items-center justify-center mb-5">
                  <Clock size={24} />
                </div>
                <h3 className="d font-bold text-xl text-[#14162B]">3. Cronômetro Pomodoro Guiado</h3>
                <p className="text-sm text-[#5B607A] mt-2.5 leading-relaxed">
                  Início estritamente <b>manual</b> (nunca automático) e resistente a trocas de abas. Gongo harmônico suave ao término de cada etapa e catalogação fotográfica de resumos manuscritos.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#D9DCEB] text-xs font-semibold text-[#17603A] flex items-center gap-1">
                <span>Zero perda de tempo em navegação</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Pilar 4: Hub de Revisões Ativas */}
            <div className="card p-6 bg-[#F8F9FD] border-[#D9DCEB] flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center mb-5">
                  <Moon size={24} />
                </div>
                <h3 className="d font-bold text-xl text-[#14162B]">4. Revisões Noturna e Mensal</h3>
                <p className="text-sm text-[#5B607A] mt-2.5 leading-relaxed">
                  <b>Revisão Noturna</b> diária (15-20 min antes de dormir) para consolidar no sono REM. <b>Revisão Mensal</b> concentrada exclusivamente no <b>1º fim de semana do mês</b> para reativação global dos resumos.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#D9DCEB] text-xs font-semibold text-[#0369A1] flex items-center gap-1">
                <span>Retenção de memória de longo prazo</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Seção de Parser de Editais */}
      <section id="editais" className="py-16 md:py-24 px-4 md:px-8 max-w-[1240px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 flex flex-col gap-4">
            <span className="text-xs font-bold text-[#4338CA] tracking-wider uppercase">Tecnologia Exclusiva</span>
            <h2 className="d font-bold text-3xl sm:text-4xl text-[#14162B] tracking-tight">
              Ingestão e Parser Inteligente de Editais <span className="hl">CEBRASPE & FGV</span>
            </h2>
            <p className="text-[#5B607A] text-base leading-relaxed">
              Cole o texto integral do edital oficial e nossa engine segmenta instantaneamente todos os grupos (Conhecimentos Básicos, Complementares e Específicos), disciplinas, tópicos e subtópicos com hierarquia recursiva (`1`, `1.1`, `4.2.1`).
            </p>

            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-[#3FA66B] shrink-0 mt-0.5" />
                <span className="text-sm text-[#14162B]">
                  <b>Filtro antiruído legislativo:</b> Citações de leis (`Lei 12.813`, `arts. 18 a 21`) não viram falsos tópicos.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-[#3FA66B] shrink-0 mt-0.5" />
                <span className="text-sm text-[#14162B]">
                  <b>Sanitização de OCR:</b> Remoção de rodapés, números de página e correção de palavras coladas (`daTransparência` → `da Transparência`).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-[#3FA66B] shrink-0 mt-0.5" />
                <span className="text-sm text-[#14162B]">
                  <b>Regras de cobrança:</b> Suporte a método certo/errado com penalidade e múltipla escolha.
                </span>
              </div>
            </div>
          </div>

          <div id="revisoes" className="lg:col-span-6 card p-6 bg-white border border-[#D9DCEB] shadow-md flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF0F7]">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#4338CA]" />
                <span className="text-xs font-bold text-[#14162B] uppercase">Estrutura Extraída em Lote</span>
              </div>
              <span className="chip ok text-[11px] font-semibold">13 matérias · 275 tópicos</span>
            </div>

            <div className="divide-y divide-[#EEF0F7] text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#14162B]">Estado, Democracia, Direitos e Ciência Política</div>
                  <div className="text-[11px] text-[#5B607A]">9 tópicos raiz · 15 subtópicos</div>
                </div>
                <span className="chip dec font-semibold">Decoreba</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#14162B]">Fundamentos de Evidências, Dados e IA</div>
                  <div className="text-[11px] text-[#5B607A]">6 tópicos raiz · 12 subtópicos</div>
                </div>
                <span className="chip rac font-semibold">Raciocínio</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#14162B]">Desenvolvimento Seguro e Qualidade</div>
                  <div className="text-[11px] text-[#5B607A]">5 tópicos raiz · 9 subtópicos</div>
                </div>
                <span className="chip rac font-semibold">Raciocínio</span>
              </div>
            </div>

            <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs text-[#166534]">
              ✓ Edital completo importado atomicamente e pronto para planejamento do ciclo.
            </div>
          </div>
        </div>
      </section>

      {/* 6. Seção de Segregação e Governança LGPD */}
      <section className="py-16 md:py-24 bg-[#14162B] text-white px-4 md:px-8">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2F2A9E] flex items-center justify-center text-[#FFD84D]">
              <Users size={20} />
            </div>
            <h3 className="d font-bold text-xl text-white">Segregação Rigorosa</h3>
            <p className="text-sm text-[#8A8FA8] leading-relaxed">
              O Mentor gerencia ciclos, acompanha aderência semanal e emite convites. O Mentorado acessa seu cronômetro, edital e matriz sem botões de troca manual de perfil.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2F2A9E] flex items-center justify-center text-[#FFD84D]">
              <Lock size={20} />
            </div>
            <h3 className="d font-bold text-xl text-white">Segurança Criptográfica</h3>
            <p className="text-sm text-[#8A8FA8] leading-relaxed">
              Derivação de chaves via <code>crypto.scryptSync</code> com salt de 16 bytes. Sessões persistentes com tokens aleatórios e controle de revogação de acessos.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2F2A9E] flex items-center justify-center text-[#FFD84D]">
              <ShieldCheck size={20} />
            </div>
            <h3 className="d font-bold text-xl text-white">Conformidade LGPD</h3>
            <p className="text-sm text-[#8A8FA8] leading-relaxed">
              Consentimento explícito registrado com timestamp na ativação de contas, auditoria de modificações do mentor e direito ao esquecimento com exclusão segura de fotos.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Seção de Credenciais de Homologação / Demonstração */}
      <section id="credenciais" className="py-16 md:py-24 px-4 md:px-8 max-w-[1080px] mx-auto text-center">
        <span className="text-xs font-bold text-[#4338CA] tracking-wider uppercase">Acesso Imediato de Teste</span>
        <h2 className="d font-bold text-3xl sm:text-4xl text-[#14162B] mt-2 tracking-tight">
          Ambiente pronto para homologação
        </h2>
        <p className="text-[#5B607A] text-base max-w-xl mx-auto mt-3">
          Utilize as credenciais oficiais pré-configuradas para explorar todos os recursos nos dois perfis da plataforma:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 text-left">
          {/* Card Mentor */}
          <div className="card p-6 border-2 border-[#D9DCEB] bg-white flex flex-col justify-between hover:border-[#4338CA] transition-colors">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#EEF0F7]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4338CA]" />
                  <span className="font-bold text-sm text-[#14162B]">Perfil do Mentor</span>
                </div>
                <span className="chip f1 font-mono text-[11px]">Administrador</span>
              </div>
              <div className="mt-4 flex flex-col gap-2 text-xs">
                <div>
                  <span className="text-[#5B607A] block">E-mail Oficial:</span>
                  <code className="text-[#14162B] font-mono font-bold text-sm">gleysonazevedo@gmail.com</code>
                </div>
                <div>
                  <span className="text-[#5B607A] block">Senha Oficial:</span>
                  <code className="text-[#14162B] font-mono font-bold text-sm">Gleyson!Handshake01</code>
                </div>
              </div>
              <ul className="text-xs text-[#5B607A] mt-4 space-y-1">
                <li>• Painel de acompanhamento e auditoria</li>
                <li>• Importador e editor de editais complexos</li>
                <li>• Planejamento e publicação de ciclos</li>
                <li>• Gestão e emissão de convites por e-mail</li>
              </ul>
            </div>
            <button
              onClick={onEntrar}
              className="btn btn-primary h-11 w-full text-xs font-semibold mt-6 flex items-center justify-center gap-1.5"
            >
              <span>Acessar como Mentor</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Card Mentorado */}
          <div className="card p-6 border-2 border-[#D9DCEB] bg-white flex flex-col justify-between hover:border-[#4338CA] transition-colors">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#EEF0F7]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3FA66B]" />
                  <span className="font-bold text-sm text-[#14162B]">Perfil do Mentorado</span>
                </div>
                <span className="chip ok font-mono text-[11px]">Aluno de Teste</span>
              </div>
              <div className="mt-4 flex flex-col gap-2 text-xs">
                <div>
                  <span className="text-[#5B607A] block">E-mail Demo:</span>
                  <code className="text-[#14162B] font-mono font-bold text-sm">marina@handshake.local</code>
                </div>
                <div>
                  <span className="text-[#5B607A] block">Senha Demo:</span>
                  <code className="text-[#14162B] font-mono font-bold text-sm">Aluno!123456</code>
                </div>
              </div>
              <ul className="text-xs text-[#5B607A] mt-4 space-y-1">
                <li>• Cronômetro de estudos Pomodoro guiado</li>
                <li>• Matriz interativa de 30 dias com cores</li>
                <li>• Consulta hierárquica do edital do aluno</li>
                <li>• Hub de revisões noturna e mensal (1º fds)</li>
              </ul>
            </div>
            <button
              onClick={onEntrar}
              className="btn h-11 w-full text-xs font-semibold mt-6 bg-[#F5F6FA] border border-[#D9DCEB] text-[#14162B] hover:bg-[#EEF0F7] flex items-center justify-center gap-1.5"
            >
              <span>Acessar como Mentorado</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* 8. Footer Institucional */}
      <footer className="mt-auto bg-white border-t border-[#E3E5F3] px-4 md:px-8 py-8">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5B607A]">
          <div className="flex items-center gap-3">
            <Logo size={22} textSize="text-lg" />
            <span className="border-l border-[#E3E5F3] pl-3">
              Plataforma de Mentoria · Metodologia Gleyson Azevedo
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span>Privacidade e Segurança LGPD</span>
            <span>•</span>
            <span>Handshake © {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
