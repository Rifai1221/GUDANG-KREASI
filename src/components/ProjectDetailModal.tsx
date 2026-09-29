import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { formatRupiah, calculateProjectSummary } from '../utils/calculator';
import { generateProjectPdf } from '../utils/pdfGenerator';
import { PrintPreviewModal } from './PrintPreviewModal';
import {
  X,
  FileText,
  Download,
  Building,
  User,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  Save,
  Scissors,
  Eye,
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveUpdate: (updatedProject: Project) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onSaveUpdate,
}) => {
  if (!isOpen || !project) return null;

  const [markupPercentage, setMarkupPercentage] = useState<number>(project.markupPercentage || 15);
  const [taxPercentage, setTaxPercentage] = useState<number>(project.taxPercentage || 0);
  const [transportCost, setTransportCost] = useState<number>(project.laborSettings.transportCost || 0);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Recalculate summary live
  const updatedLaborSettings = {
    ...project.laborSettings,
    transportCost,
  };

  const summary = calculateProjectSummary(
    project.items,
    updatedLaborSettings,
    markupPercentage,
    taxPercentage
  );

  const handleSave = () => {
    const updated: Project = {
      ...project,
      status,
      markupPercentage,
      taxPercentage,
      laborSettings: updatedLaborSettings,
      totalMaterialCost: summary.totalMaterialCost,
      totalLaborCost: summary.totalLaborCost,
      totalOperationalCost: summary.totalOperationalCost,
      subtotal: summary.subtotal,
      markupAmount: summary.markupAmount,
      taxAmount: summary.taxAmount,
      grandTotal: summary.grandTotal,
      estimatedProductionDays: summary.estimatedProductionDays,
      updatedAt: new Date().toISOString(),
    };

    onSaveUpdate(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 max-h-[90vh] flex flex-col space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">{project.title}</h2>
              <p className="text-xs text-slate-400 font-mono">No. RAB: {project.estimateNumber} • Tanggal: {project.date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Client Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Klien</span>
              <p className="font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" /> {project.clientName}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Telepon</span>
              <p className="font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {project.clientPhone || '-'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Alamat Proyek</span>
              <p className="font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {project.clientAddress || '-'}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Rincian Unit Kusen & Pintu</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Deskripsi & Spesifikasi</th>
                    <th className="py-2.5 px-3 text-center">Ukuran (mm)</th>
                    <th className="py-2.5 px-3 text-center">Vol</th>
                    <th className="py-2.5 px-3 text-right">Per Unit</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900">
                  {project.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-200">{item.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {item.brand} {item.profileSize} ({item.color}) • Kaca {item.glassType}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                        {item.widthMm} x {item.heightMm}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-200">{item.quantity} Unit</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {formatRupiah(item.subtotalCost / item.quantity)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {formatRupiah(item.subtotalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recalculation Settings */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4 text-xs">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Penyesuaian Biaya & Margin</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Margin Profit (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={markupPercentage}
                  onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Biaya Mobilisasi / Transport (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={transportCost}
                  onChange={(e) => setTransportCost(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">PPN (%)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-100"
                />
              </div>
            </div>

            {/* Summary Breakdown Box */}
            <div className="pt-3 border-t border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Material:</span>
                <span>{formatRupiah(summary.totalMaterialCost)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Upah Tukang:</span>
                <span>{formatRupiah(summary.totalLaborCost)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Biaya Operasional:</span>
                <span>{formatRupiah(summary.totalOperationalCost)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Margin Profit ({markupPercentage}%):</span>
                <span>{formatRupiah(summary.markupAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold text-base pt-2 border-t border-slate-800">
                <span>GRAND TOTAL RAB:</span>
                <span>{formatRupiah(summary.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
            >
              <Eye className="w-4 h-4" /> Preview Hasil Cetak
            </button>
            <button
              onClick={() =>
                generateProjectPdf({
                  ...project,
                  grandTotal: summary.grandTotal,
                  markupAmount: summary.markupAmount,
                  totalMaterialCost: summary.totalMaterialCost,
                  totalLaborCost: summary.totalLaborCost,
                })
              }
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            >
              <Download className="w-4 h-4 text-amber-400" /> Download PDF
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" /> Simpan Perubahan
            </button>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        project={{
          ...project,
          grandTotal: summary.grandTotal,
          markupAmount: summary.markupAmount,
          taxAmount: summary.taxAmount,
          markupPercentage,
          taxPercentage,
          totalMaterialCost: summary.totalMaterialCost,
          totalLaborCost: summary.totalLaborCost,
          totalOperationalCost: summary.totalOperationalCost,
        }}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
};
