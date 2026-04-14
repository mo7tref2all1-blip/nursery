"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'nursery-secret-key-2024';
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
    const [rows] = await db_1.default.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user)
        return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    const valid = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!valid)
        return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role, nursery_id: user.nursery_id }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role, nursery_id: user.nursery_id }
    });
});
router.post('/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: 'غير مصرح' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return res.json({ valid: true, user: decoded });
    }
    catch {
        return res.status(401).json({ error: 'رمز منتهي الصلاحية' });
    }
});
exports.default = router;
