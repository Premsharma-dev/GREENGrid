import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Plus,
  Search,
  Filter,
  Building2,
  Calendar,
  Edit2,
  Trash2,
  Zap,
  SunMedium,
  Wind,
  Cpu
} from 'lucide-react';
import { meterService } from '../services/meterService';
import { facilityService } from '../services/facilityService';
import { Meter, Facility, MeterType, MeterUnit } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const Meters: React.FC = () => {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  const [meters, setMeters] = useState<Meter[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [formFacId, setFormFacId] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formType, setFormType] = useState<MeterType>('Electricity');
  const [formUnit, setFormUnit] = useState<MeterUnit>('kWh');
  const [formCapacity, setFormCapacity] = useState<number>(500);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [facilityFilter, typeFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mtrs, facs] = await Promise.all([
        meterService.getAll({
          facility_id: facilityFilter,
          meter_type: typeFilter,
        }),
        facilityService.getAll(),
      ]);
      setMeters(mtrs);
      setFacilities(facs);
      if (facs.length > 0 && !formFacId) {
        setFormFacId(facs[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load meters.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingMeter(null);
    setFormNumber('');
    setFormType('Electricity');
    setFormUnit('kWh');
    setFormCapacity(500);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStatus('Active');
    if (facilities.length > 0) setFormFacId(facilities[0].id);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (meter: Meter) => {
    setEditingMeter(meter);
    setFormFacId(meter.facility_id);
    setFormNumber(meter.meter_number);
    setFormType(meter.meter_type);
    setFormUnit(meter.unit);
    setFormCapacity(meter.capacity);
    setFormDate(meter.installation_date);
    setFormStatus(meter.status);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNumber.trim() || !formFacId) {
      setFormError('Meter number and facility are required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingMeter) {
        await meterService.update(editingMeter.id, {
          facility_id: formFacId,
          meter_number: formNumber,
          meter_type: formType,
          unit: formUnit,
          capacity: Number(formCapacity),
          installation_date: formDate,
          status: formStatus,
        });
      } else {
        await meterService.create({
          facility_id: formFacId,
          meter_number: formNumber,
          meter_type: formType,
          unit: formUnit,
          capacity: Number(formCapacity),
          installation_date: formDate,
          status: formStatus,
        });
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await meterService.delete(deleteId);
      setDeleteId(null);
      await loadData();
    } catch (err: any) {
      alert('Failed to delete meter: ' + (err.response?.data?.detail || err.message));
    }
  };

  const filteredMeters = meters.filter((m) =>
    m.meter_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.facility_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMeterIcon = (type: MeterType) => {
    switch (type) {
      case 'Solar':
        return <SunMedium className="w-4 h-4 text-emerald-500" />;
      case 'Wind':
        return <Wind className="w-4 h-4 text-sky-500" />;
      case 'Generator':
        return <Cpu className="w-4 h-4 text-amber-500" />;
      default:
        return <Zap className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Meter Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Telemetry hardware registry: Electricity, Solar PV, Wind turbines, and backup Generators
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Register New Meter
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search meter number or facility..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto text-xs">
          <select
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Facilities</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Meter Types</option>
            <option value="Electricity">Electricity</option>
            <option value="Solar">Solar</option>
            <option value="Wind">Wind</option>
            <option value="Generator">Generator</option>
          </select>
        </div>
      </div>

      {/* Meters Table */}
      {loading ? (
        <LoadingSpinner message="Querying active hardware meters..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredMeters.length === 0 ? (
        <EmptyState
          title="No meters found"
          description="Register your first submeter or change the filters above."
          actionText={canEdit ? 'Register Meter' : undefined}
          onAction={canEdit ? handleOpenAdd : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Meter Identifier</th>
                  <th className="py-3.5 px-4">Assigned Facility</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Capacity</th>
                  <th className="py-3.5 px-4">Latest Logged Reading</th>
                  <th className="py-3.5 px-4">Installed Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  {canEdit && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredMeters.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        {getMeterIcon(m.meter_type)}
                        <span>{m.meter_number}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{m.facility_name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="neutral" size="sm">
                        {m.meter_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {m.capacity} kW
                    </td>
                    <td className="py-3 px-4">
                      {m.last_reading ? (
                        <div>
                          <span className="font-mono font-bold text-slate-900">
                            {m.last_reading.toLocaleString()} {m.unit}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {m.last_reading_date}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No logs yet</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{m.installation_date}</td>
                    <td className="py-3 px-4">
                      <Badge variant={m.status === 'Active' ? 'success' : 'neutral'} size="sm">
                        {m.status}
                      </Badge>
                    </td>
                    {canEdit && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="Edit Meter"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteId(m.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Delete Meter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMeter ? 'Edit Meter Hardware' : 'Register New Submeter'}
        subtitle="Associate meter with building and specify engineering capacity"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Meter Serial / Identifier *</label>
            <input
              type="text"
              required
              value={formNumber}
              onChange={(e) => setFormNumber(e.target.value)}
              placeholder="e.g. MTR-CYB-02"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Facility *</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meter Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as MeterType)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Electricity">Electricity (Grid)</option>
                <option value="Solar">Solar Generation</option>
                <option value="Wind">Wind Turbine</option>
                <option value="Generator">Diesel Generator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measurement</label>
              <select
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value as MeterUnit)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="kWh">kWh (Kilowatt-Hour)</option>
                <option value="kW">kW (Kilowatt)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rated Capacity (kW)</label>
              <input
                type="number"
                min="1"
                value={formCapacity}
                onChange={(e) => setFormCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Installation Date</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Telemetry Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Active">Active (Collecting Telemetry)</option>
              <option value="Inactive">Inactive</option>
            </select>
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
              {submitting ? 'Saving...' : editingMeter ? 'Save Changes' : 'Register Meter'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Meter Deletion"
        maxWidth="sm"
      >
        <p className="text-xs text-slate-600 mb-4">
          Are you sure you want to delete this meter? All past energy readings collected from this meter will also be removed.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeleteId(null)}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
          >
            Delete Meter
          </button>
        </div>
      </Modal>
    </div>
  );
};
