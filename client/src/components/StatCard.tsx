import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'purple' | 'blue' | 'green' | 'yellow' | 'red' | 'indigo';
  subtitle?: string;
}

const colorMap = {
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-600',
    text: 'text-purple-700',
    border: 'border-purple-100',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-600',
    text: 'text-blue-700',
    border: 'border-blue-100',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-600',
    text: 'text-emerald-700',
    border: 'border-emerald-100',
  },
  yellow: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-500',
    text: 'text-amber-700',
    border: 'border-amber-100',
  },
  red: {
    bg: 'bg-rose-50',
    icon: 'bg-rose-600',
    text: 'text-rose-700',
    border: 'border-rose-100',
  },
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'bg-indigo-600',
    text: 'text-indigo-700',
    border: 'border-indigo-100',
  },
};

export default function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <div className={`bg-white rounded-2xl border ${colors.border} p-6 card-hover shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`${colors.icon} p-3 rounded-xl shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
