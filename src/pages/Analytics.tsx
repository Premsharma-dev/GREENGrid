import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Zap,
  Gauge,
  Building2,
  DollarSign,
  SunMedium,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { energyService } from '../services/energyService';
import { facilityService } from '../services/facilityService';
import { meterService } from '../services/meterService';
import { renewableService } from '../services/renewableService';
import { Facility, Meter } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { Badge } from '../components/common/Badge';

export const Analytics: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);

  // Filters
  const [selectedFacility, setSelectedFacility] = useState('all');
  const [selectedMeter, setSelectedMeter] = useState('all');
  const [timeframe, setTimeframe] = useState<'7' | '30' | '90' | '365'>('30');

  const [dailyData, setDailyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [selectedFacility, selectedMeter, timeframe]);

  const loadMetadata = async () => {
    try {
      const [facs, mtrs] = await Promise.all([
        facilityService.getAll(),
        meterService.getAll(),
      ]);
      setFacilities(facs);
      setMeters(mtrs);
    } catch {
      // Ignore
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const days = parseInt(timeframe, 10);
      const data = await energyService.getDaily({
        facility_id: selectedFacility,
        days,
      });
      setDailyData(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to aggregate analytics.');
    } finally {
      setLoading(false);
    }
  };

  // Metrics Calculations
  const totalConsumption = dailyData.reduce((acc, d) => acc + d.consumption, 0);
  const avgConsumption = dailyData.length > 0 ? Math.round(totalConsumption / dailyData.length) : 0;
  const maxDay = dailyData.reduce((max, d) => (d.consumption > (max?.consumption || 0) ? d : max), dailyData[0] || null);
  const minDay = dailyData.reduce((min, d) => (d.consumption < (min?.consumption || Infinity) ? d : min), dailyData[0] || null);
  const totalCost = dailyData.reduce((acc, d) => acc + (d.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Advanced Energy Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Deep-dive multi-parameter load duration curves, peak demand analysis, and cost modeling
          </p>
        </div>

        {/* Timeframe pill toggle */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
          {[
            { label: '7 Days', val: '7' },
            { label: '30 Days', val: '30' },
            { label: '3 Months', val: '90' },
            { label: '1 Year', val: '365' },
          ].map((tf) => (
            <button
              key={tf.val}
              onClick={() => setTimeframe(tf.val as any)}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                timeframe === tf.val ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Monitored Facilities</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <select
            value={selectedMeter}
            onChange={(e) => setSelectedMeter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none font-mono"
          >
            <option value="all">All Submeters</option>
            {meters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.meter_number} ({m.facility_name})
              </option>
            ))}
          </select>
        </div>

        <span className="text-slate-400 font-mono text-[11px]">
          Sample Size: {dailyData.length} Observation Days
        </span>
      </div>

      {/* Statistical Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Period Volume</span>
          <div className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
            {totalConsumption.toLocaleString()}
            <span className="text-[10px] font-sans text-slate-400 ml-0.5">kWh</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Daily Average</span>
          <div className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
            {avgConsumption.toLocaleString()}
            <span className="text-[10px] font-sans text-slate-400 ml-0.5">kWh/d</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-rose-500 font-semibold uppercase block">Peak Load Day</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg font-extrabold text-rose-700 font-mono mt-0.5">
            {maxDay ? `${maxDay.consumption.toLocaleString()} kWh` : '—'}
          </div>
          <span className="text-[9px] text-slate-400">{maxDay?.date}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-500 font-semibold uppercase block">Lowest Day</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-extrabold text-emerald-700 font-mono mt-0.5">
            {minDay ? `${minDay.consumption.toLocaleString()} kWh` : '—'}
          </div>
          <span className="text-[9px] text-slate-400">{minDay?.date}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Estimated Period Cost</span>
          <div className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
            ₹{Math.round(totalCost).toLocaleString()}
          </div>
          <span className="text-[9px] text-slate-400">₹7.85/unit tariff</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Load Factor Ratio</span>
          <div className="text-lg font-extrabold text-emerald-700 font-mono mt-0.5">
            {maxDay && maxDay.consumption > 0
              ? `${Math.round((avgConsumption / maxDay.consumption) * 100)}%`
              : '82%'}
          </div>
          <span className="text-[9px] text-slate-400">Higher is more optimal</span>
        </div>
      </div>

      {/* Main Charts */}
      {loading ? (
        <LoadingSpinner message="Generating energy load analytics..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAnalytics} />
      ) : (
        <div className="space-y-6">
          {/* Chart 1: Daily Peak vs Off-Peak Stacked Area */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Peak vs. Off-Peak Diurnal Load Profile</h2>
                <p className="text-xs text-slate-500">Daytime operational load (65%) vs. night baseline (35%)</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Peak Hours</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-400" />
                  <span className="text-slate-600">Off-Peak Baseline</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => val.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: any) => [`${val.toLocaleString()} kWh`]}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="peak" stackId="1" stroke="#10b981" fill="#10b981" name="Peak Load (kWh)" />
                  <Area type="monotone" dataKey="off_peak" stackId="1" stroke="#38bdf8" fill="#38bdf8" name="Off-Peak Load (kWh)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Daily Cost Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Daily Electricity Expenditure Run-Rate</h2>
                <p className="text-xs text-slate-500">Expenditure incurred per calendar day (₹)</p>
              </div>
              <Badge variant="neutral" size="sm">Tariff ₹7.85/kWh</Badge>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => val.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Daily Cost']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="cost" fill="#6366f1" radius={[4, 4, 0, 0]} name="Incurred Cost (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
