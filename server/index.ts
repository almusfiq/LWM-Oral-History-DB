import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import apiRouter from './api';
import { initDatabase } from './db';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded school pictures
app.use('/school-pictures', express.static(path.resolve(process.cwd(), 'public/school-pictures')));

// Mount API router
app.use('/api', apiRouter);

let isDbInitialized = false;

export async function getApp() {
  if (!isDbInitialized) {
    await initDatabase();
    isDbInitialized = true;
  }
  return app;
}

// If run directly (e.g. npx tsx server/index.ts in production)
const isDirectRun = process.env.STANDALONE_SERVER === 'true' || 
  (process.argv[1] && (process.argv[1].endsWith('server/index.ts') || process.argv[1].endsWith('server/index.js')));

if (isDirectRun) {
  const PORT = parseInt(process.env.API_PORT || '5001', 10);
  getApp().then(() => {
    // Serve static frontend files if dist/ exists
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`LWM Oral History Server listening on http://0.0.0.0:${PORT}`);
    });
  });
}

export default app;
