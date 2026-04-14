import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// Dashboard stats
router.get('/dashboard', async (req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  const nurseryId = (req as any).nurseryId;

  let teacherWhere = "status='active'";
  let studentWhere = "status='active'";
  let taWhere = `date='${today}' AND status='present'`;
  let saWhere = `date='${today}' AND status='present'`;
  const tParams: any[] = [];
  const sParams: any[] = [];
  const taParams: any[] = [today];
  const saParams: any[] = [today];

  if (nurseryId) {
    teacherWhere += ' AND nursery_id = ?';
    studentWhere += ' AND nursery_id = ?';
    tParams.push(nurseryId);
    sParams.push(nurseryId);
  }

  const [[ts]]: any = await pool.execute(`SELECT COUNT(*) AS cnt FROM teachers WHERE ${teacherWhere}`, tParams);
  const [[ss]]: any = await pool.execute(`SELECT COUNT(*) AS cnt FROM students WHERE ${studentWhere}`, sParams);

  let taJoin = nurseryId
    ? `SELECT COUNT(*) AS cnt FROM teacher_attendance ta JOIN teachers t ON t.id = ta.teacher_id WHERE ta.date=? AND ta.status='present' AND t.nursery_id=?`
    : `SELECT COUNT(*) AS cnt FROM teacher_attendance WHERE date=? AND status='present'`;
  let saJoin = nurseryId
    ? `SELECT COUNT(*) AS cnt FROM student_attendance sa JOIN students s ON s.id = sa.student_id WHERE sa.date=? AND sa.status='present' AND s.nursery_id=?`
    : `SELECT COUNT(*) AS cnt FROM student_attendance WHERE date=? AND status='present'`;

  const taJoinParams = nurseryId ? [today, nurseryId] : [today];
  const saJoinParams = nurseryId ? [today, nurseryId] : [today];

  const [[ta]]: any = await pool.execute(taJoin, taJoinParams);
  const [[sa]]: any = await pool.execute(saJoin, saJoinParams);

  let recentStudentsSql = `
    SELECT sa.*, s.name AS person_name, 'student' AS type, s.class_group AS extra
    FROM student_attendance sa JOIN students s ON s.id = sa.student_id
    ${nurseryId ? 'WHERE s.nursery_id = ?' : ''}
    ORDER BY sa.created_at DESC LIMIT 5
  `;
  let recentTeachersSql = `
    SELECT ta.*, t.name AS person_name, 'teacher' AS type, t.subject AS extra
    FROM teacher_attendance ta JOIN teachers t ON t.id = ta.teacher_id
    ${nurseryId ? 'WHERE t.nursery_id = ?' : ''}
    ORDER BY ta.created_at DESC LIMIT 5
  `;

  const [recentStudents]: any = await pool.execute(recentStudentsSql, nurseryId ? [nurseryId] : []);
  const [recentTeachers]: any = await pool.execute(recentTeachersSql, nurseryId ? [nurseryId] : []);

  const recentActivity = [...recentStudents, ...recentTeachers]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return res.json({
    totalTeachers:          ts.cnt,
    totalStudents:          ss.cnt,
    todayTeacherAttendance: ta.cnt,
    todayStudentAttendance: sa.cnt,
    recentActivity,
  });
});

// Teacher attendance report
router.get('/teacher-attendance', async (req: Request, res: Response) => {
  const { from, to, teacher_id } = req.query;
  const nurseryId = (req as any).nurseryId;
  let sql = `
    SELECT ta.*, t.name AS teacher_name, t.subject
    FROM teacher_attendance ta JOIN teachers t ON t.id = ta.teacher_id WHERE 1=1
  `;
  const params: any[] = [];
  if (nurseryId) { sql += ' AND t.nursery_id = ?'; params.push(nurseryId); }
  if (teacher_id) { sql += ' AND ta.teacher_id = ?'; params.push(teacher_id); }
  if (from)       { sql += ' AND ta.date >= ?';       params.push(from); }
  if (to)         { sql += ' AND ta.date <= ?';        params.push(to); }
  sql += ' ORDER BY ta.date DESC, t.name ASC';
  const [rows]: any = await pool.execute(sql, params);
  return res.json(rows);
});

// Student attendance report
router.get('/student-attendance', async (req: Request, res: Response) => {
  const { from, to, student_id, class_group } = req.query;
  const nurseryId = (req as any).nurseryId;
  let sql = `
    SELECT sa.*, s.name AS student_name, s.class_group, s.parent_name
    FROM student_attendance sa JOIN students s ON s.id = sa.student_id WHERE 1=1
  `;
  const params: any[] = [];
  if (nurseryId)   { sql += ' AND s.nursery_id = ?';   params.push(nurseryId); }
  if (student_id)  { sql += ' AND sa.student_id = ?'; params.push(student_id); }
  if (class_group) { sql += ' AND s.class_group = ?'; params.push(class_group); }
  if (from)        { sql += ' AND sa.date >= ?';      params.push(from); }
  if (to)          { sql += ' AND sa.date <= ?';      params.push(to); }
  sql += ' ORDER BY sa.date DESC, s.name ASC';
  const [rows]: any = await pool.execute(sql, params);
  return res.json(rows);
});

// Salary report
router.get('/salary', async (req: Request, res: Response) => {
  const { month, year } = req.query;
  const nurseryId = (req as any).nurseryId;
  let sql = `
    SELECT ts.*, t.name AS teacher_name, t.subject
    FROM teacher_salary ts JOIN teachers t ON t.id = ts.teacher_id WHERE 1=1
  `;
  const params: any[] = [];
  if (nurseryId) { sql += ' AND t.nursery_id = ?'; params.push(nurseryId); }
  if (month) { sql += ' AND ts.month = ?'; params.push(month); }
  if (year)  { sql += ' AND ts.year  = ?'; params.push(year); }
  sql += ' ORDER BY ts.year DESC, ts.month DESC, t.name ASC';
  const [rows]: any = await pool.execute(sql, params);
  return res.json(rows);
});

// Student evaluations report
router.get('/evaluations', async (req: Request, res: Response) => {
  const { month, year, class_group } = req.query;
  const nurseryId = (req as any).nurseryId;
  let sql = `
    SELECT se.*, s.name AS student_name, s.class_group
    FROM student_evaluations se JOIN students s ON s.id = se.student_id WHERE 1=1
  `;
  const params: any[] = [];
  if (nurseryId)   { sql += ' AND s.nursery_id = ?';   params.push(nurseryId); }
  if (month)       { sql += ' AND se.month = ?';      params.push(month); }
  if (year)        { sql += ' AND se.year  = ?';       params.push(year); }
  if (class_group) { sql += ' AND s.class_group = ?'; params.push(class_group); }
  sql += ' ORDER BY se.year DESC, se.month DESC, s.name ASC';
  const [rows]: any = await pool.execute(sql, params);
  return res.json(rows);
});

export default router;
