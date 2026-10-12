import { describe, it, expect } from 'vitest';
import {
  detectPastedWords,
  autoFixPastedWords,
  cleanEditalNoise,
  parseEditalText,
  parseFullEdital,
} from '../src/server/services/parserService.js';

describe('parserService', () => {
  it('detecta palavras coladas geradas por PDFs', () => {
    const text = 'Transparência ativa e Portal daTransparência como meios.';
    const detected = detectPastedWords(text);

    expect(detected).toHaveLength(1);
    expect(detected[0].original).toBe('daTransparência');
    expect(detected[0].sugestao).toBe('da Transparência');
  });

  it('corrige automaticamente palavras coladas com autoFixPastedWords', () => {
    const text = 'Portal daTransparência e deDados';
    const fixed = autoFixPastedWords(text);
    expect(fixed).toBe('Portal da Transparência e de Dados');
  });

  it('limpa ruídos comuns de PDF como números de página e rodapés com cleanEditalNoise', () => {
    const dirty = `
      CEBRASPE – CONCURSO PÚBLICO CGU 2026
      ESTADO E DEMOCRACIA: 1 Estado.
      Página 12 de 45
      1.1 Legitimidade e poder.
      fl. 13
      14
    `;
    const cleaned = cleanEditalNoise(dirty);
    expect(cleaned).not.toContain('Página 12 de 45');
    expect(cleaned).not.toContain('fl. 13');
    expect(cleaned).toContain('ESTADO E DEMOCRACIA: 1 Estado.');
    expect(cleaned).toContain('1.1 Legitimidade e poder.');
  });

  it('faz o parse de edital padrão CEBRASPE e gera hierarquia de tópicos', () => {
    const raw = `FUNDAMENTOS DE TRANSPARÊNCIA: 1 Acesso à informação. 1.1 Transparência ativa e passiva. 1.1.1 Pedidos de acesso. 2 Proteção de dados. 2.1 Dados pessoais sensíveis.`;
    const parsed = parseEditalText(raw);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].nome).toBe('FUNDAMENTOS DE TRANSPARÊNCIA');

    const topicos = parsed[0].topicos;
    expect(topicos).toHaveLength(2); // Nós raiz 1 e 2

    // Raiz 1
    expect(topicos[0].numeracao).toBe('1');
    expect(topicos[0].texto).toBe('Acesso à informação');
    expect(topicos[0].filhos).toHaveLength(1); // 1.1

    // Filho 1.1
    expect(topicos[0].filhos[0].numeracao).toBe('1.1');
    expect(topicos[0].filhos[0].texto).toBe('Transparência ativa e passiva');
    expect(topicos[0].filhos[0].filhos).toHaveLength(1); // 1.1.1
    expect(topicos[0].filhos[0].filhos[0].numeracao).toBe('1.1.1');

    // Raiz 2
    expect(topicos[1].numeracao).toBe('2');
    expect(topicos[1].texto).toBe('Proteção de dados');
    expect(topicos[1].filhos).toHaveLength(1); // 2.1
  });

  it('anota warning em nó com palavra colada', () => {
    const raw = `1 Acesso ao Portal daTransparência.`;
    const parsed = parseEditalText(raw);

    expect(parsed[0].topicos[0].warnings).toBeDefined();
    expect(parsed[0].topicos[0].warnings?.[0].original).toBe('daTransparência');
  });

  it('faz o parsing completo de edital CEBRASPE com múltiplos grupos e 13 disciplinas', () => {
    const fullText = `15.2 CONHECIMENTOS
15.2.1 Nas provas, serão avaliados, além de habilidades, conhecimentos conforme descritos a seguir.

15.2.2 CONHECIMENTOS BÁSICOS

ESTADO, DEMOCRACIA, DIREITOS E CIÊNCIA POLÍTICA: 1 Estado e legitimidade. 1.1 Estado, governo e administração; autoridade, legitimidade e poder; interesse público, pluralismo e conflitos distributivos. 2 Democracia e representação. 2.1 Representação e participação; responsabilização democrática; relações entre Executivo, Legislativo e Judiciário; governabilidade e controles recíprocos. 3 Federalismo e capacidades estatais. 3.1 Autonomia, coordenação e cooperação federativa; capacidades administrativas e políticas; burocracia, discricionariedade e implementação de direitos. 4 Ordem constitucional e direitos. 4.1 Fundamentos e objetivos da República; direitos fundamentais, sociais e políticos; igualdade, devido processo e limites ao exercício do poder; princípios da administração pública. 5 Valor público e controle. 5.1 Resultados socialmente relevantes; legitimidade, confiança e direitos; controle interno, externo e social em perspectiva institucional; tensões entre eficiência, equidade e garantias. 6 Corrupção como fenômeno político e social. 6.1 Abuso do poder confiado e apropriação de decisões públicas em benefício particular; dimensões política, administrativa e público-privada. 6.2 Distinções entre corrupção, falha de gestão, conflito de interesses e ilícitos específicos; relações e diferenças entre clientelismo, patronagem, nepotismo e captura. 7 Mecanismos de reprodução e captura. 7.1 Assimetrias de poder e informação, incentivos e oportunidades; relações principal-agente e problemas de ação coletiva; normas sociais, tolerância organizacional e redes de favorecimento. 7.2 Captura de políticas e influência indevida; distinção entre representação legítima de interesses e favorecimento. 8 Consequências e respostas à corrupção. 8.1 Efeitos sobre direitos, desigualdades, competição, alocação de recursos, qualidade dos serviços e confiança institucional. 8.2 Relações entre prevenção, detecção, responsabilização e reparação; controles democráticos, participação e capacidades estatais. 8.3 Avaliação crítica das respostas e de seus efeitos não pretendidos, preservados o devido processo e a continuidade de serviços essenciais. 9 Estado e modelos de desenvolvimento econômico. 9.1 Arranjos de desenvolvimento com diferentes combinações de mercado, planejamento, regulação, provisão pública e atuação empresarial do Estado; industrialização, inovação e transformação produtiva. 9.2 Papel das empresas estatais no investimento de longo prazo, na infraestrutura, no financiamento e na prestação de serviços públicos. 9.3 Relações entre finalidade pública, concorrência, universalização, sustentabilidade fiscal e socioambiental; capacidades estatais, riscos de captura e efeitos distributivos. 9.4 Fundamentos constitucionais da atuação econômica do Estado e comparação de alternativas institucionais à luz de objetivos, evidências e resultados.

SOCIEDADE BRASILEIRA, DESIGUALDADES, DIVERSIDADE E DESENVOLVIMENTO: 1 Fundamentos sociológicos. 1.1 Instituições, socialização e ação coletiva; estratificação e mobilidade social; redes, poder, discriminação e reprodução das desigualdades. 2 Formação social e cidadania no Brasil. 2.1 Heranças da escravidão, hierarquias sociais e construção da cidadania; transformações nas relações entre Estado e sociedade; mecanismos de inclusão e exclusão institucional. 3 População, território e trabalho. 3.1 Transição demográfica, envelhecimento e cuidado; desigualdades regionais, urbanas e rurais; estrutura produtiva, informalidade e mudanças tecnológicas no trabalho. 4 Diversidade e acesso a direitos. 4.1 Relações étnico-raciais, gênero e sexualidade; pessoas com deficiência; idade; povos indígenas e comunidades tradicionais. Interseccionalidade, acessibilidade e barreiras administrativas e digitais. 5 Desenvolvimento e realidade brasileira. 5.1 Pobreza, renda e proteção social; educação, saúde, saneamento e habitação como problemas públicos; sustentabilidade e vulnerabilidade climática; leitura contextual de indicadores e desigualdades.

ÉTICA PÚBLICA E RESPONSABILIDADE PROFISSIONAL: 1 Fundamentos da ética pública. 1.1 Interesse público, dignidade, justiça e responsabilidade; relações entre deveres, consequências e virtudes profissionais; conflitos entre valores em decisões públicas. 2 Deveres profissionais. 2.1 Imparcialidade, probidade, diligência e respeito; autonomia técnica e responsabilidade; limites da obediência hierárquica; uso adequado de informação e recursos públicos. 2.2 Aplicação dos valores e deveres de conduta ética da CGU a situações de trabalho. 3 Conflitos de interesses e imparcialidade. 3.1 Identificação de interesses privados em conflito com a função pública e medidas de prevenção, consulta e encaminhamento, nos termos dos arts. 3º a 5º, 8º e 10 da Lei nº 12.813/2013. 3.2 Impedimento e suspeição no processo administrativo federal, nos termos dos arts. 18 a 21 da Lei nº 9.784/1999; comunicação e abstenção quando exigidas. 4 Relações de trabalho e atendimento. 4.1 Dignidade, diversidade e relações de poder; reconhecimento e prevenção de assédio e discriminação; respeito, escuta e não retaliação. 4.2 Distinção entre acolher uma pessoa, verificar fatos e atribuir responsabilidade. 5 Integridade como responsabilidade institucional. 5.1 Coerência entre regras e práticas; ambiente organizacional e incentivos; canais de orientação e relato; papel do exemplo, da confiança e da prestação de contas.

ADMINISTRAÇÃO PÚBLICA E FUNDAMENTOS DE POLÍTICAS PÚBLICAS: 1 Organização administrativa. 1.1 Administração direta e indireta; descentralização e desconcentração; agentes públicos; funções da administração pública: formulação, execução, regulação e controle de políticas e ações públicas; arranjos de cooperação com entes federativos e entidades não estatais. 2 Modelos de administração. 2.1 Burocracia e profissionalização; gestão orientada a resultados; participação e governança; limites e contribuições de diferentes modelos na realidade brasileira. 3 Políticas públicas. 3.1 Problema público, agenda e formulação; instrumentos de ação estatal; implementação, monitoramento e avaliação; intersetorialidade e atores governamentais e sociais. 4 Planejamento e recursos. 4.1 Funções do planejamento e do orçamento; relação entre PPA, LDO e LOA; receita e despesa em nível conceitual; restrições fiscais, escolhas alocativas e sustentabilidade das ações. 5 Serviços e transformação digital. 5.1 Orientação ao usuário; simplificação e acessibilidade; coordenação de serviços; oportunidades e riscos da automação e da inteligência artificial na administração.

15.2.3 CONHECIMENTOS COMPLEMENTARES

FUNDAMENTOS DE GOVERNANÇA, RISCOS E INTEGRIDADE PÚBLICA E PRIVADA: 1 Governança e responsabilidades. 1.1 Distinção entre direção, gestão, controle e prestação de contas; papéis, supervisão, transparência e responsabilização. Relação entre decisões organizacionais, finalidade pública e direitos. 2 Riscos e controles essenciais. 2.1 Risco, causa, consequência e controle; prevenção e detecção; proporcionalidade dos controles, segregação de funções e risco residual. 2.2 Identificação de vulnerabilidades e de controles compatíveis com situações usuais, a partir dos dados fornecidos. 3 Integridade pública. 3.1 Finalidades dos programas e medidas de integridade; compromisso da liderança, orientação ética, identificação de riscos, canais de relato e acompanhamento de ações. 3.2 Prevenção de favorecimento, assédio e discriminação; ambiente seguro e não retaliação. 4 Integridade privada. 4.1 Finalidades dos programas de integridade e sua relação com o poder público; compromisso da direção, registros confiáveis, controles, diligência proporcional sobre terceiros, canais de relato e remediação. 4.2 Diferença entre existência documental, implementação e efetividade dos mecanismos. 5 Prevenção e melhoria institucional. 5.1 Cultura, incentivos e confiança; diferenças de capacidade entre organizações; orientação e medidas proporcionais. 5.2 Denúncias e resultados de controle como insumos de melhoria. 5.3 Distinção entre baixa ocorrência e baixa detecção de problemas; leitura de evidências simples sobre funcionamento e resultados das medidas.

FUNDAMENTOS DE TRANSPARÊNCIA, OUVIDORIA E PARTICIPAÇÃO SOCIAL: 1 Acesso à informação. 1.1 Transparência ativa e passiva; finalidade de pedidos e recursos; publicidade como regra e motivação das restrições. 1.2 Distinção conceitual entre informação classificada, sigilos previstos em lei, informação pessoal e documento preparatório; acesso parcial e comunicação clara da decisão. 2 Transparência e proteção de dados. 2.1 Compatibilização entre acesso à informação e proteção de dados pessoais; finalidade, necessidade e salvaguardas. 2.2 Diferença entre dados pessoais e dados pessoais sensíveis; noções de tarjamento, anonimização e risco de reidentificação. 3 Ouvidoria e proteção das pessoas. 3.1 Finalidades das manifestações; acolhimento, encaminhamento e resposta ao usuário; acessibilidade e linguagem cidadã. 3.2 Proteção da identidade e prevenção de retaliação. 3.3 Distinção entre receber um relato, apurar fatos e decidir sobre responsabilidade. 4 Participação e melhoria de serviços. 4.1 Participação e controle social; conselhos, consultas e escuta de usuários; representatividade e barreiras à participação. 4.2 Recorrências em manifestações como sinais de problemas. 4.2.1 Subnotificação. 4.3 Transparência ativa, dados abertos e Portal daTransparência como meios de acesso e controle; qualidade, atualização, cobertura e limites da informação. 4.4 Papel da CGU na orientação e no monitoramento da transparência e do acesso à informação, em nível de finalidade institucional. 5 Integridade da informação e comunicação. 5.1 Confiabilidade e contexto das fontes; distinção entre fato, alegação e interpretação. 5.2 Desinformação e efeitos sobre políticas públicas; comunicação de incertezas e correção de erros. 5.3 Liberdade de expressão e pluralismo. 5.3.1 Distinção entre crítica legítima e desinformação.

FUNDAMENTOS DE DIREITO PÚBLICO APLICADO, CONTROLE E RESPONSABILIZAÇÃO: 1 Decisão administrativa. 1.1 Competência, finalidade, motivação, proporcionalidade e segurança jurídica; consideração das consequências e das condições de atuação. 1.2 Dever de fundamentação e limites ao exercício do poder e à revisão de decisões. 2 Processo e garantias. 2.1 Devido processo, contraditório, defesa e imparcialidade; finalidade da instrução e da prova. 2.2 Distinção entre procedimento investigativo e processo sancionador; proteção de direitos e necessidade de fundamentar conclusões. 3 Funções de controle e melhoria da gestão. 3.1 Finalidades do controle interno, externo e social; inserção institucional da CGU no Poder Executivo federal. 3.2 Avaliação da ação governamental e apoio ao aprimoramento da gestão, da governança, dos controles e dos resultados das políticas públicas; prevenção, detecção e correção de irregularidades. 3.3 Autonomia técnica e responsabilidades dos gestores; diferenças de competências e complementaridade com o controle externo exercido pelo Congresso Nacional com o auxílio do TCU. 3.4 Distinção entre avaliar a gestão, apurar fatos e aplicar sanções; cooperação e compartilhamento lícito de informações. 4 Responsabilização em nível introdutório. 4.1 Distinção entre indício, falha de gestão, irregularidade e responsabilidade. 4.2 Finalidades e diferenças entre responsabilização de agentes públicos e de pessoas jurídicas; noções de admissibilidade, processo disciplinar, processo administrativo de responsabilização e acordo de leniência. 5 Proteção e encaminhamento. 5.1 Distinção entre acolhimento, medidas de proteção, apuração de fatos e conclusão sancionadora, especialmente diante de assédio e discriminação; finalidades e garantias de cada atuação.

FUNDAMENTOS DE EVIDÊNCIAS, DADOS E INTELIGÊNCIA ARTIFICIAL: 1 Perguntas e fontes. 1.1 Relação entre problema, pergunta e informação necessária; fontes documentais, administrativas, estatísticas e de participação social. 1.2 Distinção entre dado, evidência, interpretação e juízo de valor; verificação de origem e confronto de fontes. 2 Leitura de dados e indicadores. 2.1 Interpretação de tabelas, gráficos, proporções, taxas e medidas descritivas; denominadores, qualidade e comparabilidade. 2.2 Distinção entre indicadores de percepção, experiência, denúncias, detecção e sanções na análise da corrupção; subnotificação e limites de inferência sobre sua ocorrência. 3 Inferências e erros de raciocínio. 3.1 Associação e causalidade; seleção e representatividade; explicações alternativas e incerteza. 3.2 Generalizações indevidas, falácia ecológica e viés de confirmação; falsos positivos e falsos negativos. 4 Integridade da evidência e proteção. 4.1 Rastreabilidade e verificação de informações; comunicação proporcional dos resultados e limites. 4.2 Escuta sem indução, confidencialidade e risco de identificação indireta. 4.3 Distinção entre as condições e os regimes de proteção de entrevistados em auditoria, participantes de pesquisa e denunciantes. 5 Uso responsável de inteligência artificial. 5.1 Possibilidades de classificação, busca, síntese e apoio à análise; escolha entre IA, solução simples e revisão humana. 5.2 Erros, conteúdo não sustentado, vieses e efeitos sobre grupos; proteção de informações, supervisão, rastreabilidade e contestação. 5.3 Verificação de fontes e limites da automação de decisões que afetam direitos.

FUNDAMENTOS DE AUDITORIA GOVERNAMENTAL E ATUAÇÃO INTEGRADA DA CGU: 1 Propósito, serviços e papéis. 1.1 Contribuição da auditoria para a governança, os riscos, os controles e os resultados. 1.2 Avaliação e consultoria como serviços de auditoria interna governamental; apuração de atos e fatos com indícios de ilegalidade ou irregularidade na utilização de recursos públicos federais como competência do sistema de controle interno. 1.3 Finalidades e diferenças entre as três formas de atuação da SFC; relação com a gestão, correição e avaliação de políticas. 1.4 Independência, objetividade, diligência e ceticismo; papéis de gestão, supervisão e auditoria no modelo das três linhas. 2 Ciclo do trabalho. 2.1 Planejamento, execução, comunicação e monitoramento; finalidade de objetivos, escopo, critérios e perguntas. 2.2 Priorização por risco, materialidade e relevância social em nível conceitual; adequação do trabalho às finalidades de avaliação, consultoria ou apuração. 2.3 Apoio à melhoria da gestão com preservação da autonomia técnica e das responsabilidades de decisão e execução dos gestores. 3 Evidência e conclusão. 3.1 Suficiência, adequação e confiabilidade; noção de achado e de limitações. 3.2 Distinção entre sinal de risco, evidência e conclusão; necessidade de aprofundamento e proporcionalidade da afirmação. 4 Comunicação e acompanhamento. 4.1 Clareza, contexto e utilidade dos resultados; publicidade e proteção de pessoas e informações. 4.2 Recomendações relacionadas a causas e riscos; distinção entre plano de ação, implementação, resultado e benefício. 5 Integração entre funções da CGU. 5.1 Denúncias e informações de ouvidoria e transparência como insumos de risco; achados como subsídios para admissibilidade correcional e responsabilização de entes privados. 5.2 Resultados do controle como insumos de integridade e melhoria de serviços; compartilhamento lícito, devolutivas e proteção. e conhecimentos especificos ENGENHARIA DE SOFTWARE E PROGRAMAÇÃO: 1 Problemas e requisitos. 1.1 Necessidades de usuários. 1.2 Requisitos funcionais e não funcionais. 1.3 Restrições e critérios de aceitação. 1.4 Desenho centrado nas pessoas. 1.5 Relações entre problema público, processo de trabalho e solução digital. 2 Programação e correção. 2.1 Linguagem Java: tipos de dados, estruturas de controle, métodos, classes e objetos. 2.2 Encapsulamento, interfaces, herança e polimorfismo. 2.3 Coleções e tipos genéricos. 2.4 Igualdade de objetos, mutabilidade, tratamento de exceções e leitura e escrita de arquivos. 2.5 Estruturas de dados, algoritmos e pseudocódigo. 2.6 Leitura, depuração e testes de borda. 2.7 Complexidade em decisões de desempenho. 2.8 Modularidade e padrões de projeto aplicados à manutenção. 3 Concorrência e processamento. 3.1 Concorrência, paralelismo e assincronia. 3.2 Condições de corrida e sincronização. 3.3 Compartilhamento de estado, bloqueios e falhas. 3.4 Correção e desempenho sob requisições concorrentes. 4 Interfaces e experiência do usuário. 4.1 Usabilidade, prototipagem e desenho responsivo. 4.2 Acessibilidade e barreiras digitais. 4.3 Componentes de interface e reaproveitamento. 4.4 Validação com usuários e prevenção de erros no uso dos serviços. 4.5 Desenvolvimento de interfaces com JavaScript e Vue.js: componentes, reatividade, tratamento de eventos e consumo de APIs. 5 Manutenção e evolução. 5.1 Débito técnico, documentação, modularidade e acoplamento. 5.2 Sustentação e modernização de sistemas legados. 5.3 Interoperabilidade e compatibilidade. 5.4 Impactos das mudanças e das falhas sobre a continuidade e a qualidade dos serviços.

ARQUITETURA E INTEGRAÇÃO DE SISTEMAS: 1 Arquiteturas de aplicações. 1.1 Monolitos, microsserviços e arquiteturas orientadas a eventos. 1.2 Distribuição de responsabilidades, acoplamento e dependências. 1.3 Desempenho, escalabilidade, segurança e custo. 1.4 Escolha de arquitetura conforme restrições. 1.5 Aplicações Java com Spring Framework e Spring Boot: organização de componentes, inversão de controle e injeção de dependências. 1.6 Configuração e autoconfiguração. 1.7 Construção de serviços REST e separação entre apresentação, regras de negócio e acesso a dados. 2 APIs e identidade. 2.1 Design, contratos e versionamento de APIs REST. 2.2 Autenticação e autorização. 2.3 OAuth 2.0 para autorização e OpenID Connect para autenticação federada. 2.4 Uso, validação e proteção de tokens. 2.5 Controle de acesso e segregação de funções nas aplicações. 2.6 Spring Security: configuração e avaliação de mecanismos de autenticação e autorização. 2.7 Proteção de endpoints e métodos. 2.8 Identificação e correção de permissões excessivas e falhas de controle de acesso. 3 Comunicação e consistência. 3.1 Mensageria, eventos e persistência. 3.2 Falhas, repetição de requisições, idempotência e consistência. 3.3 Integração entre sistemas e coordenação de operações. 3.4 Evolução de contratos e migração de esquemas. 4 Integração com dados e IA. 4.1 Consumo e disponibilização de serviços de dados e modelos de linguagem. 4.2 Representações vetoriais, busca semântica e recuperação de informação para geração de respostas. 4.3 Agentes e ferramentas. 4.4 Avaliação funcional de respostas e fontes. 4.5 Limites de autorização, supervisão e proteção contra instruções maliciosas em conteúdo externo. 5 Confiabilidade das aplicações. 5.1 Contêineres, serviços de nuvem e processamento serverless como ambientes de implantação. 5.2 Logs, métricas e rastreamento. 5.3 Latência, disponibilidade, capacidade e tolerância a falhas. 5.4 Diagnóstico de integrações e dependências. 5.5 Continuidade, recuperação e degradação de serviços.

PERSISTÊNCIA, INTEGRAÇÃO E PROTEÇÃO DE DADOS: 1 Modelagem e persistência. 1.1 Modelagem relacional, normalização e integridade. 1.2 Bancos documentais, chave-valor e vetoriais. 1.3 Cache e busca textual. 1.4 Escolha de armazenamento conforme uso. 1.5 Transações, concorrência, consistência e evolução de esquemas. 1.6 Persistência em Java com JPA: mapeamento de entidades e relacionamentos, ciclo de vida das entidades, contexto de persistência, consultas e transações. 1.7 Estratégias de carregamento e seus efeitos sobre correção e desempenho. 1.8 Spring Data JPA: repositórios, consultas e paginação. 1.9 Integração da camada de persistência às regras de negócio. 2 SQL e desempenho. 2.1 Definição e manipulação de dados, controle de acesso e transações. 2.2 Consultas com filtros, junções, agregações, subconsultas e expressões de tabela comuns. 2.3 Índices, planos de execução, valores nulos e duplicações. 2.4 Diagnóstico de consultas e efeitos sobre o desempenho da aplicação. 3 Fluxos e interoperabilidade. 3.1 Ingestão, transformação e carga. 3.2 ETL e ELT. 3.3 Processamento em lote e fluxo, completo e incremental. 3.4 APIs, contratos e formatos CSV, JSON, XML e Parquet. 3.5 Qualidade, rastreabilidade, conciliação e repetição segura de processamento. 3.6 Spring Batch: organização de trabalhos e etapas de processamento (jobs e steps). 3.7 Leitura, processamento e escrita de registros. 3.8 Controle transacional, registro do estado de execução e reinício após falhas. 3.9 Prevenção de perdas e duplicações no reprocessamento. 4 Privacidade e segurança de dados. 4.1 Minimização, finalidade, acesso e segregação. 4.2 Criptografia em trânsito e repouso. 4.3 Pseudonimização e risco de reidentificação. 4.4 Retenção, descarte e proteção de cópias e registros. 4.5 Compartilhamento e publicação com salvaguardas. 4.6 Proteção de dados pessoais desde a concepção da aplicação.

DESENVOLVIMENTO SEGURO, QUALIDADE E GESTÃO DA ENTREGA: 1 Segurança de aplicações. 1.1 Ameaças e vulnerabilidades em aplicações e interfaces. 1.2 Validação de entradas e controles de acesso. 1.3 Proteção de segredos e dependências. 1.4 Testes de segurança autorizados. 1.5 Prevenção de vazamentos. 1.6 Registros, preservação de evidências e tratamento de falhas de segurança, inclusive em integrações com IA. 2 Testes e qualidade. 2.1 Testes unitários, de integração, de contrato e de aceitação. 2.2 Análise estática, cobertura e revisão de código. 2.3 Automação e dados de teste. 2.4 Limites das métricas de qualidade. 2.5 Verificação de requisitos funcionais, segurança, desempenho e acessibilidade. 3 Entrega e operação. 3.1 Versionamento, integração e entrega contínuas. 3.2 DevSecOps e segurança da cadeia de dependências. 3.3 Automação de build, teste e implantação. 3.4 Configuração e segregação de ambientes. 3.5 Mudanças, reversão e observabilidade. 3.6 Manutenção da continuidade durante entregas e incidentes. 4 Gestão de produtos e governança. 4.1 Descoberta de necessidades, entrega e ciclo de vida de produtos digitais. 4.2 Scrum e Kanban. 4.3 Priorização, critérios de aceitação e indicadores de resultado. 4.4 PDTIC, plano de transformação digital e plano de dados abertos aplicados a produtos e integrações. 4.5 Riscos, responsabilidades e evidências de efetividade de controles. 5 Contratação e fiscalização de soluções. 5.1 Necessidade, estudo técnico preliminar e termo de referência. 5.2 Comparação entre desenvolvimento próprio, contratação e compartilhamento. 5.3 Viabilidade, dimensionamento, custo total de propriedade e pesquisa de preços. 5.4 Qualidade, níveis de serviço e entregas verificáveis. 5.5 Fiscalização e pagamento. 5.6 Propriedade intelectual, portabilidade, acesso a código e dados, dependência tecnológica e plano de saída.`;

    const res = parseFullEdital(fullText);

    // 1. Deve encontrar as 13 disciplinas
    expect(res.totalDisciplinas).toBe(13);
    expect(res.disciplinas).toHaveLength(13);

    // 2. Deve identificar os 3 blocos / grupos
    expect(res.grupos.map(g => g.nome)).toContain('Conhecimentos Básicos');
    expect(res.grupos.map(g => g.nome)).toContain('Conhecimentos Complementares');
    expect(res.grupos.map(g => g.nome)).toContain('Conhecimentos Específicos');

    const basicas = res.grupos.find(g => g.nome === 'Conhecimentos Básicos');
    expect(basicas?.disciplinas).toHaveLength(4);

    const complem = res.grupos.find(g => g.nome === 'Conhecimentos Complementares');
    expect(complem?.disciplinas).toHaveLength(5);

    const especif = res.grupos.find(g => g.nome === 'Conhecimentos Específicos');
    expect(especif?.disciplinas).toHaveLength(4);

    // 3. Disciplinas com dois-pontos internos no texto não quebram (ex: Administração Pública)
    const adm = res.disciplinas.find(d => d.nome.includes('ADMINISTRAÇÃO PÚBLICA'));
    expect(adm).toBeDefined();
    expect(adm?.topicos).toHaveLength(5);

    // 4. Citações legislativas com números não viram tópicos falsos (ex: Ética Pública)
    const etica = res.disciplinas.find(d => d.nome.includes('ÉTICA PÚBLICA'));
    expect(etica).toBeDefined();
    expect(etica?.topicos).toHaveLength(5); // Apenas 1, 2, 3, 4, 5 raiz
    const topico3 = etica?.topicos.find(t => t.numeracao === '3');
    expect(topico3?.filhos.map(f => f.numeracao)).toEqual(['3.1', '3.2']);

    // 5. Terceiro nível de tópicos é mapeado corretamente (ex: 4.2.1 e 5.3.1 em Transparência)
    const transp = res.disciplinas.find(d => d.nome.includes('TRANSPARÊNCIA'));
    expect(transp).toBeDefined();
    const topico4 = transp?.topicos.find(t => t.numeracao === '4');
    const sub42 = topico4?.filhos.find(f => f.numeracao === '4.2');
    expect(sub42?.filhos.map(f => f.numeracao)).toContain('4.2.1');

    // 6. Heurística de sugestão de raciocínio vs decoreba
    const engSoft = res.disciplinas.find(d => d.nome.includes('ENGENHARIA DE SOFTWARE'));
    expect(engSoft?.tipoSugerido).toBe('raciocinio');

    const estado = res.disciplinas.find(d => d.nome.includes('ESTADO, DEMOCRACIA'));
    expect(estado?.tipoSugerido).toBe('decoreba');
  });
});
