import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../nursery.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject TEXT,
    phone TEXT,
    salary REAL DEFAULT 0,
    join_date TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER,
    class_group TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    join_date TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS teacher_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    check_in TEXT,
    check_out TEXT,
    status TEXT NOT NULL DEFAULT 'present',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS student_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    check_in TEXT,
    check_out TEXT,
    status TEXT NOT NULL DEFAULT 'present',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS student_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    behavior INTEGER DEFAULT 5,
    academic INTEGER DEFAULT 5,
    social INTEGER DEFAULT 5,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS teacher_salary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    base_salary REAL DEFAULT 0,
    deductions REAL DEFAULT 0,
    bonuses REAL DEFAULT 0,
    net_salary REAL DEFAULT 0,
    paid INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
  );
`);

// Seed default admin user
const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
  console.log('Default admin user created: admin / admin123');
}

// Seed some sample data
const teacherCount = (db.prepare('SELECT COUNT(*) as count FROM teachers').get() as { count: number }).count;
if (teacherCount === 0) {
  const insertTeacher = db.prepare(
    'INSERT INTO teachers (name, subject, phone, salary, join_date, status) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertTeacher.run('سارة أحمد', 'رياضيات', '0501234567', 5000, '2023-01-15', 'active');
  insertTeacher.run('محمد علي', 'علوم', '0507654321', 5500, '2023-02-01', 'active');
  insertTeacher.run('فاطمة حسن', 'لغة عربية', '0509876543', 4800, '2023-03-10', 'active');
}

const studentCount = (db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number }).count;
if (studentCount === 0) {
  const insertStudent = db.prepare(
    'INSERT INTO students (name, age, class_group, parent_name, parent_phone, join_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  insertStudent.run('أحمد محمد', 4, 'روضة أ', 'محمد سعيد', '0551234567', '2023-09-01', 'active');
  insertStudent.run('نورة خالد', 3, 'تمهيدي', 'خالد عبدالله', '0557654321', '2023-09-01', 'active');
  insertStudent.run('عمر يوسف', 5, 'روضة ب', 'يوسف إبراهيم', '0559876543', '2023-09-01', 'active');
  insertStudent.run('ليلى سالم', 4, 'روضة أ', 'سالم عمر', '0553456789', '2023-09-15', 'active');
  insertStudent.run('ريان فيصل', 3, 'تمهيدي', 'فيصل حمد', '0556789012', '2023-09-15', 'active');
}

export default db;
