import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Check, Clock, DollarSign,
  ChevronDown, ChevronUp, UserCheck, Calendar, Phone, BookOpen
} from 'lucide-react';
import { api } from '../api';
import { Teacher, TeacherAttendance, TeacherSalary } from '../types';

const statusLabel: Record<string, string> = {
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
};

const statusClass: Record<string, string> = {
  present: 'badge-present',
  absent: 'badge-absent',
  late: 'badge-late',
};

const MONTHS = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'
];

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function TeacherForm({ teacher, onSave, onClose }: { teacher?: Teacher; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: teacher?.name || '',
    subject: teacher?.subject || '',
    phone: teacher?.phone || '',
    salary: teacher?.salary || '',
    join_date: teacher?.join_date || new Date().toISOString().split('T')[0],
    status: (teacher?.status || 'active') as 'active' | 'inactive',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('اسم المعلم مطلوب'); return; }
    setLoading(true);
    try {
      if (teacher) {
        await api.teachers.update(teacher.id, { ...form, salary: Number(form.salary) });
      } else {
        await api.teachers.create({ ...form, salary: Number(form.salary) });
      }
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">الاسم الكامل *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            placeholder="أدخل اسم المعلم"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">التخصص</label>
          <input
            type="text"
            value={form.subject}
            onChange={e => setForm({...form, subject: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            placeholder="مثال: رياضيات"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">رقم الهاتف</label>
          <input
            type="text"
            value={form.phone}
            onChange={e => setForm({...form, phone: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            placeholder="05xxxxxxxx"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">الراتب الأساسي</label>
          <input
            type="number"
            value={form.salary}
            onChange={e => setForm({...form, salary: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">تاريخ الانضمام</label>
          <input
            type="date"
            value={form.join_date}
            onChange={e => setForm({...form, join_date: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>
        {teacher && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">الحالة</label>
            <select
              value={form.status}
              onChange={e => setForm({...form, status: e.target.value as 'active' | 'inactive'})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            >
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-60"
        >
          {loading ? 'جاري الحفظ...' : teacher ? 'حفظ التعديلات' : 'إضافة المعلم'}
        </button>
        <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all">
          إلغاء
        </button>
      </div>
    </form>
  );
}

function AttendanceModal({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const [records, setRecords] = useState<TeacherAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    check_in: new Date().toTimeString().slice(0, 5),
    check_out: '',
    status: 'present',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.teachers.getAttendance(teacher.id);
    setRecords(data);
    setLoading(false);
  }, [teacher.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.teachers.markAttendance(teacher.id, form);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`سجل حضور - ${teacher.name}`} onClose={onClose}>
      {/* Mark Attendance Form */}
      <div className="bg-indigo-50 rounded-xl p-4 mb-5">
        <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4" />
          تسجيل الحضور
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">التاريخ</label>
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">الحالة</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="present">حاضر</option>
              <option value="absent">غائب</option>
              <option value="late">متأخر</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">وقت الدخول</label>
            <input type="time" value={form.check_in} onChange={e => setForm({...form, check_in: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">وقت الخروج</label>
            <input type="time" value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">ملاحظات</label>
            <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="ملاحظات اختيارية" />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="mt-3 w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
          {saving ? 'جاري الحفظ...' : 'حفظ الحضور'}
        </button>
      </div>

      {/* History */}
      <h4 className="font-bold text-gray-700 mb-3">سجل الحضور</h4>
      {loading ? (
        <p className="text-center text-gray-400 py-6">جاري التحميل...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-400 py-6">لا توجد سجلات حضور</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {records.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusClass[r.status]}`}>
                  {statusLabel[r.status]}
                </span>
                <span className="text-sm text-gray-600">{r.date}</span>
              </div>
              <div className="text-xs text-gray-400 flex gap-2">
                {r.check_in && <span>دخول: {r.check_in}</span>}
                {r.check_out && <span>خروج: {r.check_out}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function SalaryModal({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const [records, setRecords] = useState<TeacherSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    base_salary: teacher.salary,
    deductions: 0,
    bonuses: 0,
    paid: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.teachers.getSalary(teacher.id);
    setRecords(data);
    setLoading(false);
  }, [teacher.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.teachers.saveSalary(teacher.id, form);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const net = Number(form.base_salary) - Number(form.deductions) + Number(form.bonuses);

  return (
    <Modal title={`إدارة الراتب - ${teacher.name}`} onClose={onClose}>
      <div className="bg-emerald-50 rounded-xl p-4 mb-5">
        <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          تسجيل راتب شهري
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">الشهر</label>
            <select value={form.month} onChange={e => setForm({...form, month: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">السنة</label>
            <input type="number" value={form.year} onChange={e => setForm({...form, year: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">الراتب الأساسي</label>
            <input type="number" value={form.base_salary} onChange={e => setForm({...form, base_salary: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">الخصومات</label>
            <input type="number" value={form.deductions} onChange={e => setForm({...form, deductions: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">المكافآت</label>
            <input type="number" value={form.bonuses} onChange={e => setForm({...form, bonuses: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="flex items-end">
            <div className="bg-white rounded-lg px-3 py-2 border border-emerald-200 w-full">
              <p className="text-xs text-gray-500">صافي الراتب</p>
              <p className="font-bold text-emerald-700 text-lg">{net.toLocaleString()} ر.س</p>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="paid" checked={form.paid} onChange={e => setForm({...form, paid: e.target.checked})}
              className="w-4 h-4 rounded" />
            <label htmlFor="paid" className="text-sm text-gray-700 font-medium">تم الصرف</label>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="mt-3 w-full bg-emerald-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
          {saving ? 'جاري الحفظ...' : 'حفظ السجل'}
        </button>
      </div>

      <h4 className="font-bold text-gray-700 mb-3">سجل الرواتب</h4>
      {loading ? (
        <p className="text-center text-gray-400 py-6">جاري التحميل...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-400 py-6">لا توجد سجلات رواتب</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {records.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <span className="text-sm font-semibold text-gray-700">{MONTHS[r.month - 1]} {r.year}</span>
                <p className="text-xs text-gray-400">أساسي: {r.base_salary} | خصم: {r.deductions} | مكافأة: {r.bonuses}</p>
              </div>
              <div className="text-left">
                <p className="font-bold text-emerald-700">{r.net_salary.toLocaleString()} ر.س</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {r.paid ? 'مصروف' : 'معلق'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | undefined>();
  const [attendanceTeacher, setAttendanceTeacher] = useState<Teacher | undefined>();
  const [salaryTeacher, setSalaryTeacher] = useState<Teacher | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.teachers.list();
    setTeachers(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    await api.teachers.delete(id);
    setDeleteId(null);
    load();
  };

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة المعلمين</h2>
          <p className="text-gray-500 text-sm mt-1">{teachers.length} معلم مسجل</p>
        </div>
        <button
          onClick={() => { setEditTeacher(undefined); setShowForm(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          إضافة معلم
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="البحث باسم المعلم أو التخصص..."
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">لا يوجد معلمون</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">#</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">الاسم</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">التخصص</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">الهاتف</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">الراتب</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">تاريخ الانضمام</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">الحالة</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((teacher, i) => (
                  <tr key={teacher.id} className="table-row-hover">
                    <td className="px-6 py-4 text-sm text-gray-400">{i + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                          {teacher.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-800">{teacher.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{teacher.subject || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-1">
                      {teacher.phone ? <><Phone className="w-3 h-3" />{teacher.phone}</> : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-emerald-700">{teacher.salary?.toLocaleString()} ر.س</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {teacher.join_date || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        teacher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {teacher.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAttendanceTeacher(teacher)}
                          title="الحضور"
                          className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-500 hover:text-indigo-700 transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSalaryTeacher(teacher)}
                          title="الراتب"
                          className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-500 hover:text-emerald-700 transition-colors"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditTeacher(teacher); setShowForm(true); }}
                          title="تعديل"
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(teacher.id)}
                          title="حذف"
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <Modal title={editTeacher ? 'تعديل بيانات المعلم' : 'إضافة معلم جديد'} onClose={() => setShowForm(false)}>
          <TeacherForm
            teacher={editTeacher}
            onSave={() => { setShowForm(false); load(); }}
            onClose={() => setShowForm(false)}
          />
        </Modal>
      )}

      {/* Attendance Modal */}
      {attendanceTeacher && (
        <AttendanceModal teacher={attendanceTeacher} onClose={() => setAttendanceTeacher(undefined)} />
      )}

      {/* Salary Modal */}
      {salaryTeacher && (
        <SalaryModal teacher={salaryTeacher} onClose={() => setSalaryTeacher(undefined)} />
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 modal-overlay">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-bold text-lg text-gray-800 mb-2">تأكيد الحذف</h3>
            <p className="text-gray-500 text-sm mb-5">هل أنت متأكد من حذف هذا المعلم؟ لا يمكن التراجع عن هذه العملية.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 font-semibold hover:bg-red-600 transition-colors"
              >
                نعم، احذف
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
