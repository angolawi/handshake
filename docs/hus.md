Histórias de Usuário — Plataforma de Estudos (MVP)
Oct 10, 2026 · @Willian de Santana
Convenções e personas
O MVP reúne 39 histórias em cinco módulos (M1 a M5), numeradas na ordem em que devem ser construídas.
Formato de cada história: "Como [persona], quero [ação], para [objetivo]", seguida dos critérios de aceite. O esforço (P, M ou G) é uma estimativa relativa, para planejar a ordem, não um prazo.
Personas
• Mentor: monta editais e ciclos, convida mentorados, acompanha e corrige o preenchimento.
• Mentorado: estuda, registra sessões, faz as revisões. Tem um único mentor.
• Sistema: regras automáticas, rotinas agendadas e notificações.
Definição de pronto (vale para todas)
• Critérios de aceite atendidos e a regra de negócio coberta por teste automatizado.
• Funciona no celular e na web.
• Toda edição do mentor em dado do mentorado gera registro de auditoria.
• Nenhum dado pessoal ou foto aparece em log.
Fora do MVP (v2): técnica Minority Report, upload de PDF com sorteio de questões, importação de dados externos, modo recordar nas revisões e armazenamento frio das fotos.
M1 — Fundação
O M1 entrega acesso, vínculo mentor-mentorado, configuração de tempos, auditoria e exclusão de conta; nada dos módulos seguintes funciona sem ele.
HU-1.1 — Convidar mentorado (esforço M)
Como mentor, quero convidar um mentorado por e-mail, para vinculá-lo à minha mentoria.
• Informo nome, e-mail, data de fim da mentoria e dia de corte semanal (dia da reunião).
• O convite gera um link com token que expira.
• Um e-mail já vinculado a outro mentor não pode ser convidado.
HU-1.2 — Aceitar convite e dar consentimento (esforço M)
Como mentorado, quero criar minha conta pelo convite e aceitar a política de privacidade, para começar a usar a plataforma.
• Antes de concluir o cadastro, vejo a política de privacidade e registro o consentimento com data e hora.
• Ao aceitar, fico vinculado somente ao mentor que convidou.
• Convite expirado ou já usado mostra mensagem clara e não cria conta.
HU-1.3 — Entrar e acessar só o que é meu (esforço M)
Como usuário, quero entrar com e-mail e senha, para acessar apenas os dados do meu papel.
• O mentorado vê somente os próprios dados.
• O mentor vê somente os dados dos mentorados vinculados a ele.
• Sessão expira por inatividade e há recuperação de senha.
HU-1.4 — Configurar tempos do mentorado (esforço P)
Como mentor, quero ajustar as durações das etapas de um mentorado, para adaptar a rotina a ele.
• O padrão da plataforma é 45 min de estudo, 10 de teste e 5 de recorde na Fase 1; cada fase tem seus tempos e o cooldown também é configurável.
• O ajuste vale por mentorado e só é gravado quando difere do padrão.
• Campo vazio significa usar o padrão.
HU-1.5 — Auditar edições do mentor (esforço M)
Como mentorado, quero que toda correção feita pelo mentor fique registrada, para saber o que mudou.
• O registro guarda autor, data e hora, entidade, campo, valor anterior e valor novo.
• Vale para qualquer edição do mentor em dados do mentorado.
• O mentorado consegue consultar o histórico das alterações nos próprios dados.
HU-1.6 — Excluir minha conta (esforço G)
Como mentorado, quero solicitar a exclusão da minha conta, para exercer meus direitos pela LGPD.
• Meu histórico e minhas fotos são removidos no prazo definido pelo jurídico, conforme a LGPD.
• Registros de auditoria que me citam ficam anonimizados, não apagados.
• Cópias de segurança expiram dentro desse mesmo prazo.
HU-1.7 — Excluir conta do mentor (esforço M)
Como mentor, quero poder excluir minha conta com ciência do efeito, para encerrar minha atuação.
• Antes de confirmar, vejo o aviso de que as fotos dos meus mentorados serão apagadas.
• A exclusão apaga as fotos por cascata.
• O destino do histórico dos mentorados após a exclusão precisa ser definido (pergunta aberta).
M2 — Editais
O M2 permite montar um edital base uma vez e reaproveitá-lo para vários mentorados, com estrutura estável e atualizações que chegam a todos.
HU-2.1 — Criar edital base (esforço M)
Como mentor, quero criar um edital base com nome e banca, para não montar a planilha de cada mentorado do zero.
• O edital tem nome, banca (CEBRASPE, FGV ou outra) e versão.
• O mentor cria os grupos do edital (por exemplo, básicas, complementares e específicas), cada um com nome, número de questões na prova e peso. Pode renomear, reordenar e excluir grupos que não tenham disciplinas.
• Cada disciplina pertence a um único grupo, escolhido numa lista no cadastro da disciplina, com a opção de criar um grupo novo na hora.
• O peso do grupo é informado nesta etapa; seu uso no ciclo ainda será definido.
• O edital pertence ao mentor que o criou.
HU-2.2 — Gerar a estrutura a partir do texto do edital (esforço G)
Como mentor, quero colar o texto de uma disciplina no padrão CEBRASPE ou FGV, para obter tópicos e subtópicos automaticamente.
• O formato reconhecido é "NOME DA DISCIPLINA: 1 Tópico. 1.1 Subtópico. 1.1.1 Subtópico do subtópico".
• A numeração define a hierarquia (pai e filhos).
• Quebras de linha e palavras coladas (por exemplo, "daTransparência") não impedem a leitura; o que não for reconhecido é sinalizado.
HU-2.3 — Pré-visualizar e corrigir antes de salvar (esforço M)
Como mentor, quero ver a árvore gerada e corrigi-la, para garantir que o edital está certo.
• A pré-visualização mostra a hierarquia completa e permite editar texto, numeração e posição de cada item.
• Nada é salvo até eu confirmar.
• Posso colar o texto de várias disciplinas em sequência.
HU-2.4 — Classificar a disciplina (esforço P)
Como mentor, quero marcar cada disciplina como decoreba ou raciocínio, para que o ciclo alterne a carga cognitiva.
• A classificação é única: nunca as duas ao mesmo tempo.
• Disciplina sem classificação não entra em ciclo.
• Ao cadastrar a disciplina, o mentor escolhe o grupo e o tipo; a banca vem do edital e não é pedida de novo.
HU-2.5 — Editar o edital preservando identidade (esforço M)
Como mentor, quero alterar um edital já em uso, para refletir retificações sem perder o progresso dos alunos.
• Cada tópico mantém o mesmo identificador ao ser renomeado ou renumerado.
• Tópico removido é arquivado, nunca apagado, e seu identificador não é reutilizado.
• Cada alteração incrementa a versão do edital.
HU-2.6 — Propagar a nova versão aos mentorados (esforço M)
Como mentorado, quero receber a versão atualizada do edital, para estudar o conteúdo vigente.
• Todos os mentorados com o edital atribuído passam a ver a versão nova.
• Datas e questões já registradas continuam ligadas aos mesmos tópicos.
• Tópicos arquivados continuam consultáveis no histórico, mas saem das listas de estudo.
HU-2.7 — Atribuir e remover edital de um mentorado (esforço P)
Como mentor, quero atribuir ou remover editais de um mentorado, para controlar o que ele estuda.
• Somente o mentor pode atribuir ou remover; o mentorado não vê essa ação.
• Um mentorado pode ter mais de um edital, pois o mentor gerencia vários concursos.
• Remover não apaga o histórico de estudo.
HU-2.8 — Ver o edital com o estado das disciplinas (esforço M)
Como mentorado, quero ver as disciplinas do meu edital com a fase de cada uma, para saber onde estou.
• A lista agrupa as disciplinas por grupo do edital e mostra se são decoreba ou raciocínio.
• O nome da disciplina é colorido pela fase: sem cor na Fase 1, laranja na Fase 2, vermelho na Fase 3.
• Mostra quais disciplinas estão no ciclo atual.
M3 — Ciclos e sessão de estudo
O M3 é o coração do produto e concentra o maior risco técnico: cronômetro confiável em segundo plano e fechamento automático da sessão.
HU-3.1 — Sugerir um ciclo (esforço M)
Como mentor, quero que o sistema sugira um ciclo, para não montá-lo manualmente.
• Parâmetros: edital, número de slots por dia e duração (30 dias por padrão).
• A sugestão alterna disciplinas decoreba e raciocínio.
• No fim do ciclo, a sequência recomeça pela primeira disciplina.
HU-3.2 — Ajustar o ciclo manualmente (esforço M)
Como mentor, quero reordenar e trocar disciplinas da sugestão, para refletir meu planejamento.
• Posso mover, trocar e remover slots.
• Se duas disciplinas do mesmo tipo ficarem em sequência, vejo um aviso, mas posso manter.
• Cada slot dura uma hora, como no ciclo da planilha.
HU-3.3 — Publicar o ciclo e guardar o histórico (esforço M)
Como mentorado, quero ver o ciclo vigente e os anteriores, para acompanhar minha evolução.
• O ciclo publicado aparece para o mentorado com número e data de início.
• Ciclos anteriores ficam consultáveis, com as disciplinas de cada um.
• Só o mentor publica e altera ciclos.
HU-3.4 — Iniciar uma sessão (esforço M)
Como mentorado, quero iniciar a sessão do slot do dia, para estudar com o roteiro da fase.
• Escolho o tópico (ou subtópico) folha que vou estudar.
• Vejo um lembrete curto de como executar a fase atual da disciplina.
• Ao voltar a uma disciplina, a sessão sugere começar revisando os resumos da vez anterior.
HU-3.5 — Cronometrar por etapa (esforço G)
Como mentorado, quero um cronômetro que conduza as etapas da fase, para seguir a metodologia sem pensar no relógio.
• Fase 1: estudo, teste, recorde e descanso. Fase 2: revisão, aplicação, revisão e descanso. Fase 3: aplicação, revisão e descanso.
• Os tempos vêm do padrão ou do ajuste do mentorado e ficam copiados na sessão.
• Um alerta sonoro e visual marca o fim de cada etapa.
HU-3.6 — Pausar, retomar e sobreviver ao segundo plano (esforço G)
Como mentorado, quero pausar e sair do aplicativo sem perder a sessão, para estudar sem medo de perder o tempo.
• O tempo é calculado por horários de início e fim, não por contagem na tela.
• Com o app em segundo plano ou fechado, ao voltar o cronômetro mostra o tempo correto.
• Sessão sem retorno por muito tempo fica como interrompida e posso retomá-la ou descartá-la.
HU-3.7 — Enviar a foto do resumo (esforço M)
Como mentorado, quero fotografar meu resumo manuscrito, para registrar que produzi o material.
• Na Fase 1, ao menos uma foto é obrigatória para concluir a sessão; nas Fases 2 e 3 é opcional.
• A foto é reduzida no próprio aparelho antes do envio (lado maior em torno de 1600 px, qualidade em torno de 80%).
• No envio, vejo o aviso para não fotografar documentos pessoais.
HU-3.8 — Registrar as questões do teste (esforço P)
Como mentorado, quero informar quantas questões resolvi e quantas acertei, para alimentar meu desempenho.
• Digito as quantidades certas e resolvidas em campos de texto; certas não podem superar resolvidas.
• Cada registro é um lançamento com data, tópico e fase. Ele vem da sessão (automático ao encerrar) ou é digitado manualmente ao tocar no tópico.
• O total do tópico é a soma dos lançamentos e nunca é digitado; o mentorado só lança na fase atual da disciplina.
• Posso registrar zero questões, mas o sistema mostra a pergunta antes de encerrar.
HU-3.9 — Encerrar a sessão com preenchimento automático (esforço G)
Como mentorado, quero que ao encerrar a sessão o sistema preencha meu controle, para não repetir dados.
• A data de início do tópico na fase é gravada na primeira sessão; as questões entram no acumulado.
• A célula do slot é marcada no Controle (a cor segue a HU-4.1).
• A sessão encerrada não pode ser alterada pelo mentorado, só pelo mentor, com auditoria.
HU-3.10 — Marcar o tópico como concluído na fase (esforço P)
Como mentorado, quero indicar que concluí o tópico na fase, para que a data de conclusão seja gravada.
• Ao encerrar a sessão, escolho entre "concluí o tópico" e "continuo depois".
• Concluir grava a data de fim; continuar mantém o tópico aberto.
• Tópico com subtópicos é concluído por agregação, nunca marcado diretamente.
M4 — Acompanhamento
O M4 substitui as abas Controle, Disciplinas e Questões da planilha, com dados derivados das sessões em vez de digitados.
HU-4.1 — Preencher o Controle com a cor da rodada (esforço M)
Como mentorado, quero escolher uma cor para a rodada do ciclo, para ver meu progresso visualmente.
• A paleta tem 10 cores fixas.
• Ao concluir a primeira sessão da rodada, escolho a cor; as demais células dessa rodada usam a mesma cor e não podem ter outra.
• Ao começar uma nova rodada (nova volta no ciclo), posso escolher outra cor.
HU-4.2 — Ver o Controle do ciclo (esforço M)
Como mentorado, quero ver a grade do ciclo com os dias e as disciplinas, para acompanhar o que já fiz.
• A grade segue da esquerda para a direita e continua na linha de baixo; ao fim do ciclo, recomeça pela primeira disciplina.
• Cada célula mostra o dia, a disciplina e a cor, quando estudada.
• Há linhas para a revisão noturna e a revisão mensal.
HU-4.3 — Acompanhar a disciplina por tópico (esforço G)
Como mentorado, quero ver a árvore de tópicos de uma disciplina com datas e questões por fase, para saber o que falta.
• A tela mostra uma fase por vez; cada tópico exibe início, conclusão, questões certas e resolvidas e a porcentagem daquela fase.
• Uma faixa no topo da tabela mostra o nome da disciplina e o total de questões da fase, calculado pela soma dos tópicos.
• Só tópicos sem filhos recebem dados; os tópicos pais agregam os números dos filhos.
• Um tópico pai conta como cumprido quando todos os filhos têm início, conclusão e questões.
• A disciplina abre na sua fase atual. As abas têm três estados: concluída (somente consulta), atual (editável) e futura (bloqueada).
• O mentorado só registra questões e datas na fase atual. As fases concluídas ficam somente para leitura, e as correções são feitas pelo mentor, com auditoria.
HU-4.4 — Avançar a fase da disciplina automaticamente (esforço M)
Como mentorado, quero que a disciplina avance de fase sozinha, para não controlar isso à mão.
• A disciplina vai para a fase seguinte quando todos os tópicos folha estiverem concluídos na fase atual.
• A mudança atualiza a cor da disciplina no edital e o roteiro mostrado nas sessões.
• O mentorado e o mentor recebem uma notificação da mudança.
• As fases seguintes ficam bloqueadas para o mentorado até o avanço automático; só o mentor pode liberá-las antes (HU-4.5).
• Um tópico novo, adicionado ao edital numa disciplina que já avançou de fase, entra na Fase 1 e gera um aviso de tópico pendente nessa aba, sem fazer a disciplina voltar de fase.
HU-4.5 — Forçar a fase pelo mentor (esforço P)
Como mentor, quero alterar manualmente a fase de uma disciplina, para tratar casos especiais.
• Posso avançar ou voltar a fase, mesmo sem todos os tópicos concluídos.
• A ação registra quem fez o ajuste e quando, e entra na auditoria.
HU-4.6 — Ver as questões acumuladas por semana (esforço M)
Como mentor, quero ver o total de questões por disciplina até cada data de corte, para preparar a reunião semanal.
• O corte semanal é o dia configurado para o mentorado (dia da reunião).
• Os totais acumulam: a semana 2 inclui a semana 1.
• Os números são calculados a partir das sessões, nunca digitados, e respeitam a data correta de cada sessão.
• Edição retroativa recalcula as semanas afetadas.
HU-4.7 — Corrigir o preenchimento do mentorado (esforço M)
Como mentor, quero editar datas, questões e células do Controle de um mentorado, para corrigir erros.
• Posso alterar qualquer dado de estudo do meu mentorado.
• Cada alteração aparece na auditoria da HU-1.5.
• Totais, fases e questões semanais se recalculam depois da correção.
M5 — Revisões e mentoria
O M5 transforma as fotos dos resumos em revisões prontas e dá ao mentor ferramentas de feedback e acompanhamento.
HU-5.1 — Fazer a revisão noturna (esforço M)
Como mentorado, quero abrir antes de dormir os resumos do dia, para revisar sem reunir nada à mão.
• A tela reúne as fotos das sessões do dia, agrupadas por disciplina e tópico.
• Posso marcar a revisão como feita, o que atualiza a linha de revisão noturna do Controle.
• Dia sem sessão não gera tarefa.
HU-5.2 — Rever os resumos ao voltar à disciplina (esforço P)
Como mentorado, quero ver os resumos da última vez ao iniciar uma disciplina, para começar recordando.
• Ao iniciar a sessão, o sistema mostra as fotos da passagem anterior daquela disciplina no ciclo.
• Se não houver passagem anterior, a etapa é ignorada.
HU-5.3 — Fazer a revisão mensal (esforço M)
Como mentorado, quero receber reunidos os resumos do mês anterior, para fazer a revisão no primeiro fim de semana do mês.
• A compilação agrupa as fotos do mês anterior por disciplina e tópico.
• Posso exportá-la em PDF e marcar a revisão como feita.
• A tarefa aparece no primeiro fim de semana do mês.
HU-5.4 — Receber lembretes (esforço M)
Como mentorado, quero ser lembrado das revisões, para não esquecer nenhuma.
• Lembretes para a revisão noturna e a revisão mensal, por notificação no celular e na web.
• Posso escolher o horário do lembrete noturno.
• Tarefa concluída cancela o lembrete.
HU-5.5 — Comentar os resumos do mentorado (esforço M)
Como mentor, quero comentar as fotos dos resumos, para orientar a construção do material.
• Só o mentor e o mentorado vinculado veem as fotos e os comentários.
• O mentorado vê os comentários e é avisado de novos.
• Comentários ficam ligados à foto e à sessão.
HU-5.6 — Apagar as fotos ao fim do prazo (esforço M)
Como sistema, quero apagar as fotos quando a retenção terminar, para cumprir a LGPD.
• O prazo é o fim da mentoria definido no cadastro do mentorado.
• Uma rotina agendada apaga o arquivo e registra a exclusão, sem guardar o conteúdo.
• Alterar o fim da mentoria atualiza o prazo das fotos existentes.
HU-5.7 — Acompanhar a aderência dos mentorados (esforço G)
Como mentor, quero um painel com a aderência de cada mentorado, para saber quem precisa de apoio.
• Mostra dias com sessão concluída, sessões concluídas contra as planejadas, revisões noturnas e mensais feitas e resumos registrados na Fase 1.
• Mostra tópicos cumpridos por ciclo e questões por semana com a taxa de acerto.
• Lista mentorados sem sessão há vários dias, com um limite que o mentor configura.
Requisitos transversais
Estes requisitos valem para todas as histórias e devem ser verificados em cada entrega.
Tema
Requisito
Plataforma
Web responsiva e mobile (PWA é o caminho mais barato para os dois)
LGPD
Consentimento no cadastro, política de privacidade, exclusão de conta no prazo legal, acesso às fotos só para mentor e mentorado vinculados
Fotos
Compressão no aparelho (lado maior ~1600 px, qualidade ~80%), estimativa de ~4,5 GB por mês para 50 mentorados no teto de uso
Retenção
Fotos apagadas no fim da mentoria, na exclusão da conta do mentor e na do mentorado
Auditoria
Toda edição do mentor em dado do mentorado, com valor anterior
Fuso horário
Cortes semanais e revisões usam o fuso do mentorado
Cronômetro
Cálculo por horários, resistente a segundo plano e interrupção
Desempenho
Telas de acompanhamento carregam rápido com 50 mentorados e ciclos de 30 dias
Métricas de sucesso do produto
• Porcentagem de dias do ciclo com ao menos uma sessão concluída.
• Porcentagem de sessões planejadas que foram concluídas.
• Porcentagem de revisões noturnas e mensais feitas.
• Porcentagem de sessões da Fase 1 com resumo registrado (meta próxima de 100%).
• Tempo do mentor para montar edital e ciclo, antes e depois da plataforma.
• Número de correções manuais do mentor por aluno, como medida da qualidade da automação.
• Alunos ativos por semana e sessões abandonadas no cronômetro.
Ordem de implementação sugerida
Construa na ordem M1, M2, M3, M4, M5: cada módulo depende dos anteriores, e o ponto de maior risco (HU-3.5, 3.6 e 3.9) deve ser validado cedo.
1. M1 — Fundação (HU-1.1 a 1.7): acesso, vínculo, auditoria e exclusão de conta. As HU-1.6 e 1.7 podem ficar para o fim do módulo.
2. M2 — Editais (HU-2.1 a 2.8): pode começar em paralelo ao fim do M1, pois só precisa de login e papéis. O parser (HU-2.2) é o item mais incerto; valide-o com editais reais cedo.
3. M3 — Ciclos e sessão (HU-3.1 a 3.10): depende de M1 e M2. Comece pelo cronômetro com segundo plano (HU-3.5 e 3.6) em um protótipo, antes das demais histórias do módulo.
4. M4 — Acompanhamento (HU-4.1 a 4.7): depende das sessões do M3. A HU-4.1 pode ser entregue junto da HU-3.9, pois o fechamento da sessão marca a célula do Controle.
5. M5 — Revisões e mentoria (HU-5.1 a 5.7): depende das fotos do M3. A rotina de apagamento (HU-5.6) deve existir antes de colocar mentorados reais em uso.
Marco de uso real: ao fim do M4 já é possível rodar a mentoria com um grupo pequeno, com revisões ainda feitas à mão; o M5 elimina esse trabalho manual.