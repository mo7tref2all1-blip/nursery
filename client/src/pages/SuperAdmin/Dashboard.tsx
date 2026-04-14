import React, { useEffect, useState } from 'react';
import { Building2, Users, GraduationCap, TrendingUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import StatCard from '../../components/StatCard';

export default function SuperDashboard() {
  const [nurseries, setNurseries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.nurseries.list().then((data) => {
      setNurseries(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalTeachers = nurseries.reduce((s, n) => s + (Number(n.teacher_count) || 0), 0);
  const totalStudents = nurseries.reduce((s, n) => s + (Number(n.student_count) || 0), 0);
  const activeNurseries = nurseries.filter((n) => n.status === 'active').length;

  const today = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleManageNursery = (nurseryId: number) => {
    localStorage.setItem('selectedNurseryId', String(nurseryId));
    navigate('/super/nurseries');
  };

  const planLabel: Record<string, string> = {
    basic: 'أساسي',
    pro: 'احترافي',
    enterprise: 'مؤسسي',
  };

  const planColor: Record<string, string> = {
    basic: 'bg-gray-100 text-gray-600',
    pro: 'bg-indigo-100 text-indigo-700',
    enterprise: 'bg-purple-100 text-purple-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">لوحة التحكم الرئيسية</h2>
          <p className="text-gray-500 text-sm mt-1">{today}</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <span className="text-purple-700 text-sm font-medium">المشرف العام</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="إجمالي الحضانات"
          value={nurseries.length}
          icon={Building2}
          color="purple"
          subtitle={`${activeNurseries} نشطة`}
        />
        <StatCard
          title="إجمالي المعلمين"
          value={totalTeachers}
          icon={GraduationCap}
          color="indigo"
          subtitle="في جميع الحضانات"
        />
        <StatCard
          title="إجمالي الأطفال"
          value={totalStudents}
          icon={Users}
          color="green"
          subtitle="في جميع الحضانات"
        />
      </div>

      {/* Nurseries Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">الحضانات</h3>
          <button
            onClick={() => navigate('/super/nurseries')}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            إدارة الحضانات
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {nurseries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">لا توجد حضانات مسجلة بعد</p>
            <button
              onClick={() => navigate('/super/nurseries')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
            >
              إضافة حضانة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {nurseries.map((nursery) => (
              <div
                key={nursery.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-indigo-100 p-2 rounded-xl">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{nursery.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColor[nursery.plan] || planColor.basic}`}>
                        {planLabel[nursery.plan] || nursery.plan}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    nursery.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {nursery.status === 'active' ? 'نشطة' : 'موقوفة'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-indigo-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-bold text-indigo-700">{nursery.teacher_count || 0}</p>
                    <p className="text-xs text-indigo-500">معلم</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-bold text-purple-700">{nursery.student_count || 0}</p>
                    <p className="text-xs text-purple-500">طفل</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-bold text-emerald-700">{nursery.admin_count || 0}</p>
                    <p className="text-xs text-emerald-500">مسؤول</p>
                  </div>
                </div>

                <button
                  onClick={() => handleManageNursery(nursery.id)}
                  className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-sm py-2 rounded-xl transition-colors"
                >
                  إدارة الحضانة
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
