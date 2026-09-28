import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Filter,
  Search,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Sliders,
  Printer
} from 'lucide-react';
import { billingService } from '../services/billingService';
import { facilityService } from '../services/facilityService';
import { Bill, Facility, Tariff, PaymentStatus } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const Billing: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const canGenerate = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [bills, setBills] = useState<Bill[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedFacility, setSelectedFacility] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Generate Bill Modal
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genFacilityId, setGenFacilityId] = useState('');
  const [genMonth, setGenMonth] = useState('2026-09');
  const [genSubmitting, setGenSubmitting] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // View Bill / Invoice Modal
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Tariff Modal (Admin)
  const [tariffModalOpen, setTariffModalOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const [tariffRate, setTariffRate] = useState(7.85);
  const [tariffFixed, setTariffFixed] = useState(3500);
  const [tariffTax, setTariffTax] = useState(12);

  useEffect(() => {
    loadData();
  }, [selectedFacility, selectedMonth, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bls, facs, trfs] = await Promise.all([
        billingService.getBills({
          facility_id: selectedFacility,
          month: selectedMonth,
          status: statusFilter,
        }),
        facilityService.getAll(),
        billingService.getTariffs(),
      ]);
      setBills(bls);
      setFacilities(facs);
      setTariffs(trfs);
      if (facs.length > 0 && !genFacilityId) {
        setGenFacilityId(facs[0].id);
      }
      const activeTariff = trfs.find((t) => t.active) || trfs[0];
      if (activeTariff) {
        setEditingTariff(activeTariff);
        setTariffRate(activeTariff.rate_per_kwh);
        setTariffFixed(activeTariff.fixed_charge);
        setTariffTax(activeTariff.tax_percentage);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load billing ledgers.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genFacilityId || !genMonth) return;

    setGenSubmitting(true);
    setGenError(null);
    try {
      const newBill = await billingService.generateBill(genFacilityId, genMonth);
      setGenModalOpen(false);
      setSelectedBill(newBill);
      await loadData();
    } catch (err: any) {
      setGenError(err.response?.data?.detail || err.response?.data?.error || 'Failed to generate bill.');
    } finally {
      setGenSubmitting(false);
    }
  };

  const handleStatusChange = async (billId: string, newStatus: PaymentStatus) => {
    try {
      await billingService.updatePaymentStatus(billId, newStatus);
      await loadData();
      if (selectedBill && selectedBill.id === billId) {
        setSelectedBill({ ...selectedBill, payment_status: newStatus });
      }
    } catch (err: any) {
      alert('Error updating status: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTariff) return;

    try {
      await billingService.updateTariff(editingTariff.id, {
        rate_per_kwh: Number(tariffRate),
        fixed_charge: Number(tariffFixed),
        tax_percentage: Number(tariffTax),
      });
      setTariffModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert('Error updating tariff: ' + (err.response?.data?.detail || err.message));
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'Paid':
        return <Badge variant="success" size="sm">Paid</Badge>;
      case 'Overdue':
        return <Badge variant="danger" size="sm">Overdue</Badge>;
      default:
        return <Badge variant="warning" size="sm">Pending</Badge>;
    }
  };

  const uniqueMonths = Array.from(new Set(bills.map((b) => b.billing_month))).sort().reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Utility Billing &amp; Tariffs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic electrical tariff calculations, demand charges, taxes, and monthly invoice statements
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setTariffModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-slate-500" />
              Configure Tariffs
            </button>
          )}

          {canGenerate && (
            <button
              onClick={() => {
                setGenError(null);
                setGenModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Generate Monthly Bill
            </button>
          )}
        </div>
      </div>

      {/* Active Tariff Summary Banner */}
      {editingTariff && (
        <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ₹
            </div>
            <div>
              <span className="font-bold text-white text-sm block">{editingTariff.name}</span>
              <span className="text-slate-400 text-[11px]">Primary active tariff schedule</span>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Unit Rate</span>
              <span className="font-bold text-emerald-400 text-sm">₹{editingTariff.rate_per_kwh} / kWh</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Fixed Demand Fee</span>
              <span className="font-bold text-white text-sm">₹{editingTariff.fixed_charge.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Tax / Duty</span>
              <span className="font-bold text-sky-400 text-sm">{editingTariff.tax_percentage}%</span>
            </div>
          </div>
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

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Billing Months</option>
            {uniqueMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Payment Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <a
          href="/api/reports/export-csv/?type=bills"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
        >
          <Download className="w-3.5 h-3.5" />
          Export Bills CSV
        </a>
      </div>

      {/* Bills Table */}
      {loading ? (
        <LoadingSpinner message="Calculating billing ledgers & tariffs..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : bills.length === 0 ? (
        <EmptyState
          title="No billing statements generated"
          description="Generate your first monthly facility electricity bill based on meter readings."
          actionText={canGenerate ? 'Generate Monthly Bill' : undefined}
          onAction={canGenerate ? () => setGenModalOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Billing Month</th>
                  <th className="py-3.5 px-4">Facility</th>
                  <th className="py-3.5 px-4 text-right">Units (kWh)</th>
                  <th className="py-3.5 px-4 text-right">Energy Charge</th>
                  <th className="py-3.5 px-4 text-right">Fixed Fee</th>
                  <th className="py-3.5 px-4 text-right">Tax (12%)</th>
                  <th className="py-3.5 px-4 text-right">Total Invoiced</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.billing_month}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{b.facility_name}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium">{b.units_consumed.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">₹{b.energy_charge.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">₹{b.fixed_charge.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">₹{b.tax.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                      ₹{b.total_amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(b.payment_status)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedBill(b)}
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Bill Modal */}
      <Modal
        isOpen={genModalOpen}
        onClose={() => setGenModalOpen(false)}
        title="Generate Facility Electricity Bill"
        subtitle="Calculates: Units × Tariff Rate + Fixed Charge + Applicable Government Tax"
      >
        {genError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{genError}</span>
          </div>
        )}

        <form onSubmit={handleGenerateBill} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Facility *</label>
            <select
              required
              value={genFacilityId}
              onChange={(e) => setGenFacilityId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name} ({fac.building_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Month (YYYY-MM) *</label>
            <input
              type="month"
              required
              value={genMonth}
              onChange={(e) => setGenMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Automatic Billing Pipeline:</div>
            <div>1. Aggregates all meter telemetry readings for the target facility in {genMonth}.</div>
            <div>2. Multiplies units by active tariff rate (₹{editingTariff?.rate_per_kwh ?? 7.85}).</div>
            <div>3. Adds fixed demand charge (₹{editingTariff?.fixed_charge ?? 3500}).</div>
            <div>4. Calculates tax at {editingTariff?.tax_percentage ?? 12}%.</div>
            <div className="text-emerald-700 font-semibold pt-1">
              Guarantees zero duplicate bills for the same facility and month.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setGenModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={genSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {genSubmitting ? 'Computing Bill...' : 'Calculate & Store Bill'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Itemized Bill / Invoice Breakdown Modal */}
      <Modal
        isOpen={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        title="Electricity Consumption Statement & Invoice"
        subtitle={`Invoice Ref: ${selectedBill?.id} • Period: ${selectedBill?.billing_month}`}
        maxWidth="xl"
      >
        {selectedBill && (
          <div className="space-y-5 text-xs text-slate-700">
            {/* Invoice Top Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="font-extrabold text-base text-slate-900 block">GREENGrid Energy EMIS</span>
                <span className="text-[11px] text-slate-500">Official Utility Billing Statement</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase">Payment Status</span>
                {getStatusBadge(selectedBill.payment_status)}
              </div>
            </div>

            {/* Bill Meta */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Billed Facility</span>
                <span className="font-bold text-slate-900 text-sm">{selectedBill.facility_name}</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">Facility ID: {selectedBill.facility_id}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block uppercase">Billing Month</span>
                <span className="font-bold text-slate-900 text-sm">{selectedBill.billing_month}</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">Due Date: {selectedBill.due_date?.slice(0, 10) || 'Immediate'}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Units / Rate</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3 font-medium">Electricity Active Consumption</td>
                    <td className="py-2 px-3 text-right font-mono">
                      {selectedBill.units_consumed.toLocaleString()} kWh @ ₹{selectedBill.rate_per_kwh}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">
                      ₹{selectedBill.energy_charge.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Monthly Fixed Contract Demand Fee</td>
                    <td className="py-2 px-3 text-right font-mono">Flat Rate</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">
                      ₹{selectedBill.fixed_charge.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Electricity Duty &amp; Government Tax (12%)</td>
                    <td className="py-2 px-3 text-right font-mono">12.00%</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">
                      ₹{selectedBill.tax.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold text-slate-900 text-sm">
                    <td className="py-3 px-3">Total Payable Amount</td>
                    <td className="py-3 px-3 text-right"></td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700">
                      ₹{selectedBill.total_amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Status Action */}
            {canGenerate && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Update Status:</span>
                  {(['Pending', 'Paid', 'Overdue'] as PaymentStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedBill.id, st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        selectedBill.payment_status === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Statement
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Tariff Configuration Modal (Admin Only) */}
      <Modal
        isOpen={tariffModalOpen}
        onClose={() => setTariffModalOpen(false)}
        title="Electricity Tariff Schedule Settings"
        subtitle="Manage dynamic per-unit rates, fixed monthly demand fees, and tax schedules"
      >
        <form onSubmit={handleUpdateTariff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Active Tariff Schedule Name
            </label>
            <input
              type="text"
              disabled
              value={editingTariff?.name || ''}
              className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rate per Kilowatt-Hour (₹/kWh) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.1"
              required
              value={tariffRate}
              onChange={(e) => setTariffRate(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Applied automatically to all electricity consumption calculations
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fixed Demand Monthly Charge (₹) *
            </label>
            <input
              type="number"
              step="1"
              min="0"
              required
              value={tariffFixed}
              onChange={(e) => setTariffFixed(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Statutory Tax / Electricity Duty Percentage (%) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              required
              value={tariffTax}
              onChange={(e) => setTariffTax(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setTariffModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Update Tariff Parameters
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
