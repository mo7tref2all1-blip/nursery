import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

import authRoutes from './routes/auth';
import teacherRoutes from './routes/teachers';
import studentRoutes from './routes/students';
import reportRoutes from './routes/reports';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'nursery-secret-key-2024';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Middleware
if (!IS_PRODUCTION) {
  // Dev: allow Vite dev server
  app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
} else {
  // Production: same-origin requests only (React served by Express)
  app.use(cors({ credentials: true }));
}
app.use(express.json());

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'غير مصرح - الرجاء تسجيل الدخول' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'رمز المصادقة منتهي الصلاحية' });
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teachers', requireAuth, teacherRoutes);
app.use('/api/students', requireAuth, studentRoutes);
app.use('/api/reports', requireAuth, reportRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Serve React frontend in production ---
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // All non-API routes → React app (handles client-side routing)
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!IS_PRODUCTION) console.log(`http://localhost:${PORT}`);
});

export default app;
