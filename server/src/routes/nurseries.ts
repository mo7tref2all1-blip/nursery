import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db';

const router = Router();

// GET /api/nurseries - list all nurseries with stats
router.get('/', async (_req: Request, res: Response) => {
  const [rows]: any = await pool.execute(`
    SELECT n.*,
      COUNT(DISTINCT t.id)  AS teacher_count,
      COUNT(DISTINCT s.id)  AS student_count,
      COUNT(DISTINCT u.id)  AS admin_count
    FROM nurseries n
    LEFT JOIN teachers t ON t.nursery_id = n.id AND t.status = 'active'
    LEFT JOIN students s ON s.nursery_id = n.id AND s.status = 'active'
    LEFT JOIN users    u ON u.nursery_id = n.id AND u.role = 'nursery_admin'
    GROUP BY n.id
    ORDER BY n.created_at DESC
  `);
  return res.json(rows);
});

// POST /api/nurseries - create nursery
router.post('/', async (req: Request, res: Response) => {
  const { name, address, phone, email, plan, status } = req.body;
  if (!name) return res.status(400).json({ error: 'اسم الحضانة مطلوب' });

  const [result]: any = await pool.execute(
    'INSERT INTO nurseries (name, address, phone, email, plan, status) VALUES (?,?,?,?,?,?)',
    [name, address || null, phone || null, email || null, plan || 'basic', status || 'active']
  );
  const [rows]: any = await pool.execute('SELECT * FROM nurseries WHERE id = ?', [result.insertId]);
  return res.status(201).json(rows[0]);
});

// PUT /api/nurseries/:id - update nursery
router.put('/:id', async (req: Request, res: Response) => {
  const { name, address, phone, email, plan, status } = req.body;
  const [existing]: any = await pool.execute('SELECT id FROM nurseries WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'الحضانة غير موجودة' });

  await pool.execute(
    'UPDATE nurseries SET name=?, address=?, phone=?, email=?, plan=?, status=? WHERE id=?',
    [name, address || null, phone || null, email || null, plan || 'basic', status || 'active', req.params.id]
  );
  const [rows]: any = await pool.execute('SELECT * FROM nurseries WHERE id = ?', [req.params.id]);
  return res.json(rows[0]);
});

// DELETE /api/nurseries/:id - deactivate nursery
router.delete('/:id', async (req: Request, res: Response) => {
  const [existing]: any = await pool.execute('SELECT id FROM nurseries WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'الحضانة غير موجودة' });

  await pool.execute("UPDATE nurseries SET status='inactive' WHERE id=?", [req.params.id]);
  return res.json({ success: true });
});

// GET /api/nurseries/:id/admins - list admins of this nursery
router.get('/:id/admins', async (req: Request, res: Response) => {
  const [rows]: any = await pool.execute(
    "SELECT id, username, role, nursery_id, created_at FROM users WHERE nursery_id = ? AND role = 'nursery_admin' ORDER BY created_at DESC",
    [req.params.id]
  );
  return res.json(rows);
});

// POST /api/nurseries/:id/admins - create a new nursery_admin for this nursery
router.post('/:id/admins', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });

  const [existing]: any = await pool.execute('SELECT id FROM nurseries WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'الحضانة غير موجودة' });

  const [dup]: any = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
  if (dup[0]) return res.status(400).json({ error: 'اسم المستخدم مستخدم بالفعل' });

  const hash = await bcrypt.hash(password, 10);
  const [result]: any = await pool.execute(
    'INSERT INTO users (username, password_hash, role, nursery_id) VALUES (?,?,?,?)',
    [username, hash, 'nursery_admin', req.params.id]
  );
  const [rows]: any = await pool.execute(
    'SELECT id, username, role, nursery_id, created_at FROM users WHERE id = ?',
    [result.insertId]
  );
  return res.status(201).json(rows[0]);
});

// DELETE /api/nurseries/:id/admins/:userId - delete an admin user
router.delete('/:id/admins/:userId', async (req: Request, res: Response) => {
  const [existing]: any = await pool.execute(
    "SELECT id FROM users WHERE id = ? AND nursery_id = ? AND role = 'nursery_admin'",
    [req.params.userId, req.params.id]
  );
  if (!existing[0]) return res.status(404).json({ error: 'المستخدم غير موجود' });

  await pool.execute('DELETE FROM users WHERE id = ?', [req.params.userId]);
  return res.json({ success: true });
});

export default router;
