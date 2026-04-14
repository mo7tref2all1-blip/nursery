"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
// GET /api/nurseries - list all nurseries with stats
router.get('/', async (_req, res) => {
    const [rows] = await db_1.default.execute(`
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
router.post('/', async (req, res) => {
    const { name, address, phone, email, plan, status } = req.body;
    if (!name)
        return res.status(400).json({ error: 'اسم الحضانة مطلوب' });
    const [result] = await db_1.default.execute('INSERT INTO nurseries (name, address, phone, email, plan, status) VALUES (?,?,?,?,?,?)', [name, address || null, phone || null, email || null, plan || 'basic', status || 'active']);
    const [rows] = await db_1.default.execute('SELECT * FROM nurseries WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
});
// PUT /api/nurseries/:id - update nursery
router.put('/:id', async (req, res) => {
    const { name, address, phone, email, plan, status } = req.body;
    const [existing] = await db_1.default.execute('SELECT id FROM nurseries WHERE id = ?', [req.params.id]);
    if (!existing[0])
        return res.status(404).json({ error: 'الحضانة غير موجودة' });
    await db_1.default.execute('UPDATE nurseries SET name=?, address=?, phone=?, email=?, plan=?, status=? WHERE id=?', [name, address || null, phone || null, email || null, plan || 'basic', status || 'active', req.params.id]);
    const [rows] = await db_1.default.execute('SELECT * FROM nurseries WHERE id = ?', [req.params.id]);
    return res.json(rows[0]);
});
// DELETE /api/nurseries/:id - deactivate nursery
router.delete('/:id', async (req, res) => {
    const [existing] = await db_1.default.execute('SELECT id FROM nurseries WHERE id = ?', [req.params.id]);
    if (!existing[0])
        return res.status(404).json({ error: 'الحضانة غير موجودة' });
    await db_1.default.execute("UPDATE nurseries SET status='inactive' WHERE id=?", [req.params.id]);
    return res.json({ success: true });
});
// GET /api/nurseries/:id/admins - list admins of this nursery
router.get('/:id/admins', async (req, res) => {
    const [rows] = await db_1.default.execute("SELECT id, username, role, nursery_id, created_at FROM users WHERE nursery_id = ? AND role = 'nursery_admin' ORDER BY created_at DESC", [req.params.id]);
    return res.json(rows);
});
// POST /api/nurseries/:id/admins - create a new nursery_admin for this nursery
router.post('/:id/admins', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
    const [existing] = await db_1.default.execute('SELECT id FROM nurseries WHERE id = ?', [req.params.id]);
    if (!existing[0])
        return res.status(404).json({ error: 'الحضانة غير موجودة' });
    const [dup] = await db_1.default.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (dup[0])
        return res.status(400).json({ error: 'اسم المستخدم مستخدم بالفعل' });
    const hash = await bcryptjs_1.default.hash(password, 10);
    const [result] = await db_1.default.execute('INSERT INTO users (username, password_hash, role, nursery_id) VALUES (?,?,?,?)', [username, hash, 'nursery_admin', req.params.id]);
    const [rows] = await db_1.default.execute('SELECT id, username, role, nursery_id, created_at FROM users WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
});
// DELETE /api/nurseries/:id/admins/:userId - delete an admin user
router.delete('/:id/admins/:userId', async (req, res) => {
    const [existing] = await db_1.default.execute("SELECT id FROM users WHERE id = ? AND nursery_id = ? AND role = 'nursery_admin'", [req.params.userId, req.params.id]);
    if (!existing[0])
        return res.status(404).json({ error: 'المستخدم غير موجود' });
    await db_1.default.execute('DELETE FROM users WHERE id = ?', [req.params.userId]);
    return res.json({ success: true });
});
exports.default = router;
