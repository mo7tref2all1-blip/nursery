import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// ── CRUD ──────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  let sql = 'SELECT * FROM students WHERE 1=1';
  const params: any[] = [];
  if ((req as any).nurseryId) {
    sql += ' AND nursery_id = ?';
    params.push((req as any).nurseryId);
  }
  sql += ' ORDER BY created_at DESC';
  const [rows]: any = await pool.execute(sql, params);
  return res.json(rows);
});

router.get('/:id', async (req: Request, res: Response) => {
  let sql = 'SELECT * FROM students WHERE id = ?';
  const params: any[] = [req.params.id];
  if ((req as any).nurseryId) {
    sql += ' AND nursery_id = ?';
    params.push((req as any).nurseryId);
  }
  const [rows]: any = await pool.execute(sql, params);
  if (!rows[0]) return res.status(404).json({ error: 'الطالب غير موجود' });
  return res.json(rows[0]);
});

router.post('/', async (req: Request, res: Response) => {
  const { name, age, class_group, parent_name, parent_phone, join_date } = req.body;
  if (!name) return res.status(400).json({ error: 'اسم الطالب مطلوب' });

  const nurseryId = (req as any).nurseryId || 1;
  const [result]: any = await pool.execute(
    'INSERT INTO students (name, age, class_group, parent_name, parent_phone, join_date, nursery_id) VALUES (?,?,?,?,?,?,?)',
    [name, age || 0, class_group || '', parent_name || '', parent_phone || '', join_date || new Date().toISOString().split('T')[0], nurseryId]
  );
  const [rows]: any = await pool.execute('SELECT * FROM students WHERE id = ?', [result.insertId]);
  return res.status(201).json(rows[0]);
});

router.put('/:id', async (req: Request, res: Response) => {
  const { name, age, class_group, parent_name, parent_phone, join_date, status } = req.body;
  let checkSql = 'SELECT id FROM students WHERE id = ?';
  const checkParams: any[] = [req.params.id];
  if ((req as any).nurseryId) {
    checkSql += ' AND nursery_id = ?';
    checkParams.push((req as any).nurseryId);
  }
  const [existing]: any = await pool.execute(checkSql, checkParams);
  if (!existing[0]) return res.status(404).json({ error: 'الطالب غير موجود' });

  await pool.execute(
    'UPDATE students SET name=?, age=?, class_group=?, parent_name=?, parent_phone=?, join_date=?, status=? WHERE id=?',
    [name, age, class_group, parent_name, parent_phone, join_date, status || 'active', req.params.id]
  );
  const [rows]: any = await pool.execute('SELECT * FROM students WHERE id = ?', [req.params.id]);
  return res.json(rows[0]);
});

router.delete('/:id', async (req: Request, res: Response) => {
  let checkSql = 'SELECT id FROM students WHERE id = ?';
  const checkParams: any[] = [req.params.id];
  if ((req as any).nurseryId) {
    checkSql += ' AND nursery_id = ?';
    checkParams.push((req as any).nurseryId);
  }
  const [existing]: any = await pool.execute(checkSql, checkParams);
  if (!existing[0]) return res.status(404).json({ error: 'الطالب غير موجود' });
  await pool.execute('DELETE FROM students WHERE id = ?', [req.params.id]);
  return res.json({ success: true });
});

// ── Attendance ─────────────────────────────────────────────────────────

router.get('/attendance/today', async (req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  let sql = `
    SELECT sa.*, s.name AS student_name, s.class_group
    FROM student_attendance sa
    JOIN students s ON s.id = sa.student_id
    WHERE sa.date = ?
  `;
  const params: any[] = [today];
  if ((req as any).nurseryId) {
    sql += ' AND s.nursery_id = ?';
    params.push((req as any).nurseryId);
  }
  sql += ' ORDER BY sa.created_at DESC';
  const [rows]: any = await pool.execute(sql, params);
  return res.json(rows);
});

router.get('/:id/attendance', async (req: Request, res: Response) => {
  const { from, to } = req.query;
  let sql = 'SELECT * FROM student_attendance WHERE student_id = ?';
  const params: any[] = [req.params.id];
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to)   { sql += ' AND date <= ?'; params.push(to); }
  sql += ' ORDER BY date DESC';
  const [rows]: any = await pool.execute(sql, params);
  return res.json(rows);
});

router.post('/:id/attendance', async (req: Request, res: Response) => {
  const { date, check_in, check_out, status, notes } = req.body;
  const attendanceDate = date || new Date().toISOString().split('T')[0];

  await pool.execute(`
    INSERT INTO student_attendance (student_id, date, check_in, check_out, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE check_in=VALUES(check_in), check_out=VALUES(check_out),
                            status=VALUES(status), notes=VALUES(notes)
  `, [req.params.id, attendanceDate, check_in || null, check_out || null, status || 'present', notes || null]);

  const [rows]: any = await pool.execute(
    'SELECT * FROM student_attendance WHERE student_id = ? AND date = ?',
    [req.params.id, attendanceDate]
  );
  return res.json(rows[0]);
});

// ── Evaluations ────────────────────────────────────────────────────────

router.get('/evaluations/all', async (req: Request, res: Response) => {
  const { month, year } = req.query;
  let sql = `
    SELECT se.*, s.name AS student_name, s.class_group
    FROM student_evaluations se JOIN students s ON s.id = se.student_id WHERE 1=1
  `;
  const params: any[] = [];
  if ((req as any).nurseryId) {
    sql += ' AND s.nursery_id = ?';
    params.push((req as any).nurseryId);
  }
  if (month) { sql += ' AND se.month = ?'; params.push(month); }
  if (year)  { sql += ' AND se.year  = ?'; params.push(year); }
  sql += ' ORDER BY se.year DESC, se.month DESC';
  const [rows]: any = await pool.execute(sql, params);
  return res.json(rows);
});

router.get('/:id/evaluations', async (req: Request, res: Response) => {
  const [rows]: any = await pool.execute(
    'SELECT * FROM student_evaluations WHERE student_id = ? ORDER BY year DESC, month DESC',
    [req.params.id]
  );
  return res.json(rows);
});

router.post('/:id/evaluations', async (req: Request, res: Response) => {
  const { month, year, behavior, academic, social, notes } = req.body;

  await pool.execute(`
    INSERT INTO student_evaluations (student_id, month, year, behavior, academic, social, notes)
    VALUES (?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE behavior=VALUES(behavior), academic=VALUES(academic),
                            social=VALUES(social), notes=VALUES(notes)
  `, [req.params.id, month, year, behavior || 5, academic || 5, social || 5, notes || null]);

  const [rows]: any = await pool.execute(
    'SELECT * FROM student_evaluations WHERE student_id = ? AND month = ? AND year = ?',
    [req.params.id, month, year]
  );
  return res.json(rows[0]);
});

export default router;
