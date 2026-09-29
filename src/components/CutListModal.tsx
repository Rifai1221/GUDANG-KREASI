import React from 'react';
import { FrameItem } from '../types';
import { optimizeBarCutList, ALUMINUM_BAR_LENGTH_MM } from '../utils/calculator';
import { X, Layers, Scissors, CheckCircle, AlertTriangle } from 'lucide-react';

interface CutListModalProps {
  items: FrameItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const CutListModal: React.FC<CutListModalProps> = ({ items, isOpen, onClose }) => {
  if (!isOpen) return null;

  const { totalBars, optimizations, wastePercentage } = optimizeBarCutList(items);
  const efficiency = (100 - wastePercentage).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Optimasi Pemotongan Batang Alumunium (6 M)</h2>
              <p className="text-xs text-slate-400">Rencana potong efisien untuk meminimalkan sisa bahan (Waste Reduction)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Batang (6 M)</p>
              <p className="text-2xl font-bold text-slate-100">{totalBars} <span className="text-xs font-normal text-slate-400">Batang</span></p>
            </div>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Efisiensi Material</p>
              <p className="text-2xl font-bold text-emerald-400">{efficiency}%</p>
            </div>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Sisa Potongan (Scrap)</p>
              <p className="text-2xl font-bold text-rose-400">{wastePercentage}%</p>
            </div>
          </div>
        </div>

        {/* Bar Cut Visualizer List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {optimizations.length === 0 ? (
            <p className="text-center py-8 text-slate-500 text-sm">Belum ada item kusen dalam daftar perhitungan.</p>
          ) : (
            optimizations.map((bar) => {
              const usedPercent = ((bar.totalUsedMm / ALUMINUM_BAR_LENGTH_MM) * 100).toFixed(1);
              return (
                <div key={`bar-${bar.barIndex}`} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-amber-400">Batang #{bar.barIndex} (Total 6000 mm)</span>
                    <span className="text-slate-400">
                      Terpakai: <strong className="text-slate-200">{bar.totalUsedMm} mm ({usedPercent}%)</strong> | Sisa: <strong className="text-rose-400">{bar.remainingMm} mm</strong>
                    </span>
                  </div>

                  {/* Visual Bar Tube */}
                  <div className="relative h-8 w-full bg-slate-800 rounded-lg overflow-hidden flex border border-slate-700 shadow-inner">
                    {bar.cuts.map((cut, cIdx) => {
                      const widthPercent = (cut.lengthMm / ALUMINUM_BAR_LENGTH_MM) * 100;
                      // Alternate colors for adjacent cut pieces
                      const colors = [
                        'bg-amber-600 border-r border-amber-800 text-amber-100',
                        'bg-teal-600 border-r border-teal-800 text-teal-100',
                        'bg-indigo-600 border-r border-indigo-800 text-indigo-100',
                        'bg-sky-600 border-r border-sky-800 text-sky-100',
                        'bg-emerald-600 border-r border-emerald-800 text-emerald-100',
                      ];
                      const colorClass = colors[cIdx % colors.length];

                      return (
                        <div
                          key={`cut-${cIdx}`}
                          style={{ width: `${widthPercent}%` }}
                          className={`${colorClass} h-full flex items-center justify-center text-[10px] font-mono font-bold truncate px-1 transition-all hover:brightness-125 cursor-default`}
                          title={`${cut.itemName}: ${cut.lengthMm} mm`}
                        >
                          {cut.lengthMm}mm
                        </div>
                      );
                    })}

                    {/* Scrap / Sisa segment */}
                    {bar.remainingMm > 0 && (
                      <div
                        style={{ width: `${(bar.remainingMm / ALUMINUM_BAR_LENGTH_MM) * 100}%` }}
                        className="bg-slate-900 text-slate-500 h-full flex items-center justify-center text-[9px] font-mono border-l border-dashed border-slate-700 truncate px-1"
                        title={`Sisa Potongan (Scrap): ${bar.remainingMm} mm`}
                      >
                        Sisa {bar.remainingMm}mm
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
