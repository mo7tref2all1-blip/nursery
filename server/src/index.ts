import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

import { initDB } from './db';
import authRoutes    from './routes/auth';
import teacherRoutes from './routes/teachers';
import studentRoutes from './routes/students';
import reportRoutes  from './routes/reports';

const app = express();
const PORT        = process.env.PORT        || 3001;
const JWT_SECRET  = process.env.JWT_SECRET  || 'nursery-secret-key-2024';
const IS_PROD     = process.env.NODE_ENV === 'production';

// ── Middleware ─────────────────────────────────────────────────────────
if (!IS_PROD) {
  app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
} else {
  app.use(cors({ credentials: true }));
}
app.use(express.json());

// ── Auth middleware ────────────────────────────────────────────────────
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'غير مصرح - الرجاء تسجيل الدخول' });
  const token = authHeader.split(' ')[1];
  try {
    (req as any).user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'رمز المصادقة منتهي الصلاحية' });
  }
}

// ── API Routes ─────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/teachers', requireAuth, teacherRoutes);
app.use('/api/students', requireAuth, studentRoutes);
app.use('/api/reports',  requireAuth, reportRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Serve React frontend (production) ─────────────────────────────────
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ── Start ──────────────────────────────────────────────────────────────
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      if (!IS_PROD) console.log(`→ http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

export default app;
