import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '',
  database: process.env.DB_NAME     || 'nursery_db',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '+00:00',
  charset: 'utf8mb4',
});

async function addColIfMissing(conn: any, table: string, col: string, def: string) {
  const [rows]: any = await conn.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, col]
  );
  if (rows.length === 0) {
    await conn.execute(`ALTER TABLE \`${table}\` ADD COLUMN ${col} ${def}`);
    console.log(`Added column ${col} to ${table}`);
  }
}

export async function initDB() {
  const conn = await pool.getConnection();
  try {
    // ───── Tables ─────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS nurseries (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(200) NOT NULL,
        address    TEXT,
        phone      VARCHAR(30),
        email      VARCHAR(100),
        status     VARCHAR(20)  DEFAULT 'active',
        plan       VARCHAR(50)  DEFAULT 'basic',
        created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        username      VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(20)  NOT NULL DEFAULT 'nursery_admin',
        created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS teachers (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(200) NOT NULL,
        subject    VARCHAR(200),
        phone      VARCHAR(30),
        salary     DECIMAL(10,2) DEFAULT 0,
        join_date  DATE,
        status     VARCHAR(20)  NOT NULL DEFAULT 'active',
        created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        name         VARCHAR(200) NOT NULL,
        age          INT,
        class_group  VARCHAR(100),
        parent_name  VARCHAR(200),
        parent_phone VARCHAR(30),
        join_date    DATE,
        status       VARCHAR(20)  NOT NULL DEFAULT 'active',
        created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS teacher_attendance (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        date       DATE NOT NULL,
        check_in   VARCHAR(10),
        check_out  VARCHAR(10),
        status     VARCHAR(20)  NOT NULL DEFAULT 'present',
        notes      TEXT,
        created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
        UNIQUE KEY uq_teacher_date (teacher_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS student_attendance (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        date       DATE NOT NULL,
        check_in   VARCHAR(10),
        check_out  VARCHAR(10),
        status     VARCHAR(20)  NOT NULL DEFAULT 'present',
        notes      TEXT,
        created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY uq_student_date (student_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS student_evaluations (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        month      TINYINT NOT NULL,
        year       SMALLINT NOT NULL,
        behavior   TINYINT DEFAULT 5,
        academic   TINYINT DEFAULT 5,
        social     TINYINT DEFAULT 5,
        notes      TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY uq_eval (student_id, month, year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS teacher_salary (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id  INT NOT NULL,
        month       TINYINT NOT NULL,
        year        SMALLINT NOT NULL,
        base_salary DECIMAL(10,2) DEFAULT 0,
        deductions  DECIMAL(10,2) DEFAULT 0,
        bonuses     DECIMAL(10,2) DEFAULT 0,
        net_salary  DECIMAL(10,2) DEFAULT 0,
        paid        TINYINT(1)    DEFAULT 0,
        created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
        UNIQUE KEY uq_salary (teacher_id, month, year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ───── Add multi-tenant columns if missing ─────
    await addColIfMissing(conn, 'users',    'nursery_id', 'INT NULL');
    await addColIfMissing(conn, 'teachers', 'nursery_id', 'INT NOT NULL DEFAULT 1');
    await addColIfMissing(conn, 'students', 'nursery_id', 'INT NOT NULL DEFAULT 1');

    // ───── Seed default nursery ─────
    const [nurseries]: any = await conn.execute('SELECT id FROM nurseries LIMIT 1');
    if (nurseries.length === 0) {
      await conn.execute(
        "INSERT INTO nurseries (id, name, status, plan) VALUES (1, 'الحضانة الرئيسية', 'active', 'basic')"
      );
      console.log('Default nursery created → الحضانة الرئيسية');
    }

    // ───── Seed admin (nursery_admin) ─────
    const [admins]: any = await conn.execute('SELECT id FROM users WHERE username = ?', ['admin']);
    if (admins.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await conn.execute(
        'INSERT INTO users (username, password_hash, role, nursery_id) VALUES (?,?,?,?)',
        ['admin', hash, 'nursery_admin', 1]
      );
      console.log('Default admin created  →  admin / admin123');
    } else {
      // Update existing admin: ensure role=nursery_admin and nursery_id=1 if NULL
      await conn.execute(
        "UPDATE users SET role='nursery_admin', nursery_id=1 WHERE username='admin' AND (nursery_id IS NULL OR role='admin')"
      );
    }

    // ───── Seed super_admin ─────
    const [superAdmins]: any = await conn.execute('SELECT id FROM users WHERE username = ?', ['superadmin']);
    if (superAdmins.length === 0) {
      const hash = await bcrypt.hash('super123', 10);
      await conn.execute(
        'INSERT INTO users (username, password_hash, role, nursery_id) VALUES (?,?,?,?)',
        ['superadmin', hash, 'super_admin', null]
      );
      console.log('Super admin created  →  superadmin / super123');
    }

    // ───── Fix existing teachers/students nursery_id ─────
    await conn.execute("UPDATE teachers SET nursery_id=1 WHERE nursery_id=0 OR nursery_id IS NULL");
    await conn.execute("UPDATE students SET nursery_id=1 WHERE nursery_id=0 OR nursery_id IS NULL");

    // ───── Seed sample data ─────
    const [tc]: any = await conn.execute('SELECT COUNT(*) AS cnt FROM teachers');
    if (tc[0].cnt === 0) {
      await conn.execute(
        'INSERT INTO teachers (name, subject, phone, salary, join_date, nursery_id) VALUES (?,?,?,?,?,?),(?,?,?,?,?,?),(?,?,?,?,?,?)',
        ['سارة أحمد','رياضيات','0501234567',5000,'2023-01-15',1,
         'محمد علي','علوم','0507654321',5500,'2023-02-01',1,
         'فاطمة حسن','لغة عربية','0509876543',4800,'2023-03-10',1]
      );
    }

    const [sc]: any = await conn.execute('SELECT COUNT(*) AS cnt FROM students');
    if (sc[0].cnt === 0) {
      await conn.execute(
        `INSERT INTO students (name, age, class_group, parent_name, parent_phone, join_date, nursery_id) VALUES
         (?,?,?,?,?,?,?),(?,?,?,?,?,?,?),(?,?,?,?,?,?,?),(?,?,?,?,?,?,?),(?,?,?,?,?,?,?)`,
        ['أحمد محمد',4,'روضة أ','محمد سعيد','0551234567','2023-09-01',1,
         'نورة خالد',3,'تمهيدي','خالد عبدالله','0557654321','2023-09-01',1,
         'عمر يوسف',5,'روضة ب','يوسف إبراهيم','0559876543','2023-09-01',1,
         'ليلى سالم',4,'روضة أ','سالم عمر','0553456789','2023-09-15',1,
         'ريان فيصل',3,'تمهيدي','فيصل حمد','0556789012','2023-09-15',1]
      );
    }

    console.log('Database ready ✓');
  } finally {
    conn.release();
  }
}

export default pool;
