import React, { useState } from 'react';
import { FileText, Download, Filter, BarChart3, Users, GraduationCap, DollarSign, Star } from 'lucide-react';
import { api } from '../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const MONTHS = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'
];

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

type ReportType = 'teacher-attendance' | 'student-attendance' | 'salary' | 'evaluations';

const reportTabs = [
  { key: 'teacher-attendance' as ReportType, label: 'حضور المعلمين', icon: GraduationCap, color: 'indigo' },
  { key: 'student-attendance' as ReportType, label: 'حضور الأطفال', icon: Users, color: 'purple' },
  { key: 'salary' as ReportType, label: 'الرواتب', icon: DollarSign, color: 'emerald' },
  { key: 'evaluations' as ReportType, label: 'تقييمات الأطفال', icon: Star, color: 'amber' },
];

// Simple PDF export that works without Arabic font issues
function exportToPDF(title: string, headers: string[], rows: (string | number)[][]) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text(title, doc.internal.pageSize.width / 2, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 25);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 30,
    styles: { fontSize: 9, halign: 'right' },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`${title}.pdf`);
}

function exportToExcel(title: string, headers: string[], rows: (string | number)[][]) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${title}.xlsx`);
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportType>('teacher-attendance');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchReport = async () => {
    setLoading(true);
    setData([]);
    try {
      let result: any[] = [];
      switch (activeTab) {
        case 'teacher-attendance':
          result = await api.reports.teacherAttendance(fromDate || undefined, toDate || undefined);
          break;
        case 'student-attendance':
          result = await api.reports.studentAttendance(fromDate || undefined, toDate || undefined);
          break;
        case 'salary':
          result = await api.reports.salary(month, year);
          break;
        case 'evaluations':
          result = await api.reports.evaluations(month, year);
          break;
      }
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  const getTableConfig = () => {
    switch (activeTab) {
      case 'teacher-attendance':
        return {
          headers: ['اسم المعلم', 'التخصص', 'التاريخ', 'وقت الدخول', 'وقت الخروج', 'الحالة', 'ملاحظات'],
          rows: data.map(r => [
            r.teacher_name, r.subject, r.date, r.check_in || '-', r.check_out || '-',
            statusLabel[r.status] || r.status, r.notes || '-'
          ]),
          render: (r: any) => (
            <tr key={r.id} className="table-row-hover">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold">
                    {r.teacher_name?.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-800">{r.teacher_name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{r.subject || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{r.date}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{r.check_in || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{r.check_out || '-'}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusClass[r.status] || 'bg-gray-100 text-gray-600'}`}>
                  {statusLabel[r.status] || r.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">{r.notes || '-'}</td>
            </tr>
          ),
          cols: ['اسم المعلم', 'التخصص', 'التاريخ', 'وقت الدخول', 'وقت الخروج', 'الحالة', 'ملاحظات'],
        };

      case 'student-attendance':
        return {
          headers: ['اسم الطفل', 'المجموعة', 'ولي الأمر', 'التاريخ', 'وقت الدخول', 'وقت الخروج', 'الحالة'],
          rows: data.map(r => [
            r.student_name, r.class_group, r.parent_name, r.date,
            r.check_in || '-', r.check_out || '-', statusLabel[r.status] || r.status
          ]),
          render: (r: any) => (
            <tr key={r.id} className="table-row-hover">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-xs font-bold">
                    {r.student_name?.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-800">{r.student_name}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                {r.class_group ? (
                  <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-lg">{r.class_group}</span>
                ) : '-'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{r.parent_name || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{r.date}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{r.check_in || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{r.check_out || '-'}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusClass[r.status] || 'bg-gray-100 text-gray-600'}`}>
                  {statusLabel[r.status] || r.status}
                </span>
              </td>
            </tr>
          ),
          cols: ['اسم الطفل', 'المجموعة', 'ولي الأمر', 'التاريخ', 'وقت الدخول', 'وقت الخروج', 'الحالة'],
        };

      case 'salary':
        return {
          headers: ['اسم المعلم', 'التخصص', 'الشهر', 'السنة', 'الراتب الأساسي', 'الخصومات', 'المكافآت', 'صافي الراتب', 'الحالة'],
          rows: data.map(r => [
            r.teacher_name, r.subject, MONTHS[r.month - 1], r.year,
            r.base_salary, r.deductions, r.bonuses, r.net_salary, r.paid ? 'مصروف' : 'معلق'
          ]),
          render: (r: any) => (
            <tr key={r.id} className="table-row-hover">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold">
                    {r.teacher_name?.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-800">{r.teacher_name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{r.subject || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{MONTHS[r.month - 1]}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{r.year}</td>
              <td className="px-4 py-3 text-sm font-medium">{r.base_salary?.toLocaleString()} ر.س</td>
              <td className="px-4 py-3 text-sm text-red-600">{r.deductions?.toLocaleString()} ر.س</td>
              <td className="px-4 py-3 text-sm text-green-600">{r.bonuses?.toLocaleString()} ر.س</td>
              <td className="px-4 py-3">
                <span className="font-bold text-emerald-700">{r.net_salary?.toLocaleString()} ر.س</span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${r.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {r.paid ? 'مصروف' : 'معلق'}
                </span>
              </td>
            </tr>
          ),
          cols: ['اسم المعلم', 'التخصص', 'الشهر', 'السنة', 'الراتب الأساسي', 'الخصومات', 'المكافآت', 'صافي الراتب', 'الحالة'],
        };

      case 'evaluations':
        return {
          headers: ['اسم الطفل', 'المجموعة', 'الشهر', 'السنة', 'السلوك', 'الأكاديمي', 'الاجتماعي', 'المعدل', 'ملاحظات'],
          rows: data.map(r => [
            r.student_name, r.class_group, MONTHS[r.month - 1], r.year,
            `${r.behavior}/10`, `${r.academic}/10`, `${r.social}/10`,
            `${((r.behavior + r.academic + r.social) / 3).toFixed(1)}/10`, r.notes || '-'
          ]),
          render: (r: any) => {
            const avg = ((r.behavior + r.academic + r.social) / 3).toFixed(1);
            return (
              <tr key={r.id} className="table-row-hover">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-xs font-bold">
                      {r.student_name?.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-800">{r.student_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {r.class_group ? (
                    <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-lg">{r.class_group}</span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{MONTHS[r.month - 1]}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.year}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-200 rounded-full h-1.5 w-16">
                      <div className="bg-blue-500 rounded-full h-1.5" style={{ width: `${r.behavior * 10}%` }} />
                    </div>
                    <span className="text-xs font-medium text-blue-700">{r.behavior}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-200 rounded-full h-1.5 w-16">
                      <div className="bg-green-500 rounded-full h-1.5" style={{ width: `${r.academic * 10}%` }} />
                    </div>
                    <span className="text-xs font-medium text-green-700">{r.academic}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-200 rounded-full h-1.5 w-16">
                      <div className="bg-purple-500 rounded-full h-1.5" style={{ width: `${r.social * 10}%` }} />
                    </div>
                    <span className="text-xs font-medium text-purple-700">{r.social}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold text-amber-700">{avg}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{r.notes || '-'}</td>
              </tr>
            );
          },
          cols: ['اسم الطفل', 'المجموعة', 'الشهر', 'السنة', 'السلوك', 'الأكاديمي', 'الاجتماعي', 'المعدل', 'ملاحظات'],
        };
    }
  };

  const tableConfig = getTableConfig();
  const currentTab = reportTabs.find(t => t.key === activeTab)!;

  const handleExportPDF = () => {
    if (!tableConfig) return;
    exportToPDF(currentTab.label, tableConfig.headers, tableConfig.rows);
  };

  const handleExportExcel = () => {
    if (!tableConfig) return;
    exportToExcel(currentTab.label, tableConfig.headers, tableConfig.rows);
  };

  const showDateFilter = activeTab === 'teacher-attendance' || activeTab === 'student-attendance';
  const showMonthFilter = activeTab === 'salary' || activeTab === 'evaluations';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">التقارير</h2>
          <p className="text-gray-500 text-sm mt-1">تقارير شاملة مع إمكانية التصدير</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span className="text-indigo-700 text-sm font-medium">مركز التقارير</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {reportTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setData([]); }}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-semibold text-sm ${
              activeTab === tab.key
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-100 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="font-bold text-gray-700">فلاتر البحث</h3>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          {showDateFilter && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">من تاريخ</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">إلى تاريخ</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
              </div>
            </>
          )}

          {showMonthFilter && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">الشهر</label>
                <select value={month} onChange={e => setMonth(Number(e.target.value))}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all">
                  {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">السنة</label>
                <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all w-28" />
              </div>
            </>
          )}

          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-60"
          >
            <FileText className="w-4 h-4" />
            {loading ? 'جاري التحميل...' : 'عرض التقرير'}
          </button>
        </div>
      </div>

      {/* Results */}
      {data.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Export Buttons */}
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <div>
              <h3 className="font-bold text-gray-800">{currentTab.label}</h3>
              <p className="text-sm text-gray-400 mt-0.5">{data.length} سجل</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {tableConfig.cols.map((col) => (
                    <th key={col} className="text-right px-4 py-3 text-xs font-bold text-gray-600">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((row) => tableConfig.render(row))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.length === 0 && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <BarChart3 className="w-16 h-16 text-gray-100 mx-auto mb-4" />
          <h3 className="text-gray-400 font-medium mb-1">لا توجد بيانات</h3>
          <p className="text-gray-300 text-sm">اضغط على "عرض التقرير" لعرض البيانات</p>
        </div>
      )}
    </div>
  );
}
