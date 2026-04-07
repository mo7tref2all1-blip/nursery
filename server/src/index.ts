import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import authRoutes from './routes/auth';
import teacherRoutes from './routes/teachers';
import studentRoutes from './routes/students';
import reportRoutes from './routes/reports';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'nursery-secret-key-2024';

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
