"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
// Get all teachers
router.get('/', (req, res) => {
    const teachers = db_1.default.prepare('SELECT * FROM teachers ORDER BY created_at DESC').all();
    return res.json(teachers);
});
// Get single teacher
router.get('/:id', (req, res) => {
    const teacher = db_1.default.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
    if (!teacher)
        return res.status(404).json({ error: 'المعلم غير موجود' });
    return res.json(teacher);
});
// Create teacher
router.post('/', (req, res) => {
    const { name, subject, phone, salary, join_date } = req.body;
    if (!name)
        return res.status(400).json({ error: 'اسم المعلم مطلوب' });
    const result = db_1.default.prepare('INSERT INTO teachers (name, subject, phone, salary, join_date) VALUES (?, ?, ?, ?, ?)').run(name, subject || '', phone || '', salary || 0, join_date || new Date().toISOString().split('T')[0]);
    const teacher = db_1.default.prepare('SELECT * FROM teachers WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json(teacher);
});
// Update teacher
router.put('/:id', (req, res) => {
    const { name, subject, phone, salary, join_date, status } = req.body;
    const existing = db_1.default.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
    if (!existing)
        return res.status(404).json({ error: 'المعلم غير موجود' });
    db_1.default.prepare('UPDATE teachers SET name=?, subject=?, phone=?, salary=?, join_date=?, status=? WHERE id=?').run(name, subject, phone, salary, join_date, status || 'active', req.params.id);
    const teacher = db_1.default.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
    return res.json(teacher);
});
// Delete teacher
router.delete('/:id', (req, res) => {
    const existing = db_1.default.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
    if (!existing)
        return res.status(404).json({ error: 'المعلم غير موجود' });
    db_1.default.prepare('DELETE FROM teachers WHERE id = ?').run(req.params.id);
    return res.json({ success: true });
});
// --- Attendance ---
// Get attendance for a teacher (optionally filter by date range)
router.get('/:id/attendance', (req, res) => {
    const { from, to } = req.query;
    let query = 'SELECT * FROM teacher_attendance WHERE teacher_id = ?';
    const params = [req.params.id];
    if (from) {
        query += ' AND date >= ?';
        params.push(from);
    }
    if (to) {
        query += ' AND date <= ?';
        params.push(to);
    }
    query += ' ORDER BY date DESC';
    const records = db_1.default.prepare(query).all(...params);
    return res.json(records);
});
// Get today's attendance for all teachers
router.get('/attendance/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const records = db_1.default.prepare(`
    SELECT ta.*, t.name as teacher_name, t.subject
    FROM teacher_attendance ta
    JOIN teachers t ON t.id = ta.teacher_id
    WHERE ta.date = ?
    ORDER BY ta.created_at DESC
  `).all(today);
    return res.json(records);
});
// Mark/update attendance
router.post('/:id/attendance', (req, res) => {
    const { date, check_in, check_out, status, notes } = req.body;
    const attendanceDate = date || new Date().toISOString().split('T')[0];
    const existing = db_1.default.prepare('SELECT * FROM teacher_attendance WHERE teacher_id = ? AND date = ?').get(req.params.id, attendanceDate);
    if (existing) {
        db_1.default.prepare('UPDATE teacher_attendance SET check_in=?, check_out=?, status=?, notes=? WHERE teacher_id=? AND date=?').run(check_in, check_out, status || 'present', notes, req.params.id, attendanceDate);
    }
    else {
        db_1.default.prepare('INSERT INTO teacher_attendance (teacher_id, date, check_in, check_out, status, notes) VALUES (?, ?, ?, ?, ?, ?)').run(req.params.id, attendanceDate, check_in, check_out, status || 'present', notes);
    }
    const record = db_1.default.prepare('SELECT * FROM teacher_attendance WHERE teacher_id = ? AND date = ?').get(req.params.id, attendanceDate);
    return res.json(record);
});
// --- Salary ---
// Get salary records for a teacher
router.get('/:id/salary', (req, res) => {
    const records = db_1.default.prepare('SELECT * FROM teacher_salary WHERE teacher_id = ? ORDER BY year DESC, month DESC').all(req.params.id);
    return res.json(records);
});
// Create/update salary record
router.post('/:id/salary', (req, res) => {
    const { month, year, base_salary, deductions, bonuses, paid } = req.body;
    const net = (base_salary || 0) - (deductions || 0) + (bonuses || 0);
    const existing = db_1.default.prepare('SELECT * FROM teacher_salary WHERE teacher_id = ? AND month = ? AND year = ?').get(req.params.id, month, year);
    if (existing) {
        db_1.default.prepare('UPDATE teacher_salary SET base_salary=?, deductions=?, bonuses=?, net_salary=?, paid=? WHERE teacher_id=? AND month=? AND year=?').run(base_salary, deductions, bonuses, net, paid ? 1 : 0, req.params.id, month, year);
    }
    else {
        db_1.default.prepare('INSERT INTO teacher_salary (teacher_id, month, year, base_salary, deductions, bonuses, net_salary, paid) VALUES (?,?,?,?,?,?,?,?)').run(req.params.id, month, year, base_salary, deductions, bonuses, net, paid ? 1 : 0);
    }
    const record = db_1.default.prepare('SELECT * FROM teacher_salary WHERE teacher_id = ? AND month = ? AND year = ?').get(req.params.id, month, year);
    return res.json(record);
});
// Get all salary records (for reports)
router.get('/salary/all', (req, res) => {
    const { month, year } = req.query;
    let query = `
    SELECT ts.*, t.name as teacher_name, t.subject
    FROM teacher_salary ts
    JOIN teachers t ON t.id = ts.teacher_id
    WHERE 1=1
  `;
    const params = [];
    if (month) {
        query += ' AND ts.month = ?';
        params.push(month);
    }
    if (year) {
        query += ' AND ts.year = ?';
        params.push(year);
    }
    query += ' ORDER BY ts.year DESC, ts.month DESC';
    const records = db_1.default.prepare(query).all(...params);
    return res.json(records);
});
exports.default = router;
