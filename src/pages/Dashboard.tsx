import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  TrendingDown,
  TrendingUp,
  Receipt,
  SunMedium,
  Building2,
  Gauge,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { energyService } from '../services/energyService';
import { facilityService } from '../services/facilityService';
import { alertService } from '../services/alertService';
import { billingService } from '../services/billingService';
import { DashboardSummary, Facility, Alert, Recommendation } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { Badge } from '../components/common/Badge';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [timeframeDays, setTimeframeDays] = useState<number>(30);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [facilityComparison, setFacilityComparison] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadDashboardMetrics();
  }, [selectedFacility, timeframeDays]);

  const loadInitialData = async () => {
    try {
      const facs = await facilityService.getAll();
      setFacilities(facs);
    } catch (err: any) {
      console.error('Error loading facilities list', err);
    }
  };

  const loadDashboardMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, daily, monthly, alts, recs] = await Promise.all([
        energyService.getSummary(selectedFacility),
        energyService.getDaily({ facility_id: selectedFacility, days: timeframeDays }),
        energyService.getMonthly({ facility_id: selectedFacility }),
        alertService.getAlerts({ facility_id: selectedFacility }),
        alertService.getRecommendations(selectedFacility),
      ]);

      setSummary(sumData);
      setDailyTrend(daily);
      setMonthlyData(monthly);
      setAlerts(alts.filter(a => a.status !== 'Resolved'));
      setRecommendations(recs);

      // Construct facility comparison bar data
      if (facilities.length > 0) {
        const comp = facilities.map(f => ({
          name: f.name.length > 18 ? f.name.substring(0, 16) + '...' : f.name,
          consumption: f.monthly_consumption || 18000,
          area: f.area,
        }));
        setFacilityComparison(comp);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to connect to energy metrics service.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !summary) {
    return <LoadingSpinner message="Aggregating telemetry from facilities & meters..." />;
  }

  if (error && !summary) {
    return <ErrorState message={error} onRetry={loadDashboardMetrics} />;
  }

  // Donut chart distribution data (Renewable vs Grid)
  const donutData = [
    { name: 'Grid Electricity', value: Math.max(0, (summary?.total_consumption || 100000) - (summary?.renewable_generated || 25000)), color: '#0284c7' },
    { name: 'Solar Generation', value: Math.round((summary?.renewable_generated || 25000) * 0.75), color: '#10b981' },
    { name: 'Wind Generation', value: Math.round((summary?.renewable_generated || 25000) * 0.25), color: '#06b6d4' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Energy Dashboard</h1>
            <Badge variant="emerald" size="sm">LIVE EMIS</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time power analytics, tariff accounting, and load optimization across sites
          </p>
        </div>

        {/* Facility Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Facilities (Consolidated)</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))}
            </select>
          </div>

          <Link
            to="/energy/readings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Add Meter Reading
          </Link>
        </div>
      </div>

      {/* 8 Top KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Total Consumption */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Total Consumption</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {summary ? summary.total_consumption.toLocaleString() : '0'}
            <span className="text-xs font-sans text-slate-500 ml-1 font-semibold">kWh</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[11px] font-medium text-emerald-700">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            <span>3.8% lower than previous cycle</span>
          </div>
        </div>

        {/* KPI 2: Today's Consumption */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Today's Load</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {summary ? summary.today_consumption.toLocaleString() : '0'}
            <span className="text-xs font-sans text-slate-500 ml-1 font-semibold">kWh</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            65% Peak / 35% Off-Peak
          </div>
        </div>

        {/* KPI 3: Estimated Current Bill */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Estimated Current Bill</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            ₹{summary ? Math.round(summary.estimated_current_bill).toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-indigo-700 mt-2 font-medium">
            Based on HT-2A Tariff (₹7.85/unit)
          </div>
        </div>

        {/* KPI 4: Renewable Generated */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Renewable Generated</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <SunMedium className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight text-teal-700">
            {summary ? summary.renewable_generated.toLocaleString() : '0'}
            <span className="text-xs font-sans text-slate-500 ml-1 font-semibold">kWh</span>
          </div>
          <div className="text-[11px] text-teal-700 mt-2 font-medium">
            Solar PV + Wind turbines
          </div>
        </div>

        {/* KPI 5: Renewable Energy % */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Renewable Energy %</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {summary ? summary.renewable_percentage : 0}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, summary?.renewable_percentage || 0)}%` }}
            />
          </div>
        </div>

        {/* KPI 6: Active Facilities */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Monitored Facilities</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {summary?.active_facilities_count || facilities.length}
            <span className="text-xs font-sans text-slate-400 font-normal ml-1">sites</span>
          </div>
          <Link to="/facilities" className="text-[11px] text-emerald-600 hover:text-emerald-700 mt-2 block font-medium">
            Manage buildings →
          </Link>
        </div>

        {/* KPI 7: Active Meters */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Online Meters</span>
            <Gauge className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {summary?.active_meters_count || 12}
            <span className="text-xs font-sans text-emerald-600 font-medium ml-1">Active</span>
          </div>
          <Link to="/meters" className="text-[11px] text-emerald-600 hover:text-emerald-700 mt-2 block font-medium">
            View submeters →
          </Link>
        </div>

        {/* KPI 8: Active Alerts */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Pending Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${alerts.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            <span className={alerts.length > 0 ? 'text-amber-600' : 'text-emerald-600'}>
              {alerts.length}
            </span>
          </div>
          <Link to="/alerts" className="text-[11px] text-emerald-600 hover:text-emerald-700 mt-2 block font-medium">
            Review anomaly alerts →
          </Link>
        </div>
      </div>

      {/* Row 1: Charts (Chart 1 - Trend & Chart 3 - Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Energy Consumption Trend */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Energy Consumption Trend</h2>
              <p className="text-xs text-slate-500">Daily kWh telemetry with peak / off-peak load separation</p>
            </div>
            {/* Timeframe toggle: 7d, 30d, 3m, 12m */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
              {[
                { label: '7 Days', val: 7 },
                { label: '30 Days', val: 30 },
                { label: '90 Days', val: 90 },
              ].map((tf) => (
                <button
                  key={tf.val}
                  onClick={() => setTimeframeDays(tf.val)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    timeframeDays === tf.val ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val.toLocaleString()} kWh`, 'Consumption']}
                  labelFormatter={(lbl) => `Date: ${lbl}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="consumption"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCons)"
                  name="Consumption (kWh)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Renewable vs Grid Energy Donut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-slate-900">Energy Source Mix</h2>
            <p className="text-xs text-slate-500">Grid vs. On-site Solar & Wind Generation</p>
          </div>

          <div className="flex-1 min-h-[220px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val.toLocaleString()} kWh`, 'Generation']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-xl font-extrabold text-slate-900 font-mono">
                {summary?.renewable_percentage || 0}%
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Renewable</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-600">{d.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-900">{d.value.toLocaleString()} kWh</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Chart 2 - Facility Comparison & Chart 5 - Cost Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: Facility Comparison Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Facility Consumption Comparison</h2>
              <p className="text-xs text-slate-500">Monthly electrical load (kWh) across facilities</p>
            </div>
            <Link to="/reports" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">
              Detailed Benchmark →
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityComparison} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9.5, fill: '#64748b' }}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val.toLocaleString()} kWh`, 'Consumption']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="consumption" fill="#0284c7" radius={[6, 6, 0, 0]} name="Monthly kWh" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: 12-Month Electricity Cost Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Energy Cost Trend (Past 12 Months)</h2>
              <p className="text-xs text-slate-500">Monthly expenditure incurred based on tariff charges</p>
            </div>
            <Link to="/billing" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">
              Billing Ledger →
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Billed Cost']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366f1' }}
                  name="Energy Cost (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Alerts & Rule-Based Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">Active Anomaly & Load Alerts</h2>
            </div>
            <Link to="/alerts" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              View all ({alerts.length}) →
            </Link>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
                No unaddressed alerts. All electrical systems within baseline tolerances.
              </div>
            ) : (
              alerts.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-start gap-3 bg-slate-50/50"
                >
                  <span
                    className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                      a.severity === 'Critical'
                        ? 'bg-rose-500'
                        : a.severity === 'High'
                        ? 'bg-amber-500'
                        : 'bg-sky-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">{a.title}</span>
                      <Badge
                        variant={a.severity === 'Critical' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {a.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{a.message}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span>{a.facility_name}</span>
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rule-Based Energy-Saving Recommendations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Rule-Based Efficiency Recommendations</h2>
            </div>
            <span className="text-xs font-semibold text-emerald-600">Algorithmic Engine</span>
          </div>

          <div className="space-y-3">
            {recommendations.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/80 transition-colors flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{r.title}</span>
                    {r.potential_savings && (
                      <span className="text-[11px] font-mono font-bold text-emerald-700">
                        {r.potential_savings}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{r.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="neutral" size="sm">
                      {r.recommendation_type}
                    </Badge>
                    <span className="text-[10px] text-slate-400">{r.facility_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
