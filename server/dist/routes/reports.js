"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
// Dashboard stats
router.get('/dashboard', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const totalStudents = db_1.default.prepare("SELECT COUNT(*) as count FROM students WHERE status='active'").get().count;
    const totalTeachers = db_1.default.prepare("SELECT COUNT(*) as count FROM teachers WHERE status='active'").get().count;
    const todayStudentAttendance = db_1.default.prepare("SELECT COUNT(*) as count FROM student_attendance WHERE date=? AND status='present'").get(today).count;
    const todayTeacherAttendance = db_1.default.prepare("SELECT COUNT(*) as count FROM teacher_attendance WHERE date=? AND status='present'").get(today).count;
    const recentStudentActivity = db_1.default.prepare(`
    SELECT sa.*, s.name as person_name, 'student' as type, s.class_group as extra
    FROM student_attendance sa
    JOIN students s ON s.id = sa.student_id
    ORDER BY sa.created_at DESC LIMIT 5
  `).all();
    const recentTeacherActivity = db_1.default.prepare(`
    SELECT ta.*, t.name as person_name, 'teacher' as type, t.subject as extra
    FROM teacher_attendance ta
    JOIN teachers t ON t.id = ta.teacher_id
    ORDER BY ta.created_at DESC LIMIT 5
  `).all();
    const recentActivity = [...recentStudentActivity, ...recentTeacherActivity]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 10);
    return res.json({
        totalStudents,
        totalTeachers,
        todayStudentAttendance,
        todayTeacherAttendance,
        recentActivity
    });
});
// Teacher attendance report
router.get('/teacher-attendance', (req, res) => {
    const { from, to, teacher_id } = req.query;
    let query = `
    SELECT ta.*, t.name as teacher_name, t.subject
    FROM teacher_attendance ta
    JOIN teachers t ON t.id = ta.teacher_id
    WHERE 1=1
  `;
    const params = [];
    if (teacher_id) {
        query += ' AND ta.teacher_id = ?';
        params.push(teacher_id);
    }
    if (from) {
        query += ' AND ta.date >= ?';
        params.push(from);
    }
    if (to) {
        query += ' AND ta.date <= ?';
        params.push(to);
    }
    query += ' ORDER BY ta.date DESC, t.name ASC';
    const records = db_1.default.prepare(query).all(...params);
    return res.json(records);
});
// Student attendance report
router.get('/student-attendance', (req, res) => {
    const { from, to, student_id, class_group } = req.query;
    let query = `
    SELECT sa.*, s.name as student_name, s.class_group, s.parent_name
    FROM student_attendance sa
    JOIN students s ON s.id = sa.student_id
    WHERE 1=1
  `;
    const params = [];
    if (student_id) {
        query += ' AND sa.student_id = ?';
        params.push(student_id);
    }
    if (class_group) {
        query += ' AND s.class_group = ?';
        params.push(class_group);
    }
    if (from) {
        query += ' AND sa.date >= ?';
        params.push(from);
    }
    if (to) {
        query += ' AND sa.date <= ?';
        params.push(to);
    }
    query += ' ORDER BY sa.date DESC, s.name ASC';
    const records = db_1.default.prepare(query).all(...params);
    return res.json(records);
});
// Salary report
router.get('/salary', (req, res) => {
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
    query += ' ORDER BY ts.year DESC, ts.month DESC, t.name ASC';
    const records = db_1.default.prepare(query).all(...params);
    return res.json(records);
});
// Student evaluations report
router.get('/evaluations', (req, res) => {
    const { month, year, class_group } = req.query;
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
    if (class_group) {
        query += ' AND s.class_group = ?';
        params.push(class_group);
    }
    query += ' ORDER BY se.year DESC, se.month DESC, s.name ASC';
    const records = db_1.default.prepare(query).all(...params);
    return res.json(records);
});
exports.default = router;
