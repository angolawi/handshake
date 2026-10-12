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

// Inicializa o esquema de tabelas
export function initDb() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
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
