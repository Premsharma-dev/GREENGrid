import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Gauge,
  Zap,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  Filter,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { facilityService } from '../services/facilityService';
import { Facility, BuildingType, FacilityStatus } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const Facilities: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formType, setFormType] = useState<BuildingType>('Office');
  const [formArea, setFormArea] = useState<number>(50000);
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<FacilityStatus>('Active');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await facilityService.getAll();
      setFacilities(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch facilities.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingFacility(null);
    setFormName('');
    setFormLocation('');
    setFormType('Office');
    setFormArea(50000);
    setFormDesc('');
    setFormStatus('Active');
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (fac: Facility) => {
    setEditingFacility(fac);
    setFormName(fac.name);
    setFormLocation(fac.location);
    setFormType(fac.building_type);
    setFormArea(fac.area);
    setFormDesc(fac.description);
    setFormStatus(fac.status);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formLocation.trim()) {
      setFormError('Name and location are required.');
      return;
    }
    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingFacility) {
        await facilityService.update(editingFacility.id, {
          name: formName,
          location: formLocation,
          building_type: formType,
          area: Number(formArea),
          description: formDesc,
          status: formStatus,
        });
      } else {
        await facilityService.create({
          name: formName,
          location: formLocation,
          building_type: formType,
          area: Number(formArea),
          description: formDesc,
          status: formStatus,
        });
      }
      setModalOpen(false);
      await loadFacilities();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Operation failed.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await facilityService.delete(deleteId);
      setDeleteId(null);
      await loadFacilities();
    } catch (err: any) {
      alert('Failed to delete facility: ' + (err.response?.data?.detail || err.message));
    }
  };

  const filtered = facilities.filter((fac) => {
    const matchesSearch =
      fac.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fac.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || fac.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Facility Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure buildings, campuses, square-footage parameters, and assigned power meters
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Facility
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search facility name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Facilities Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Loading facilities catalog..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadFacilities} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No facilities found"
          description="Try clearing your search filters or add a new building."
          actionText={isAdmin ? 'Add First Facility' : undefined}
          onAction={isAdmin ? handleOpenAdd : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((fac) => (
            <div
              key={fac.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={fac.status === 'Active' ? 'success' : 'neutral'} size="sm">
                      {fac.status}
                    </Badge>
                    <Badge variant="neutral" size="sm">
                      {fac.building_type}
                    </Badge>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">{fac.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 line-clamp-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{fac.location}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{fac.description || 'Facility operations & electrical monitoring.'}</p>
              </div>

              {/* Metrics Strip */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Meters</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{fac.meter_count ?? 2}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Area</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{(fac.area / 1000).toFixed(0)}k ft²</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Latest Load</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {fac.current_consumption ? `${fac.current_consumption} kWh` : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <Link
                    to={`/facilities/${fac.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    View Details &amp; Meters
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(fac)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Facility"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(fac.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Facility"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Facility Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFacility ? 'Edit Facility' : 'Create New Facility'}
        subtitle="Manage building metadata, square footage, and building classification"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Facility / Building Name *</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Science Complex Tower B"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location Address *</label>
            <input
              type="text"
              required
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="e.g. Block 4, Electronic City, Bengaluru"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Building Classification</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as BuildingType)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="College">College / Campus</option>
                <option value="Office">Office Building</option>
                <option value="Hospital">Hospital / Healthcare</option>
                <option value="Factory">Factory / Manufacturing</option>
                <option value="Warehouse">Warehouse / Logistics</option>
                <option value="Residential">Residential Complex</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Area (Sq. Ft.)</label>
              <input
                type="number"
                min="100"
                value={formArea}
                onChange={(e) => setFormArea(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as FacilityStatus)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description &amp; Infrastructure</label>
            <textarea
              rows={3}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="HVAC units, laboratory equipment, or solar installations..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
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
              disabled={formSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : editingFacility ? 'Save Changes' : 'Create Facility'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Facility Deletion"
        maxWidth="sm"
      >
        <p className="text-xs text-slate-600 mb-4">
          Are you sure you want to delete this facility? All associated meters, energy readings, bills, and alerts will be permanently removed.
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
            Delete Facility
          </button>
        </div>
      </Modal>
    </div>
  );
};
