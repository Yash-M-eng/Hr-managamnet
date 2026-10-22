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
import { BarChart3, Globe2, Building2, Layers, TrendingUp } from 'lucide-react';

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
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading SQL aggregated analytics...</div>;
  }

  const PIE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Global Compensation Analytics</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Deep-dive analysis of organizational compensation across 10,000 employees. All currencies normalized to USD.
        </p>
      </div>

      {/* Top Benchmark Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Highest Paying Country</span>
            <Globe2 className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {countries[0]?.countryName} ({countries[0]?.countryCode})
          </h3>
          <p className="text-xs text-emerald-400 mt-1 font-semibold">
            Avg: {formatCurrency(countries[0]?.avgSalaryUSD || 0)} USD ({countries[0]?.currency})
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Highest Paying Dept</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {departments[0]?.departmentName}
          </h3>
          <p className="text-xs text-emerald-400 mt-1 font-semibold">
            Avg: {formatCurrency(departments[0]?.avgSalaryUSD || 0)} USD
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Total Comp Spread</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {formatCurrency(overview?.totalAnnualCompensationUSD || 0)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Total Base + Bonus across 10k staff
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Country Average Salaries */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h2 className="text-base font-semibold text-white mb-1">Average Salary by Country (USD)</h2>
          <p className="text-xs text-slate-400 mb-6">Normalized conversion via fixed reference exchange rate</p>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countries} margin={{ top: 5, right: 20, left: 0, bottom: 25 }}>
                <XAxis dataKey="countryCode" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()} USD`, 'Avg Base']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="avgSalaryUSD" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Headcount Share by Department */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h2 className="text-base font-semibold text-white mb-1">Headcount by Department</h2>
          <p className="text-xs text-slate-400 mb-6">Distribution across organizational departments</p>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departments}
                  dataKey="employeeCount"
                  nameKey="departmentCode"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  fontSize={11}
                >
                  {departments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} Employees`, 'Headcount']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
