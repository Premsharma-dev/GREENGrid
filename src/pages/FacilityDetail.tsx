import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  ArrowLeft,
  Gauge,
  Zap,
  Receipt,
  SunMedium,
  AlertTriangle,
  Plus,
  Calendar,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { facilityService } from '../services/facilityService';
import { meterService } from '../services/meterService';
import { energyService } from '../services/energyService';
import { alertService } from '../services/alertService';
import { billingService } from '../services/billingService';
import { renewableService } from '../services/renewableService';
import { Facility, Meter, Alert, Bill, RenewableGeneration } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { Badge } from '../components/common/Badge';

export const FacilityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [renewable, setRenewable] = useState<RenewableGeneration[]>([]);
  const [daysFilter, setDaysFilter] = useState<number>(30);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadData(id);
  }, [id, daysFilter]);

  const loadData = async (facId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [fac, mtrs, daily, alts, bls, ren] = await Promise.all([
        facilityService.getById(facId),
        meterService.getAll({ facility_id: facId }),
        energyService.getDaily({ facility_id: facId, days: daysFilter }),
        alertService.getAlerts({ facility_id: facId }),
        billingService.getBills({ facility_id: facId }),
        renewableService.getAll({ facility_id: facId }),
      ]);
      setFacility(fac);
      setMeters(mtrs);
      setDailyTrend(daily);
      setAlerts(alts);
      setBills(bls);
      setRenewable(ren);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load facility telemetry.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Aggregating telemetry for facility..." />;
  }

  if (error || !facility) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/facilities')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Facilities
        </button>
        <ErrorState message={error || 'Facility not found.'} onRetry={() => id && loadData(id)} />
      </div>
    );
  }

  const totalRenKwh = renewable.reduce((acc, r) => acc + r.energy_generated, 0);
  const latestBill = bills[0];

  return (
    <div className="space-y-6">
      {/* Back button & Title Card */}
      <div>
        <Link
          to="/facilities"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Facilities Catalog
        </Link>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{facility.name}</h1>
                <Badge variant={facility.status === 'Active' ? 'success' : 'neutral'} size="sm">
                  {facility.status}
                </Badge>
                <Badge variant="neutral" size="sm">
                  {facility.building_type}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{facility.location}</span>
                <span>•</span>
                <span>{facility.area.toLocaleString()} sq. ft.</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 max-w-2xl">{facility.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/energy/readings"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              <Zap className="w-4 h-4" />
              Add Reading
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Active Submeters</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {meters.length}
            <span className="text-xs font-sans text-slate-400 font-normal ml-1">meters</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">30-Day Total Load</div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            {facility.monthly_consumption ? facility.monthly_consumption.toLocaleString() : '—'}
            <span className="text-xs font-sans text-slate-500 ml-1 font-semibold">kWh</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Renewable Output</div>
          <div className="text-2xl font-extrabold text-teal-700 font-mono">
            {totalRenKwh.toLocaleString()}
            <span className="text-xs font-sans text-slate-500 ml-1 font-semibold">kWh</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Estimated Current Bill</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            ₹{latestBill ? latestBill.total_amount.toLocaleString() : '12,500'}
          </div>
        </div>
      </div>

      {/* Energy Trend Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Facility Consumption History</h2>
            <p className="text-xs text-slate-500">Daily incremental meter load</p>
          </div>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDaysFilter(d)}
                className={`px-3 py-1 rounded-lg cursor-pointer ${
                  daysFilter === d ? 'bg-white text-emerald-700 shadow-xs font-bold' : ''
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="facTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => val.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                formatter={(val: any) => [`${val.toLocaleString()} kWh`, 'Consumption']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="consumption" stroke="#10b981" strokeWidth={2.5} fill="url(#facTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Meters and Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meters Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Connected Energy &amp; Renewable Meters</h2>
            <Link to="/meters" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              Manage Meters →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {meters.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 font-mono">{m.meter_number}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {m.meter_type} • Capacity: {m.capacity} kW
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">
                    {m.last_reading ? `${m.last_reading.toLocaleString()} ${m.unit}` : 'Operational'}
                  </span>
                  <div className="text-[10px] text-slate-400">
                    {m.last_reading_date ? `Logged: ${m.last_reading_date}` : 'Active'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Facility Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Facility Anomaly &amp; Demand Alerts</h2>
            <Link to="/alerts" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              Alerts Inbox →
            </Link>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No active alerts recorded for this facility.
              </div>
            ) : (
              alerts.slice(0, 4).map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900">{a.title}</span>
                      <Badge variant={a.severity === 'Critical' ? 'danger' : 'warning'} size="sm">
                        {a.severity}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{a.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
