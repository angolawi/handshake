// Mock API interativo para execução estática no GitHub Pages
// Permite que visitantes experimentem todas as telas (Mentor, Aluno, Pomodoro, Matriz, Editais)
// sem necessitar de um backend Node.js ativo.

export function setupMockApiIfNeeded() {
  if (typeof window === 'undefined') return;

  const isGitHubPages = window.location.hostname.endsWith('github.io');
  const isExplicitDemo = localStorage.getItem('handshake_demo') === 'true';

  if (!isGitHubPages && !isExplicitDemo) {
    return; // Ambiente local com backend Express real
  }

  console.info('[Handshake] Ativando Modo Demonstração estático para GitHub Pages.');

  const originalFetch = window.fetch;

  // Estado em memória e localStorage para persistência interativa durante a navegação
  const getStoredState = (key: string, defaultValue: any) => {
    try {
      const item = localStorage.getItem(`demo_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const setStoredState = (key: string, value: any) => {
    try {
      localStorage.setItem(`demo_${key}`, JSON.stringify(value));
    } catch {
      // Ignora erro de cota
    }
  };

  let activeColor = getStoredState('corAtiva', '#8EC5FF');
  let checkedCells: string[] = getStoredState('celulasMarcadas', [
    'slot_1_2026-10-01',
    'slot_1_2026-10-02',
    'slot_2_2026-10-02',
    'slot_3_2026-10-03',
    'slot_4_2026-10-04',
    'slot_1_2026-10-05',
    'slot_2_2026-10-06',
    'slot_5_2026-10-07',
  ]);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Apenas intercepta rotas /api/
    if (!urlStr.includes('/api/')) {
      return originalFetch(input, init);
    }

    const method = init?.method?.toUpperCase() || 'GET';
    const parsedUrl = new URL(urlStr, window.location.origin);
    const pathname = parsedUrl.pathname.replace(/^\/handshake/, '');

    // 1. Auth Me
    if (pathname === '/api/auth/me') {
      const token = localStorage.getItem('handshake_token');
      if (!token) {
        return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
      }
      const role = localStorage.getItem('handshake_demo_role') || 'mentor';
      const user = role === 'mentorado' ? {
        id: 'usr_aluno_marina',
        nome: 'Marina R.',
        email: 'marina@handshake.local',
        papel: 'mentorado',
        matriculaId: 'mat_marina_cgu',
        mentoradoId: 'ment_marina',
        editalId: 'edital_cgu'
      } : {
        id: 'usr_mentor_gleyson',
        nome: 'Gleyson Azevedo',
        email: 'gleysonazevedo@gmail.com',
        papel: 'mentor',
        editalId: 'edital_cgu'
      };
      return new Response(JSON.stringify({ usuario: user }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Auth Login
    if (pathname === '/api/auth/login') {
      let body: any = {};
      try { if (init?.body) body = JSON.parse(init.body as string); } catch {}
      const isAluno = body.email && body.email.includes('aluno');
      const user = isAluno ? {
        id: 'usr_aluno_marina',
        nome: 'Marina R.',
        email: body.email || 'marina@handshake.local',
        papel: 'mentorado',
        matriculaId: 'mat_marina_cgu',
        mentoradoId: 'ment_marina',
        editalId: 'edital_cgu'
      } : {
        id: 'usr_mentor_gleyson',
        nome: 'Gleyson Azevedo',
        email: body.email || 'gleysonazevedo@gmail.com',
        papel: 'mentor',
        editalId: 'edital_cgu'
      };
      localStorage.setItem('handshake_demo_role', user.papel);
      return new Response(JSON.stringify({ token: 'demo_token_github_pages', usuario: user }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Painel do Mentor
    if (pathname === '/api/mentor/painel') {
      return new Response(JSON.stringify({
        resumo: { reunioesSemana: 6, precisamAtencao: 2, revisaoNoturnaTaxa: 84 },
        mentorados: [
          {
            id: 'ment_marina',
            nome: 'Marina R.',
            email: 'marina@handshake.local',
            editalNome: 'Concurso CGU (Auditor)',
            diaCorteSemana: 2,
            fimMentoria: '2027-04-30',
            faseAtual: 2,
            aproveitamento: 82,
            horasEstudadas: 24.5,
            alerta: null
          },
          {
            id: 'ment_rafael',
            nome: 'Rafael S.',
            email: 'rafael@handshake.local',
            editalNome: 'Concurso CGU (Auditor)',
            diaCorteSemana: 2,
            fimMentoria: '2027-04-30',
            faseAtual: 1,
            aproveitamento: 64,
            horasEstudadas: 18.0,
            alerta: 'Queda de rendimento em AFO'
          },
          {
            id: 'ment_camila',
            nome: 'Camila P.',
            email: 'camila@handshake.local',
            editalNome: 'Concurso TCU (Auditor)',
            diaCorteSemana: 2,
            fimMentoria: '2027-04-30',
            faseAtual: 3,
            aproveitamento: 91,
            horasEstudadas: 32.0,
            alerta: null
          },
          {
            id: 'ment_beatriz',
            nome: 'Beatriz L.',
            email: 'beatriz@handshake.local',
            editalNome: 'Receita Federal (Auditor)',
            diaCorteSemana: 4,
            fimMentoria: '2027-04-30',
            faseAtual: 1,
            aproveitamento: 73,
            horasEstudadas: 20.0,
            alerta: null
          }
        ]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // 4. Detalhes de Mentorado
    if (pathname.startsWith('/api/mentorados/')) {
      const mentoradoId = pathname.split('/')[3];
      return new Response(JSON.stringify({
        mentorado: {
          id: mentoradoId,
          nome: mentoradoId === 'ment_rafael' ? 'Rafael S.' : 'Marina R.',
          email: mentoradoId === 'ment_rafael' ? 'rafael@handshake.local' : 'marina@handshake.local',
          dia_corte_semana: 2,
          fim_mentoria: '2027-04-30',
          duracoes_override: null
        },
        matricula: {
          id: 'mat_marina_cgu',
          edital_id: 'edital_cgu',
          edital_nome: 'Concurso CGU (Auditor)',
          banca: 'CEBRASPE'
        },
        cicloAtivo: {
          id: 'ciclo_1',
          numero: 1,
          inicio: '2026-10-01',
          slots_por_dia: 4,
          duracao_dias: 30
        },
        metricas: {
          taxaAproveitamentoLiquido: 82.4,
          coberturaEditalPercentual: 46.8,
          taxaAdesaoRevisaoNoturna: 88,
          questoesTotais: 480,
          acertosTotais: 395,
          polaridadeCognitiva: { decoreba: 55, raciocinio: 45 },
          disciplinasProgresso: [
            { nome: 'Direito Administrativo', fase: 2, aproveitamento: 85, topicosEstudados: 12, totalTopicos: 18 },
            { nome: 'Administração Financeira e Orçamentária', fase: 1, aproveitamento: 76, topicosEstudados: 8, totalTopicos: 15 },
            { nome: 'Controle Externo', fase: 2, aproveitamento: 88, topicosEstudados: 10, totalTopicos: 12 },
            { nome: 'Língua Portuguesa', fase: 3, aproveitamento: 92, topicosEstudados: 14, totalTopicos: 14 }
          ]
        },
        auditorias: [
          { acao: 'AVANCO_FASE', detalhe: 'Direito Administrativo avançou para Fase 2 por aproveitamento líquido', criado_em: '2026-10-10 14:30' },
          { acao: 'ATRIBUICAO_EDITAL', detalhe: 'Matrícula atribuída ao edital Concurso CGU', criado_em: '2026-10-01 09:00' }
        ],
        resumos: [
          { id: 'res_1', disciplina_nome: 'Direito Administrativo', numeracao: '3.1', topico_texto: 'Ato Administrativo e Requisitos de Validade', enviada_em: '2026-10-12 18:00' },
          { id: 'res_2', disciplina_nome: 'AFO', numeracao: '2.4', topico_texto: 'Créditos Adicionais e Lei Orçamentária Anual', enviada_em: '2026-10-11 20:15' }
        ]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // 5. Matriz de Controle do Aluno
    if (pathname.includes('/controle') && pathname.startsWith('/api/matriculas/')) {
      // Toggle celula
      if (pathname.endsWith('/toggle-celula') && method === 'POST') {
        let body: any = {};
        try { if (init?.body) body = JSON.parse(init.body as string); } catch {}
        const key = `${body.slotId}_${body.data}`;
        if (checkedCells.includes(key)) {
          checkedCells = checkedCells.filter(c => c !== key);
        } else {
          checkedCells.push(key);
        }
        setStoredState('celulasMarcadas', checkedCells);
        return new Response(JSON.stringify({ ok: true, estudado: checkedCells.includes(key) }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Mudança de cor da rodada
      if (pathname.endsWith('/cor-rodada') && method === 'POST') {
        let body: any = {};
        try { if (init?.body) body = JSON.parse(init.body as string); } catch {}
        if (body.cor) {
          activeColor = body.cor;
          setStoredState('corAtiva', activeColor);
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Consulta padrão da matriz de 30 dias
      const dias = Array.from({ length: 30 }, (_, i) => {
        const diaNum = i + 1;
        const diaStr = diaNum < 10 ? `0${diaNum}` : `${diaNum}`;
        return `2026-10-${diaStr}`;
      });

      const slots = [
        { id: 'slot_1', disciplina_id: 'd_adm', disciplina_nome: 'Direito Administrativo', categoria_carga: 'Decoreba', fase: 2, ordem: 1 },
        { id: 'slot_2', disciplina_id: 'd_afo', disciplina_nome: 'Adm. Financeira e Orçamentária', categoria_carga: 'Raciocínio', fase: 1, ordem: 2 },
        { id: 'slot_3', disciplina_id: 'd_cex', disciplina_nome: 'Controle Externo da Administração', categoria_carga: 'Decoreba', fase: 2, ordem: 3 },
        { id: 'slot_4', disciplina_id: 'd_por', disciplina_nome: 'Língua Portuguesa', categoria_carga: 'Raciocínio', fase: 3, ordem: 4 },
        { id: 'slot_5', disciplina_id: 'd_rlm', disciplina_nome: 'Raciocínio Lógico-Matemático', categoria_carga: 'Raciocínio', fase: 1, ordem: 5 },
        { id: 'slot_6', disciplina_id: 'd_con', disciplina_nome: 'Direito Constitucional', categoria_carga: 'Decoreba', fase: 2, ordem: 6 },
      ];

      const mappedCells = checkedCells.map(c => {
        const [slotId, data] = c.split('_');
        return { slot_id: slotId, data, cor: activeColor };
      });

      return new Response(JSON.stringify({
        ciclo: { id: 'ciclo_cgu_1', numero: 1, inicio: '2026-10-01', slots_por_dia: 4, duracao_dias: 30 },
        rodada: { numero: 1, cor: activeColor },
        diaReuniaoSemana: 2,
        slots,
        dias,
        celulas: mappedCells,
        revisaoDias: [
          { data: '2026-10-01', revisao_noturna: 1 },
          { data: '2026-10-02', revisao_noturna: 1 },
          { data: '2026-10-03', revisao_noturna: 1 },
          { data: '2026-10-04', revisao_noturna: 1 },
        ],
        revisoesMensais: [
          { data: '2026-10-03', feita: 1 },
          { data: '2026-10-04', feita: 0 }
        ]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // 6. Próxima Sessão Pomodoro
    if (pathname.includes('/proxima-sessao')) {
      return new Response(JSON.stringify({
        disciplina: { id: 'd_adm', nome: 'Direito Administrativo', categoria_carga: 'Decoreba', fase: 2 },
        topico: { id: 'top_3_1', numeracao: '3.1', texto: 'Ato Administrativo: conceito, requisitos, atributos, anulação e revogação' },
        fase: 2,
        duracoes: {
          estudo: 20 * 60,
          questoes: 35 * 60,
          resumo: 5 * 60,
          descanso: 15 * 60
        },
        totalEtapas: 4
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // 7. Edital do Aluno
    if (pathname.includes('/edital') && pathname.startsWith('/api/matriculas/')) {
      return new Response(JSON.stringify({
        edital: { id: 'edital_cgu', nome: 'Concurso CGU (Auditor Federal de Finanças e Controle)', banca: 'CEBRASPE' },
        grupos: [
          {
            id: 'grp_basicas',
            nome: 'Conhecimentos Básicos',
            disciplinas: [
              {
                id: 'd_por',
                nome: 'Língua Portuguesa',
                categoria_carga: 'Raciocínio',
                fase: 3,
                topicos: [
                  { id: 't_1', numeracao: '1', texto: 'Compreensão e interpretação de textos de gêneros variados', estudado: true },
                  { id: 't_2', numeracao: '2', texto: 'Reconhecimento de tipos e gêneros textuais', estudado: true },
                  { id: 't_3', numeracao: '3', texto: 'Domínio da ortografia oficial e acentuação gráfica', estudado: true }
                ]
              },
              {
                id: 'd_adm',
                nome: 'Direito Administrativo',
                categoria_carga: 'Decoreba',
                fase: 2,
                topicos: [
                  { id: 't_4', numeracao: '1', texto: 'Estado, governo e administração pública: conceitos e princípios', estudado: true },
                  { id: 't_5', numeracao: '2', texto: 'Organização administrativa da União: direta e indireta', estudado: true },
                  { id: 't_6', numeracao: '3', texto: 'Ato administrativo: validade, eficácia, anulação e revogação', estudado: false }
                ]
              }
            ]
          },
          {
            id: 'grp_especificas',
            nome: 'Conhecimentos Específicos',
            disciplinas: [
              {
                id: 'd_afo',
                nome: 'Administração Financeira e Orçamentária',
                categoria_carga: 'Raciocínio',
                fase: 1,
                topicos: [
                  { id: 't_7', numeracao: '1', texto: 'Orçamento público: conceitos, princípios e evolução', estudado: true },
                  { id: 't_8', numeracao: '2', texto: 'PPA, LDO e LOA na Constituição Federal de 1988', estudado: false }
                ]
              }
            ]
          }
        ]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // 8. Revisões Hub
    if (pathname.includes('/revisoes') && pathname.startsWith('/api/matriculas/')) {
      return new Response(JSON.stringify({
        resumosHoje: [
          { id: 'rf_1', topico: 'Ato Administrativo (Requisitos de Validade)', disciplina: 'Direito Administrativo', hora: '18:15', revisado: false },
          { id: 'rf_2', topico: 'Créditos Suplementares e Especiais', disciplina: 'AFO', hora: '19:40', revisado: false }
        ],
        revisaoNoturnaFeitaHoje: false,
        revisaoMensalLiberada: true,
        proximoFimDeSemanaMensal: 'Primeiro sábado e domingo do mês'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // 9. Lista de Editais e Estrutura
    if (pathname === '/api/editais') {
      return new Response(JSON.stringify([
        { id: 'edital_cgu', nome: 'Concurso CGU (Auditor)', banca: 'CEBRASPE', totalDisciplinas: 8, totalTopicos: 142 },
        { id: 'edital_tcu', nome: 'Concurso TCU (Auditor)', banca: 'FGV', totalDisciplinas: 10, totalTopicos: 188 }
      ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (pathname.includes('/estrutura') && pathname.startsWith('/api/editais/')) {
      return new Response(JSON.stringify({
        edital: { id: 'edital_cgu', nome: 'Concurso CGU (Auditor)', banca: 'CEBRASPE' },
        grupos: [
          {
            id: 'grp_basicas',
            nome: 'Conhecimentos Básicos',
            disciplinas: [
              { id: 'd_por', nome: 'Língua Portuguesa', categoria_carga: 'Raciocínio', topicosCount: 14 },
              { id: 'd_adm', nome: 'Direito Administrativo', categoria_carga: 'Decoreba', topicosCount: 18 }
            ]
          },
          {
            id: 'grp_especificas',
            nome: 'Conhecimentos Específicos',
            disciplinas: [
              { id: 'd_afo', nome: 'Adm. Financeira e Orçamentária', categoria_carga: 'Raciocínio', topicosCount: 15 },
              { id: 'd_cex', nome: 'Controle Externo', categoria_carga: 'Decoreba', topicosCount: 12 }
            ]
          }
        ]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (pathname.includes('/pode-excluir')) {
      return new Response(JSON.stringify({ podeExcluir: false, motivo: 'Edital possui matrículas ativas vinculadas.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 10. Convites
    if (pathname === '/api/convites') {
      return new Response(JSON.stringify({
        convites: [
          { id: 'conv_1', email: 'novoaluno@estudos.com', status: 'pendente', criado_em: '2026-10-12', magicLink: `${window.location.origin}/handshake/?token=tok_demo_convite` },
          { id: 'conv_2', email: 'marina@handshake.local', status: 'aceito', criado_em: '2026-10-01', aceito_em: '2026-10-01' }
        ]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Fallback genérico para mutações e outras rotas
    return new Response(JSON.stringify({ ok: true, mensagem: 'Operação simulada em Modo Demonstração.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };
}
