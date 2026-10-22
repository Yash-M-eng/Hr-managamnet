'use client';

import React from 'react';
import { Building, Award } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface DashboardChartsProps {
  departments: any[];
  distribution: any[];
}

const DEPT_COLORS = ['#6366f1', '#4f46e5', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#8b5cf6'];
const TIER_COLORS = ['#0284c7', '#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#6366f1'];

export function DashboardCharts({ departments, distribution }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Department Average Base Salary Chart */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#0f172a] tracking-tight">Average Salary by Department</h2>
            <p className="text-xs text-slate-500 mt-0.5">Normalized Annual Base Pay Benchmark (USD)</p>
          </div>
          <div className="p-2 bg-blue-50 rounded-xl text-[#1864f7] border border-blue-100">
            <Building className="w-4 h-4" />
          </div>
        </div>
        <div className="h-88 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departments} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis type="number" tickFormatter={(val) => `$${val / 1000}k`} stroke="#94a3b8" fontSize={11} />
              <YAxis 
                dataKey="departmentName" 
                type="category" 
                stroke="#475569" 
                fontSize={12} 
                fontWeight={500}
                width={145} 
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()} USD`, 'Avg Base Pay']}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '14px', color: '#0f172a', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: '600' }}
              />
              <Bar dataKey="avgSalaryUSD" radius={[0, 8, 8, 0]} barSize={22}>
                {departments.map((entry, index) => (
                  <Cell key={`dept-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Salary Distribution Tiers Chart */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#0f172a] tracking-tight">Employee Salary Distribution</h2>
            <p className="text-xs text-slate-500 mt-0.5">Headcount across compensation brackets</p>
          </div>
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution} margin={{ top: 5, right: 20, left: 0, bottom: 10 }}>
              <XAxis dataKey="tier" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                formatter={(value: any) => [`${Number(value).toLocaleString()} employees`, 'Headcount']}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '14px', color: '#0f172a', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {distribution.map((entry, index) => (
                  <Cell key={`tier-${index}`} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
