import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BarChart3,
  LogOut,
  Baby,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { path: '/teachers', label: 'المعلمون', icon: GraduationCap },
  { path: '/students', label: 'الأطفال', icon: Users },
  { path: '/reports', label: 'التقارير', icon: BarChart3 },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="w-64 min-h-screen flex flex-col bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-800 shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur p-2.5 rounded-xl">
            <Baby className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">نظام الحضانة</h1>
            <p className="text-indigo-300 text-xs">إدارة متكاملة</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl sidebar-item font-medium text-sm ${
                isActive
                  ? 'bg-white/20 text-white shadow-lg backdrop-blur'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info & logout */}
      <div className="p-4 border-t border-white/10">
        <div className="bg-white/10 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user.username?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{user.username || 'Admin'}</p>
              <p className="text-indigo-300 text-xs">مسؤول النظام</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-indigo-200 hover:bg-red-500/20 hover:text-red-300 sidebar-item text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
