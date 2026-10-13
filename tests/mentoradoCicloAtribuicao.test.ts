import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import { Server } from 'http';
import { initDb, dbHelper } from '../src/server/db/database.js';
import { runSeed } from '../src/server/db/seed.js';
import { apiRouter } from '../src/server/routes/api.js';

describe('Atribuição de Edital e Montagem de Ciclo pelo Mentor (Desacoplado de Marina)', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', apiRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}/api`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    initDb();
    runSeed();
  });

  it('retorna matricula nula e cicloAtivo nulo para mentorado sem edital inicial (Rafael)', async () => {
    const res = await fetch(`${baseUrl}/mentorados/ment_rafael`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.mentorado.nome).toBe('Rafael S.');
    expect(data.matricula).toBeNull();
    expect(data.cicloAtivo).toBeNull();
  });

  it('permite ao mentor atribuir edital ao mentorado e audita a operacao', async () => {
    // 1. Atribui edital CGU para Rafael
    const atribRes = await fetch(`${baseUrl}/matriculas/atribuir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mentoradoId: 'ment_rafael',
        editalId: 'edital_cgu',
        mentorId: 'usr_mentor_gleyson',
      }),
    });

    expect(atribRes.status).toBe(201);
    const atribData = await atribRes.json();
    expect(atribData.ok).toBe(true);
    expect(atribData.matriculaId).toBeDefined();

    const matriculaId = atribData.matriculaId;

    // 2. Consulta novamente Rafael
    const res = await fetch(`${baseUrl}/mentorados/ment_rafael`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.matricula).toBeDefined();
    expect(data.matricula.id).toBe(matriculaId);
    expect(data.matricula.edital_nome).toBe('Concurso CGU');
    expect(data.cicloAtivo).toBeNull(); // Sem ciclo publicado ainda

    // 3. Verifica auditoria
    const audit = dbHelper.get<{ entidade: string; valor_novo: string }>(
      `SELECT * FROM auditoria WHERE mentorado_id = ? AND entidade = 'matricula' ORDER BY id DESC LIMIT 1`,
      'ment_rafael'
    );
    expect(audit).toBeDefined();
    expect(audit?.valor_novo).toBe('Concurso CGU');
  });

  it('sugere ciclo dinamicamente com nome do aluno e numero do ciclo corretos', async () => {
    // Atribui edital a Rafael
    const atribRes = await fetch(`${baseUrl}/matriculas/atribuir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mentoradoId: 'ment_rafael',
        editalId: 'edital_cgu',
        mentorId: 'usr_mentor_gleyson',
      }),
    });
    const atribData = await atribRes.json();
    const matriculaId = atribData.matriculaId;

    // Sugere ciclo para a matrícula de Rafael
    const sugerirRes = await fetch(`${baseUrl}/ciclos/sugerir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matriculaId,
        slotsPorDia: 3,
        duracaoDias: 30,
      }),
    });

    expect(sugerirRes.status).toBe(200);
    const sugerirData = await sugerirRes.json();
    expect(sugerirData.mentoradoNome).toBe('Rafael S.');
    expect(sugerirData.cicloNumero).toBe(1);
    expect(sugerirData.editalNome).toBe('Concurso CGU');
    expect(sugerirData.slotsSequencia.length).toBeGreaterThan(0);
  });

  it('publica ciclo para o aluno e atualiza a visao de ciclo ativo e listagem do mentor', async () => {
    // Atribui edital a Rafael
    const atribRes = await fetch(`${baseUrl}/matriculas/atribuir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mentoradoId: 'ment_rafael',
        editalId: 'edital_cgu',
        mentorId: 'usr_mentor_gleyson',
      }),
    });
    const atribData = await atribRes.json();
    const matriculaId = atribData.matriculaId;

    // Publica o ciclo 1 para Rafael
    const slots = [
      { disciplina_id: 'disc_estado', disciplina_nome: 'Estado e Sociedade', tipo: 'decoreba', ordem: 1 },
      { disciplina_id: 'disc_evidencias', disciplina_nome: 'Evidências e Pesquisa', tipo: 'raciocinio', ordem: 2 },
      { disciplina_id: 'disc_transparencia', disciplina_nome: 'Transparência Pública', tipo: 'decoreba', ordem: 3 },
    ];

    const pubRes = await fetch(`${baseUrl}/ciclos/publicar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matriculaId,
        inicio: '2026-11-01',
        duracaoDias: 30,
        slotsPorDia: 3,
        slots,
      }),
    });

    expect(pubRes.status).toBe(201);
    const pubData = await pubRes.json();
    expect(pubData.ok).toBe(true);
    expect(pubData.numero).toBe(1);

    // Consulta perfil do Rafael: agora cicloAtivo está presente!
    const resRafael = await fetch(`${baseUrl}/mentorados/ment_rafael`);
    const dataRafael = await resRafael.json();
    expect(dataRafael.cicloAtivo).toBeDefined();
    expect(dataRafael.cicloAtivo.numero).toBe(1);
    expect(dataRafael.cicloAtivo.slots_por_dia).toBe(3);

    // Consulta listagem /api/mentor/matriculas: deve conter Marina e Rafael
    const listaRes = await fetch(`${baseUrl}/mentor/matriculas`);
    expect(listaRes.status).toBe(200);
    const listaData = await listaRes.json();
    const rafaelItem = listaData.find((item: any) => item.mentorado_id === 'ment_rafael');
    expect(rafaelItem).toBeDefined();
    expect(rafaelItem.mentorado_nome).toBe('Rafael S.');
    expect(rafaelItem.ciclo_numero).toBe(1);

    const marinaItem = listaData.find((item: any) => item.mentorado_id === 'ment_marina');
    expect(marinaItem).toBeDefined();
    expect(marinaItem.mentorado_nome).toBe('Marina R.');
  });
});
