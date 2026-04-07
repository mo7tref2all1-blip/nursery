const BASE_URL = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('غير مصرح');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'حدث خطأ');
  }
  return data as T;
}

// Auth
export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
  },

  // Dashboard
  dashboard: {
    stats: () => request<any>('/reports/dashboard'),
  },

  // Teachers
  teachers: {
    list: () => request<any[]>('/teachers'),
    get: (id: number) => request<any>(`/teachers/${id}`),
    create: (data: any) => request<any>('/teachers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<any>(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<any>(`/teachers/${id}`, { method: 'DELETE' }),
    // Attendance
    getAttendance: (id: number, from?: string, to?: string) => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return request<any[]>(`/teachers/${id}/attendance?${params}`);
    },
    getTodayAttendance: () => request<any[]>('/teachers/attendance/today'),
    markAttendance: (id: number, data: any) =>
      request<any>(`/teachers/${id}/attendance`, { method: 'POST', body: JSON.stringify(data) }),
    // Salary
    getSalary: (id: number) => request<any[]>(`/teachers/${id}/salary`),
    saveSalary: (id: number, data: any) =>
      request<any>(`/teachers/${id}/salary`, { method: 'POST', body: JSON.stringify(data) }),
    getAllSalary: (month?: number, year?: number) => {
      const params = new URLSearchParams();
      if (month) params.set('month', String(month));
      if (year) params.set('year', String(year));
      return request<any[]>(`/teachers/salary/all?${params}`);
    },
  },

  // Students
  students: {
    list: () => request<any[]>('/students'),
    get: (id: number) => request<any>(`/students/${id}`),
    create: (data: any) => request<any>('/students', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<any>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<any>(`/students/${id}`, { method: 'DELETE' }),
    // Attendance
    getAttendance: (id: number, from?: string, to?: string) => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return request<any[]>(`/students/${id}/attendance?${params}`);
    },
    getTodayAttendance: () => request<any[]>('/students/attendance/today'),
    markAttendance: (id: number, data: any) =>
      request<any>(`/students/${id}/attendance`, { method: 'POST', body: JSON.stringify(data) }),
    // Evaluations
    getEvaluations: (id: number) => request<any[]>(`/students/${id}/evaluations`),
    saveEvaluation: (id: number, data: any) =>
      request<any>(`/students/${id}/evaluations`, { method: 'POST', body: JSON.stringify(data) }),
    getAllEvaluations: (month?: number, year?: number, class_group?: string) => {
      const params = new URLSearchParams();
      if (month) params.set('month', String(month));
      if (year) params.set('year', String(year));
      if (class_group) params.set('class_group', class_group);
      return request<any[]>(`/students/evaluations/all?${params}`);
    },
  },

  // Reports
  reports: {
    teacherAttendance: (from?: string, to?: string, teacher_id?: number) => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (teacher_id) params.set('teacher_id', String(teacher_id));
      return request<any[]>(`/reports/teacher-attendance?${params}`);
    },
    studentAttendance: (from?: string, to?: string, student_id?: number, class_group?: string) => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (student_id) params.set('student_id', String(student_id));
      if (class_group) params.set('class_group', class_group);
      return request<any[]>(`/reports/student-attendance?${params}`);
    },
    salary: (month?: number, year?: number) => {
      const params = new URLSearchParams();
      if (month) params.set('month', String(month));
      if (year) params.set('year', String(year));
      return request<any[]>(`/reports/salary?${params}`);
    },
    evaluations: (month?: number, year?: number, class_group?: string) => {
      const params = new URLSearchParams();
      if (month) params.set('month', String(month));
      if (year) params.set('year', String(year));
      if (class_group) params.set('class_group', class_group);
      return request<any[]>(`/reports/evaluations?${params}`);
    },
  },
};
