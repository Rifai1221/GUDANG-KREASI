import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Package, AlertTriangle, Plus, Search, CheckCircle, RefreshCw } from 'lucide-react';

interface InventoryTabProps {
  inventory: InventoryItem[];
  onUpdateStock: (itemId: string, addQuantity: number) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({ inventory, onUpdateStock }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [restockQty, setRestockQty] = useState<number>(10);

  const lowStockItems = inventory.filter((item) => item.stockQuantity <= item.minStockThreshold);

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || restockQty <= 0) return;
    onUpdateStock(selectedItemId, restockQty);
    alert('Stok bahan baku berhasil ditambahkan!');
    setRestockQty(10);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              Manajemen Stok Bahan Baku & Peringatan Otomatis
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Pantau ketersediaan stok batang alumunium, kaca, dan hardware. Notifikasi otomatis aktif saat stok menipis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> {lowStockItems.length} Bahan Menipis
            </span>
          </div>
        </div>

        {/* Low Stock Warning Alert Banner */}
        {lowStockItems.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-4 h-4" /> PERINGATAN OTOMATIS: Ditemukan Bahan Baku Dibawah Batas Minimum!
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
              {lowStockItems.map((item) => (
                <div key={item.id} className="p-2.5 rounded-lg bg-slate-950 border border-rose-500/30 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-200 line-clamp-1">{item.name}</p>
                    <p className="text-[11px] text-rose-400 font-medium">Sisa: {item.stockQuantity} {item.unit} (Min: {item.minStockThreshold})</p>
                  </div>
                  <button
                    onClick={() => setSelectedItemId(item.id)}
                    className="px-2 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[10px]"
                  >
                    Isi Ulang
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Restock Form & Inventory Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Restock Form */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-800">
            <Plus className="w-4 h-4 text-amber-400" /> Form Restock / Tambah Stok
          </h3>

          <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Pilih Material / Bahan Baku</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-500"
                required
              >
                <option value="">-- Pilih Item dari Katalog --</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Sisa: {item.stockQuantity} {item.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Jumlah Tambahan Restock</label>
              <input
                type="number"
                min="1"
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-amber-500/20"
            >
              Tambah Stok Sekarang
            </button>
          </form>
        </div>

        {/* Inventory Stock Table */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Filter stok bahan baku..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Nama Bahan Baku</th>
                  <th className="py-2.5 px-3 text-center">Satuan</th>
                  <th className="py-2.5 px-3 text-center">Stok Saat Ini</th>
                  <th className="py-2.5 px-3 text-center">Min Threshold</th>
                  <th className="py-2.5 px-3 text-center">Status Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredInventory.map((item) => {
                  const isLow = item.stockQuantity <= item.minStockThreshold;
                  return (
                    <tr key={item.id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-200 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.itemCode}</span>
                      </td>

                      <td className="py-3 px-3 text-center uppercase font-bold text-slate-400">{item.unit}</td>

                      <td className="py-3 px-3 text-center font-mono font-black text-sm text-slate-100">
                        {item.stockQuantity}
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-slate-400">{item.minStockThreshold}</td>

                      <td className="py-3 px-3 text-center">
                        {isLow ? (
                          <span className="px-2 py-1 rounded text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
                            MENIPIS
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            AMAN
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
