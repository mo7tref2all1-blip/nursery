"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
// Get all students
router.get('/', (req, res) => {
    const students = db_1.default.prepare('SELECT * FROM students ORDER BY created_at DESC').all();
    return res.json(students);
});
// Get single student
router.get('/:id', (req, res) => {
    const student = db_1.default.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    if (!student)
        return res.status(404).json({ error: 'الطالب غير موجود' });
    return res.json(student);
});
// Create student
router.post('/', (req, res) => {
    const { name, age, class_group, parent_name, parent_phone, join_date } = req.body;
    if (!name)
        return res.status(400).json({ error: 'اسم الطالب مطلوب' });
    const result = db_1.default.prepare('INSERT INTO students (name, age, class_group, parent_name, parent_phone, join_date) VALUES (?, ?, ?, ?, ?, ?)').run(name, age || 0, class_group || '', parent_name || '', parent_phone || '', join_date || new Date().toISOString().split('T')[0]);
    const student = db_1.default.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json(student);
});
// Update student
router.put('/:id', (req, res) => {
    const { name, age, class_group, parent_name, parent_phone, join_date, status } = req.body;
    const existing = db_1.default.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    if (!existing)
        return res.status(404).json({ error: 'الطالب غير موجود' });
    db_1.default.prepare('UPDATE students SET name=?, age=?, class_group=?, parent_name=?, parent_phone=?, join_date=?, status=? WHERE id=?').run(name, age, class_group, parent_name, parent_phone, join_date, status || 'active', req.params.id);
    const student = db_1.default.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    return res.json(student);
});
// Delete student
router.delete('/:id', (req, res) => {
    const existing = db_1.default.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    if (!existing)
        return res.status(404).json({ error: 'الطالب غير موجود' });
    db_1.default.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    return res.json({ success: true });
});
// --- Attendance ---
// Get attendance for a student
router.get('/:id/attendance', (req, res) => {
    const { from, to } = req.query;
    let query = 'SELECT * FROM student_attendance WHERE student_id = ?';
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
// Get today's attendance for all students
router.get('/attendance/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const records = db_1.default.prepare(`
    SELECT sa.*, s.name as student_name, s.class_group
    FROM student_attendance sa
    JOIN students s ON s.id = sa.student_id
    WHERE sa.date = ?
    ORDER BY sa.created_at DESC
  `).all(today);
    return res.json(records);
});
// Mark/update attendance
router.post('/:id/attendance', (req, res) => {
    const { date, check_in, check_out, status, notes } = req.body;
    const attendanceDate = date || new Date().toISOString().split('T')[0];
    const existing = db_1.default.prepare('SELECT * FROM student_attendance WHERE student_id = ? AND date = ?').get(req.params.id, attendanceDate);
    if (existing) {
        db_1.default.prepare('UPDATE student_attendance SET check_in=?, check_out=?, status=?, notes=? WHERE student_id=? AND date=?').run(check_in, check_out, status || 'present', notes, req.params.id, attendanceDate);
    }
    else {
        db_1.default.prepare('INSERT INTO student_attendance (student_id, date, check_in, check_out, status, notes) VALUES (?, ?, ?, ?, ?, ?)').run(req.params.id, attendanceDate, check_in, check_out, status || 'present', notes);
    }
    const record = db_1.default.prepare('SELECT * FROM student_attendance WHERE student_id = ? AND date = ?').get(req.params.id, attendanceDate);
    return res.json(record);
});
// --- Evaluations ---
// Get evaluations for a student
router.get('/:id/evaluations', (req, res) => {
    const records = db_1.default.prepare('SELECT * FROM student_evaluations WHERE student_id = ? ORDER BY year DESC, month DESC').all(req.params.id);
    return res.json(records);
});
// Create/update evaluation
router.post('/:id/evaluations', (req, res) => {
    const { month, year, behavior, academic, social, notes } = req.body;
    const existing = db_1.default.prepare('SELECT * FROM student_evaluations WHERE student_id = ? AND month = ? AND year = ?').get(req.params.id, month, year);
    if (existing) {
        db_1.default.prepare('UPDATE student_evaluations SET behavior=?, academic=?, social=?, notes=? WHERE student_id=? AND month=? AND year=?').run(behavior, academic, social, notes, req.params.id, month, year);
    }
    else {
        db_1.default.prepare('INSERT INTO student_evaluations (student_id, month, year, behavior, academic, social, notes) VALUES (?,?,?,?,?,?,?)').run(req.params.id, month, year, behavior, academic, social, notes);
    }
    const record = db_1.default.prepare('SELECT * FROM student_evaluations WHERE student_id = ? AND month = ? AND year = ?').get(req.params.id, month, year);
    return res.json(record);
});
// Get all evaluations (for reports)
router.get('/evaluations/all', (req, res) => {
    const { month, year } = req.query;
    let query = `
    SELECT se.*, s.name as student_name, s.class_group
    FROM student_evaluations se
    JOIN students s ON s.id = se.student_id
    WHERE 1=1
  `;
    const params = [];
    if (month) {
        query += ' AND se.month = ?';
        params.push(month);
    }
    if (year) {
        query += ' AND se.year = ?';
        params.push(year);
    }
    query += ' ORDER BY se.year DESC, se.month DESC';
    const records = db_1.default.prepare(query).all(...params);
    return res.json(records);
});
exports.default = router;
