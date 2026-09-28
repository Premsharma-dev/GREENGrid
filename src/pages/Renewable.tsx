import React, { useState, useEffect } from 'react';
import {
  SunMedium,
  Wind,
  Plus,
  Filter,
  Calendar,
  Zap,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  Building2,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { renewableService, RenewableSummaryData } from '../services/renewableService';
import { facilityService } from '../services/facilityService';
import { RenewableGeneration, Facility, RenewableSourceType } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const Renewable: React.FC = () => {
  const { user } = useAuth();
  const canRecord = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [records, setRecords] = useState<RenewableGeneration[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [summary, setSummary] = useState<RenewableSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedFacility, setSelectedFacility] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');

  // Record Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formFacId, setFormFacId] = useState('');
  const [formSource, setFormSource] = useState<RenewableSourceType>('Solar');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formGen, setFormGen] = useState('');
  const [formCap, setFormCap] = useState(150);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedFacility, selectedSource]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recList, facs, sum] = await Promise.all([
        renewableService.getAll({
          facility_id: selectedFacility,
          source_type: selectedSource,
        }),
        facilityService.getAll(),
        renewableService.getSummary(selectedFacility),
      ]);
      setRecords(recList);
      setFacilities(facs);
      setSummary(sum);
      if (facs.length > 0 && !formFacId) {
        setFormFacId(facs[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load renewable telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFacId || !formGen) {
      setFormError('Facility and energy generated are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await renewableService.addRecord({
        facility_id: formFacId,
        source_type: formSource,
        generation_date: formDate,
        energy_generated: Number(formGen),
        capacity: Number(formCap),
      });
      setModalOpen(false);
      setFormGen('');
      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Failed to save record.');
    } finally {
      setSubmitting(false);
    }
  };

  const pieData = summary
    ? [
        { name: 'Grid Consumption', value: summary.grid_consumed, color: '#0284c7' },
        { name: 'Solar Generation', value: summary.by_source.Solar, color: '#10b981' },
        { name: 'Wind Generation', value: summary.by_source.Wind, color: '#06b6d4' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Renewable Energy Telemetry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track rooftop solar PV, on-site micro wind turbines, carbon offset metrics, and grid independence
          </p>
        </div>

        {canRecord && (
          <button
            onClick={() => {
              setFormError(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Log Generation
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Total Renewable Yield</span>
            <SunMedium className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            {summary ? summary.total_generated.toLocaleString() : '0'}
            <span className="text-xs font-sans text-slate-500 ml-1 font-semibold">kWh</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-2 font-medium">Clean energy generated on-site</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Renewable Share %</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {summary ? summary.renewable_percentage : 0}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, summary?.renewable_percentage || 0)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Solar Generation</span>
            <SunMedium className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {summary ? summary.by_source.Solar.toLocaleString() : '0'}
            <span className="text-xs font-sans text-slate-400 font-normal ml-1">kWh</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">PV arrays on 3 facilities</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Wind Generation</span>
            <Wind className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {summary ? summary.by_source.Wind.toLocaleString() : '0'}
            <span className="text-xs font-sans text-slate-400 font-normal ml-1">kWh</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Micro turbines at Logistics Hub</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source Distribution Donut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-slate-900">Grid vs. Renewable Independence</h2>
            <p className="text-xs text-slate-500">Self-generation ratio compared to grid draw</p>
          </div>

          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val.toLocaleString()} kWh`, 'Energy']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {pieData.map((d) => (
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

        {/* Renewable Daily Yield Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Generation Log Trend</h2>
              <p className="text-xs text-slate-500">Daily logged clean energy output (kWh)</p>
            </div>
            <Badge variant="emerald" size="sm">ZERO EMISSIONS</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={records.slice(0, 15).reverse()}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="generation_date" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => val.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val.toLocaleString()} kWh`, 'Generated']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="energy_generated" fill="#10b981" radius={[4, 4, 0, 0]} name="Energy (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter Bar & Records Table */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Facilities</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Renewable Sources</option>
            <option value="Solar">Solar Generation</option>
            <option value="Wind">Wind Generation</option>
            <option value="Other Renewable">Other Renewable</option>
          </select>
        </div>

        <span className="text-slate-400 font-mono text-[11px]">
          Showing {records.length} logged generation records
        </span>
      </div>

      {/* Records Table */}
      {loading ? (
        <LoadingSpinner message="Loading renewable telemetry..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : records.length === 0 ? (
        <EmptyState
          title="No renewable generation logged"
          description="Log generation from rooftop solar panels or wind turbines."
          actionText={canRecord ? 'Log Generation' : undefined}
          onAction={canRecord ? () => setModalOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Facility</th>
                  <th className="py-3.5 px-4">Source Type</th>
                  <th className="py-3.5 px-4">Installed Capacity</th>
                  <th className="py-3.5 px-4 text-right">Energy Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">{r.generation_date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.facility_name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {r.source_type === 'Solar' ? (
                          <SunMedium className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Wind className="w-3.5 h-3.5 text-sky-500" />
                        )}
                        <span>{r.source_type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{r.capacity} kW</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      +{r.energy_generated.toLocaleString()} kWh
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Log Renewable Generation"
        subtitle="Record daily electrical generation from solar photovoltaics or wind turbines"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleAddRecord} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Facility *</label>
            <select
              required
              value={formFacId}
              onChange={(e) => setFormFacId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name} ({fac.building_type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source Type</label>
              <select
                value={formSource}
                onChange={(e) => setFormSource(e.target.value as RenewableSourceType)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Solar">Solar PV Array</option>
                <option value="Wind">Micro Wind Turbine</option>
                <option value="Other Renewable">Other Renewable</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Generation Date</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Energy Generated (kWh) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="e.g. 320"
                value={formGen}
                onChange={(e) => setFormGen(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nameplate Capacity (kW)
              </label>
              <input
                type="number"
                min="1"
                value={formCap}
                onChange={(e) => setFormCap(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Renewable Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
