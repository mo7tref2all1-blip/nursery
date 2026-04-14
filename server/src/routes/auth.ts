import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nursery-secret-key-2024';

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });

  const [rows]: any = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
  const user = rows[0];

  if (!user) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, nursery_id: user.nursery_id },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role, nursery_id: user.nursery_id }
  });
});

router.post('/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'غير مصرح' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ valid: true, user: decoded });
  } catch {
    return res.status(401).json({ error: 'رمز منتهي الصلاحية' });
  }
});

export default router;
