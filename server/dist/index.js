"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = require("./db");
const auth_1 = __importDefault(require("./routes/auth"));
const teachers_1 = __importDefault(require("./routes/teachers"));
const students_1 = __importDefault(require("./routes/students"));
const reports_1 = __importDefault(require("./routes/reports"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'nursery-secret-key-2024';
const IS_PROD = process.env.NODE_ENV === 'production';
// ── Middleware ─────────────────────────────────────────────────────────
if (!IS_PROD) {
    app.use((0, cors_1.default)({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
}
else {
    app.use((0, cors_1.default)({ credentials: true }));
}
app.use(express_1.default.json());
// ── Auth middleware ────────────────────────────────────────────────────
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: 'غير مصرح - الرجاء تسجيل الدخول' });
    const token = authHeader.split(' ')[1];
    try {
        req.user = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return next();
    }
    catch {
        return res.status(401).json({ error: 'رمز المصادقة منتهي الصلاحية' });
    }
}
// ── API Routes ─────────────────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/teachers', requireAuth, teachers_1.default);
app.use('/api/students', requireAuth, students_1.default);
app.use('/api/reports', requireAuth, reports_1.default);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
// ── Serve React frontend (production) ─────────────────────────────────
const clientDist = path_1.default.join(__dirname, '../../client/dist');
if (fs_1.default.existsSync(clientDist)) {
    app.use(express_1.default.static(clientDist));
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(clientDist, 'index.html'));
    });
}
// ── Start ──────────────────────────────────────────────────────────────
(0, db_1.initDB)()
    .then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        if (!IS_PROD)
            console.log(`→ http://localhost:${PORT}`);
    });
})
    .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
exports.default = app;
