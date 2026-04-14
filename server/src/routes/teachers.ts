import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// ── CRUD ──────────────────────────────────────────────────────────────

router.get('/', async (_req: Request, res: Response) => {
  const [rows]: any = await pool.execute('SELECT * FROM teachers ORDER BY created_at DESC');
  return res.json(rows);
});

router.get('/:id', async (req: Request, res: Response) => {
  const [rows]: any = await pool.execute('SELECT * FROM teachers WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'المعلم غير موجود' });
  return res.json(rows[0]);
});

router.post('/', async (req: Request, res: Response) => {
  const { name, subject, phone, salary, join_date } = req.body;
  if (!name) return res.status(400).json({ error: 'اسم المعلم مطلوب' });

  const [result]: any = await pool.execute(
    'INSERT INTO teachers (name, subject, phone, salary, join_date) VALUES (?,?,?,?,?)',
    [name, subject || '', phone || '', salary || 0, join_date || new Date().toISOString().split('T')[0]]
  );
  const [rows]: any = await pool.execute('SELECT * FROM teachers WHERE id = ?', [result.insertId]);
  return res.status(201).json(rows[0]);
});

router.put('/:id', async (req: Request, res: Response) => {
  const { name, subject, phone, salary, join_date, status } = req.body;
  const [existing]: any = await pool.execute('SELECT id FROM teachers WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'المعلم غير موجود' });

  await pool.execute(
    'UPDATE teachers SET name=?, subject=?, phone=?, salary=?, join_date=?, status=? WHERE id=?',
    [name, subject, phone, salary, join_date, status || 'active', req.params.id]
  );
  const [rows]: any = await pool.execute('SELECT * FROM teachers WHERE id = ?', [req.params.id]);
  return res.json(rows[0]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const [existing]: any = await pool.execute('SELECT id FROM teachers WHERE id = ?', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'المعلم غير موجود' });
  await pool.execute('DELETE FROM teachers WHERE id = ?', [req.params.id]);
  return res.json({ success: true });
});

// ── Attendance ─────────────────────────────────────────────────────────

// Today's attendance for ALL teachers
router.get('/attendance/today', async (_req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  const [rows]: any = await pool.execute(`
    SELECT ta.*, t.name AS teacher_name, t.subject
    FROM teacher_attendance ta
    JOIN teachers t ON t.id = ta.teacher_id
    WHERE ta.date = ?
    ORDER BY ta.created_at DESC
  `, [today]);
  return res.json(rows);
});

// Attendance history for one teacher
router.get('/:id/attendance', async (req: Request, res: Response) => {
  const { from, to } = req.query;
  let sql = 'SELECT * FROM teacher_attendance WHERE teacher_id = ?';
  const params: any[] = [req.params.id];
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to)   { sql += ' AND date <= ?'; params.push(to); }
  sql += ' ORDER BY date DESC';
  const [rows]: any = await pool.execute(sql, params);
  return res.json(rows);
});

// Mark / update attendance (UPSERT)
router.post('/:id/attendance', async (req: Request, res: Response) => {
  const { date, check_in, check_out, status, notes } = req.body;
  const attendanceDate = date || new Date().toISOString().split('T')[0];

  await pool.execute(`
    INSERT INTO teacher_attendance (teacher_id, date, check_in, check_out, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE check_in=VALUES(check_in), check_out=VALUES(check_out),
                            status=VALUES(status), notes=VALUES(notes)
  `, [req.params.id, attendanceDate, check_in || null, check_out || null, status || 'present', notes || null]);

  const [rows]: any = await pool.execute(
    'SELECT * FROM teacher_attendance WHERE teacher_id = ? AND date = ?',
    [req.params.id, attendanceDate]
  );
  return res.json(rows[0]);
});

// ── Salary ─────────────────────────────────────────────────────────────

router.get('/salary/all', async (req: Request, res: Response) => {
  const { month, year } = req.query;
  let sql = `
    SELECT ts.*, t.name AS teacher_name, t.subject
    FROM teacher_salary ts JOIN teachers t ON t.id = ts.teacher_id WHERE 1=1
  `;
  const params: any[] = [];
  if (month) { sql += ' AND ts.month = ?'; params.push(month); }
  if (year)  { sql += ' AND ts.year  = ?'; params.push(year); }
  sql += ' ORDER BY ts.year DESC, ts.month DESC';
  const [rows]: any = await pool.execute(sql, params);
  return res.json(rows);
});

router.get('/:id/salary', async (req: Request, res: Response) => {
  const [rows]: any = await pool.execute(
    'SELECT * FROM teacher_salary WHERE teacher_id = ? ORDER BY year DESC, month DESC',
    [req.params.id]
  );
  return res.json(rows);
});

router.post('/:id/salary', async (req: Request, res: Response) => {
  const { month, year, base_salary, deductions, bonuses, paid } = req.body;
  const net = (base_salary || 0) - (deductions || 0) + (bonuses || 0);

  await pool.execute(`
    INSERT INTO teacher_salary (teacher_id, month, year, base_salary, deductions, bonuses, net_salary, paid)
    VALUES (?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE base_salary=VALUES(base_salary), deductions=VALUES(deductions),
                            bonuses=VALUES(bonuses), net_salary=VALUES(net_salary), paid=VALUES(paid)
  `, [req.params.id, month, year, base_salary || 0, deductions || 0, bonuses || 0, net, paid ? 1 : 0]);

  const [rows]: any = await pool.execute(
    'SELECT * FROM teacher_salary WHERE teacher_id = ? AND month = ? AND year = ?',
    [req.params.id, month, year]
  );
  return res.json(rows[0]);
});

export default router;
