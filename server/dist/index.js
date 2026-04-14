"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = __importDefault(require("./routes/auth"));
const teachers_1 = __importDefault(require("./routes/teachers"));
const students_1 = __importDefault(require("./routes/students"));
const reports_1 = __importDefault(require("./routes/reports"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'nursery-secret-key-2024';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
// Middleware
if (!IS_PRODUCTION) {
    // Dev: allow Vite dev server
    app.use((0, cors_1.default)({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
}
else {
    // Production: same-origin requests only (React served by Express)
    app.use((0, cors_1.default)({ credentials: true }));
}
app.use(express_1.default.json());
// Auth middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: 'غير مصرح - الرجاء تسجيل الدخول' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        return next();
    }
    catch {
        return res.status(401).json({ error: 'رمز المصادقة منتهي الصلاحية' });
    }
}
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/teachers', requireAuth, teachers_1.default);
app.use('/api/students', requireAuth, students_1.default);
app.use('/api/reports', requireAuth, reports_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// --- Serve React frontend in production ---
const clientDist = path_1.default.join(__dirname, '../../client/dist');
if (fs_1.default.existsSync(clientDist)) {
    app.use(express_1.default.static(clientDist));
    // All non-API routes → React app (handles client-side routing)
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(clientDist, 'index.html'));
    });
}
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (!IS_PRODUCTION)
        console.log(`http://localhost:${PORT}`);
});
exports.default = app;
