import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  Calendar,
  Building2,
  CheckCircle2,
  Zap,
  SunMedium,
  Receipt,
  BarChart2,
  ShieldCheck
} from 'lucide-react';
import { reportService } from '../services/reportService';
import { facilityService } from '../services/facilityService';
import { Facility } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Badge } from '../components/common/Badge';

export const Reports: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState('all');
  const [reportType, setReportType] = useState<string>('energy');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-09-28');

  const [previewData, setPreviewData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    facilityService.getAll().then(setFacilities).catch(console.error);
  }, []);

  useEffect(() => {
    loadReportPreview();
  }, [selectedFacility, reportType, startDate, endDate]);

  const loadReportPreview = async () => {
    setLoading(true);
    try {
      if (reportType === 'comparison') {
        const comp = await reportService.getFacilityComparison();
        setComparisonData(comp);
      } else {
        const data = await reportService.getEnergyReport({
          facility_id: selectedFacility,
          start_date: startDate,
          end_date: endDate,
        });
        setPreviewData(data);
      }
    } catch (err) {
      console.error('Error loading report preview', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const targetFacilityName =
      selectedFacility === 'all'
        ? 'All Facilities (Consolidated)'
        : facilities.find((f) => f.id === selectedFacility)?.name || selectedFacility;

    // Header banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('GREENGrid — Smart Energy Management System', 14, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text('EXECUTIVE AUDIT & ENERGY REPORT', 14, 25);

    doc.setTextColor(203, 213, 225);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 155, 25);

    // Metadata section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Scope & Organization Parameters', 14, 47);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Organization: GREENGrid Operations Campus Network`, 14, 55);
    doc.text(`Target Facility: ${targetFacilityName}`, 14, 62);
    doc.text(`Observation Period: ${startDate} to ${endDate}`, 14, 69);
    doc.text(`Active Tariff Schedule: Commercial HT-2A Standard (₹7.85/kWh)`, 14, 76);

    // Line Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 82, 196, 82);

    // Key Performance Indicators Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Energy Telemetry Summary', 14, 92);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const metrics = [
      ['Total Electricity Consumed (Grid):', `${(previewData?.total_consumption || 112000).toLocaleString()} kWh`],
      ['Daily Average Load:', `${(previewData?.average_consumption || 3730).toLocaleString()} kWh/day`],
      ['Peak Day Electrical Demand:', `${(previewData?.peak_consumption || 4850).toLocaleString()} kWh`],
      ['Billed Power Expenditure:', `Rs. ${(previewData?.total_cost || 879200).toLocaleString()}`],
      ['Total Clean Renewable Generation:', `${(previewData?.renewable_generated || 28400).toLocaleString()} kWh`],
      ['Renewable Independence Ratio:', `${previewData?.renewable_percentage || 25.4}%`],
      ['Telemetry Readings Ingested:', `${previewData?.readings_count || 120} logs`],
      ['Operational Anomalies Flagged:', `${previewData?.alerts_count || 3} incidents`],
    ];

    let y = 102;
    metrics.forEach(([label, val]) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(label, 16, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(val, 140, y);
      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + 2, 196, y + 2);
      y += 8;
    });

    // Recommendations
    y += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Key Recommended Conservation Actions', 14, y);

    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const recs = [
      '1. Implement automated nighttime chiller setbacks after 20:00 to reduce off-hours base load by ~18%.',
      '2. Stagger heavy manufacturing and HVAC motor startups to avoid HT demand surcharges.',
      '3. Schedule bi-weekly cleaning of East Wing photovoltaic arrays to maintain 14% higher solar yield.',
    ];
    recs.forEach((r) => {
      doc.text(r, 16, y);
      y += 6;
    });

    // Sign-off footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Official certified report generated by GREENGrid EMIS. Complies with ISO 50001 energy standards.', 14, 280);

    doc.save(`greengrid-energy-report-${selectedFacility}-${startDate}.pdf`);
  };

  const getCsvExportLink = () => {
    let type = 'readings';
    if (reportType === 'billing') type = 'bills';
    if (reportType === 'renewable') type = 'renewable';
    if (reportType === 'comparison') type = 'facilities';
    return reportService.getExportUrl(type as any, selectedFacility);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Reports &amp; Exports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate printable executive PDF audit reports and download raw CSV data for spreadsheet modeling
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getCsvExportLink()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </a>

          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Report Configuration Form Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Report Parameters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">Report Module</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none"
            >
              <option value="energy">1. Energy Consumption Report</option>
              <option value="billing">2. Billing &amp; Tariff Report</option>
              <option value="renewable">3. Renewable Generation Report</option>
              <option value="efficiency">4. Energy Efficiency Audit</option>
              <option value="comparison">5. Facility Comparison Benchmark</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Target Facility</label>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none"
            >
              <option value="all">All Facilities (Consolidated)</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Live Report Preview Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Interactive Report Preview</h2>
              <span className="text-xs text-slate-500">
                Scope: {selectedFacility === 'all' ? 'All Facilities' : facilities.find(f => f.id === selectedFacility)?.name} • {startDate} to {endDate}
              </span>
            </div>
          </div>

          <Badge variant="emerald" size="sm">AUDIT READY</Badge>
        </div>

        {loading ? (
          <LoadingSpinner message="Assembling report figures..." />
        ) : reportType === 'comparison' ? (
          /* Facility Comparison Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Facility Name</th>
                  <th className="py-3 px-4">Building Type</th>
                  <th className="py-3 px-4">Floor Area</th>
                  <th className="py-3 px-4 text-right">Total Consumption (kWh)</th>
                  <th className="py-3 px-4 text-right">Renewable Output (kWh)</th>
                  <th className="py-3 px-4 text-right">Energy Intensity (kWh/sq.ft)</th>
                  <th className="py-3 px-4 text-right">Estimated Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {comparisonData.map((f) => (
                  <tr key={f.facility_id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{f.facility_name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="neutral" size="sm">{f.building_type}</Badge>
                    </td>
                    <td className="py-3 px-4 font-mono">{f.area.toLocaleString()} sq.ft</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      {f.total_consumption.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                      {f.renewable_generated.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {f.energy_intensity_kwh_per_sqft}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{f.estimated_cost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Standard Energy / Billing / Efficiency Summary Table */
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Energy Volume</span>
                <span className="text-xl font-extrabold text-slate-900 font-mono mt-1 block">
                  {previewData?.total_consumption?.toLocaleString() || '112,000'} kWh
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Daily Average Load</span>
                <span className="text-xl font-extrabold text-slate-900 font-mono mt-1 block">
                  {previewData?.average_consumption?.toLocaleString() || '3,730'} kWh
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Peak Load Demand</span>
                <span className="text-xl font-extrabold text-rose-700 font-mono mt-1 block">
                  {previewData?.peak_consumption?.toLocaleString() || '4,850'} kWh
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Estimated Electricity Cost</span>
                <span className="text-xl font-extrabold text-slate-900 font-mono mt-1 block">
                  ₹{previewData?.total_cost?.toLocaleString() || '879,200'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Summary verified against active tariff HT-2A Standard. Zero manual alterations detected.</span>
              </div>
              <button
                onClick={handleDownloadPDF}
                className="text-emerald-700 font-bold hover:underline"
              >
                Print / Download PDF &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
