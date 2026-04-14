import React, { useEffect, useState } from 'react';
import {
  Building2, Plus, Pencil, Trash2, Users, X, AlertCircle, CheckCircle, UserPlus, Eye,
} from 'lucide-react';
import { api } from '../../api';
import { Nursery, NurseryAdmin } from '../../types';

const planOptions = [
  { value: 'basic', label: 'أساسي' },
  { value: 'pro', label: 'احترافي' },
  { value: 'enterprise', label: 'مؤسسي' },
];

const planLabel: Record<string, string> = { basic: 'أساسي', pro: 'احترافي', enterprise: 'مؤسسي' };
const planColor: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-600',
  pro: 'bg-indigo-100 text-indigo-700',
  enterprise: 'bg-purple-100 text-purple-700',
};

const emptyForm: Partial<Nursery> = { name: '', address: '', phone: '', email: '', plan: 'basic', status: 'active' };

export default function SuperNurseries() {
  const [nurseries, setNurseries] = useState<Nursery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNursery, setEditingNursery] = useState<Nursery | null>(null);
  const [form, setForm] = useState<Partial<Nursery>>(emptyForm);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Admins modal
  const [adminsNursery, setAdminsNursery] = useState<Nursery | null>(null);
  const [admins, setAdmins] = useState<NurseryAdmin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const loadNurseries = async () => {
    setLoading(true);
    try {
      const data = await api.nurseries.list();
      setNurseries(data as Nursery[]);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNurseries(); }, []);

  const openAdd = () => {
    setEditingNursery(null);
    setForm(emptyForm);
    setFormError('');
    setFormSuccess('');
    setShowForm(true);
  };

  const openEdit = (n: Nursery) => {
    setEditingNursery(n);
    setForm({ name: n.name, address: n.address || '', phone: n.phone || '', email: n.email || '', plan: n.plan, status: n.status });
    setFormError('');
    setFormSuccess('');
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingNursery(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { setFormError('اسم الحضانة مطلوب'); return; }
    setFormLoading(true);
    setFormError('');
    try {
      if (editingNursery) {
        await api.nurseries.update(editingNursery.id, form);
        setFormSuccess('تم تحديث الحضانة بنجاح');
      } else {
        await api.nurseries.create(form);
        setFormSuccess('تم إضافة الحضانة بنجاح');
      }
      await loadNurseries();
      setTimeout(closeForm, 800);
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (n: Nursery) => {
    if (!confirm(`هل تريد إيقاف حضانة "${n.name}"؟`)) return;
    try {
      await api.nurseries.delete(n.id);
      await loadNurseries();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    }
  };

  const openAdmins = async (n: Nursery) => {
    setAdminsNursery(n);
    setAdminsLoading(true);
    setAdminError('');
    setAdminSuccess('');
    setAdminForm({ username: '', password: '' });
    try {
      const data = await api.nurseries.getAdmins(n.id);
      setAdmins(data as NurseryAdmin[]);
    } catch {
      setAdmins([]);
    } finally {
      setAdminsLoading(false);
    }
  };

  const closeAdmins = () => setAdminsNursery(null);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.username.trim() || !adminForm.password.trim()) {
      setAdminError('اسم المستخدم وكلمة المرور مطلوبان');
      return;
    }
    if (!adminsNursery) return;
    setAdminSubmitting(true);
    setAdminError('');
    try {
      await api.nurseries.addAdmin(adminsNursery.id, adminForm);
      setAdminSuccess('تم إضافة المسؤول بنجاح');
      setAdminForm({ username: '', password: '' });
      const data = await api.nurseries.getAdmins(adminsNursery.id);
      setAdmins(data as NurseryAdmin[]);
    } catch (err: any) {
      setAdminError(err.message || 'حدث خطأ');
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (userId: number) => {
    if (!adminsNursery) return;
    if (!confirm('هل تريد حذف هذا المسؤول؟')) return;
    try {
      await api.nurseries.removeAdmin(adminsNursery.id, userId);
      const data = await api.nurseries.getAdmins(adminsNursery.id);
      setAdmins(data as NurseryAdmin[]);
    } catch (err: any) {
      setAdminError(err.message || 'حدث خطأ');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">إدارة الحضانات</h2>
          <p className="text-gray-500 text-sm mt-1">إضافة وإدارة جميع الحضانات في المنصة</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          إضافة حضانة
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : nurseries.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">لا توجد حضانات بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-600">الاسم</th>
                  <th className="text-right px-4 py-3.5 font-semibold text-gray-600">الباقة</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600">المعلمون</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600">الأطفال</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600">المسؤولون</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600">الحالة</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {nurseries.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-indigo-100 p-1.5 rounded-lg">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{n.name}</p>
                          {n.phone && <p className="text-xs text-gray-400">{n.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${planColor[n.plan] || planColor.basic}`}>
                        {planLabel[n.plan] || n.plan}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-semibold text-indigo-700">{n.teacher_count || 0}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-semibold text-purple-700">{n.student_count || 0}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-semibold text-emerald-700">{n.admin_count || 0}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        n.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {n.status === 'active' ? 'نشطة' : 'موقوفة'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openAdmins(n)}
                          title="إدارة المسؤولين"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(n)}
                          title="تعديل"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(n)}
                          title="إيقاف"
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Add/Edit Nursery Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {editingNursery ? 'تعديل الحضانة' : 'إضافة حضانة جديدة'}
              </h3>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}
              {formSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl p-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-600">{formSuccess}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">اسم الحضانة *</label>
                <input
                  type="text"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="مثال: حضانة النور"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">العنوان</label>
                <input
                  type="text"
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="عنوان الحضانة"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">الهاتف</label>
                  <input
                    type="text"
                    value={form.phone || ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    placeholder="05XXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">الباقة</label>
                  <select
                    value={form.plan || 'basic'}
                    onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
                  >
                    {planOptions.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">الحالة</label>
                  <select
                    value={form.status || 'active'}
                    onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
                  >
                    <option value="active">نشطة</option>
                    <option value="inactive">موقوفة</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
                >
                  {formLoading ? 'جاري الحفظ...' : editingNursery ? 'حفظ التعديلات' : 'إضافة الحضانة'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Admins Modal */}
      {adminsNursery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-gray-800">مسؤولو الحضانة</h3>
                <p className="text-sm text-gray-500">{adminsNursery.name}</p>
              </div>
              <button onClick={closeAdmins} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Current admins */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">المسؤولون الحاليون</h4>
                {adminsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                ) : admins.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">لا يوجد مسؤولون بعد</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {admins.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {admin.username?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{admin.username}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(admin.created_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAdmin(admin.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add admin form */}
              <div className="border-t border-gray-100 pt-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  إضافة مسؤول جديد
                </h4>

                {adminError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-3">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-600">{adminError}</p>
                  </div>
                )}
                {adminSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl p-3 mb-3">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-green-600">{adminSuccess}</p>
                  </div>
                )}

                <form onSubmit={handleAddAdmin} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">اسم المستخدم</label>
                      <input
                        type="text"
                        value={adminForm.username}
                        onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        placeholder="username"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">كلمة المرور</label>
                      <input
                        type="password"
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        placeholder="••••••"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={adminSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    {adminSubmitting ? 'جاري الإضافة...' : 'إضافة المسؤول'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
