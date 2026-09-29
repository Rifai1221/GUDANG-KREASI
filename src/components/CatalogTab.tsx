import React, { useState } from 'react';
import { InventoryItem, PriceHistoryLog, MaterialCategory } from '../types';
import { formatRupiah } from '../utils/calculator';
import {
  Tag,
  Edit,
  History,
  Search,
  Check,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Percent,
  Building2,
  SlidersHorizontal,
  Plus,
  Trash2,
} from 'lucide-react';

interface CatalogTabProps {
  inventory: InventoryItem[];
  priceHistory: PriceHistoryLog[];
  onUpdateItemPrice: (itemId: string, newPrice: number, notes?: string, supplierName?: string) => void;
  onAddInventoryItem?: (item: InventoryItem) => void;
  onDeleteInventoryItem?: (itemId: string) => void;
  onResetCatalog: () => void;
}

export const CatalogTab: React.FC<CatalogTabProps> = ({
  inventory,
  priceHistory,
  onUpdateItemPrice,
  onAddInventoryItem,
  onDeleteInventoryItem,
  onResetCatalog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Single Item Edit Modal State
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [supplierName, setSupplierName] = useState<string>('Toko Alumunium Utama');
  const [editNotes, setEditNotes] = useState<string>('Penyesuaian harga pasar berkala');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Bulk Percentage Adjustment State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<string>('aluminum');
  const [bulkPercentage, setBulkPercentage] = useState<number>(5); // e.g. +5%
  const [bulkNotes, setBulkNotes] = useState<string>('Penyesuaian fluktuasi harga pasar');

  // Add New Material State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<MaterialCategory>('aluminum');
  const [newItemBrand, setNewItemBrand] = useState('Alexindo');
  const [newItemColor, setNewItemColor] = useState('Black (Hitam)');
  const [newItemSpec, setNewItemSpec] = useState('4 Inch');
  const [newItemUnit, setNewItemUnit] = useState<'batang' | 'm2' | 'pcs' | 'meter' | 'set' | 'm1'>('batang');
  const [newItemPrice, setNewItemPrice] = useState<number>(195000);
  const [newItemSupplier, setNewItemSupplier] = useState('Toko Alumunium Utama');
  const [newItemStock, setNewItemStock] = useState<number>(50);
  const [newItemMinStock, setNewItemMinStock] = useState<number>(10);

  const categories = [
    { id: 'all', label: 'Semua Material' },
    { id: 'aluminum', label: 'Batang Alumunium (6M)' },
    { id: 'glass', label: 'Kaca (per m²)' },
    { id: 'hardware', label: 'Hardware & Engsel' },
    { id: 'accessories', label: 'Sealant & Karet' },
    { id: 'labor_rate', label: 'Tarif Upah Tukang' },
  ];

  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setNewPrice(item.pricePerUnit);
    setSupplierName(item.supplierName || 'Toko Alumunium Utama');
  };

  const handleSavePrice = () => {
    if (!editingItem) return;
    onUpdateItemPrice(editingItem.id, newPrice, editNotes, supplierName);
    setEditingItem(null);
  };

  const handleAddNewItem = () => {
    if (!newItemName.trim()) {
      alert('Mohon masukkan nama material.');
      return;
    }

    const code = newItemCode.trim() || `MAT-${Date.now().toString(36).toUpperCase()}`;
    const newItem: InventoryItem = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      itemCode: code,
      name: newItemName.trim(),
      category: newItemCategory,
      brand: newItemBrand.trim(),
      color: newItemColor.trim(),
      spec: newItemSpec.trim(),
      unit: newItemUnit,
      pricePerUnit: Number(newItemPrice) || 0,
      supplierName: newItemSupplier.trim(),
      stockQuantity: Number(newItemStock) || 0,
      minStockThreshold: Number(newItemMinStock) || 5,
      lastUpdated: new Date().toISOString(),
    };

    if (onAddInventoryItem) {
      onAddInventoryItem(newItem);
    }

    setShowAddModal(false);
    setNewItemName('');
    setNewItemCode('');
    alert(`Material "${newItem.name}" berhasil ditambahkan ke master katalog!`);
  };

  const handleApplyBulkAdjustment = () => {
    const targets = inventory.filter(
      (item) => bulkCategory === 'all' || item.category === bulkCategory
    );

    if (targets.length === 0) {
      alert('Tidak ada material yang sesuai kriteria.');
      return;
    }

    targets.forEach((item) => {
      const calculatedNewPrice = Math.round(item.pricePerUnit * (1 + bulkPercentage / 100));
      onUpdateItemPrice(
        item.id,
        calculatedNewPrice,
        `Bulk Update ${bulkPercentage > 0 ? '+' : ''}${bulkPercentage}%: ${bulkNotes}`
      );
    });

    setShowBulkModal(false);
    alert(`Berhasil memperbarui ${targets.length} material dengan penyesuaian ${bulkPercentage}%!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-400" />
              Katalog & Rincian Harga Batang Alumunium & Material
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Master harga per batang 6 meter, kaca, hardware, dan penyesuaian pasar masal (Bulk Adjustment).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Material Baru</span>
            </button>

            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition shadow-sm"
            >
              <Percent className="w-4 h-4" />
              <span>Penyesuaian Masal (%)</span>
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>Riwayat ({priceHistory.length})</span>
            </button>

            <button
              onClick={onResetCatalog}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium transition border border-slate-700"
              title="Reset ke Standar Pasar Indonesia"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Default
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari profil alumunium, merek, atau tipe kaca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Category Tabs */}
          <div className="md:col-span-7 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Material Price Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Kode & Nama Material</th>
                <th className="py-3 px-4">Kategori / Spesifikasi</th>
                <th className="py-3 px-4 text-center">Satuan Unit</th>
                <th className="py-3 px-4 text-right">Harga Master (Rp)</th>
                <th className="py-3 px-4 text-center">Tren Pasar</th>
                <th className="py-3 px-4 text-center">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredItems.map((item) => {
                // Find previous log for trend indicator
                const logs = priceHistory.filter((l) => l.itemId === item.id);
                const lastLog = logs[0];
                let trendBadge = null;

                if (lastLog) {
                  const diff = item.pricePerUnit - lastLog.oldPrice;
                  if (diff > 0) {
                    trendBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <TrendingUp className="w-3 h-3" /> +{formatRupiah(diff)}
                      </span>
                    );
                  } else if (diff < 0) {
                    trendBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <TrendingDown className="w-3 h-3" /> {formatRupiah(diff)}
                      </span>
                    );
                  } else {
                    trendBadge = <span className="text-[10px] text-slate-500 font-mono">Stabil</span>;
                  }
                } else {
                  trendBadge = <span className="text-[10px] text-slate-500 font-mono">Stabil</span>;
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono font-bold text-amber-400 block">{item.itemCode}</span>
                      <span className="font-bold text-slate-100 text-sm">{item.name}</span>
                      {item.supplierName && (
                        <span className="block text-[10px] text-slate-400 font-medium">Supplier: {item.supplierName}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium border border-slate-700 capitalize">
                        {item.category.replace('_', ' ')}
                      </span>
                      {item.brand && <span className="ml-2 text-slate-400 font-semibold">• {item.brand}</span>}
                      {item.spec && <span className="ml-1 text-slate-400">({item.spec})</span>}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-300 uppercase">{item.unit}</td>

                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                      {formatRupiah(item.pricePerUnit)}
                    </td>

                    <td className="py-3.5 px-4 text-center">{trendBadge}</td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition"
                          title="Ubah Harga Satuan"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        {onDeleteInventoryItem && (
                          <button
                            onClick={() => onDeleteInventoryItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Hapus Material dari Katalog"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Price Update Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-400" /> Update Harga Satuan Material
            </h3>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-xs font-bold text-slate-200">{editingItem.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Harga Master Saat Ini: <strong className="text-slate-200 font-mono">{formatRupiah(editingItem.pricePerUnit)}</strong> / {editingItem.unit}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1">Harga Satuan Pasar Baru (Rupiah)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Supplier / Toko Langganan</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200"
                placeholder="e.g. Toko Alumunium Utama BSD"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Catatan Alasan Perubahan</label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSavePrice}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black"
              >
                Simpan Harga Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Percentage Adjustment Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Percent className="w-5 h-5 text-amber-400" /> Penyesuaian Harga Masal (%)
              </h3>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-200">
                Tutup
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Sesuaikan harga seluruh bahan sekaligus dengan persentase tertentu (misal kenaikan distributor +5%).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Target Kategori Material</label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold"
                >
                  <option value="all">Semua Kategori Material</option>
                  <option value="aluminum">Hanya Batang Alumunium (6M)</option>
                  <option value="glass">Hanya Kaca (per m²)</option>
                  <option value="hardware">Hanya Hardware & Engsel</option>
                  <option value="accessories">Hanya Sealant & Karet</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-amber-400 mb-1">Persentase Perubahan (+ % Kenaikan / - % Diskon)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.5"
                    value={bulkPercentage}
                    onChange={(e) => setBulkPercentage(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-emerald-400"
                  />
                  <span className="font-extrabold text-sm font-mono text-slate-200">%</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Catatan Keterangan</label>
                <input
                  type="text"
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleApplyBulkAdjustment}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20"
              >
                Terapkan Perubahan Masal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price History Log Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" /> Riwayat Perubahan Harga Material
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                Tutup
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {priceHistory.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-500">Belum ada catatan perubahan harga material.</p>
              ) : (
                priceHistory.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-200">{log.itemName}</span>
                      <span className="text-amber-400 font-mono">{new Date(log.changedAt).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <span>Lama: <strong className="text-slate-300 font-mono">{formatRupiah(log.oldPrice)}</strong></span>
                      <span>→</span>
                      <span>Baru: <strong className="text-emerald-400 font-mono">{formatRupiah(log.newPrice)}</strong></span>
                    </div>
                    {log.notes && <p className="text-[11px] text-slate-500 italic">"{log.notes}"</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" /> Tambah Material / Profil Baru ke Katalog
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Kategori Material</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => {
                      const cat = e.target.value as MaterialCategory;
                      setNewItemCategory(cat);
                      if (cat === 'aluminum') setNewItemUnit('batang');
                      else if (cat === 'glass') setNewItemUnit('m2');
                      else if (cat === 'hardware') setNewItemUnit('pcs');
                      else if (cat === 'accessories') setNewItemUnit('meter');
                      else if (cat === 'labor_rate') setNewItemUnit('m1');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold"
                  >
                    <option value="aluminum">Batang Alumunium (6 Meter)</option>
                    <option value="glass">Kaca (per m²)</option>
                    <option value="hardware">Hardware / Engsel / Kunci</option>
                    <option value="accessories">Aksesori (Sealant / Karet / Sekrup)</option>
                    <option value="labor_rate">Tarif Jasa / Upah Pasang</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Kode Material (Opsional)</label>
                  <input
                    type="text"
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value)}
                    placeholder="Contoh: AL-INK-01"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-400 mb-1">Nama Lengkap Material *</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Contoh: Kusen Inkalum 4 Inch Urat Kayu Ebony"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Merek</label>
                  <input
                    type="text"
                    value={newItemBrand}
                    onChange={(e) => setNewItemBrand(e.target.value)}
                    placeholder="Alexindo / Inkalum dll"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Warna / Finishing</label>
                  <input
                    type="text"
                    value={newItemColor}
                    onChange={(e) => setNewItemColor(e.target.value)}
                    placeholder="Hitam / Putih dll"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Ukuran / Spesifikasi</label>
                  <input
                    type="text"
                    value={newItemSpec}
                    onChange={(e) => setNewItemSpec(e.target.value)}
                    placeholder="4 Inch / 5mm dll"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-400 mb-1">Harga Satuan (Rupiah) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                    {formatRupiah(newItemPrice)} / {newItemUnit}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Satuan Hitung Unit</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold uppercase"
                  >
                    <option value="batang">Batang (Standard 6M)</option>
                    <option value="m2">m² (Meter Persegi Kaca)</option>
                    <option value="pcs">Pcs (Biji / Unit)</option>
                    <option value="set">Set (Pasang)</option>
                    <option value="meter">Meter (Panjang Karet/Seal)</option>
                    <option value="m1">m1 (Meter Lari Kusen)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-slate-400 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-slate-400 mb-1">Batas Minimum</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemMinStock}
                    onChange={(e) => setNewItemMinStock(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-slate-400 mb-1">Toko Supplier</label>
                  <input
                    type="text"
                    value={newItemSupplier}
                    onChange={(e) => setNewItemSupplier(e.target.value)}
                    placeholder="Nama Toko"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleAddNewItem}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20"
              >
                Simpan Material ke Katalog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
