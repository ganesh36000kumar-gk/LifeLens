import React from 'react';
import { SimulationResult } from '../../types/decision';
import { exportSimulationToCsv, exportSimulationToJson, printSimulationReport } from '../../lib/export';
import { X, FileSpreadsheet, FileCode, Printer, Download } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: SimulationResult | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  simulation,
}) => {
  if (!isOpen || !simulation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 shadow-2xl space-y-4 max-h-[88vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-400 shrink-0" />
            <h3 className="text-base font-bold text-white">Export Simulation</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Choose your preferred data format for archiving or spreadsheet analysis:
        </p>

        <div className="space-y-2.5">
          {/* Print / Save to PDF */}
          <button
            onClick={() => {
              onClose();
              setTimeout(() => printSimulationReport(), 200);
            }}
            className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-emerald-500/50 hover:bg-slate-900 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Print / Save as PDF</div>
                <div className="text-xs text-slate-400">Formatted executive summary for printing or PDF export</div>
              </div>
            </div>
          </button>

          {/* CSV Spreadsheet */}
          <button
            onClick={() => {
              exportSimulationToCsv(simulation);
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-emerald-500/50 hover:bg-slate-900 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">CSV Spreadsheet Data</div>
                <div className="text-xs text-slate-400">Excel / Google Sheets compatible projections table</div>
              </div>
            </div>
          </button>

          {/* JSON Full Data */}
          <button
            onClick={() => {
              exportSimulationToJson(simulation);
              onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-emerald-500/50 hover:bg-slate-900 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <FileCode className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Structured JSON Snapshot</div>
                <div className="text-xs text-slate-400">Complete raw mathematical models & schema</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
