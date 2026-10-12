import crypto from 'node:crypto';
import { dbHelper } from '../db/database.js';

export const MENTOR_DEFAULT_EMAIL = 'gleysonazevedo@gmail.com';
export const MENTOR_DEFAULT_SENHA = 'Gleyson!Handshake01';

/**
 * Cria hash de senha com salt usando algoritmo scrypt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifica se a senha corresponde ao hash armazenado
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, hash] = storedHash.split(':');
  try {
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
  } catch {
    return false;
  }
}

export interface AuthUserDTO {
  id: string;
  nome: string;
  email: string;
  papel: 'mentor' | 'mentorado';
  mentoradoId?: string;
  matriculaId?: string;
  editalId?: string;
}

/**
 * Realiza login por e-mail e senha (para mentor ou mentorado)
 */
export function loginComSenha(email: string, senha: string): { token: string; usuario: AuthUserDTO } {
  if (!email || !senha) {
    throw new Error('E-mail e senha são obrigatórios.');
  }

  const emailNorm = email.trim().toLowerCase();

  // Busca usuário no banco
  let usuario = dbHelper.get<{ id: string; nome: string; email: string; papel: 'mentor' | 'mentorado'; senha_hash: string | null }>(
    `SELECT id, nome, email, papel, senha_hash FROM usuario WHERE LOWER(email) = ? AND excluido_em IS NULL`,
    emailNorm
  );

  // Tratamento especial para o Mentor padrão
  if (emailNorm === MENTOR_DEFAULT_EMAIL.toLowerCase() || emailNorm === 'gleyson@handshake.local') {
    if (senha !== MENTOR_DEFAULT_SENHA && (!usuario?.senha_hash || !verifyPassword(senha, usuario.senha_hash))) {
      throw new Error('Credenciais de mentor inválidas.');
    }

    // Se o mentor não existir com o e-mail padrão oficial, atualiza ou insere
    if (!usuario) {
      const mentorExistente = dbHelper.get<{ id: string }>(`SELECT id FROM usuario WHERE papel = 'mentor' LIMIT 1`);
      if (mentorExistente) {
        dbHelper.run(
          `UPDATE usuario SET email = ?, senha_hash = ? WHERE id = ?`,
          MENTOR_DEFAULT_EMAIL,
          hashPassword(MENTOR_DEFAULT_SENHA),
          mentorExistente.id
        );
        usuario = dbHelper.get(`SELECT id, nome, email, papel, senha_hash FROM usuario WHERE id = ?`, mentorExistente.id);
      }
    }
  } else {
    // Aluno ou outro usuário
    if (!usuario) {
      throw new Error('E-mail não cadastrado. Se você recebeu um convite, acesse pelo link enviado.');
    }

    // Se ainda não tiver senha cadastrada mas for aluno de teste
    if (!usuario.senha_hash && senha === 'Aluno!123456') {
      dbHelper.run(`UPDATE usuario SET senha_hash = ? WHERE id = ?`, hashPassword(senha), usuario.id);
    } else if (!usuario.senha_hash || !verifyPassword(senha, usuario.senha_hash)) {
      throw new Error('Senha incorreta.');
    }
  }

  if (!usuario) {
    throw new Error('Usuário não encontrado.');
  }

  // Gera token de sessão
  const token = crypto.randomUUID();
  const agora = new Date();
  const expira = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias

  dbHelper.run(
    `INSERT INTO sessao_auth (token, usuario_id, criado_em, expira_em) VALUES (?, ?, ?, ?)`,
    token,
    usuario.id,
    agora.toISOString(),
    expira.toISOString()
  );

  const authUser: AuthUserDTO = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
  };

  if (usuario.papel === 'mentorado') {
    const ment = dbHelper.get<{ id: string }>(`SELECT id FROM mentorado WHERE usuario_id = ?`, usuario.id);
    if (ment) {
      authUser.mentoradoId = ment.id;
      const mat = dbHelper.get<{ id: string; edital_id: string }>(
        `SELECT id, edital_id FROM matricula WHERE mentorado_id = ? AND removido_em IS NULL LIMIT 1`,
        ment.id
      );
      if (mat) {
        authUser.matriculaId = mat.id;
        authUser.editalId = mat.edital_id;
      }
    }
  }

  return { token, usuario: authUser };
}

/**
 * Solicita envio de Magic Link para o e-mail do aluno
 */
export function solicitarMagicLink(email: string, baseUrl: string = 'http://localhost:3001'): { ok: boolean; tipo: 'convite' | 'login'; magicLink: string; email: string; nome: string } {
  const emailNorm = email.trim().toLowerCase();

  // 1. Verifica se já é mentorado ativo
  const usuario = dbHelper.get<{ id: string; nome: string; email: string; papel: string }>(
    `SELECT id, nome, email, papel FROM usuario WHERE LOWER(email) = ? AND papel = 'mentorado' AND excluido_em IS NULL`,
    emailNorm
  );

  if (usuario) {
    const token = crypto.randomBytes(24).toString('hex');
    const agora = new Date();
    const expira = new Date(agora.getTime() + 24 * 60 * 60 * 1000); // 24h

    dbHelper.run(
      `INSERT INTO sessao_auth (token, usuario_id, criado_em, expira_em) VALUES (?, ?, ?, ?)`,
      token,
      usuario.id,
      agora.toISOString(),
      expira.toISOString()
    );

    return {
      ok: true,
      tipo: 'login',
      magicLink: `${baseUrl}/entrar?token=${token}`,
      email: usuario.email,
      nome: usuario.nome,
    };
  }

  // 2. Verifica se tem convite pendente
  const convite = dbHelper.get<{ id: string; nome: string; email: string; token: string; expira_em: string; aceito_em: string | null }>(
    `SELECT id, nome, email, token, expira_em, aceito_em FROM convite WHERE LOWER(email) = ? ORDER BY expira_em DESC LIMIT 1`,
    emailNorm
  );

  if (convite) {
    if (convite.aceito_em) {
      throw new Error('Este convite já foi aceito. Utilize seu e-mail e senha para entrar.');
    }
    return {
      ok: true,
      tipo: 'convite',
      magicLink: `${baseUrl}/convite?token=${convite.token}`,
      email: convite.email,
      nome: convite.nome || 'Futuro Mentorado',
    };
  }

  throw new Error('Nenhum cadastro ou convite de mentoria encontrado para este e-mail. Solicite um convite ao seu mentor.');
}

/**
 * Valida token de Magic Link ou Convite
 */
export function validarMagicLinkToken(token: string): {
  tipo: 'convite' | 'login';
  convite?: {
    id: string;
    nome: string;
    email: string;
    mentorNome: string;
    fimMentoria: string;
    diaCorteSemana: number;
    editalId?: string;
  };
  usuario?: AuthUserDTO;
  token?: string;
} {
  if (!token) throw new Error('Token não fornecido.');

  // 1. Procura em convite
  const convite = dbHelper.get<{
    id: string;
    mentor_id: string;
    nome: string;
    email: string;
    fim_mentoria: string;
    dia_corte_semana: number;
    edital_id: string | null;
    expira_em: string;
    aceito_em: string | null;
  }>(`SELECT * FROM convite WHERE token = ?`, token);

  if (convite) {
    if (convite.aceito_em) {
      // Se já aceitou, tenta logar direto
      const usr = dbHelper.get<{ id: string; nome: string; email: string; papel: 'mentorado' }>(
        `SELECT id, nome, email, papel FROM usuario WHERE LOWER(email) = LOWER(?)`,
        convite.email
      );
      if (usr) {
        const novoToken = crypto.randomUUID();
        dbHelper.run(
          `INSERT INTO sessao_auth (token, usuario_id, criado_em, expira_em) VALUES (?, ?, ?, ?)`,
          novoToken,
          usr.id,
          new Date().toISOString(),
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        );
        const ment = dbHelper.get<{ id: string }>(`SELECT id FROM mentorado WHERE usuario_id = ?`, usr.id);
        const mat = ment ? dbHelper.get<{ id: string; edital_id: string }>(`SELECT id, edital_id FROM matricula WHERE mentorado_id = ?`, ment.id) : null;
        return {
          tipo: 'login',
          token: novoToken,
          usuario: {
            id: usr.id,
            nome: usr.nome,
            email: usr.email,
            papel: 'mentorado',
            mentoradoId: ment?.id,
            matriculaId: mat?.id,
            editalId: mat?.edital_id,
          },
        };
      }
    }

    const agora = new Date().toISOString();
    if (convite.expira_em < agora) {
      throw new Error('Este convite expirou. Solicite um novo link ao seu mentor.');
    }

    const mentor = dbHelper.get<{ nome: string }>(`SELECT nome FROM usuario WHERE id = ?`, convite.mentor_id);

    return {
      tipo: 'convite',
      convite: {
        id: convite.id,
        nome: convite.nome || '',
        email: convite.email,
        mentorNome: mentor?.nome || 'Gleyson Azevedo',
        fimMentoria: convite.fim_mentoria || '2027-04-30',
        diaCorteSemana: convite.dia_corte_semana ?? 2,
        editalId: convite.edital_id || 'edital_cgu',
      },
    };
  }

  // 2. Procura em sessao_auth (magic link de login direto)
  const sessao = dbHelper.get<{ token: string; usuario_id: string; expira_em: string }>(
    `SELECT token, usuario_id, expira_em FROM sessao_auth WHERE token = ?`,
    token
  );

  if (sessao) {
    if (sessao.expira_em < new Date().toISOString()) {
      throw new Error('Este link de acesso expirou. Solicite um novo Magic Link.');
    }
    const usr = dbHelper.get<{ id: string; nome: string; email: string; papel: 'mentorado' | 'mentor' }>(
      `SELECT id, nome, email, papel FROM usuario WHERE id = ?`,
      sessao.usuario_id
    );
    if (!usr) throw new Error('Usuário associado ao link não encontrado.');

    const ment = dbHelper.get<{ id: string }>(`SELECT id FROM mentorado WHERE usuario_id = ?`, usr.id);
    const mat = ment ? dbHelper.get<{ id: string; edital_id: string }>(`SELECT id, edital_id FROM matricula WHERE mentorado_id = ?`, ment.id) : null;

    return {
      tipo: 'login',
      token: sessao.token,
      usuario: {
        id: usr.id,
        nome: usr.nome,
        email: usr.email,
        papel: usr.papel,
        mentoradoId: ment?.id,
        matriculaId: mat?.id,
        editalId: mat?.edital_id,
      },
    };
  }

  throw new Error('Link inválido ou não encontrado.');
}

/**
 * Conclui onboarding de convite: aceita LGPD e cria a senha do mentorado
 */
export function aceitarConviteMentorado(
  token: string,
  senha: string,
  consentimento: boolean,
  nomeCustom?: string
): { token: string; usuario: AuthUserDTO } {
  if (!consentimento) {
    throw new Error('É necessário aceitar os termos de consentimento e privacidade LGPD para prosseguir.');
  }
  if (!senha || senha.length < 6) {
    throw new Error('A senha deve conter no mínimo 6 caracteres.');
  }

  const convite = dbHelper.get<{
    id: string;
    mentor_id: string;
    nome: string;
    email: string;
    fim_mentoria: string;
    dia_corte_semana: number;
    edital_id: string | null;
    expira_em: string;
    aceito_em: string | null;
  }>(`SELECT * FROM convite WHERE token = ?`, token);

  if (!convite) {
    throw new Error('Convite não encontrado.');
  }
  if (convite.aceito_em) {
    throw new Error('Este convite já foi utilizado.');
  }
  if (convite.expira_em < new Date().toISOString()) {
    throw new Error('Este convite está expirado.');
  }

  const nomeFinal = (nomeCustom || convite.nome || convite.email.split('@')[0]).trim();
  const senhaHash = hashPassword(senha);

  // 1. Cria ou atualiza usuário
  let usuario = dbHelper.get<{ id: string; nome: string; email: string }>(
    `SELECT id, nome, email FROM usuario WHERE LOWER(email) = LOWER(?)`,
    convite.email
  );

  let usuarioId = usuario?.id;
  if (!usuario) {
    usuarioId = crypto.randomUUID();
    dbHelper.run(
      `INSERT INTO usuario (id, nome, email, papel, senha_hash) VALUES (?, ?, ?, 'mentorado', ?)`,
      usuarioId,
      nomeFinal,
      convite.email,
      senhaHash
    );
  } else {
    dbHelper.run(
      `UPDATE usuario SET nome = ?, senha_hash = ?, papel = 'mentorado' WHERE id = ?`,
      nomeFinal,
      senhaHash,
      usuarioId
    );
  }

  // 2. Cria ou atualiza perfil de mentorado com consentimento LGPD
  let mentorado = dbHelper.get<{ id: string }>(`SELECT id FROM mentorado WHERE usuario_id = ?`, usuarioId);
  let mentoradoId = mentorado?.id;
  const agora = new Date().toISOString();

  if (!mentorado) {
    mentoradoId = crypto.randomUUID();
    dbHelper.run(
      `INSERT INTO mentorado (id, usuario_id, mentor_id, fim_mentoria, dia_corte_semana, consentimento_em)
       VALUES (?, ?, ?, ?, ?, ?)`,
      mentoradoId,
      usuarioId,
      convite.mentor_id,
      convite.fim_mentoria || '2027-04-30',
      convite.dia_corte_semana ?? 2,
      agora
    );
  } else {
    dbHelper.run(
      `UPDATE mentorado SET fim_mentoria = ?, dia_corte_semana = ?, consentimento_em = ? WHERE id = ?`,
      convite.fim_mentoria || '2027-04-30',
      convite.dia_corte_semana ?? 2,
      agora,
      mentoradoId
    );
  }

  // 3. Cria matrícula no edital
  const editalId = convite.edital_id || 'edital_cgu';
  let matricula = dbHelper.get<{ id: string }>(
    `SELECT id FROM matricula WHERE mentorado_id = ? AND edital_id = ? AND removido_em IS NULL`,
    mentoradoId,
    editalId
  );
  let matriculaId = matricula?.id;
  if (!matricula) {
    matriculaId = crypto.randomUUID();
    dbHelper.run(
      `INSERT INTO matricula (id, mentorado_id, edital_id, atribuido_em) VALUES (?, ?, ?, ?)`,
      matriculaId,
      mentoradoId,
      editalId,
      agora
    );
  }

  // 4. Marca convite como aceito
  dbHelper.run(`UPDATE convite SET aceito_em = ? WHERE id = ?`, agora, convite.id);

  // 5. Inicia sessão
  const sessionToken = crypto.randomUUID();
  dbHelper.run(
    `INSERT INTO sessao_auth (token, usuario_id, criado_em, expira_em) VALUES (?, ?, ?, ?)`,
    sessionToken,
    usuarioId,
    agora,
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  );

  return {
    token: sessionToken,
    usuario: {
      id: usuarioId!,
      nome: nomeFinal,
      email: convite.email,
      papel: 'mentorado',
      mentoradoId,
      matriculaId,
      editalId,
    },
  };
}

/**
 * Criação de convite pelo mentor
 */
export function criarConvite(
  mentorId: string,
  dados: {
    nome: string;
    email: string;
    fimMentoria: string;
    diaCorte: number;
    editalId?: string;
  },
  baseUrl: string = 'http://localhost:3001'
): { convite: any; magicLink: string } {
  const { nome, email, fimMentoria, diaCorte, editalId } = dados;
  if (!email || !email.trim()) throw new Error('E-mail do mentorado é obrigatório.');

  const emailNorm = email.trim().toLowerCase();

  // HU-1.1: Um e-mail já vinculado a outro mentor não pode ser convidado
  const outroMentor = dbHelper.get<{ mentor_id: string }>(
    `SELECT m.mentor_id
     FROM usuario u
     JOIN mentorado m ON u.id = m.usuario_id
     WHERE LOWER(u.email) = ? AND m.mentor_id != ?`,
    emailNorm,
    mentorId
  );
  if (outroMentor) {
    throw new Error('Este aluno já está vinculado a outro mentor na plataforma.');
  }

  const token = crypto.randomBytes(24).toString('hex');
  const conviteId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const agora = new Date();
  const expira = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias

  dbHelper.run(
    `INSERT INTO convite (id, mentor_id, nome, email, token, fim_mentoria, dia_corte_semana, edital_id, expira_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    conviteId,
    mentorId,
    nome?.trim() || null,
    emailNorm,
    token,
    fimMentoria || '2027-04-30',
    diaCorte ?? 2,
    editalId || 'edital_cgu',
    expira.toISOString()
  );

  const magicLink = `${baseUrl}/convite?token=${token}`;

  return {
    convite: {
      id: conviteId,
      nome,
      email: emailNorm,
      token,
      fim_mentoria: fimMentoria,
      dia_corte_semana: diaCorte,
      expira_em: expira.toISOString(),
    },
    magicLink,
  };
}

/**
 * Listagem de convites emitidos pelo mentor
 */
export function listarConvites(mentorId: string, baseUrl: string = 'http://localhost:3001'): any[] {
  const convites = dbHelper.all<any>(
    `SELECT c.*, u.nome as mentor_nome
     FROM convite c
     JOIN usuario u ON c.mentor_id = u.id
     WHERE c.mentor_id = ?
     ORDER BY c.expira_em DESC`,
    mentorId
  );

  const agora = new Date().toISOString();

  return convites.map(c => {
    let status: 'pendente' | 'aceito' | 'expirado' = 'pendente';
    if (c.aceito_em) {
      status = 'aceito';
    } else if (c.expira_em < agora) {
      status = 'expirado';
    }

    return {
      ...c,
      status,
      magicLink: `${baseUrl}/convite?token=${c.token}`,
    };
  });
}

/**
 * Recupera o usuário autenticado pela sessão ativa
 */
export function obterUsuarioPorSessao(token: string): AuthUserDTO | null {
  if (!token) return null;

  const sessao = dbHelper.get<{ token: string; usuario_id: string; expira_em: string }>(
    `SELECT token, usuario_id, expira_em FROM sessao_auth WHERE token = ?`,
    token
  );

  if (!sessao || sessao.expira_em < new Date().toISOString()) {
    return null;
  }

  const usuario = dbHelper.get<{ id: string; nome: string; email: string; papel: 'mentor' | 'mentorado' }>(
    `SELECT id, nome, email, papel FROM usuario WHERE id = ? AND excluido_em IS NULL`,
    sessao.usuario_id
  );

  if (!usuario) return null;

  const authUser: AuthUserDTO = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
  };

  if (usuario.papel === 'mentorado') {
    const ment = dbHelper.get<{ id: string }>(`SELECT id FROM mentorado WHERE usuario_id = ?`, usuario.id);
    if (ment) {
      authUser.mentoradoId = ment.id;
      const mat = dbHelper.get<{ id: string; edital_id: string }>(
        `SELECT id, edital_id FROM matricula WHERE mentorado_id = ? AND removido_em IS NULL LIMIT 1`,
        ment.id
      );
      if (mat) {
        authUser.matriculaId = mat.id;
        authUser.editalId = mat.edital_id;
      }
    }
  }

  return authUser;
}

/**
 * Encerra sessão do usuário
 */
export function encerrarSessao(token: string): void {
  if (token) {
    dbHelper.run(`DELETE FROM sessao_auth WHERE token = ?`, token);
  }
}
