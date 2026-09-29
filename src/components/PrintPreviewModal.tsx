import React, { useState, useRef } from 'react';
import { Project } from '../types';
import { formatRupiah } from '../utils/calculator';
import { generateProjectPdf } from '../utils/pdfGenerator';
import { FramePreviewSvg } from './FramePreviewSvg';
import { GudangKreasiLogo } from './GudangKreasiLogo';
import { getLocalShopProfile } from '../services/storageService';
import {
  X,
  Download,
  Printer,
  Eye,
  ImageIcon,
  CheckSquare,
  Square,
  Sparkles,
  Compass,
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
  const [includeDrawings, setIncludeDrawings] = useState<boolean>(true);
  const [drawingStyle, setDrawingStyle] = useState<'render3d' | 'cad'>('render3d');
  const [shopProfile] = useState(getLocalShopProfile());
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !project) return null;

  // Calculate All-In Blended Pricing for each item
  const baseItemsTotal = project.items.reduce((sum, item) => sum + item.subtotalCost, 0) || 1;
  const targetSubtotal = project.grandTotal - (project.taxAmount || 0);
  const blendFactor = targetSubtotal / baseItemsTotal;

  let accumulatedBlended = 0;
  const blendedItems = project.items.map((item, idx) => {
    let itemTotal = Math.round(item.subtotalCost * blendFactor);
    if (idx === project.items.length - 1) {
      itemTotal = targetSubtotal - accumulatedBlended;
    } else {
      accumulatedBlended += itemTotal;
    }
    const unitPrice = Math.round(itemTotal / (item.quantity || 1));
    return {
      ...item,
      blendedUnitPrice: unitPrice,
      blendedSubtotal: itemTotal,
    };
  });

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generateProjectPdf(project, includeDrawings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[95vh] text-slate-100 overflow-hidden print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/95 print:hidden">
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

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle Include Shop Drawings */}
            <button
              onClick={() => setIncludeDrawings(!includeDrawings)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                includeDrawings
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Aktifkan untuk menyertakan lampiran gambar ilustrasi"
            >
              {includeDrawings ? (
                <CheckSquare className="w-4 h-4 text-amber-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Gambar ({project.items.length} Unit)</span>
            </button>

            {/* Drawing Style Switcher (Modern 3D vs Blueprint CAD) */}
            {includeDrawings && (
              <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setDrawingStyle('render3d')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    drawingStyle === 'render3d'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tampilan Gambar Modern Realistis Berwarna seperti di Aplikasi"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Modern 3D</span>
                </button>
                <button
                  onClick={() => setDrawingStyle('cad')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    drawingStyle === 'cad'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tampilan Gambar Blueprint Garis CAD"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>CAD Line</span>
                </button>
              </div>
            )}

            <button
              onClick={handleBrowserPrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Cetak langsung menggunakan printer browser"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Sheet Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 flex flex-col items-center gap-8 print:p-0 print:bg-white print:gap-0">
          
          {/* ========================================================================= */}
          {/* SHEET 1: LEMBAR UTAMA RINCIAN ANGGARAN BIAYA (RAB) */}
          {/* ========================================================================= */}
          <div
            ref={printRef}
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-sm p-8 sm:p-12 flex flex-col justify-between text-xs font-sans print:shadow-none print:w-full print:p-0 print:min-h-0 print:break-after-page"
            style={{ pageBreakAfter: includeDrawings ? 'always' : 'auto' }}
          >
            <div>
              {/* Header Banner */}
              <div className="bg-slate-900 text-white p-5 rounded-lg mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <GudangKreasiLogo size={52} className="shrink-0 drop-shadow-md" />
                  <div>
                    <h1 className="text-xl font-extrabold tracking-wide uppercase">
                      {shopProfile.name || 'GUDANG KREASI ALUMUNIUM'}
                    </h1>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {shopProfile.address}
                    </p>
                  </div>
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
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="w-28 font-bold text-slate-700 shrink-0">Nama Proyek</span>
                    <span className="w-4 font-bold text-slate-500 text-center shrink-0">:</span>
                    <span className="flex-1 font-semibold text-slate-900">{project.title}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-28 font-bold text-slate-700 shrink-0">Klien / Pemesan</span>
                    <span className="w-4 font-bold text-slate-500 text-center shrink-0">:</span>
                    <span className="flex-1 text-slate-900">{project.clientName}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-28 font-bold text-slate-700 shrink-0">No. Telepon</span>
                    <span className="w-4 font-bold text-slate-500 text-center shrink-0">:</span>
                    <span className="flex-1 text-slate-900">{project.clientPhone || '-'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="w-28 font-bold text-slate-700 shrink-0">Alamat Proyek</span>
                    <span className="w-4 font-bold text-slate-500 text-center shrink-0">:</span>
                    <span className="flex-1 text-slate-900">{project.clientAddress || '-'}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-28 font-bold text-slate-700 shrink-0">Status Dokumen</span>
                    <span className="w-4 font-bold text-slate-500 text-center shrink-0">:</span>
                    <span className="flex-1 font-bold uppercase text-slate-800">{project.status}</span>
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
                    {blendedItems.map((item, idx) => (
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
                          {formatRupiah(item.blendedUnitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(item.blendedSubtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary & Signatures Section */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 mb-6">
                {/* Left side: Clean empty space */}
                <div className="flex-1"></div>

                {/* Right side Calculation Summary Box */}
                <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <div className="p-3 space-y-2 font-mono text-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-semibold text-slate-700">Total Biaya Pekerjaan:</span>
                      <span className="font-bold text-slate-900">{formatRupiah(targetSubtotal)}</span>
                    </div>
                    {project.taxPercentage > 0 && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-sans">PPN ({project.taxPercentage}%):</span>
                        <span className="font-semibold">{formatRupiah(project.taxAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Grand Total Highlight */}
                  <div className="bg-teal-700 text-white p-3.5 flex justify-between items-center font-bold text-sm">
                    <span>GRAND TOTAL (Rp):</span>
                    <span className="font-mono text-base">{formatRupiah(project.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures Spot */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs mt-6 pt-4 border-t border-slate-200">
                <div className="space-y-16">
                  <p className="font-bold text-slate-800">Disetujui,</p>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1.5 max-w-[200px] mx-auto">
                    ( {project.clientName} )
                  </p>
                </div>

                <div className="space-y-16">
                  <p className="font-bold text-slate-800">Dibuat Oleh,</p>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1.5 max-w-[220px] mx-auto">
                    ( {shopProfile.name || 'GUDANG KREASI ALUMUNIUM'} )
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="mt-6 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono">
              Halaman 1 — Dokumen Resmi Penawaran RAB • GUDANG KREASI ALUMUNIUM
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SHEET 2+: LAMPIRAN GAMBAR TEKNIS & SKETSA KERJA (SHOP DRAWING ANNEX) */}
          {/* ========================================================================= */}
          {includeDrawings && (
            <div
              className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-sm p-8 sm:p-12 flex flex-col justify-between text-xs font-sans print:shadow-none print:w-full print:p-0 print:min-h-0 print:break-before-page"
              style={{ pageBreakBefore: 'always' }}
            >
              <div>
                {/* Header Banner Lampiran */}
                <div className="bg-slate-900 text-white p-4 rounded-lg mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <GudangKreasiLogo size={42} className="shrink-0 drop-shadow-md" />
                    <div>
                      <h2 className="text-sm font-extrabold tracking-wide uppercase">
                        {shopProfile.name || 'GUDANG KREASI ALUMUNIUM'}
                      </h2>
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        {shopProfile.address}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] space-y-0.5 text-slate-300 font-mono">
                    <p className="font-bold text-white">No. Dokumen: {project.estimateNumber || 'RAB-2026-001'}</p>
                    <p className="font-bold text-white">Total: {formatRupiah(project.grandTotal)}</p>
                  </div>
                </div>

                {/* Subtitle Project Reference */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 mb-6 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center">
                    <span className="font-bold text-slate-700 mr-1.5">Proyek</span>
                    <span className="font-bold text-slate-500 mr-2">:</span>
                    <strong className="text-slate-900">{project.title}</strong>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold text-slate-700 mr-1.5">Pemesan</span>
                    <span className="font-bold text-slate-500 mr-2">:</span>
                    <strong className="text-slate-900">{project.clientName}</strong>
                  </div>
                </div>

                {/* Grid of Modern Drawing Cards (Pure SVG Illustration Only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                  {project.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-2xl overflow-hidden shadow-sm flex flex-col items-center justify-center break-inside-avoid print:break-inside-avoid"
                      style={{ pageBreakInside: 'avoid' }}
                    >
                      {/* Modern SVG Illustration (Only the SVG Drawing) */}
                      <div className="w-full flex items-center justify-center">
                        <FramePreviewSvg
                          type={item.type}
                          widthMm={item.widthMm}
                          heightMm={item.heightMm}
                          mullionVerticalCount={item.mullionVerticalCount}
                          mullionHorizontalCount={item.mullionHorizontalCount}
                          profileSize={item.profileSize}
                          brand={item.brand}
                          color={item.color}
                          glassType={item.glassType}
                          hasTopBoven={item.hasTopBoven}
                          topBovenHeightMm={item.topBovenHeightMm}
                          doorPanelType={item.doorPanelType}
                          doorWidthMm={item.doorWidthMm}
                          windowCount={item.windowCount}
                          windowHeightMm={item.windowHeightMm}
                          title={`${index + 1}. ${item.name} (${item.quantity} Unit)`}
                          controlledViewMode={drawingStyle}
                          hideToolbar={true}
                          hideFooter={true}
                          compact={true}
                          className="w-full border-0 shadow-none rounded-xl"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Footer Note */}
              <div className="mt-8 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono">
                Lampiran Gambar Desain & Sketsa Kerja — GUDANG KREASI ALUMUNIUM
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
