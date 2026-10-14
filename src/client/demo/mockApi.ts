// Mock API interativo para execução estática no GitHub Pages
// Permite que visitantes experimentem todas as telas (Mentor, Aluno, Pomodoro, Matriz, Editais, Planejador de Ciclo)
// sem necessitar de um backend Node.js ativo.

export function setupMockApiIfNeeded() {
  if (typeof window === 'undefined') return;

  const isGitHubPages =
    window.location.hostname.endsWith('github.io') ||
    window.location.hostname.includes('pages.dev');
  const isBuildPages = (import.meta as any).env?.VITE_DEMO_MODE === 'true';
  const isExplicitDemo = localStorage.getItem('handshake_demo') === 'true';

  if (!isGitHubPages && !isBuildPages && !isExplicitDemo) {
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
  let revisaoNoturnaCheckedDates: string[] = getStoredState('revisoesNoturnas', [
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
    '2026-10-04',
    '2026-10-05',
  ]);
  let revisaoMensalCheckedDates: string[] = getStoredState('revisoesMensais', [
    '2026-10-03',
  ]);

  // Dias da semana para o rastreador seg..dom
  const gerarSemanaDias = () => {
    const diasSemanaNomes = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const hoje = new Date();
    const curr = new Date(hoje);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const seg = new Date(curr.setDate(diff));

    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(seg);
      d.setDate(d.getDate() + i);
      const dStr = d.toISOString().slice(0, 10);
      const dayOfWeek = d.getDay();
      result.push({
        data: dStr,
        dia_semana: diasSemanaNomes[dayOfWeek],
        estudado: i < 5, // seg a sex com estudo no demo
        fim_de_semana: dayOfWeek === 0 || dayOfWeek === 6,
        reuniao: dayOfWeek === 2, // terça-feira é reunião
      });
    }
    return result;
  };

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Apenas intercepta rotas /api/
    if (!urlStr.includes('/api/')) {
      return originalFetch(input, init);
    }

    const method = init?.method?.toUpperCase() || 'GET';
    const parsedUrl = new URL(urlStr, window.location.origin);
    const apiIdx = parsedUrl.pathname.indexOf('/api/');
    const pathname = apiIdx !== -1 ? parsedUrl.pathname.slice(apiIdx) : parsedUrl.pathname;

    const jsonResponse = (data: any, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    // 1. Auth Me
    if (pathname === '/api/auth/me') {
      const token = localStorage.getItem('handshake_token');
      if (!token) {
        return jsonResponse({ error: 'Não autenticado' }, 401);
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
      return jsonResponse({ usuario: user });
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
      return jsonResponse({ token: 'demo_token_github_pages', usuario: user });
    }

    // 3. Auth Magic Link
    if (pathname === '/api/auth/magic-link/solicitar') {
      const demoMagicLink = `${window.location.origin}${window.location.pathname}?token=tok_demo_magic_link`;
      return jsonResponse({ ok: true, magicLink: demoMagicLink });
    }

    if (pathname === '/api/auth/magic-link/validar') {
      return jsonResponse({
        token: 'tok_demo_magic_link',
        mentorado: {
          id: 'ment_marina',
          nome: 'Marina R.',
          email: 'marina@handshake.local',
          editalNome: 'Concurso CGU (Auditor)',
        },
      });
    }

    if (pathname === '/api/auth/convite/aceitar') {
      const user = {
        id: 'usr_aluno_marina',
        nome: 'Marina R.',
        email: 'marina@handshake.local',
        papel: 'mentorado',
        matriculaId: 'mat_marina_cgu',
        mentoradoId: 'ment_marina',
        editalId: 'edital_cgu',
      };
      localStorage.setItem('handshake_demo_role', 'mentorado');
      return jsonResponse({ ok: true, token: 'demo_token_github_pages', usuario: user });
    }

    // 4. Painel do Mentor (HU-5.7, HU-1.1, HU-1.4)
    if (pathname === '/api/mentor/painel') {
      const semanaDias = gerarSemanaDias();

      return jsonResponse({
        resumo: { reunioesSemana: 4, precisamAtencao: 1, revisaoNoturnaTaxa: 84 },
        mentorados: [
          {
            id: 'ment_marina',
            usuario_id: 'usr_aluno_marina',
            nome: 'Marina R.',
            email: 'marina@handshake.local',
            edital_nome: 'Concurso CGU (Auditor)',
            dia_reuniao_nome: 'ter',
            data_reuniao_proxima: 'ter 13/10',
            matricula_id: 'mat_marina_cgu',
            semana_dias: semanaDias,
            sessoes_realizadas: 10,
            sessoes_planejadas: 15,
            taxa_acerto: 82,
            situacao: 'ok',
            motivo_alerta: null,
          },
          {
            id: 'ment_rafael',
            usuario_id: 'usr_aluno_rafael',
            nome: 'Rafael S.',
            email: 'rafael@handshake.local',
            edital_nome: 'Concurso CGU (Auditor)',
            dia_reuniao_nome: 'ter',
            data_reuniao_proxima: 'ter 13/10',
            matricula_id: 'mat_rafael_cgu',
            semana_dias: semanaDias.map((d, i) => ({ ...d, estudado: i < 2 })),
            sessoes_realizadas: 4,
            sessoes_planejadas: 15,
            taxa_acerto: 64,
            situacao: 'alerta',
            motivo_alerta: 'Queda de rendimento em AFO',
          },
          {
            id: 'ment_camila',
            usuario_id: 'usr_aluno_camila',
            nome: 'Camila P.',
            email: 'camila@handshake.local',
            edital_nome: 'Concurso TCU (Auditor)',
            dia_reuniao_nome: 'qui',
            data_reuniao_proxima: 'qui 15/10',
            matricula_id: 'mat_camila_tcu',
            semana_dias: semanaDias,
            sessoes_realizadas: 14,
            sessoes_planejadas: 15,
            taxa_acerto: 91,
            situacao: 'ok',
            motivo_alerta: null,
          },
          {
            id: 'ment_beatriz',
            usuario_id: 'usr_aluno_beatriz',
            nome: 'Beatriz L.',
            email: 'beatriz@handshake.local',
            edital_nome: 'Receita Federal (Auditor)',
            dia_reuniao_nome: 'sex',
            data_reuniao_proxima: 'sex 16/10',
            matricula_id: 'mat_beatriz_rfb',
            semana_dias: semanaDias.map((d, i) => ({ ...d, estudado: i % 2 === 0 })),
            sessoes_realizadas: 8,
            sessoes_planejadas: 15,
            taxa_acerto: 73,
            situacao: 'ok',
            motivo_alerta: null,
          },
        ],
      });
    }

    // 5. Ajuste de tempos do mentorado (deve vir antes de /api/mentorados/:id)
    if (pathname.includes('/tempos') && pathname.startsWith('/api/mentorados/')) {
      return jsonResponse({ ok: true, mensagem: 'Tempos atualizados com sucesso.' });
    }

    // 6. Métricas do mentorado
    if (pathname.includes('/metricas') && pathname.startsWith('/api/mentorados/')) {
      // Retorna objeto completo MetricasMentorado
      return jsonResponse(getMockMentoradoMetrics());
    }

    // 7. Detalhes de Mentorado (HU-5.7, HU-1.4, HU-1.5)
    if (pathname.startsWith('/api/mentorados/')) {
      const mentoradoId = pathname.split('/')[3] || 'ment_marina';
      const isRafael = mentoradoId === 'ment_rafael';

      return jsonResponse({
        mentorado: {
          id: mentoradoId,
          nome: isRafael ? 'Rafael S.' : 'Marina R.',
          email: isRafael ? 'rafael@handshake.local' : 'marina@handshake.local',
          dia_corte_semana: 2,
          fim_mentoria: '2027-04-30',
          duracoes_override: null,
        },
        matricula: {
          id: isRafael ? 'mat_rafael_cgu' : 'mat_marina_cgu',
          edital_id: 'edital_cgu',
          edital_nome: 'Concurso CGU (Auditor)',
          banca: 'CEBRASPE',
        },
        cicloAtivo: {
          id: 'ciclo_cgu_1',
          numero: 1,
          inicio: '2026-10-01',
          slots_por_dia: 4,
          duracao_dias: 30,
        },
        metricas: getMockMentoradoMetrics(isRafael),
        auditorias: [
          {
            id: 'aud_1',
            em: '2026-10-10 14:30',
            entidade: 'FaseDisciplina',
            campo: 'fase_atual',
            valor_anterior: '1',
            valor_novo: '2',
            autor_nome: 'Gleyson Azevedo',
          },
          {
            id: 'aud_2',
            em: '2026-10-01 09:00',
            entidade: 'Matricula',
            campo: 'edital_id',
            valor_anterior: 'Sem edital',
            valor_novo: 'Concurso CGU (Auditor)',
            autor_nome: 'Gleyson Azevedo',
          },
        ],
        resumos: [
          {
            id: 'res_1',
            storage_key: 'demo_resumo_1.jpg',
            disciplina_nome: 'Direito Administrativo',
            numeracao: '3.1',
            topico_texto: 'Ato Administrativo e Requisitos de Validade',
            enviada_em: '2026-10-12 18:00',
            comentarios: [
              { id: 'com_1', autor_nome: 'Gleyson Azevedo', texto: 'Excelente síntese de atributos!', criado_em: '2026-10-12 19:30' }
            ]
          },
          {
            id: 'res_2',
            storage_key: 'demo_resumo_2.jpg',
            disciplina_nome: 'AFO',
            numeracao: '2.4',
            topico_texto: 'Créditos Adicionais e Lei Orçamentária Anual',
            enviada_em: '2026-10-11 20:15',
            comentarios: []
          },
        ],
      });
    }

    // 8. Questões por Reunião Semanal (HU-4.6)
    if (pathname.includes('/questoes-semanais')) {
      return jsonResponse([
        {
          data_corte: '2026-10-06',
          reuniao_numero: 1,
          disciplinas: [
            { disciplina_id: 'd_adm', disciplina_nome: 'Direito Administrativo', grupo_nome: 'Conhecimentos Básicos', certas: 58, resolvidas: 68, taxa_acerto: 85 },
            { disciplina_id: 'd_afo', disciplina_nome: 'Adm. Financeira e Orçamentária', grupo_nome: 'Conhecimentos Específicos', certas: 42, resolvidas: 55, taxa_acerto: 76 },
            { disciplina_id: 'd_cex', disciplina_nome: 'Controle Externo', grupo_nome: 'Conhecimentos Específicos', certas: 52, resolvidas: 60, taxa_acerto: 87 },
            { disciplina_id: 'd_por', disciplina_nome: 'Língua Portuguesa', grupo_nome: 'Conhecimentos Básicos', certas: 50, resolvidas: 55, taxa_acerto: 91 },
          ],
        },
        {
          data_corte: '2026-10-13',
          reuniao_numero: 2,
          disciplinas: [
            { disciplina_id: 'd_adm', disciplina_nome: 'Direito Administrativo', grupo_nome: 'Conhecimentos Básicos', certas: 119, resolvidas: 140, taxa_acerto: 85 },
            { disciplina_id: 'd_afo', disciplina_nome: 'Adm. Financeira e Orçamentária', grupo_nome: 'Conhecimentos Específicos', certas: 84, resolvidas: 110, taxa_acerto: 76 },
            { disciplina_id: 'd_cex', disciplina_nome: 'Controle Externo', grupo_nome: 'Conhecimentos Específicos', certas: 106, resolvidas: 120, taxa_acerto: 88 },
            { disciplina_id: 'd_por', disciplina_nome: 'Língua Portuguesa', grupo_nome: 'Conhecimentos Básicos', certas: 101, resolvidas: 110, taxa_acerto: 92 },
          ],
        },
      ]);
    }

    // 9. Matriz de Controle do Aluno (HU-4.1 a 4.5)
    if (pathname.includes('/controle') && pathname.startsWith('/api/matriculas/')) {
      // Toggle célula na grade
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
        return jsonResponse({ ok: true, estudado: checkedCells.includes(key) });
      }

      // Mudança de cor da rodada
      if (pathname.endsWith('/cor-rodada') && method === 'POST') {
        let body: any = {};
        try { if (init?.body) body = JSON.parse(init.body as string); } catch {}
        if (body.cor) {
          activeColor = body.cor;
          setStoredState('corAtiva', activeColor);
        }
        return jsonResponse({ ok: true });
      }

      // Toggle revisão noturna na grade de controle
      if (pathname.endsWith('/toggle-revisao-noturna') && method === 'POST') {
        let body: any = {};
        try { if (init?.body) body = JSON.parse(init.body as string); } catch {}
        const dataStr = body.data || new Date().toISOString().slice(0, 10);
        if (revisaoNoturnaCheckedDates.includes(dataStr)) {
          revisaoNoturnaCheckedDates = revisaoNoturnaCheckedDates.filter(d => d !== dataStr);
        } else {
          revisaoNoturnaCheckedDates.push(dataStr);
        }
        setStoredState('revisoesNoturnas', revisaoNoturnaCheckedDates);
        return jsonResponse({ ok: true, revisaoNoturnaFeita: revisaoNoturnaCheckedDates.includes(dataStr) });
      }

      // Toggle revisão mensal
      if (pathname.endsWith('/toggle-revisao-mensal') && method === 'POST') {
        let body: any = {};
        try { if (init?.body) body = JSON.parse(init.body as string); } catch {}
        const dataStr = body.data || '2026-10-03';
        if (revisaoMensalCheckedDates.includes(dataStr)) {
          revisaoMensalCheckedDates = revisaoMensalCheckedDates.filter(d => d !== dataStr);
        } else {
          revisaoMensalCheckedDates.push(dataStr);
        }
        setStoredState('revisoesMensais', revisaoMensalCheckedDates);
        return jsonResponse({ ok: true, feita: revisaoMensalCheckedDates.includes(dataStr) });
      }

      // Consulta padrão da matriz de 30 dias
      const dias = Array.from({ length: 30 }, (_, i) => {
        const diaNum = i + 1;
        const diaStr = diaNum < 10 ? `0${diaNum}` : `${diaNum}`;
        return `2026-10-${diaStr}`;
      });

      // SLOTS COM AS PROPRIEDADES EXATAS ESPERADAS PELO CONTROLE MATRIZ (nome, tipo)
      const slots = [
        { id: 'slot_1', disciplina_id: 'd_adm', nome: 'Direito Administrativo', tipo: 'decoreba', ordem: 1 },
        { id: 'slot_2', disciplina_id: 'd_afo', nome: 'Adm. Financeira e Orçamentária', tipo: 'raciocinio', ordem: 2 },
        { id: 'slot_3', disciplina_id: 'd_cex', nome: 'Controle Externo da Administração', tipo: 'decoreba', ordem: 3 },
        { id: 'slot_4', disciplina_id: 'd_por', nome: 'Língua Portuguesa', tipo: 'raciocinio', ordem: 4 },
        { id: 'slot_5', disciplina_id: 'd_rlm', nome: 'Raciocínio Lógico-Matemático', tipo: 'raciocinio', ordem: 5 },
        { id: 'slot_6', disciplina_id: 'd_con', nome: 'Direito Constitucional', tipo: 'decoreba', ordem: 6 },
      ];

      const mappedCells = checkedCells.map(c => {
        const [slotId, data] = c.split('_');
        return { slot_id: slotId, data, cor: activeColor };
      });

      return jsonResponse({
        ciclo: { id: 'ciclo_cgu_1', numero: 1, inicio: '2026-10-01', slots_por_dia: 4, duracao_dias: 30 },
        rodada: { id: 'rod_1', numero: 1, cor: activeColor },
        diaReuniaoSemana: 2,
        slots,
        dias,
        celulas: mappedCells,
        revisaoDias: dias.map(d => ({
          data: d,
          revisao_noturna: revisaoNoturnaCheckedDates.includes(d) ? 1 : 0,
        })),
        revisoesMensais: [
          { data: '2026-10-03', feita: revisaoMensalCheckedDates.includes('2026-10-03') ? 1 : 0 },
          { data: '2026-10-04', feita: revisaoMensalCheckedDates.includes('2026-10-04') ? 1 : 0 },
        ],
      });
    }

    // 10. Próxima Sessão Pomodoro (HU-3.4, HU-3.5)
    if (pathname.includes('/proxima-sessao')) {
      return jsonResponse({
        slot: {
          id: 'slot_1',
          disciplina_id: 'd_adm',
          nome: 'Direito Administrativo',
          tipo: 'decoreba',
          disciplina: {
            id: 'd_adm',
            nome: 'Direito Administrativo',
            tipo: 'decoreba',
          },
        },
        fase: 2,
        topico: {
          id: 'top_3_1',
          numeracao: '3.1',
          texto: 'Ato Administrativo: conceito, requisitos, atributos, anulação e revogação',
        },
        resumosAnteriores: [
          {
            id: 'rf_ant_1',
            storage_key: 'demo_resumo_1.jpg',
            enviada_em: '2026-10-10 18:00',
            numeracao: '2.1',
            topico_texto: 'Poderes Administrativos: vinculado, discricionário e de polícia',
          },
        ],
      });
    }

    // 11. Encerramento de Sessão Pomodoro
    if (pathname === '/api/sessoes/encerrar') {
      return jsonResponse({ ok: true, sessaoId: 'sess_nova_demo_1' });
    }

    // 12. Edital do Aluno (Hierarquia Completa)
    if (pathname.includes('/edital') && pathname.startsWith('/api/matriculas/')) {
      return jsonResponse({
        edital: { id: 'edital_cgu', nome: 'Concurso CGU (Auditor Federal de Finanças e Controle)', banca: 'CEBRASPE' },
        grupos: [
          {
            id: 'grp_basicas',
            nome: 'Conhecimentos Básicos',
            disciplinas: [
              {
                id: 'd_por',
                nome: 'Língua Portuguesa',
                tipo: 'raciocinio',
                categoria_carga: 'Raciocínio',
                fase: 3,
                topicos: [
                  { id: 't_1', numeracao: '1', texto: 'Compreensão e interpretação de textos de gêneros variados', estudado: true },
                  { id: 't_2', numeracao: '2', texto: 'Reconhecimento de tipos e gêneros textuais', estudado: true },
                  { id: 't_3', numeracao: '3', texto: 'Domínio da ortografia oficial e acentuação gráfica', estudado: true },
                ],
              },
              {
                id: 'd_adm',
                nome: 'Direito Administrativo',
                tipo: 'decoreba',
                categoria_carga: 'Decoreba',
                fase: 2,
                topicos: [
                  { id: 't_4', numeracao: '1', texto: 'Estado, governo e administração pública: conceitos e princípios', estudado: true },
                  { id: 't_5', numeracao: '2', texto: 'Organização administrativa da União: direta e indireta', estudado: true },
                  { id: 't_6', numeracao: '3', texto: 'Ato administrativo: validade, eficácia, anulação e revogação', estudado: false },
                ],
              },
            ],
          },
          {
            id: 'grp_especificas',
            nome: 'Conhecimentos Específicos',
            disciplinas: [
              {
                id: 'd_afo',
                nome: 'Administração Financeira e Orçamentária',
                tipo: 'raciocinio',
                categoria_carga: 'Raciocínio',
                fase: 1,
                topicos: [
                  { id: 't_7', numeracao: '1', texto: 'Orçamento público: conceitos, princípios e evolução', estudado: true },
                  { id: 't_8', numeracao: '2', texto: 'PPA, LDO e LOA na Constituição Federal de 1988', estudado: false },
                ],
              },
              {
                id: 'd_cex',
                nome: 'Controle Externo da Administração',
                tipo: 'decoreba',
                categoria_carga: 'Decoreba',
                fase: 2,
                topicos: [
                  { id: 't_9', numeracao: '1', texto: 'Controle exercido pelo Tribunal de Contas da União', estudado: true },
                  { id: 't_10', numeracao: '2', texto: 'Tomada de Contas Especial: pressupostos e rito', estudado: false },
                ],
              },
            ],
          },
        ],
      });
    }

    // 13. Tópicos da Disciplina selecionada pelo Aluno (DisciplinaTopicos.tsx)
    if (pathname.includes('/disciplinas/') && pathname.startsWith('/api/matriculas/')) {
      const discId = pathname.split('/disciplinas/')[1];
      const isAdm = discId === 'd_adm';
      const isAfo = discId === 'd_afo';

      return jsonResponse({
        disciplina: {
          id: discId,
          nome: isAdm ? 'Direito Administrativo' : isAfo ? 'Administração Financeira e Orçamentária' : 'Controle Externo',
          tipo: isAfo ? 'raciocinio' : 'decoreba',
          faseAtual: isAdm ? 2 : isAfo ? 1 : 2,
          grupoNome: isAdm ? 'Conhecimentos Básicos' : 'Conhecimentos Específicos',
          metricas: {
            totalCertas: isAdm ? 119 : 84,
            totalResolvidas: isAdm ? 140 : 110,
            taxaAcerto: isAdm ? 85 : 76,
            pontuacaoLiquida: isAdm ? 98 : 58,
          },
        },
        topicos: [
          {
            id: 'top_1',
            disciplina_id: discId,
            pai_id: null,
            numeracao: '1',
            texto: 'Conceitos Fundamentais e Princípios Institucionais',
            inicio: '2026-10-01',
            conclusao: '2026-10-04',
            filhos: [
              { id: 'top_1_1', disciplina_id: discId, pai_id: 'top_1', numeracao: '1.1', texto: 'Conceito, fontes e princípios constitucionais', inicio: '2026-10-01', conclusao: '2026-10-02', filhos: [] },
              { id: 'top_1_2', disciplina_id: discId, pai_id: 'top_1', numeracao: '1.2', texto: 'Regime jurídico-administrativo e supremacia do interesse público', inicio: '2026-10-02', conclusao: '2026-10-04', filhos: [] },
            ],
          },
          {
            id: 'top_2',
            disciplina_id: discId,
            pai_id: null,
            numeracao: '2',
            texto: 'Organização da Administração e Estruturas Orgânicas',
            inicio: '2026-10-05',
            conclusao: '2026-10-08',
            filhos: [
              { id: 'top_2_1', disciplina_id: discId, pai_id: 'top_2', numeracao: '2.1', texto: 'Administração direta e indireta: autarquias, fundações e estatais', inicio: '2026-10-05', conclusao: '2026-10-08', filhos: [] },
            ],
          },
          {
            id: 'top_3',
            disciplina_id: discId,
            pai_id: null,
            numeracao: '3',
            texto: 'Ato Administrativo e Requisitos de Validade',
            inicio: '2026-10-09',
            conclusao: null,
            filhos: [
              { id: 'top_3_1', disciplina_id: discId, pai_id: 'top_3', numeracao: '3.1', texto: 'Ato Administrativo: conceito, requisitos, atributos, anulação e revogação', inicio: '2026-10-09', conclusao: null, filhos: [] },
            ],
          },
        ],
      });
    }

    // 14. Hub de Revisões (HU-5.1 a 5.6)
    if (pathname.includes('/revisoes') && pathname.startsWith('/api/matriculas/')) {
      const revNoturnaFeita = getStoredState('revisaoNoturnaHoje', false);

      return jsonResponse({
        fotosHoje: [
          {
            id: 'rf_1',
            storage_key: 'demo_resumo_1.jpg',
            disciplina_nome: 'Direito Administrativo',
            topico_texto: 'Ato Administrativo (Requisitos de Validade)',
          },
          {
            id: 'rf_2',
            storage_key: 'demo_resumo_2.jpg',
            disciplina_nome: 'AFO',
            topico_texto: 'Créditos Suplementares e Especiais na LOA',
          },
        ],
        revisaoNoturnaFeita: revNoturnaFeita,
      });
    }

    // 15. Marcação de Revisão Noturna Diária (RevisaoHub.tsx)
    if (pathname.includes('/revisao-noturna') && pathname.startsWith('/api/matriculas/')) {
      setStoredState('revisaoNoturnaHoje', true);
      return jsonResponse({ ok: true });
    }

    // 16. Matrículas Ativas para Planejador de Ciclo (PlanejarCiclo.tsx)
    if (pathname === '/api/mentor/matriculas') {
      return jsonResponse([
        {
          matricula_id: 'mat_marina_cgu',
          mentorado_id: 'ment_marina',
          mentorado_nome: 'Marina R.',
          edital_id: 'edital_cgu',
          edital_nome: 'Concurso CGU (Auditor)',
          ciclo_numero: 1,
        },
        {
          matricula_id: 'mat_rafael_cgu',
          mentorado_id: 'ment_rafael',
          mentorado_nome: 'Rafael S.',
          edital_id: 'edital_cgu',
          edital_nome: 'Concurso CGU (Auditor)',
          ciclo_numero: 1,
        },
      ]);
    }

    // 17. Sugestão Inteligente de Ciclo de 30 Dias (PlanejarCiclo.tsx)
    if (pathname === '/api/ciclos/sugerir') {
      let body: any = {};
      try { if (init?.body) body = JSON.parse(init.body as string); } catch {}
      const slotsPorDia = Number(body.slotsPorDia) || 3;

      const todasDisciplinas = [
        { id: 'd_adm', nome: 'Direito Administrativo', tipo: 'decoreba' as const, peso: 1.0 },
        { id: 'd_afo', nome: 'Adm. Financeira e Orçamentária', tipo: 'raciocinio' as const, peso: 2.0 },
        { id: 'd_cex', nome: 'Controle Externo', tipo: 'decoreba' as const, peso: 2.0 },
        { id: 'd_por', nome: 'Língua Portuguesa', tipo: 'raciocinio' as const, peso: 1.0 },
        { id: 'd_con', nome: 'Direito Constitucional', tipo: 'decoreba' as const, peso: 1.0 },
        { id: 'd_rlm', nome: 'Raciocínio Lógico-Matemático', tipo: 'raciocinio' as const, peso: 1.0 },
      ];

      // Gera slots intercalando Decoreba e Raciocínio
      const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const totalSlots = slotsPorDia * 6; // 1 semana útil padrão
      const slotsSequencia = [];

      for (let s = 0; s < totalSlots; s++) {
        const disc = todasDisciplinas[s % todasDisciplinas.length];
        const diaIndex = Math.floor(s / slotsPorDia);
        slotsSequencia.push({
          id: `slot_seq_${s + 1}`,
          disciplina_id: disc.id,
          nome: disc.nome,
          tipo: disc.tipo,
          ordem: s + 1,
          slotNumero: (s % slotsPorDia) + 1,
          dia: diaIndex + 1,
          diaSemana: diasSemana[diaIndex] || 'Segunda',
          frequenciaCiclo: Math.round(30 / (todasDisciplinas.length / slotsPorDia)),
        });
      }

      return jsonResponse({
        slotsSequencia,
        todasDisciplinas,
        editalNome: 'Concurso CGU (Auditor Federal de Finanças e Controle)',
        editalId: 'edital_cgu',
        mentoradoNome: body.matriculaId?.includes('rafael') ? 'Rafael S.' : 'Marina R.',
        cicloNumero: 1,
      });
    }

    // 18. Análise Neuropsicológica do Ciclo
    if (pathname === '/api/ciclos/analisar') {
      return jsonResponse({
        avisos: [],
        choques: [],
        totalSlots: 18,
        totalDecoreba: 9,
        totalRaciocinio: 9,
        equilibrado: true,
        principioInterleaving: 'Alternância perfeita de carga cognitiva ativa conforme metodologia Gleyson Azevedo.',
        tamanhoMatriz: '3x3',
        diasPorVolta: 3,
        voltasPorSemana: 2.0,
        metaSemanalAtingida: true,
      });
    }

    // 19. Publicar Ciclo
    if (pathname === '/api/ciclos/publicar') {
      return jsonResponse({ ok: true, cicloId: 'ciclo_cgu_novo', mensagem: 'Ciclo publicado com sucesso no Modo Demonstração.' });
    }

    // 20. Parser de Editais (EditalParser.tsx)
    if (pathname === '/api/editais/parser' && method === 'POST') {
      return jsonResponse({
        disciplinas: [
          {
            idTemp: 'parsed_d1',
            nome: 'Direito Administrativo',
            grupoSugerido: 'Conhecimentos Básicos',
            tipoSugerido: 'decoreba',
            totalTopicos: 4,
            totalAvisos: 0,
            topicos: [
              { idTemp: 'top_p1', numeracao: '1', texto: 'Estado, governo e administração pública: conceitos e princípios' },
              { idTemp: 'top_p2', numeracao: '2', texto: 'Ato administrativo: validade, eficácia e extinção' },
              { idTemp: 'top_p3', numeracao: '3', texto: 'Poderes da administração pública' },
              { idTemp: 'top_p4', numeracao: '4', texto: 'Licitações e Contratos Públicos (Lei 14.133/2021)' },
            ],
          },
          {
            idTemp: 'parsed_d2',
            nome: 'Administração Financeira e Orçamentária',
            grupoSugerido: 'Conhecimentos Específicos',
            tipoSugerido: 'raciocinio',
            totalTopicos: 3,
            totalAvisos: 0,
            topicos: [
              { idTemp: 'top_p5', numeracao: '1', texto: 'Orçamento público: princípios fundamentais' },
              { idTemp: 'top_p6', numeracao: '2', texto: 'Lei de Responsabilidade Fiscal e Metas Fiscais' },
              { idTemp: 'top_p7', numeracao: '3', texto: 'Estágios da Receita e Despesa Orçamentária' },
            ],
          },
        ],
      });
    }

    // 21. Lista de Editais e Criação
    if (pathname === '/api/editais') {
      if (method === 'POST') {
        let body: any = {};
        try { if (init?.body) body = JSON.parse(init.body as string); } catch {}
        return jsonResponse({
          ok: true,
          edital: {
            id: `edital_${Date.now()}`,
            nome: body.nome || 'Novo Edital Cadastrado',
            banca: body.banca || 'CEBRASPE',
          },
        });
      }

      return jsonResponse([
        { id: 'edital_cgu', nome: 'Concurso CGU (Auditor)', banca: 'CEBRASPE', totalDisciplinas: 8, totalTopicos: 142 },
        { id: 'edital_tcu', nome: 'Concurso TCU (Auditor)', banca: 'FGV', totalDisciplinas: 10, totalTopicos: 188 },
      ]);
    }

    // 22. Estrutura do Edital (EstruturaEdital.tsx)
    if (pathname.includes('/estrutura') && pathname.startsWith('/api/editais/')) {
      return jsonResponse({
        edital: { id: 'edital_cgu', nome: 'Concurso CGU (Auditor)', banca: 'CEBRASPE' },
        grupos: [
          {
            id: 'grp_basicas',
            nome: 'Conhecimentos Básicos',
            questoes_prova: 50,
            peso: 1.0,
            nota_minima_grupo: 15,
            disciplinas: [
              { id: 'd_por', nome: 'Língua Portuguesa', tipo: 'raciocinio', total_topicos: 14, questoes_estimadas: 15, peso: 1.0 },
              { id: 'd_adm', nome: 'Direito Administrativo', tipo: 'decoreba', total_topicos: 18, questoes_estimadas: 20, peso: 1.0 },
              { id: 'd_con', nome: 'Direito Constitucional', tipo: 'decoreba', total_topicos: 16, questoes_estimadas: 15, peso: 1.0 },
            ],
          },
          {
            id: 'grp_especificas',
            nome: 'Conhecimentos Específicos',
            questoes_prova: 70,
            peso: 2.0,
            nota_minima_grupo: 25,
            disciplinas: [
              { id: 'd_afo', nome: 'Adm. Financeira e Orçamentária', tipo: 'raciocinio', total_topicos: 15, questoes_estimadas: 25, peso: 2.0 },
              { id: 'd_cex', nome: 'Controle Externo', tipo: 'decoreba', total_topicos: 12, questoes_estimadas: 20, peso: 2.0 },
              { id: 'd_aud', nome: 'Auditoria Governamental', tipo: 'decoreba', total_topicos: 14, questoes_estimadas: 25, peso: 2.0 },
            ],
          },
        ],
      });
    }

    if (pathname.includes('/pode-excluir')) {
      return jsonResponse({ podeExcluir: false, motivo: 'Edital possui matrículas ativas vinculadas.' });
    }

    // 23. Convites (ConvitesGerenciar.tsx)
    if (pathname === '/api/convites') {
      if (method === 'POST') {
        let body: any = {};
        try { if (init?.body) body = JSON.parse(init.body as string); } catch {}
        return jsonResponse({
          ok: true,
          convite: {
            id: `conv_${Date.now()}`,
            email: body.email || 'novoaluno@estudos.com',
            magicLink: `${window.location.origin}${window.location.pathname}?token=tok_demo_${Date.now()}`,
          },
        });
      }

      return jsonResponse({
        convites: [
          {
            id: 'conv_1',
            email: 'novoaluno@estudos.com',
            status: 'pendente',
            criado_em: '2026-10-12',
            magicLink: `${window.location.origin}${window.location.pathname}?token=tok_demo_convite`,
          },
          {
            id: 'conv_2',
            email: 'marina@handshake.local',
            status: 'aceito',
            criado_em: '2026-10-01',
            aceito_em: '2026-10-01',
          },
        ],
      });
    }

    // Fallback genérico para mutações e outras rotas
    return jsonResponse({ ok: true, mensagem: 'Operação simulada em Modo Demonstração.' });
  };
}

// Retorna as métricas completas com a interface MetricasMentorado exata
function getMockMentoradoMetrics(isAlerta = false) {
  return {
    notaLiquida: {
      totalCertas: isAlerta ? 280 : 395,
      totalResolvidas: isAlerta ? 420 : 480,
      totalErradas: isAlerta ? 140 : 85,
      notaLiquida: isAlerta ? 140 : 310,
      aproveitamentoLiquidoPct: isAlerta ? 33.3 : 64.6,
      aproveitamentoBrutoPct: isAlerta ? 66.7 : 82.3,
      pontuacaoTotalEdital: 180,
      notaMinimaAprovacao: 108,
      atingiuCorteGeral: !isAlerta,
      metodoCobranca: 'certo_errado',
      fatorPenalidade: 1.0,
    },
    coberturaEdital: {
      totalTopicosFolha: 142,
      topicosConcluidos: isAlerta ? 40 : 66,
      coberturaPct: isAlerta ? 28.2 : 46.5,
      topicosConcluidosUltimos30Dias: isAlerta ? 18 : 38,
      velocidadeSemanalTopicos: isAlerta ? 4.5 : 9.5,
      diasAteFimMentoria: 198,
      projecaoConclusaoDias: isAlerta ? 280 : 105,
      emDiaComCronograma: !isAlerta,
    },
    equilibrioCognitivo: {
      decoreba: {
        questoesResolvidas: isAlerta ? 230 : 260,
        questoesCertas: isAlerta ? 160 : 218,
        acertoPct: isAlerta ? 69.5 : 83.8,
        totalDisciplinas: 4,
      },
      raciocinio: {
        questoesResolvidas: isAlerta ? 190 : 220,
        questoesCertas: isAlerta ? 120 : 177,
        acertoPct: isAlerta ? 63.1 : 80.5,
        totalDisciplinas: 4,
      },
      polaridadeDominante: isAlerta ? 'melhor_decoreba' : 'equilibrado',
    },
    giroCiclo: {
      slotsPorDia: 4,
      tamanhoMatriz: '4x4',
      diasPorVolta: 4,
      voltasPorSemanaEsperadas: 1.5,
      voltasConcluidasUltimos14Dias: isAlerta ? 1 : 3,
      voltasPorSemanaRealizadas: isAlerta ? 0.8 : 1.8,
      metaSemanalAtingida: !isAlerta,
    },
    aderenciaRevisoes: {
      diasComEstudoUltimos30Dias: isAlerta ? 14 : 24,
      diasComRevisaoNoturnaUltimos30Dias: isAlerta ? 8 : 21,
      taxaRevisaoNoturnaPct: isAlerta ? 57.1 : 87.5,
      revisaoMensalFeita: !isAlerta,
      mesReferenciaAtual: '2026-10',
    },
    funilFases: {
      fase1Teoria: isAlerta ? 5 : 3,
      fase2Aplicacao: isAlerta ? 2 : 4,
      fase3Manutencao: isAlerta ? 1 : 1,
      totalDisciplinas: 8,
    },
    pautaReuniaoSemanal: isAlerta
      ? [
          {
            tipo: 'critico' as const,
            titulo: 'Queda de Rendimento em AFO (Fase 1)',
            descricao: 'Aproveitamento líquido caiu para 42% nos últimos 14 dias com acúmulo de erros em Créditos Adicionais.',
            disciplinaId: 'd_afo',
          },
          {
            tipo: 'atencao' as const,
            titulo: 'Ritmo Insuficiente para o Edital',
            descricao: 'Velocidade de 4.5 tópicos/semana é insuficiente para cobrir o edital antes da prova.',
          },
          {
            tipo: 'sono_revisao' as const,
            titulo: 'Baixa Adesão à Revisão Noturna',
            descricao: 'Apenas 57% dos dias tiveram revisão antes de dormir. Risco de esquecimento acentuado.',
          },
        ]
      : [
          {
            tipo: 'positivo' as const,
            titulo: 'Avanço Consolidado em Direito Administrativo',
            descricao: 'Atingiu 85% de acerto consistente nos 12 tópicos concluídos da Fase 2.',
          },
          {
            tipo: 'sono_revisao' as const,
            titulo: 'Excelente Adesão à Revisão Noturna',
            descricao: 'Aluno completou a revisão noturna em 88% dos dias com estudo registrado.',
          },
          {
            tipo: 'atencao' as const,
            titulo: 'Reforçar Exercícios em AFO',
            descricao: 'Matéria com menor aproveitamento no bloco (76%). Sugerida bateria extra.',
          },
        ],
    disciplinasDetalhadas: [
      {
        id: 'd_adm',
        nome: 'Direito Administrativo',
        grupoId: 'grp_basicas',
        grupoNome: 'Conhecimentos Básicos',
        tipo: 'decoreba' as const,
        faseAtual: 2,
        totalTopicos: 18,
        topicosConcluidos: 12,
        progressoPct: 66.7,
        questoesResolvidas: 140,
        questoesCertas: 119,
        acertoBrutoPct: 85,
        acertoLiquidoPct: 70,
        abaixoDoCorte: false,
      },
      {
        id: 'd_afo',
        nome: 'Administração Financeira e Orçamentária',
        grupoId: 'grp_especificas',
        grupoNome: 'Conhecimentos Específicos',
        tipo: 'raciocinio' as const,
        faseAtual: 1,
        totalTopicos: 15,
        topicosConcluidos: 8,
        progressoPct: 53.3,
        questoesResolvidas: 110,
        questoesCertas: isAlerta ? 60 : 84,
        acertoBrutoPct: isAlerta ? 54 : 76,
        acertoLiquidoPct: isAlerta ? 28 : 52,
        abaixoDoCorte: isAlerta,
      },
      {
        id: 'd_cex',
        nome: 'Controle Externo',
        grupoId: 'grp_especificas',
        grupoNome: 'Conhecimentos Específicos',
        tipo: 'decoreba' as const,
        faseAtual: 2,
        totalTopicos: 12,
        topicosConcluidos: 10,
        progressoPct: 83.3,
        questoesResolvidas: 120,
        questoesCertas: 106,
        acertoBrutoPct: 88,
        acertoLiquidoPct: 76,
        abaixoDoCorte: false,
      },
      {
        id: 'd_por',
        nome: 'Língua Portuguesa',
        grupoId: 'grp_basicas',
        grupoNome: 'Conhecimentos Básicos',
        tipo: 'raciocinio' as const,
        faseAtual: 3,
        totalTopicos: 14,
        topicosConcluidos: 14,
        progressoPct: 100,
        questoesResolvidas: 110,
        questoesCertas: 101,
        acertoBrutoPct: 92,
        acertoLiquidoPct: 84,
        abaixoDoCorte: false,
      },
    ],
  };
}
