import { describe, it, expect, beforeEach } from 'vitest';
import { initDb, dbHelper } from '../src/server/db/database.js';
import {
  hashPassword,
  verifyPassword,
  loginComSenha,
  solicitarMagicLink,
  validarMagicLinkToken,
  aceitarConviteMentorado,
  criarConvite,
  listarConvites,
  obterUsuarioPorSessao,
  encerrarSessao,
  MENTOR_DEFAULT_EMAIL,
  MENTOR_DEFAULT_SENHA,
} from '../src/server/services/authService.js';
import { runSeed } from '../src/server/db/seed.js';

describe('authService', () => {
  beforeEach(() => {
    initDb();
    runSeed();
  });

  it('gera e valida hashes de senha com salt usando scrypt', () => {
    const raw = 'MinhaSenhaSegura123!';
    const hash = hashPassword(raw);
    expect(hash).toContain(':');

    expect(verifyPassword(raw, hash)).toBe(true);
    expect(verifyPassword('SenhaErrada', hash)).toBe(false);
  });

  it('permite login do mentor com email padrao e senha oficial', () => {
    const res = loginComSenha(MENTOR_DEFAULT_EMAIL, MENTOR_DEFAULT_SENHA);
    expect(res.token).toBeDefined();
    expect(res.usuario.email.toLowerCase()).toBe(MENTOR_DEFAULT_EMAIL.toLowerCase());
    expect(res.usuario.papel).toBe('mentor');

    // Valida que a sessão foi registrada
    const userSessao = obterUsuarioPorSessao(res.token);
    expect(userSessao).toBeDefined();
    expect(userSessao?.papel).toBe('mentor');
  });

  it('rejeita login do mentor com senha incorreta', () => {
    expect(() => {
      loginComSenha(MENTOR_DEFAULT_EMAIL, 'SenhaInvalida');
    }).toThrow('Credenciais de mentor inválidas.');
  });

  it('permite login de mentorado pré-cadastrado com senha', () => {
    // Aluna Marina pré-cadastrada no seed
    const res = loginComSenha('marina@handshake.local', 'Aluno!123456');
    expect(res.token).toBeDefined();
    expect(res.usuario.papel).toBe('mentorado');
    expect(res.usuario.mentoradoId).toBeDefined();
  });

  it('mentor cria convite com magic link e aluno aceita definindo senha e consentimento LGPD', () => {
    const mentor = dbHelper.get<{ id: string }>(`SELECT id FROM usuario WHERE papel = 'mentor' LIMIT 1`);
    expect(mentor).toBeDefined();

    // 1. Mentor cria convite
    const emailNovo = 'carlos.oliveira@teste.com';
    const conviteRes = criarConvite(mentor!.id, {
      nome: 'Carlos Oliveira',
      email: emailNovo,
      fimMentoria: '2027-04-30',
      diaCorte: 3,
      editalId: 'edital_cgu',
    });

    expect(conviteRes.magicLink).toContain('/convite?token=');
    expect(conviteRes.convite.token).toBeDefined();

    // 2. Aluno valida o token do Magic Link
    const validacao = validarMagicLinkToken(conviteRes.convite.token);
    expect(validacao.tipo).toBe('convite');
    expect(validacao.convite?.email).toBe(emailNovo);
    expect(validacao.convite?.nome).toBe('Carlos Oliveira');

    // 3. Aluno tenta aceitar sem consentimento LGPD (deve falhar)
    expect(() => {
      aceitarConviteMentorado(conviteRes.convite.token, 'SenhaCarlos@123', false);
    }).toThrow('É necessário aceitar os termos de consentimento');

    // 4. Aluno aceita com consentimento e define senha
    const aceite = aceitarConviteMentorado(conviteRes.convite.token, 'SenhaCarlos@123', true);
    expect(aceite.token).toBeDefined();
    expect(aceite.usuario.papel).toBe('mentorado');
    expect(aceite.usuario.email).toBe(emailNovo);

    // 5. Aluno agora consegue fazer login diretamente com a senha que acabou de criar
    const loginDireto = loginComSenha(emailNovo, 'SenhaCarlos@123');
    expect(loginDireto.token).toBeDefined();
    expect(loginDireto.usuario.papel).toBe('mentorado');

    // 6. Logout invalida a sessão
    encerrarSessao(loginDireto.token);
    expect(obterUsuarioPorSessao(loginDireto.token)).toBeNull();
  });

  it('permite solicitar magic link por e-mail para mentorado cadastrado', () => {
    const res = solicitarMagicLink('marina@handshake.local');
    expect(res.ok).toBe(true);
    expect(res.magicLink).toContain('/entrar?token=');

    // Validação do token de login direto
    const token = res.magicLink.split('token=')[1];
    const validacao = validarMagicLinkToken(token);
    expect(validacao.tipo).toBe('login');
    expect(validacao.usuario?.email).toBe('marina@handshake.local');
  });

  it('lista convites do mentor com status e magic links', () => {
    const mentor = dbHelper.get<{ id: string }>(`SELECT id FROM usuario WHERE papel = 'mentor' LIMIT 1`);
    criarConvite(mentor!.id, {
      nome: 'Aluno Teste Lista',
      email: 'teste.lista@exemplo.com',
      fimMentoria: '2027-04-30',
      diaCorte: 2,
    });

    const lista = listarConvites(mentor!.id);
    expect(lista.length).toBeGreaterThanOrEqual(1);
    expect(lista[0].status).toBe('pendente');
    expect(lista[0].magicLink).toBeDefined();
  });
});
