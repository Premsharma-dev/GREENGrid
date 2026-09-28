import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Filter,
  Lightbulb,
  Search,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { alertService } from '../services/alertService';
import { facilityService } from '../services/facilityService';
import { Alert, Recommendation, Facility, AlertSeverity, AlertStatus } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export const Alerts: React.FC = () => {
  const { user } = useAuth();
  const canResolve = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [facilityFilter, setFacilityFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [severityFilter, statusFilter, facilityFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [alts, recs, facs] = await Promise.all([
        alertService.getAlerts({
          severity: severityFilter,
          status: statusFilter,
          facility_id: facilityFilter,
        }),
        alertService.getRecommendations(facilityFilter),
        facilityService.getAll(),
      ]);
      setAlerts(alts);
      setRecommendations(recs);
      setFacilities(facs);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to query alerts.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await alertService.markRead(id);
      await loadData();
    } catch (err: any) {
      alert('Error updating alert: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleMarkResolved = async (id: string) => {
    try {
      await alertService.markResolved(id);
      await loadData();
    } catch (err: any) {
      alert('Error resolving alert: ' + (err.response?.data?.detail || err.message));
    }
  };

  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'Critical':
        return <Badge variant="danger" size="sm">Critical</Badge>;
      case 'High':
        return <Badge variant="warning" size="sm">High</Badge>;
      case 'Medium':
        return <Badge variant="info" size="sm">Medium</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Low</Badge>;
    }
  };

  const getStatusBadge = (st: AlertStatus) => {
    switch (st) {
      case 'Resolved':
        return <Badge variant="success" size="sm">Resolved</Badge>;
      case 'Read':
        return <Badge variant="neutral" size="sm">Acknowledged</Badge>;
      default:
        return <Badge variant="warning" size="sm">New Incident</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Anomalies &amp; Energy Intelligence</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time threshold triggers, off-hours night baseline spikes, and rule-based energy conservation actions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="warning" size="md">
            {alerts.filter(a => a.status === 'New').length} New Alerts
          </Badge>
          <Badge variant="emerald" size="md">
            {recommendations.length} Active Recommendations
          </Badge>
        </div>
      </div>

      {/* Recommendations Engine Section */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-emerald-900/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Rule-Based Efficiency Recommendations</h2>
              <p className="text-xs text-slate-400">Algorithmic energy-saving actions derived from telemetry patterns</p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/20">
            EMIS Rules Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="emerald" size="sm">{rec.recommendation_type}</Badge>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Est. {rec.potential_savings}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">{rec.title}</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{rec.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{rec.facility_name || 'System Wide'}</span>
                </div>
                <span className="font-semibold text-emerald-400">Priority: {rec.priority}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
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
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="New">New Incidents</option>
            <option value="Read">Acknowledged</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <span className="text-slate-400 font-mono text-[11px]">
          {alerts.length} Incidents Filtered
        </span>
      </div>

      {/* Alerts Feed List */}
      {loading ? (
        <LoadingSpinner message="Scanning telemetry alert rules..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No alerts found"
          description="All monitored facilities are operating within normal electrical parameters."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alt) => (
            <div
              key={alt.id}
              className={`p-4 bg-white rounded-2xl border transition-all ${
                alt.status === 'New'
                  ? 'border-amber-300 shadow-xs ring-1 ring-amber-100'
                  : 'border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      alt.severity === 'Critical'
                        ? 'bg-rose-50 text-rose-600'
                        : alt.severity === 'High'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-sky-50 text-sky-600'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{alt.title}</h3>
                      {getSeverityBadge(alt.severity)}
                      {getStatusBadge(alt.status)}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">{alt.message}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span className="font-semibold text-slate-600">{alt.facility_name}</span>
                      <span>•</span>
                      <span>Type: {alt.alert_type}</span>
                      <span>•</span>
                      <span>Logged: {new Date(alt.created_at).toLocaleString()}</span>
                      {alt.resolved_at && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600">
                            Resolved: {new Date(alt.resolved_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {alt.status === 'New' && (
                    <button
                      onClick={() => handleMarkRead(alt.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Acknowledge
                    </button>
                  )}

                  {canResolve && alt.status !== 'Resolved' && (
                    <button
                      onClick={() => handleMarkResolved(alt.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
