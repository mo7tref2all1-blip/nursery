"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
// Dashboard stats
router.get('/dashboard', async (_req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const [[ts]] = await db_1.default.execute("SELECT COUNT(*) AS cnt FROM teachers WHERE status='active'");
    const [[ss]] = await db_1.default.execute("SELECT COUNT(*) AS cnt FROM students WHERE status='active'");
    const [[ta]] = await db_1.default.execute("SELECT COUNT(*) AS cnt FROM teacher_attendance WHERE date=? AND status='present'", [today]);
    const [[sa]] = await db_1.default.execute("SELECT COUNT(*) AS cnt FROM student_attendance WHERE date=? AND status='present'", [today]);
    const [recentStudents] = await db_1.default.execute(`
    SELECT sa.*, s.name AS person_name, 'student' AS type, s.class_group AS extra
    FROM student_attendance sa JOIN students s ON s.id = sa.student_id
    ORDER BY sa.created_at DESC LIMIT 5
  `);
    const [recentTeachers] = await db_1.default.execute(`
    SELECT ta.*, t.name AS person_name, 'teacher' AS type, t.subject AS extra
    FROM teacher_attendance ta JOIN teachers t ON t.id = ta.teacher_id
    ORDER BY ta.created_at DESC LIMIT 5
  `);
    const recentActivity = [...recentStudents, ...recentTeachers]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
    return res.json({
        totalTeachers: ts.cnt,
        totalStudents: ss.cnt,
        todayTeacherAttendance: ta.cnt,
        todayStudentAttendance: sa.cnt,
        recentActivity,
    });
});
// Teacher attendance report
router.get('/teacher-attendance', async (req, res) => {
    const { from, to, teacher_id } = req.query;
    let sql = `
    SELECT ta.*, t.name AS teacher_name, t.subject
    FROM teacher_attendance ta JOIN teachers t ON t.id = ta.teacher_id WHERE 1=1
  `;
    const params = [];
    if (teacher_id) {
        sql += ' AND ta.teacher_id = ?';
        params.push(teacher_id);
    }
    if (from) {
        sql += ' AND ta.date >= ?';
        params.push(from);
    }
    if (to) {
        sql += ' AND ta.date <= ?';
        params.push(to);
    }
    sql += ' ORDER BY ta.date DESC, t.name ASC';
    const [rows] = await db_1.default.execute(sql, params);
    return res.json(rows);
});
// Student attendance report
router.get('/student-attendance', async (req, res) => {
    const { from, to, student_id, class_group } = req.query;
    let sql = `
    SELECT sa.*, s.name AS student_name, s.class_group, s.parent_name
    FROM student_attendance sa JOIN students s ON s.id = sa.student_id WHERE 1=1
  `;
    const params = [];
    if (student_id) {
        sql += ' AND sa.student_id = ?';
        params.push(student_id);
    }
    if (class_group) {
        sql += ' AND s.class_group = ?';
        params.push(class_group);
    }
    if (from) {
        sql += ' AND sa.date >= ?';
        params.push(from);
    }
    if (to) {
        sql += ' AND sa.date <= ?';
        params.push(to);
    }
    sql += ' ORDER BY sa.date DESC, s.name ASC';
    const [rows] = await db_1.default.execute(sql, params);
    return res.json(rows);
});
// Salary report
router.get('/salary', async (req, res) => {
    const { month, year } = req.query;
    let sql = `
    SELECT ts.*, t.name AS teacher_name, t.subject
    FROM teacher_salary ts JOIN teachers t ON t.id = ts.teacher_id WHERE 1=1
  `;
    const params = [];
    if (month) {
        sql += ' AND ts.month = ?';
        params.push(month);
    }
    if (year) {
        sql += ' AND ts.year  = ?';
        params.push(year);
    }
    sql += ' ORDER BY ts.year DESC, ts.month DESC, t.name ASC';
    const [rows] = await db_1.default.execute(sql, params);
    return res.json(rows);
});
// Student evaluations report
router.get('/evaluations', async (req, res) => {
    const { month, year, class_group } = req.query;
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
    if (class_group) {
        sql += ' AND s.class_group = ?';
        params.push(class_group);
    }
    sql += ' ORDER BY se.year DESC, se.month DESC, s.name ASC';
    const [rows] = await db_1.default.execute(sql, params);
    return res.json(rows);
});
exports.default = router;
