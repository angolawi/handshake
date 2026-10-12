import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório de dados
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Diretório de uploads
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'handshake.db');
export const db = new DatabaseSync(dbPath);

// Configuração de performance e integridade
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA busy_timeout = 5000;');

// Inicializa o esquema de tabelas e aplica migrações incrementais
export function initDb() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Migrações incrementais para colunas adicionadas
  runMigrations();
}

function runMigrations() {
  const getColumns = (tableName: string): Set<string> => {
    try {
      const rows = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
      return new Set(rows.map(r => r.name));
    } catch {
      return new Set();
    }
  };

  const editalCols = getColumns('edital');
  if (editalCols.size > 0) {
    if (!editalCols.has('metodo_cobranca')) {
      db.exec(`ALTER TABLE edital ADD COLUMN metodo_cobranca TEXT NOT NULL DEFAULT 'certo_errado'`);
    }
    if (!editalCols.has('fator_penalidade')) {
      db.exec(`ALTER TABLE edital ADD COLUMN fator_penalidade REAL NOT NULL DEFAULT 1.0`);
    }
    if (!editalCols.has('pontuacao_total')) {
      db.exec(`ALTER TABLE edital ADD COLUMN pontuacao_total REAL DEFAULT 120.0`);
    }
    if (!editalCols.has('nota_minima_aprovacao')) {
      db.exec(`ALTER TABLE edital ADD COLUMN nota_minima_aprovacao REAL DEFAULT 60.0`);
    }
  }

  const grupoCols = getColumns('grupo');
  if (grupoCols.size > 0) {
    if (!grupoCols.has('nota_minima_grupo')) {
      db.exec(`ALTER TABLE grupo ADD COLUMN nota_minima_grupo REAL DEFAULT 0.0`);
    }
  }

  const discCols = getColumns('disciplina');
  if (discCols.size > 0) {
    if (!discCols.has('peso')) {
      db.exec(`ALTER TABLE disciplina ADD COLUMN peso REAL NOT NULL DEFAULT 1.0`);
    }
    if (!discCols.has('questoes_estimadas')) {
      db.exec(`ALTER TABLE disciplina ADD COLUMN questoes_estimadas INTEGER DEFAULT 0`);
    }
  }

  const usuarioCols = getColumns('usuario');
  if (usuarioCols.size > 0) {
    if (!usuarioCols.has('senha_hash')) {
      db.exec(`ALTER TABLE usuario ADD COLUMN senha_hash TEXT`);
    }
  }

  const conviteCols = getColumns('convite');
  if (conviteCols.size > 0) {
    if (!conviteCols.has('nome')) {
      db.exec(`ALTER TABLE convite ADD COLUMN nome TEXT`);
    }
    if (!conviteCols.has('fim_mentoria')) {
      db.exec(`ALTER TABLE convite ADD COLUMN fim_mentoria TEXT`);
    }
    if (!conviteCols.has('dia_corte_semana')) {
      db.exec(`ALTER TABLE convite ADD COLUMN dia_corte_semana INTEGER DEFAULT 2`);
    }
    if (!conviteCols.has('edital_id')) {
      db.exec(`ALTER TABLE convite ADD COLUMN edital_id TEXT`);
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessao_auth (
      token TEXT PRIMARY KEY,
      usuario_id TEXT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
      criado_em TEXT NOT NULL,
      expira_em TEXT NOT NULL
    );
  `);
}

// Helper tipado para consultas
export const dbHelper = {
  all<T = any>(sql: string, ...params: any[]): T[] {
    return db.prepare(sql).all(...params) as T[];
  },
  get<T = any>(sql: string, ...params: any[]): T | undefined {
    return db.prepare(sql).get(...params) as T | undefined;
  },
  run(sql: string, ...params: any[]) {
    return db.prepare(sql).run(...params);
  },
  exec(sql: string) {
    return db.exec(sql);
  },
};
