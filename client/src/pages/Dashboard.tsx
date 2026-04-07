import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, UserCheck, BookOpen, Clock, TrendingUp } from 'lucide-react';
import StatCard from '../components/StatCard';
import { api } from '../api';

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

const typeLabel: Record<string, string> = {
  teacher: 'معلم',
  student: 'طالب',
};

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.stats().then((data) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
          <h2 className="text-2xl font-bold text-gray-800">لوحة التحكم</h2>
          <p className="text-gray-500 text-sm mt-1">{today}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span className="text-indigo-700 text-sm font-medium">نظرة عامة</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="إجمالي الأطفال"
          value={stats?.totalStudents ?? 0}
          icon={Users}
          color="purple"
          subtitle="طفل مسجل"
        />
        <StatCard
          title="إجمالي المعلمين"
          value={stats?.totalTeachers ?? 0}
          icon={GraduationCap}
          color="indigo"
          subtitle="معلم نشط"
        />
        <StatCard
          title="حضور الأطفال اليوم"
          value={stats?.todayStudentAttendance ?? 0}
          icon={UserCheck}
          color="green"
          subtitle="حاضر اليوم"
        />
        <StatCard
          title="حضور المعلمين اليوم"
          value={stats?.todayTeacherAttendance ?? 0}
          icon={BookOpen}
          color="blue"
          subtitle="حاضر اليوم"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">آخر النشاطات</h3>
          </div>
          <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-lg">
            آخر 10 سجلات
          </span>
        </div>

        {stats?.recentActivity?.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {stats.recentActivity.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-6 py-4 table-row-hover">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    item.type === 'teacher' ? 'bg-indigo-500' : 'bg-purple-500'
                  }`}>
                    {item.person_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{item.person_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.type === 'teacher' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {typeLabel[item.type] || item.type}
                      </span>
                      <span className="text-xs text-gray-400">{item.extra}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <p className="text-sm text-gray-500">{item.date}</p>
                    {item.check_in && (
                      <p className="text-xs text-gray-400">دخول: {item.check_in}</p>
                    )}
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${statusClass[item.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabel[item.status] || item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">لا توجد نشاطات حديثة</p>
            <p className="text-gray-300 text-xs mt-1">ابدأ بتسجيل حضور المعلمين والأطفال</p>
          </div>
        )}
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <h3 className="font-bold text-lg mb-2">معدل الحضور اليوم</h3>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-4xl font-bold">
              {stats?.totalStudents > 0
                ? Math.round((stats.todayStudentAttendance / stats.totalStudents) * 100)
                : 0}%
            </span>
            <span className="text-indigo-200 mb-1">من الأطفال</span>
          </div>
          <div className="bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{
                width: `${stats?.totalStudents > 0
                  ? Math.round((stats.todayStudentAttendance / stats.totalStudents) * 100)
                  : 0}%`
              }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
          <h3 className="font-bold text-lg mb-2">معدل حضور المعلمين</h3>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-4xl font-bold">
              {stats?.totalTeachers > 0
                ? Math.round((stats.todayTeacherAttendance / stats.totalTeachers) * 100)
                : 0}%
            </span>
            <span className="text-emerald-100 mb-1">من المعلمين</span>
          </div>
          <div className="bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{
                width: `${stats?.totalTeachers > 0
                  ? Math.round((stats.todayTeacherAttendance / stats.totalTeachers) * 100)
                  : 0}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
