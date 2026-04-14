export interface User {
  id: number;
  username: string;
  role: 'super_admin' | 'nursery_admin';
  nursery_id: number | null;
}

export interface Nursery {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  plan: string;
  teacher_count?: number;
  student_count?: number;
  admin_count?: number;
  created_at: string;
}

export interface NurseryAdmin {
  id: number;
  username: string;
  role: string;
  nursery_id: number;
  created_at: string;
}

export interface Teacher {
  id: number;
  name: string;
  subject: string;
  phone: string;
  salary: number;
  join_date: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Student {
  id: number;
  name: string;
  age: number;
  class_group: string;
  parent_name: string;
  parent_phone: string;
  join_date: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface TeacherAttendance {
  id: number;
  teacher_id: number;
  teacher_name?: string;
  subject?: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'absent' | 'late';
  notes: string | null;
  created_at: string;
}

export interface StudentAttendance {
  id: number;
  student_id: number;
  student_name?: string;
  class_group?: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'absent' | 'late';
  notes: string | null;
  created_at: string;
}

export interface StudentEvaluation {
  id: number;
  student_id: number;
  student_name?: string;
  class_group?: string;
  month: number;
  year: number;
  behavior: number;
  academic: number;
  social: number;
  notes: string | null;
  created_at: string;
}

export interface TeacherSalary {
  id: number;
  teacher_id: number;
  teacher_name?: string;
  subject?: string;
  month: number;
  year: number;
  base_salary: number;
  deductions: number;
  bonuses: number;
  net_salary: number;
  paid: number;
  created_at: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  todayStudentAttendance: number;
  todayTeacherAttendance: number;
  recentActivity: Array<TeacherAttendance | StudentAttendance>;
}
