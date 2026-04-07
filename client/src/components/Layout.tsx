import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-100" dir="rtl">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
