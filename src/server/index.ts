import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './routes/api.js';
import { initDb, dbHelper } from './db/database.js';
import { runSeed } from './db/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir fotos enviadas
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Inicializa o banco e verifica se precisa de seed
initDb();
const totalUsers = dbHelper.get<{ count: number }>(`SELECT COUNT(*) as count FROM usuario`)?.count || 0;
if (totalUsers === 0) {
  runSeed();
}

// Rotas da API
app.use('/api', apiRouter);

// Servir frontend em produção se existir a pasta dist
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor Handshake rodando em http://localhost:${PORT}`);
});
