Guia de UI/UX — Plataforma de Estudos
Este guia reúne tudo o que foi definido de interface e experiência até agora: identidade visual, padrões de componentes, inventário de telas e as decisões tomadas com o mentor.
As telas desenhadas estão no canvas de design: https://claude.ai/artifact/26ikrDdcnhRFrDpRPRRE6V. Os requisitos estão no documento de histórias de usuário (https://claude.ai/code/artifact/ecf11c79-a682-4e31-91bb-edcef6cf3b68), e o modelo de dados no arquivo modelo-dados-mvp.
Princípios
A interface é limpa, em modo claro por padrão, com cor usada só quando carrega significado.
• Sem sobrecarga visual: poucos elementos por tela, sem sombras e sem ícones decorativos. O menu é só texto.
• Cor com função: tipo da disciplina, fase, rodada, fim de semana e dia da reunião têm cores próprias. Quando a cor carrega informação, há também um rótulo escrito.
• Conceito do ciclo: o anel aparece no logo, no cronômetro e na ideia de rodada.
• Mobile e web: toda tela principal existe nos dois formatos. Alvos de toque têm pelo menos 44 px.
• Acessível desde o desenho: botões e campos reais, nomes acessíveis nos controles só com ícone ou cor, contraste de texto adequado.
Identidade visual
O nome de trabalho é "ciclo", escrito em minúsculas com um anel aberto em índigo e um ponto amarelo, como um marca-texto.
Tipografia
Uso
Fonte
Peso
Títulos, cronômetro e números grandes
Bricolage Grotesque
600 e 700
Texto, tabelas, campos e botões
Figtree
400, 500 e 600
Tamanhos de referência: títulos de tela 32 px no celular e 36 px na web; cronômetro 56 px no celular e 64 px na web; texto 14 a 16 px; rótulos de seção 13 px em maiúsculas com espaçamento de 0,06 em e peso 600; chips 12 px.
Cores de base
Token
Hex
Uso
Fundo
#F5F6FA
Fundo das telas
Superfície
#FFFFFF
Cartões, tabelas, menu
Borda
#E3E5F3 e #D9DCEB
Cartões e controles
Tinta
#14162B
Texto principal
Texto secundário
#5B607A
Legendas e apoio
Acento (índigo)
#4338CA
Botão principal, cronômetro, links; ajustável
Índigo suave
#E4E5FB com texto #2F2A9E
Item ativo, aba atual
Marca-texto
#FFD84D
Item ativo do menu e ponto de progresso
Cores com significado
Significado
Cor
Observação
Decoreba
#D3E3F5, texto #1F3F66
Azul, herdado da planilha
Raciocínio
#FFF2CC, texto #6B4F00
Amarelo, herdado da planilha
Fase 1
#EEEFF6, texto #3A3F5C
Sem cor de destaque
Fase 2
Chip #FDE8D2, texto #8A3F05; nome em #B45309
Laranja
Fase 3
Chip #FBDADA, texto #8E1F1F; nome em #C62828
Vermelho
Fim de semana
#E4E6EE
Cinza liso, sem listras
Dia da reunião
Cabeçalho #BFE5C8, borda #7FC48E, texto #17603A
Verde
Acerto e confirmação
Barra #3FA66B; pílula #CFEBD8, texto #17603A
Verde
Aviso
#FFE9B8, texto #7A4B00 (faixa #FFF4D6)
Âmbar
Paleta da rodada (10 cores)
O mentorado escolhe uma cor por rodada, entre estas: Coral #FFB4A2, Âmbar #FFD166, Lima #D4E157, Menta #86E3B0, Turquesa #6FD3D3, Azul-claro #8EC5FF, Lavanda #A9A6FF, Lilás #D7A8FF, Rosa #FF9FCB e Areia #C9B79C. A cor padrão de exemplo é o azul-claro.
Forma e espaçamento
• Raios: 16 px em cartões, 14 px em botões grandes, 12 px em campos, 9 px em chips.
• Celular: tela de 390 por 844 px, margem de 24 px, menu inferior só com texto.
• Web: menu lateral de 232 px, conteúdo com margem de 40 px por 48 px, tabelas em cartões.
• Botões: 44 px (padrão) e 52 px (ação principal).
Padrões de componentes
Cada padrão abaixo foi aprovado e deve ser reutilizado nas telas novas.
• Navegação: celular com quatro itens (Hoje, Edital, Controle, Revisões) e web com menu lateral. O item ativo ganha o marca-texto amarelo sob o texto. O mentor tem menu próprio: Mentorados, Editais, Ciclos e Convites.
• Chips: fase, tipo (decoreba ou raciocínio) e "no ciclo", sempre com texto.
• Progresso de questões: barra curta, "certas/resolvidas" e porcentagem em verde, numa célula só.
• Registro de questões: painel ao tocar num tópico (lateral na web, folha no celular), com campos de texto para certas e resolvidas (não contadores), porcentagem calculada na hora, data e lista de lançamentos com o total somado.
• Faixa da disciplina: linha azul logo abaixo do cabeçalho da tabela, com o nome em maiúsculas e o total de questões da fase.
• Abas de fase: três estados. Atual (destacada e editável), concluída (visto, somente consulta) e futura (cadeado, esmaecida e bloqueada). A disciplina abre na fase atual.
• Áreas de envio: o envio da foto do resumo mostra a contagem obrigatória e o aviso para não fotografar documentos pessoais.
• Avisos: faixa âmbar com a explicação e a ação possível (por exemplo, "Corrigir" ou "Ignorar" no parser).
Inventário de telas
Mobile (390 × 844)
• Sessão de estudo: cronômetro em anel, etapas (estudo, teste, recorde, descanso), lembrete da fase e botões Pausar e Ir para o teste.
• Controle: disciplinas do ciclo como lista fixa à esquerda e datas em colunas que rolam para o lado. A célula estudada recebe a cor da rodada com um visto. As revisões noturna e mensal ficam abaixo da lista. A cor da rodada fica numa faixa com o botão Alterar.
• Edital: grupos com questões e peso, cartões por disciplina com fase, tipo e "no ciclo".
• Disciplina por tópico: abas de fase e árvore de tópicos com datas e questões.
• Registrar questões: folha com os dois campos, porcentagem, data e lançamentos.
Web do mentorado
• Sessão: cronômetro à esquerda; etapas com tempos, lembrete e envio de foto à direita.
• Controle: 30 dias sem rolagem, paleta de 10 cores aberta, legenda e revisões abaixo das disciplinas.
• Edital: tabela por grupo com fase, tipo e situação no ciclo.
• Disciplina: tabela de uma fase por vez, com a faixa da disciplina e o painel de registro ao lado.
Web do mentor
• Painel de mentorados: semana em quadradinhos, sessões, acerto, dia da reunião em verde e situação; quem precisa de atenção aparece primeiro.
• Mentorado (visão geral): métricas da semana, questões desde a última reunião, disciplinas por fase, resumos recentes com comentário e as correções do mentor.
• Estrutura do edital: grupos com nome, questões e peso, e as disciplinas de cada um, com criação de novo grupo.
• Editar disciplina: grupo e tipo no topo, texto do edital à esquerda e pré-visualização do parser à direita, com aviso de palavra colada.
• Planejar ciclo: sequência por dia e hora, equilíbrio entre decoreba e raciocínio, aviso de repetição do mesmo tipo e lista de disciplinas fora do ciclo.
Decisões de experiência
• Controle: disciplinas fixas e o que varia é a marcação. Os fins de semana são cinza liso em todas as células, exceto as estudadas. O dia da reunião é verde no cabeçalho.
• Reunião e corte: o dia da reunião é também o dia de corte das questões, um único dia configurável por mentorado, para verificar o progresso entre reuniões.
• Cor da rodada: uma vez escolhida, vale até o fim da rodada e não pode mudar nas demais células dela.
• Questões: campos de texto no lugar de contadores; o total do tópico é a soma dos lançamentos e nunca é digitado.
• Fases: o mentorado só marca na fase atual. As fases seguintes ficam bloqueadas até o avanço automático ou a liberação pelo mentor. Um tópico novo em disciplina avançada entra na Fase 1 com aviso, sem fazer a disciplina voltar de fase.
• Grupos: o mentor cria os grupos na estrutura do edital e escolhe grupo e tipo ao cadastrar a disciplina. A banca é definida só no cadastro do edital.
• Resumos: a foto original é guardada e só o mentor e o mentorado a veem.
• Fora do MVP: técnica Minority Report, upload de PDF com sorteio de questões e importação de dados externos.
Pontos em aberto
• Peso dos grupos: definir se só informa ou se influencia a ordem e a carga do ciclo.
• Estado "concluída" das abas de fase: ainda não aparece nas telas de exemplo, pois a disciplina desenhada está na Fase 1.
• Telas ainda por desenhar:
    ◦ Mentorado: tela Hoje, revisão noturna e mensal (galeria das fotos), questões por semana (acumulado e entre reuniões), cadastro com consentimento e perfil com exclusão de conta.
    ◦ Mentor: preparação da reunião, convites e cadastro do mentorado, configuração de tempos, histórico de edições, galeria de resumos e lançamento em lote da Fase 3.
• Dados de exemplo: nomes, datas e números das telas são fictícios; os nomes das disciplinas vêm da planilha.