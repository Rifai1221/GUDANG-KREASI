import React, { useRef } from 'react';
import { Project } from '../types';
import { formatRupiah } from '../utils/calculator';
import { generateProjectPdf } from '../utils/pdfGenerator';
import {
  X,
  Download,
  Printer,
  FileCheck,
  Eye,
  Building,
  User,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';

interface PrintPreviewModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !project) return null;

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generateProjectPdf(project);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[95vh] text-slate-100 overflow-hidden print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Preview Hasil Cetak Dokumen / Kwitansi
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {project.estimateNumber} • {project.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBrowserPrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Cetak langsung menggunakan printer browser"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Sheet Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 flex justify-center print:p-0 print:bg-white">
          {/* A4 Sheet Representation */}
          <div
            ref={printRef}
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-sm p-8 sm:p-12 flex flex-col justify-between text-xs font-sans print:shadow-none print:w-full print:p-0 print:min-h-0"
          >
            {/* Header Banner */}
            <div>
              <div className="bg-slate-900 text-white p-5 rounded-lg mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-extrabold tracking-wide uppercase">
                    GUDANG KREASI ALUMUNIUM
                  </h1>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Kalkulasi Presisi Kusen, Pintu, Jendela & Facade Glass
                  </p>
                </div>
                <div className="text-right text-[11px] space-y-0.5 text-slate-300 font-mono">
                  <p className="font-bold text-white">No. Dokumen: {project.estimateNumber || 'RAB-2026-001'}</p>
                  <p>Tanggal: {project.date || new Date().toLocaleDateString('id-ID')}</p>
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                  Rincian Anggaran Biaya (RAB)
                </h2>
              </div>

              {/* Client & Project Info Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-28 font-bold text-slate-700">Nama Proyek:</span>
                    <span className="font-semibold text-slate-900">{project.title}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 font-bold text-slate-700">Klien / Pemesan:</span>
                    <span className="text-slate-900">{project.clientName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 font-bold text-slate-700">No. Telepon:</span>
                    <span className="text-slate-900">{project.clientPhone || '-'}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-28 font-bold text-slate-700">Alamat Proyek:</span>
                    <span className="text-slate-900">{project.clientAddress || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 font-bold text-slate-700">Status Dokumen:</span>
                    <span className="font-bold uppercase text-slate-800">{project.status}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-900 text-white font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-2 px-3 text-center w-10">No</th>
                      <th className="py-2 px-3">Uraian Pekerjaan & Spesifikasi</th>
                      <th className="py-2 px-3 text-center w-28">Dimensi (LxT)</th>
                      <th className="py-2 px-3 text-center w-14">Vol</th>
                      <th className="py-2 px-3 text-center w-16">Satuan</th>
                      <th className="py-2 px-3 text-right w-28">Harga Satuan</th>
                      <th className="py-2 px-3 text-right w-32">Total (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {project.items.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {item.brand} {item.profileSize} • Warna: {item.color} • Kaca: {item.glassType}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {item.widthMm} x {item.heightMm} mm
                          <span className="block text-[10px] text-slate-400">({item.perimeterMeters} m1)</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">Unit</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {formatRupiah(item.subtotalCost / item.quantity)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(item.subtotalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary & Signatures Section */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8">
                {/* Left side (Custom Notes if available) */}
                <div className="flex-1 text-xs space-y-2">
                  {project.notes && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <p className="font-bold text-slate-900 uppercase text-[11px] mb-1">Catatan Khusus:</p>
                      <p className="text-slate-600 leading-relaxed text-xs">{project.notes}</p>
                    </div>
                  )}
                </div>

                {/* Right side Calculation Summary Box */}
                <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <div className="p-3 space-y-1.5 font-mono text-slate-700">
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-600">Total Material:</span>
                      <span className="font-semibold">{formatRupiah(project.totalMaterialCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-600">Total Upah Tukang:</span>
                      <span className="font-semibold">{formatRupiah(project.totalLaborCost)}</span>
                    </div>
                    {project.totalOperationalCost > 0 && (
                      <div className="flex justify-between">
                        <span className="font-sans text-slate-600">Biaya Operasional:</span>
                        <span className="font-semibold">{formatRupiah(project.totalOperationalCost)}</span>
                      </div>
                    )}
                    {project.markupPercentage > 0 && (
                      <div className="flex justify-between">
                        <span className="font-sans text-slate-600">Jasa & Margin ({project.markupPercentage}%):</span>
                        <span className="font-semibold">{formatRupiah(project.markupAmount)}</span>
                      </div>
                    )}
                    {project.taxPercentage > 0 && (
                      <div className="flex justify-between">
                        <span className="font-sans text-slate-600">PPN ({project.taxPercentage}%):</span>
                        <span className="font-semibold">{formatRupiah(project.taxAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Grand Total Highlight */}
                  <div className="bg-teal-700 text-white p-3 flex justify-between items-center font-bold text-sm">
                    <span>GRAND TOTAL (Rp):</span>
                    <span className="font-mono text-base">{formatRupiah(project.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures Spot */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs mt-6 pt-4 border-t border-slate-200">
                <div className="space-y-16">
                  <p className="text-slate-600">Disetujui Oleh (Klien),</p>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1.5 max-w-[180px] mx-auto">
                    ( {project.clientName} )
                  </p>
                </div>

                <div className="space-y-16">
                  <p className="text-slate-600">Dibuat Oleh (Kontraktor),</p>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1.5 max-w-[200px] mx-auto">
                    ( GUDANG KREASI ALUMUNIUM )
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="mt-8 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono">
              Dokumen ini diterbitkan resmi secara otomatis oleh sistem GudangKreasi Aluminium Cost Calculator.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
