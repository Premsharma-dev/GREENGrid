import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Upload,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Info
} from 'lucide-react';
import { energyService } from '../services/energyService';
import { meterService } from '../services/meterService';
import { facilityService } from '../services/facilityService';
import { EnergyReading, Meter, Facility } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const EnergyReadings: React.FC = () => {
  const { user } = useAuth();
  const canRecord = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [readings, setReadings] = useState<EnergyReading[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedFacility, setSelectedFacility] = useState('all');
  const [selectedMeter, setSelectedMeter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Add Reading Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formMeterId, setFormMeterId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formReading, setFormReading] = useState('');
  const [allowReset, setAllowReset] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // CSV Import Modal State
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvSubmitting, setCsvSubmitting] = useState(false);
  const [csvSummary, setCsvSummary] = useState<{ successCount: number; failedCount: number; errors: string[] } | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedFacility, selectedMeter, startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rdgs, mtrs, facs] = await Promise.all([
        energyService.getReadings({
          facility_id: selectedFacility,
          meter_id: selectedMeter,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          limit: 100,
        }),
        meterService.getAll(),
        facilityService.getAll(),
      ]);
      setReadings(rdgs);
      setMeters(mtrs);
      setFacilities(facs);
      if (mtrs.length > 0 && !formMeterId) {
        setFormMeterId(mtrs[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load energy readings.');
    } finally {
      setLoading(false);
    }
  };

  // Selected meter lookup for automatic previous reading display
  const targetMeter = meters.find((m) => m.id === formMeterId);
  const estimatedConsumption =
    targetMeter && formReading && !isNaN(Number(formReading))
      ? Math.max(0, Number(formReading) - (targetMeter.last_reading || 0))
      : 0;

  const handleAddReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMeterId || !formReading) {
      setFormError('Please select a meter and specify the current reading value.');
      return;
    }
    const val = Number(formReading);
    if (isNaN(val) || val < 0) {
      setFormError('Meter reading must be a valid positive number.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setSuccessNotice(null);

    try {
      const result = await energyService.addReading({
        meter_id: formMeterId,
        reading_date: formDate,
        meter_reading: val,
        allow_reset: allowReset,
      });

      let notice = `Recorded ${result.reading.consumption} kWh consumption successfully!`;
      if (result.alertGenerated) {
        notice += ` (Automated High Consumption Alert Triggered)`;
      }
      setSuccessNotice(notice);
      setAddModalOpen(false);
      setFormReading('');
      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || err.message || 'Error recording reading.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCsvText(evt.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleCsvImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    setCsvSubmitting(true);
    setCsvSummary(null);
    try {
      const summary = await energyService.importCsv(csvText);
      setCsvSummary(summary);
      await loadData();
    } catch (err: any) {
      setCsvSummary({
        successCount: 0,
        failedCount: 1,
        errors: [err.response?.data?.detail || err.message || 'Import failed'],
      });
    } finally {
      setCsvSubmitting(false);
    }
  };

  const sampleCsvExample = `meter_id,date,reading
MTR-ENG-01,2026-09-26,143200
MTR-ENG-01,2026-09-27,144050
MTR-CYB-MAIN,2026-09-27,211500`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Meter Telemetry &amp; Readings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Log incremental kilowatt-hour readings with automatic differential consumption calculations
          </p>
        </div>

        {canRecord && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCsvSummary(null);
                setCsvModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              Batch CSV Import
            </button>

            <button
              onClick={() => {
                setFormError(null);
                setAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Record Reading
            </button>
          </div>
        )}
      </div>

      {/* Success Notification Alert */}
      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Facility Filter */}
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

          {/* Meter Filter */}
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

        {/* Date Filter */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-slate-400 font-medium">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-medium text-slate-700 focus:outline-none"
          />
          <span className="text-slate-400 font-medium">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-medium text-slate-700 focus:outline-none"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Readings Table */}
      {loading ? (
        <LoadingSpinner message="Loading energy telemetry readings..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : readings.length === 0 ? (
        <EmptyState
          title="No energy readings recorded"
          description="Enter a new reading or import a batch CSV file to view consumption telemetry."
          actionText={canRecord ? 'Record Meter Reading' : undefined}
          onAction={canRecord ? () => setAddModalOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Meter Identifier</th>
                  <th className="py-3.5 px-4">Facility</th>
                  <th className="py-3.5 px-4 text-right">Cumulative Reading</th>
                  <th className="py-3.5 px-4 text-right">Calculated Consumption</th>
                  <th className="py-3.5 px-4 text-right">Peak (65%)</th>
                  <th className="py-3.5 px-4 text-right">Off-Peak (35%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {readings.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.reading_date}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {r.meter_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{r.facility_name}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                      {r.meter_reading.toLocaleString()} kWh
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      +{r.consumption.toLocaleString()} kWh
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {r.peak_consumption.toLocaleString()} kWh
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {r.off_peak_consumption.toLocaleString()} kWh
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Reading Modal with Automatic Calculation Preview */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Record New Meter Reading"
        subtitle="Automatic differential calculation: Current Reading - Previous Reading = Consumption"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleAddReading} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Meter *</label>
            <select
              required
              value={formMeterId}
              onChange={(e) => setFormMeterId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {meters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.meter_number} — {m.facility_name} (Last: {m.last_reading?.toLocaleString() ?? 0} {m.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Reading *</label>
            <input
              type="date"
              required
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Cumulative Meter Reading (kWh) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="e.g. 143500"
              value={formReading}
              onChange={(e) => setFormReading(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Automatic Consumption Calculation Preview Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span>Previous Reading on File:</span>
              <span className="font-mono font-semibold text-slate-800">
                {targetMeter?.last_reading ? `${targetMeter.last_reading.toLocaleString()} kWh` : '0 kWh (Baseline)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Entered Current Reading:</span>
              <span className="font-mono font-semibold text-slate-800">
                {formReading ? `${Number(formReading).toLocaleString()} kWh` : '—'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-bold">
              <span className="text-slate-900">Auto-Calculated Consumption:</span>
              <span className="font-mono text-emerald-700">
                +{estimatedConsumption.toLocaleString()} kWh
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Formula: CURRENT READING - PREVIOUS READING = CONSUMPTION. System detects abnormal consumption (&gt;120% moving average) automatically.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 text-xs">
            <input
              type="checkbox"
              id="resetCheck"
              checked={allowReset}
              onChange={(e) => setAllowReset(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="resetCheck" className="text-slate-600">
              Authorize hardware meter rollover / hardware counter reset
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Calculating & Saving...' : 'Confirm & Save Reading'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        title="Batch CSV Reading Import"
        subtitle="Upload or paste comma-separated energy readings for automated batch consumption ingestion"
        maxWidth="xl"
      >
        {csvSummary && (
          <div className={`mb-4 p-4 rounded-xl border text-xs ${
            csvSummary.failedCount === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="font-bold mb-1">
              Import Summary: {csvSummary.successCount} successfully imported, {csvSummary.failedCount} failed
            </div>
            {csvSummary.errors.length > 0 && (
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700 mt-2">
                {csvSummary.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleCsvImportSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select CSV File from Computer
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Or Paste CSV Content</label>
              <button
                type="button"
                onClick={() => setCsvText(sampleCsvExample)}
                className="text-[11px] text-emerald-600 hover:underline"
              >
                Load Template Sample
              </button>
            </div>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="meter_id,date,reading&#10;MTR-ENG-01,2026-09-27,144000"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
            <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Automated Validation Workflow:
            </div>
            <span>
              1. Validates CSV header (`meter_id,date,reading`) &rarr; 2. Verifies meter exists in registry &rarr; 3. Validates date &rarr; 4. Sorts chronologically &rarr; 5. Auto-calculates consumption difference &rarr; 6. Saves records.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCsvModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={csvSubmitting || !csvText.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {csvSubmitting ? 'Parsing & Ingesting...' : 'Validate & Import Records'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
