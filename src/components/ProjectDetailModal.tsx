import React, { useState, useEffect } from 'react';
import {
  Project,
  ProjectStatus,
  FrameItem,
  InventoryItem,
  FrameType,
  AluminumBrand,
  AluminumColor,
  GlassType,
} from '../types';
import { formatRupiah, calculateProjectSummary, calculateFrameCosts } from '../utils/calculator';
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
  Plus,
  Minus,
  Trash2,
  Edit3,
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project | null;
  inventory?: InventoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSaveUpdate: (updatedProject: Project) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  inventory = [],
  isOpen,
  onClose,
  onSaveUpdate,
}) => {
  if (!isOpen || !project) return null;

  const [items, setItems] = useState<FrameItem[]>(project.items || []);
  const [markupPercentage, setMarkupPercentage] = useState<number>(project.markupPercentage || 15);
  const [taxPercentage, setTaxPercentage] = useState<number>(project.taxPercentage || 0);
  const [transportCost, setTransportCost] = useState<number>(project.laborSettings.transportCost || 0);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Modal State: Add New Order Item
  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState('Jendela Casement J2');
  const [newItemType, setNewItemType] = useState<FrameType>('kusen_jendela_casement');
  const [newItemWidth, setNewItemWidth] = useState<number>(1200);
  const [newItemHeight, setNewItemHeight] = useState<number>(1400);
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemBrand, setNewItemBrand] = useState<AluminumBrand>('Alexindo');
  const [newItemColor, setNewItemColor] = useState<AluminumColor>('White (Putih)');
  const [newItemGlass, setNewItemGlass] = useState<GlassType>('Polos 5mm');

  // Modal State: Edit Specific Order Item
  const [editingItem, setEditingItem] = useState<FrameItem | null>(null);

  useEffect(() => {
    if (project) {
      setItems(project.items || []);
      setMarkupPercentage(project.markupPercentage || 15);
      setTaxPercentage(project.taxPercentage || 0);
      setTransportCost(project.laborSettings.transportCost || 0);
      setStatus(project.status);
    }
  }, [project]);

  // Recalculate summary live
  const updatedLaborSettings = {
    ...project.laborSettings,
    transportCost,
  };

  const summary = calculateProjectSummary(
    items,
    updatedLaborSettings,
    markupPercentage,
    taxPercentage
  );

  // Item list mutation handlers
  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newQty = Math.max(1, item.quantity + delta);
          return calculateFrameCosts({ ...item, quantity: newQty }, inventory, project.laborSettings);
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (itemId: string) => {
    if (items.length <= 1) {
      alert('Proyek harus memiliki minimal 1 jenis pesanan unit kusen.');
      return;
    }
    if (!confirm('Hapus jenis pesanan unit ini dari daftar RAB proyek?')) return;
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleAddNewItemSubmit = () => {
    if (!newItemName.trim()) {
      alert('Mohon masukkan nama unit pesanan.');
      return;
    }

    const newItem = calculateFrameCosts(
      {
        id: `item-added-${Date.now()}`,
        name: newItemName.trim(),
        type: newItemType,
        widthMm: Number(newItemWidth) || 1000,
        heightMm: Number(newItemHeight) || 1000,
        quantity: Number(newItemQty) || 1,
        profileSize: '4 Inch',
        brand: newItemBrand,
        color: newItemColor,
        glassType: newItemGlass,
        mullionVerticalCount: newItemType.includes('jendela') ? 1 : 0,
        mullionHorizontalCount: 0,
        hardware: {
          hingesCount: 2,
          lockSetCount: 1,
          slotCount: 0,
          frictionStayCount: newItemType.includes('jendela') ? 2 : 0,
          sealantMeters: Math.ceil(((newItemWidth + newItemHeight) * 2) / 1000),
          rubberMeters: Math.ceil(((newItemWidth + newItemHeight) * 2) / 1000),
          screwsSikuSet: 1,
        },
      },
      inventory,
      project.laborSettings
    );

    setItems((prev) => [...prev, newItem]);
    setShowAddItemModal(false);
  };

  const handleSaveEditedItemSubmit = () => {
    if (!editingItem) return;
    const updated = calculateFrameCosts(editingItem, inventory, project.laborSettings);
    setItems((prev) => prev.map((it) => (it.id === editingItem.id ? updated : it)));
    setEditingItem(null);
  };

  const handleSave = () => {
    const updated: Project = {
      ...project,
      items,
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
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Rincian Unit Kusen & Pintu Pesanan</h3>
              <button
                type="button"
                onClick={() => setShowAddItemModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition shadow-md shadow-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Unit Pesanan Baru
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Deskripsi & Spesifikasi</th>
                    <th className="py-2.5 px-3 text-center">Ukuran (mm)</th>
                    <th className="py-2.5 px-3 text-center">Vol (Unit)</th>
                    <th className="py-2.5 px-3 text-right">Per Unit</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-3 text-center">Aksi Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-850/50 transition">
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
                      {/* Quantity Stepper */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 w-fit mx-auto">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                            title="Kurangi Volume"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-amber-400 font-mono min-w-[20px] text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                            title="Tambah Volume"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {formatRupiah(item.subtotalCost / item.quantity)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {formatRupiah(item.subtotalCost)}
                      </td>
                      {/* Action buttons */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingItem({ ...item })}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Edit Spesifikasi Pesanan Ini"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                            title="Hapus Unit Ini dari Proyek"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

      {/* Modal: Tambah Unit Pesanan Baru */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Tambah Unit Pesanan Baru ke RAB
              </h3>
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nama Unit Pesanan</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-bold"
                  placeholder="Misal: Jendela Belakang J2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tipe Kusen</label>
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as FrameType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="kusen_jendela_casement">Jendela Casement / Swing</option>
                    <option value="kusen_jendela_sliding">Jendela Sliding / Geser</option>
                    <option value="kusen_pintu_swing">Pintu Swing Single</option>
                    <option value="kusen_pintu_sliding">Pintu Sliding Geser</option>
                    <option value="kusen_pintu_jendela_gabungan">Gabungan Pintu + Jendela</option>
                    <option value="kusen_mati_kaca">Kusen Kaca Mati</option>
                    <option value="boven_ventilasi">Boven Ventilasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Volume (Unit)</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Lebar (mm)</label>
                  <input
                    type="number"
                    step="50"
                    value={newItemWidth}
                    onChange={(e) => setNewItemWidth(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tinggi (mm)</label>
                  <input
                    type="number"
                    step="50"
                    value={newItemHeight}
                    onChange={(e) => setNewItemHeight(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Merek Alumunium</label>
                  <select
                    value={newItemBrand}
                    onChange={(e) => setNewItemBrand(e.target.value as AluminumBrand)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="Alexindo">Alexindo</option>
                    <option value="YKK AP">YKK AP</option>
                    <option value="Forta">Forta</option>
                    <option value="Dacon">Dacon</option>
                    <option value="Incalum">Incalum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Warna Anodized / Powder</label>
                  <select
                    value={newItemColor}
                    onChange={(e) => setNewItemColor(e.target.value as AluminumColor)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="White (Putih)">White (Putih)</option>
                    <option value="Black (Hitam)">Black (Hitam)</option>
                    <option value="Brown (Cokelat)">Brown (Cokelat)</option>
                    <option value="Anodized Silver">Anodized Silver</option>
                    <option value="Urat Kayu (Wood)">Urat Kayu (Wood)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Jenis Kaca</label>
                <select
                  value={newItemGlass}
                  onChange={(e) => setNewItemGlass(e.target.value as GlassType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="Polos 5mm">Polos 5mm</option>
                  <option value="Polos 6mm">Polos 6mm</option>
                  <option value="Rayban 5mm">Rayban 5mm</option>
                  <option value="Es / Frosted 5mm">Es / Frosted 5mm</option>
                  <option value="Tempered 8mm">Tempered 8mm</option>
                  <option value="Tanpa Kaca">Tanpa Kaca</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddNewItemSubmit}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20"
              >
                + Tambah ke Daftar RAB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Spesifikasi Pesanan */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4" /> Edit Spesifikasi Pesanan
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nama Unit Pesanan</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Lebar (mm)</label>
                  <input
                    type="number"
                    step="50"
                    value={editingItem.widthMm}
                    onChange={(e) => setEditingItem({ ...editingItem, widthMm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tinggi (mm)</label>
                  <input
                    type="number"
                    step="50"
                    value={editingItem.heightMm}
                    onChange={(e) => setEditingItem({ ...editingItem, heightMm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Volume (Unit)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Merek Alumunium</label>
                  <select
                    value={editingItem.brand}
                    onChange={(e) => setEditingItem({ ...editingItem, brand: e.target.value as AluminumBrand })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="Alexindo">Alexindo</option>
                    <option value="YKK AP">YKK AP</option>
                    <option value="Forta">Forta</option>
                    <option value="Dacon">Dacon</option>
                    <option value="Incalum">Incalum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Warna Anodized / Powder</label>
                  <select
                    value={editingItem.color}
                    onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value as AluminumColor })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="White (Putih)">White (Putih)</option>
                    <option value="Black (Hitam)">Black (Hitam)</option>
                    <option value="Brown (Cokelat)">Brown (Cokelat)</option>
                    <option value="Anodized Silver">Anodized Silver</option>
                    <option value="Urat Kayu (Wood)">Urat Kayu (Wood)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Jenis Kaca</label>
                <select
                  value={editingItem.glassType}
                  onChange={(e) => setEditingItem({ ...editingItem, glassType: e.target.value as GlassType })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="Polos 5mm">Polos 5mm</option>
                  <option value="Polos 6mm">Polos 6mm</option>
                  <option value="Rayban 5mm">Rayban 5mm</option>
                  <option value="Es / Frosted 5mm">Es / Frosted 5mm</option>
                  <option value="Tempered 8mm">Tempered 8mm</option>
                  <option value="Tanpa Kaca">Tanpa Kaca</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditedItemSubmit}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
