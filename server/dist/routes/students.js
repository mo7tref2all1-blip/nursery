"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
// ── CRUD ──────────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
    const [rows] = await db_1.default.execute('SELECT * FROM students ORDER BY created_at DESC');
    return res.json(rows);
});
router.get('/:id', async (req, res) => {
    const [rows] = await db_1.default.execute('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!rows[0])
        return res.status(404).json({ error: 'الطالب غير موجود' });
    return res.json(rows[0]);
});
router.post('/', async (req, res) => {
    const { name, age, class_group, parent_name, parent_phone, join_date } = req.body;
    if (!name)
        return res.status(400).json({ error: 'اسم الطالب مطلوب' });
    const [result] = await db_1.default.execute('INSERT INTO students (name, age, class_group, parent_name, parent_phone, join_date) VALUES (?,?,?,?,?,?)', [name, age || 0, class_group || '', parent_name || '', parent_phone || '', join_date || new Date().toISOString().split('T')[0]]);
    const [rows] = await db_1.default.execute('SELECT * FROM students WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
});
router.put('/:id', async (req, res) => {
    const { name, age, class_group, parent_name, parent_phone, join_date, status } = req.body;
    const [existing] = await db_1.default.execute('SELECT id FROM students WHERE id = ?', [req.params.id]);
    if (!existing[0])
        return res.status(404).json({ error: 'الطالب غير موجود' });
    await db_1.default.execute('UPDATE students SET name=?, age=?, class_group=?, parent_name=?, parent_phone=?, join_date=?, status=? WHERE id=?', [name, age, class_group, parent_name, parent_phone, join_date, status || 'active', req.params.id]);
    const [rows] = await db_1.default.execute('SELECT * FROM students WHERE id = ?', [req.params.id]);
    return res.json(rows[0]);
});
router.delete('/:id', async (req, res) => {
    const [existing] = await db_1.default.execute('SELECT id FROM students WHERE id = ?', [req.params.id]);
    if (!existing[0])
        return res.status(404).json({ error: 'الطالب غير موجود' });
    await db_1.default.execute('DELETE FROM students WHERE id = ?', [req.params.id]);
    return res.json({ success: true });
});
// ── Attendance ─────────────────────────────────────────────────────────
router.get('/attendance/today', async (_req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await db_1.default.execute(`
    SELECT sa.*, s.name AS student_name, s.class_group
    FROM student_attendance sa
    JOIN students s ON s.id = sa.student_id
    WHERE sa.date = ?
    ORDER BY sa.created_at DESC
  `, [today]);
    return res.json(rows);
});
router.get('/:id/attendance', async (req, res) => {
    const { from, to } = req.query;
    let sql = 'SELECT * FROM student_attendance WHERE student_id = ?';
    const params = [req.params.id];
    if (from) {
        sql += ' AND date >= ?';
        params.push(from);
    }
    if (to) {
        sql += ' AND date <= ?';
        params.push(to);
    }
    sql += ' ORDER BY date DESC';
    const [rows] = await db_1.default.execute(sql, params);
    return res.json(rows);
});
router.post('/:id/attendance', async (req, res) => {
    const { date, check_in, check_out, status, notes } = req.body;
    const attendanceDate = date || new Date().toISOString().split('T')[0];
    await db_1.default.execute(`
    INSERT INTO student_attendance (student_id, date, check_in, check_out, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE check_in=VALUES(check_in), check_out=VALUES(check_out),
                            status=VALUES(status), notes=VALUES(notes)
  `, [req.params.id, attendanceDate, check_in || null, check_out || null, status || 'present', notes || null]);
    const [rows] = await db_1.default.execute('SELECT * FROM student_attendance WHERE student_id = ? AND date = ?', [req.params.id, attendanceDate]);
    return res.json(rows[0]);
});
// ── Evaluations ────────────────────────────────────────────────────────
router.get('/evaluations/all', async (req, res) => {
    const { month, year } = req.query;
    let sql = `
    SELECT se.*, s.name AS student_name, s.class_group
    FROM student_evaluations se JOIN students s ON s.id = se.student_id WHERE 1=1
  `;
    const params = [];
    if (month) {
        sql += ' AND se.month = ?';
        params.push(month);
    }
    if (year) {
        sql += ' AND se.year  = ?';
        params.push(year);
    }
    sql += ' ORDER BY se.year DESC, se.month DESC';
    const [rows] = await db_1.default.execute(sql, params);
    return res.json(rows);
});
router.get('/:id/evaluations', async (req, res) => {
    const [rows] = await db_1.default.execute('SELECT * FROM student_evaluations WHERE student_id = ? ORDER BY year DESC, month DESC', [req.params.id]);
    return res.json(rows);
});
router.post('/:id/evaluations', async (req, res) => {
    const { month, year, behavior, academic, social, notes } = req.body;
    await db_1.default.execute(`
    INSERT INTO student_evaluations (student_id, month, year, behavior, academic, social, notes)
    VALUES (?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE behavior=VALUES(behavior), academic=VALUES(academic),
                            social=VALUES(social), notes=VALUES(notes)
  `, [req.params.id, month, year, behavior || 5, academic || 5, social || 5, notes || null]);
    const [rows] = await db_1.default.execute('SELECT * FROM student_evaluations WHERE student_id = ? AND month = ? AND year = ?', [req.params.id, month, year]);
    return res.json(rows[0]);
});
exports.default = router;
