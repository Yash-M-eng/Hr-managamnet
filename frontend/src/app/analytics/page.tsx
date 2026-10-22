'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, formatCurrency } from '@/lib/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend 
} from 'recharts';
import { Globe2, Building2, TrendingUp, Sparkles, MapPin, Award } from 'lucide-react';

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [overview, setOverview] = useState<any>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/countries'),
        api.get('/analytics/departments'),
        api.get('/analytics/distribution'),
      ]).then(([ov, ct, dp, ds]) => {
        setOverview(ov.data);
        setCountries(ct.data);
        setDepartments(dp.data);
        setDistribution(ds.data);
        setLoading(false);
      });
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white rounded-2xl border border-slate-200"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-88 bg-white rounded-3xl border border-slate-200"></div>
          <div className="h-88 bg-white rounded-3xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#6366f1', '#f97316'];
  const BAR_COLORS = ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#60a5fa', '#93c5fd'];

  return (
    <div className="h-full overflow-y-auto space-y-6 pb-12 pr-1">
      {/* Header Section matching AI Assistant theme */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
            Global Compensation Analytics
          </h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
            <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>10,000 Employees Benchmarked</span>
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Deep-dive analysis of organizational compensation across 10,000 employees. All currencies normalized to USD.
        </p>
      </div>

      {/* Top 3 Benchmark Summary Cards matching clean white card styling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Highest Paying Country */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>Highest Paying Country</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1864f7] border border-blue-100 flex items-center justify-center">
              <Globe2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
            {countries[0]?.countryName} <span className="text-sm font-semibold text-slate-500">({countries[0]?.countryCode})</span>
          </h3>
          <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
            <span>Avg: {formatCurrency(countries[0]?.avgSalaryUSD || 0)} USD</span>
            <span className="text-slate-400 font-normal">({countries[0]?.currency})</span>
          </p>
        </div>

        {/* Highest Paying Dept */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>Highest Paying Dept</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
            {departments[0]?.departmentName}
          </h3>
          <p className="text-xs text-emerald-600 font-bold mt-2">
            Avg Base: {formatCurrency(departments[0]?.avgSalaryUSD || 0)} USD
          </p>
        </div>

        {/* Total Comp Spread */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>Total Comp Spread</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
            {formatCurrency(overview?.totalAnnualCompensationUSD || 0)}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Total Base + Bonus across 10k staff
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Country Average Salaries Chart */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0f172a] tracking-tight">Average Salary by Country (USD)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Normalized conversion via fixed reference exchange rate</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1864f7] border border-blue-100 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countries} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <XAxis dataKey="countryCode" stroke="#64748b" fontSize={11} fontWeight={600} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()} USD`, 'Avg Base Pay']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', color: '#0f172a', fontWeight: 'bold' }}
                />
                <Bar dataKey="avgSalaryUSD" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {countries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Headcount Share by Department Chart */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0f172a] tracking-tight">Headcount by Department</h2>
              <p className="text-xs text-slate-400 mt-0.5">Distribution across organizational departments</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departments}
                  dataKey="employeeCount"
                  nameKey="departmentName"
                  cx="50%"
                  cy="50%"
                  outerRadius={105}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ name, percent }: any) => `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                  fontSize={11}
                  fontWeight={500}
                >
                  {departments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} Employees`, 'Headcount']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', color: '#0f172a', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
