import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, UserCheck, Star,
  Phone, Calendar, Users, Baby
} from 'lucide-react';
import { api } from '../api';
import { Student, StudentAttendance, StudentEvaluation } from '../types';

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

function StudentForm({ student, onSave, onClose }: { student?: Student; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: student?.name || '',
    age: student?.age || '',
    class_group: student?.class_group || '',
    parent_name: student?.parent_name || '',
    parent_phone: student?.parent_phone || '',
    join_date: student?.join_date || new Date().toISOString().split('T')[0],
    status: (student?.status || 'active') as 'active' | 'inactive',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('اسم الطفل مطلوب'); return; }
    setLoading(true);
    try {
      if (student) {
        await api.students.update(student.id, { ...form, age: Number(form.age) });
      } else {
        await api.students.create({ ...form, age: Number(form.age) });
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
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">اسم الطفل *</label>
          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            placeholder="أدخل اسم الطفل" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">العمر</label>
          <input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            placeholder="بالسنوات" min="1" max="10" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">المجموعة/الفصل</label>
          <input type="text" value={form.class_group} onChange={e => setForm({...form, class_group: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            placeholder="مثال: روضة أ" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">اسم ولي الأمر</label>
          <input type="text" value={form.parent_name} onChange={e => setForm({...form, parent_name: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            placeholder="اسم ولي الأمر" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">هاتف ولي الأمر</label>
          <input type="text" value={form.parent_phone} onChange={e => setForm({...form, parent_phone: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            placeholder="05xxxxxxxx" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">تاريخ الانضمام</label>
          <input type="date" value={form.join_date} onChange={e => setForm({...form, join_date: e.target.value})}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
        </div>
        {student && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">الحالة</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value as 'active' | 'inactive'})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all">
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-60">
          {loading ? 'جاري الحفظ...' : student ? 'حفظ التعديلات' : 'إضافة الطفل'}
        </button>
        <button type="button" onClick={onClose}
          className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all">
          إلغاء
        </button>
      </div>
    </form>
  );
}

function AttendanceModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const [records, setRecords] = useState<StudentAttendance[]>([]);
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
    const data = await api.students.getAttendance(student.id);
    setRecords(data);
    setLoading(false);
  }, [student.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.students.markAttendance(student.id, form);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`سجل حضور - ${student.name}`} onClose={onClose}>
      <div className="bg-purple-50 rounded-xl p-4 mb-5">
        <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
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
          className="mt-3 w-full bg-purple-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-purple-700 disabled:opacity-60">
          {saving ? 'جاري الحفظ...' : 'حفظ الحضور'}
        </button>
      </div>

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

function EvaluationModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const [records, setRecords] = useState<StudentEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    behavior: 5,
    academic: 5,
    social: 5,
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.students.getEvaluations(student.id);
    setRecords(data);
    setLoading(false);
  }, [student.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.students.saveEvaluation(student.id, form);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const ScoreInput = ({ label, field }: { label: string; field: 'behavior' | 'academic' | 'social' }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="range" min="1" max="10" value={form[field]}
          onChange={e => setForm({...form, [field]: Number(e.target.value)})}
          className="flex-1 accent-purple-600" />
        <span className="w-8 text-center font-bold text-purple-700 text-sm">{form[field]}</span>
      </div>
    </div>
  );

  return (
    <Modal title={`تقييم الطفل - ${student.name}`} onClose={onClose}>
      <div className="bg-amber-50 rounded-xl p-4 mb-5">
        <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
          <Star className="w-4 h-4" />
          تقييم شهري
        </h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
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
        </div>
        <div className="space-y-3">
          <ScoreInput label="السلوك (1-10)" field="behavior" />
          <ScoreInput label="الأداء الأكاديمي (1-10)" field="academic" />
          <ScoreInput label="المهارات الاجتماعية (1-10)" field="social" />
        </div>
        <div className="mt-3">
          <label className="block text-xs font-semibold text-gray-600 mb-1">ملاحظات</label>
          <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2}
            placeholder="ملاحظات حول تطور الطفل..." />
        </div>
        <button onClick={handleSave} disabled={saving}
          className="mt-3 w-full bg-amber-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-amber-700 disabled:opacity-60">
          {saving ? 'جاري الحفظ...' : 'حفظ التقييم'}
        </button>
      </div>

      <h4 className="font-bold text-gray-700 mb-3">سجل التقييمات</h4>
      {loading ? (
        <p className="text-center text-gray-400 py-6">جاري التحميل...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-400 py-6">لا توجد تقييمات</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {records.map((r) => (
            <div key={r.id} className="p-3 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-700 text-sm">{MONTHS[r.month - 1]} {r.year}</span>
                <div className="flex gap-2 text-xs">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">سلوك: {r.behavior}</span>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">أكاديمي: {r.academic}</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">اجتماعي: {r.social}</span>
                </div>
              </div>
              {r.notes && <p className="text-xs text-gray-500">{r.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | undefined>();
  const [attendanceStudent, setAttendanceStudent] = useState<Student | undefined>();
  const [evalStudent, setEvalStudent] = useState<Student | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.students.list();
    setStudents(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    await api.students.delete(id);
    setDeleteId(null);
    load();
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.class_group?.toLowerCase().includes(search.toLowerCase()) ||
    s.parent_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة الأطفال</h2>
          <p className="text-gray-500 text-sm mt-1">{students.length} طفل مسجل</p>
        </div>
        <button
          onClick={() => { setEditStudent(undefined); setShowForm(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          إضافة طفل
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
            placeholder="البحث باسم الطفل أو المجموعة أو ولي الأمر..."
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Baby className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">لا يوجد أطفال مسجلون</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">#</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">الاسم</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">العمر</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">المجموعة</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">ولي الأمر</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">الهاتف</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">تاريخ الانضمام</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">الحالة</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((student, i) => (
                  <tr key={student.id} className="table-row-hover">
                    <td className="px-6 py-4 text-sm text-gray-400">{i + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-800">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.age ? `${student.age} سنوات` : '-'}</td>
                    <td className="px-6 py-4">
                      {student.class_group ? (
                        <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                          {student.class_group}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.parent_name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {student.parent_phone ? (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {student.parent_phone}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {student.join_date || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {student.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAttendanceStudent(student)}
                          title="الحضور"
                          className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-500 hover:text-purple-700 transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEvalStudent(student)}
                          title="التقييم"
                          className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500 hover:text-amber-700 transition-colors"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditStudent(student); setShowForm(true); }}
                          title="تعديل"
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(student.id)}
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
        <Modal title={editStudent ? 'تعديل بيانات الطفل' : 'إضافة طفل جديد'} onClose={() => setShowForm(false)}>
          <StudentForm
            student={editStudent}
            onSave={() => { setShowForm(false); load(); }}
            onClose={() => setShowForm(false)}
          />
        </Modal>
      )}

      {/* Attendance Modal */}
      {attendanceStudent && (
        <AttendanceModal student={attendanceStudent} onClose={() => setAttendanceStudent(undefined)} />
      )}

      {/* Evaluation Modal */}
      {evalStudent && (
        <EvaluationModal student={evalStudent} onClose={() => setEvalStudent(undefined)} />
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 modal-overlay">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-bold text-lg text-gray-800 mb-2">تأكيد الحذف</h3>
            <p className="text-gray-500 text-sm mb-5">هل أنت متأكد من حذف هذا الطفل؟ لا يمكن التراجع عن هذه العملية.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 font-semibold hover:bg-red-600 transition-colors">
                نعم، احذف
              </button>
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
