import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  Wifi,
  Database,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Key,
  Copy,
  Check
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const SettingsPage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sampleJsonWebhook = `{
  "meter_id": "MTR-CYB-MAIN",
  "reading_date": "2026-09-28",
  "meter_reading": 215400.5,
  "voltage_v": 415.2,
  "current_a": 128.4,
  "power_factor": 0.94
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleJsonWebhook);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System &amp; IoT Configuration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise database parameters, smart meter API ingress, and automated alerting thresholds
          </p>
        </div>

        <Badge variant="emerald" size="md">
          <ShieldCheck className="w-3.5 h-3.5" />
          Production EMIS Ready
        </Badge>
      </div>

      {/* IoT / Smart Meter Future Readiness Architecture (Section 37) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Future Smart Meter &amp; IoT Ingress Pipeline</h2>
            <p className="text-xs text-slate-400">
              Architecture for seamless plug-and-play field telemetry from Modbus/RS485 and LoRaWAN gateways
            </p>
          </div>
        </div>

        {/* Pipeline Diagram */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
            <Cpu className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
            <span className="text-xs font-bold text-white block">Smart Meter</span>
            <span className="text-[10px] text-slate-400">Modbus / LoRaWAN</span>
          </div>
          <div className="flex items-center justify-center text-slate-500 text-xs hidden md:flex font-mono">
            &rarr; Internet &rarr;
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
            <Wifi className="w-6 h-6 text-sky-400 mx-auto mb-1.5" />
            <span className="text-xs font-bold text-white block">Django REST API</span>
            <span className="text-[10px] text-slate-400">JWT / API Key auth</span>
          </div>
          <div className="flex items-center justify-center text-slate-500 text-xs hidden md:flex font-mono">
            &rarr; Persistence &rarr;
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
            <Database className="w-6 h-6 text-purple-400 mx-auto mb-1.5" />
            <span className="text-xs font-bold text-white block">MySQL &amp; Analytics</span>
            <span className="text-[10px] text-slate-400">ACID Relational Engine</span>
          </div>
        </div>

        {/* Webhook Specification */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-400">
              POST /api/energy/readings/ (JSON Ingestion Endpoint)
            </span>
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Payload' : 'Copy Sample Payload'}
            </button>
          </div>
          <pre className="text-xs font-mono text-slate-300 bg-slate-900/80 p-3 rounded-xl overflow-x-auto">
            {sampleJsonWebhook}
          </pre>
        </div>
      </div>

      {/* Threshold Configuration */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Automated Anomaly Detection Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">HIGH_CONSUMPTION Trigger</div>
            <p className="text-slate-600">
              Triggers when current day load exceeds 7-day rolling average by <strong>&gt;20%</strong>.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">UNUSUAL_NIGHT_USAGE Trigger</div>
            <p className="text-slate-600">
              Fires when off-peak night consumption (00:00 - 05:00) exceeds unoccupied baseline tolerances.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">RENEWABLE_DROP Trigger</div>
            <p className="text-slate-600">
              Fires when solar/wind output drops &gt;30% below seasonal solar insolation forecast.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">NEGATIVE_CONSUMPTION Prevention</div>
            <p className="text-slate-600">
              Rejects any current meter reading less than previous recorded reading without authorized reset.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
