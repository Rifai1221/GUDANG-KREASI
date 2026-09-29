import React, { useState } from 'react';
import {
  FrameType,
  AluminumBrand,
  AluminumProfile,
  AluminumColor,
  GlassType,
  DoorInfillType,
  DoorHandleType,
  DoorHandlePosition,
  DoorHandleColor,
  FrameItem,
  InventoryItem,
  MaterialCategory,
  LaborSettings,
  Project,
  CustomDoorModel,
  CustomFrameModel,
  DoorPanelStyle,
  WindowLeafType,
} from '../types';
import { calculateFrameCosts, formatRupiah } from '../utils/calculator';
import { FramePreviewSvg } from './FramePreviewSvg';
import { CutListModal } from './CutListModal';
import { parseDesignWithAi, parseDesignRuleBased } from '../services/geminiAiService';
import {
  getLocalCustomFrameModels,
  saveLocalCustomFrameModels,
  getLocalCustomDoorModels,
  saveLocalCustomDoorModels,
} from '../services/storageService';
import {
  Plus,
  Scissors,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
  FileText,
  Building,
  User,
  Phone,
  MapPin,
  Trash2,
  DollarSign,
  SlidersHorizontal,
  Compass,
  DoorClosed,
  Grid,
  LayoutGrid,
  Wand2,
  KeyRound,
  GripHorizontal,
  ShieldCheck,
  Send,
  Loader2,
  Check,
} from 'lucide-react';

const DEFAULT_DOOR_MODELS: CustomDoorModel[] = [
  { id: 'panil_horizontal', name: 'Panil Horizontal Alumunium (Spandrel)', panelStyle: 'panil_horizontal' },
  { id: 'kaca_full', name: 'Kaca Penuh (Full Glass)', panelStyle: 'kaca_full' },
  { id: 'kaca_panil_bawah', name: 'Kaca Atas + Panil Bawah (Kombinasi)', panelStyle: 'kaca_panil_bawah' },
  { id: 'jalusi_louver', name: 'Jalusi / Louver Ventilasi Penuh', panelStyle: 'jalusi_louver' },
  { id: 'acp_solid', name: 'Panil ACP Solid Plat', panelStyle: 'acp_solid' },
  { id: 'ornamen_kotak', name: 'Kaca + Kisi Ornamen Kotak', panelStyle: 'ornamen_kotak' },
];

interface CalculatorTabProps {
  inventory: InventoryItem[];
  laborSettings: LaborSettings;
  setLaborSettings: (settings: LaborSettings) => void;
  onSaveProject: (project: Project) => void;
  onAddInventoryItem?: (item: InventoryItem) => void;
}

export const CalculatorTab: React.FC<CalculatorTabProps> = ({
  inventory,
  laborSettings,
  setLaborSettings,
  onSaveProject,
  onAddInventoryItem,
}) => {
  // Current Item Form State
  const [frameName, setFrameName] = useState('Jendela Utama Depan (J1)');
  const [frameType, setFrameType] = useState<FrameType>('kusen_jendela_casement');
  const [selectedModelId, setSelectedModelId] = useState<string>('kusen_jendela_casement');
  const [widthMm, setWidthMm] = useState<number>(1200);
  const [heightMm, setHeightMm] = useState<number>(1500);
  const [quantity, setQuantity] = useState<number>(1);

  const [profileSize, setProfileSize] = useState<AluminumProfile>('4 Inch');
  const [brand, setBrand] = useState<AluminumBrand>('Alexindo');
  const [color, setColor] = useState<AluminumColor>('Black (Hitam)');
  const [glassType, setGlassType] = useState<GlassType>('Polos 5mm');

  const [mullionVertical, setMullionVertical] = useState<number>(1);
  const [mullionHorizontal, setMullionHorizontal] = useState<number>(0);

  // Architectural Shop Drawing Options (like reference image)
  const [hasTopBoven, setHasTopBoven] = useState<boolean>(true);
  const [topBovenHeightMm, setTopBovenHeightMm] = useState<number>(140);
  const [doorPanelType, setDoorPanelType] = useState<string>('panil_horizontal');
  const [selectedDoorModelId, setSelectedDoorModelId] = useState<string>('panil_horizontal');
  const [doorWidthMm, setDoorWidthMm] = useState<number>(900);
  const [windowCount, setWindowCount] = useState<number>(3);
  const [windowHeightMm, setWindowHeightMm] = useState<number>(1350);
  const [windowLeaves, setWindowLeaves] = useState<WindowLeafType[]>(['open', 'fixed', 'open']);

  const handleWindowLeafCountChange = (newCount: number) => {
    setWindowCount(newCount);
    setMullionVertical(Math.max(0, newCount - 1));

    setWindowLeaves((prev) => {
      const nextLeaves: WindowLeafType[] = [];
      for (let i = 0; i < newCount; i++) {
        if (prev[i]) {
          nextLeaves.push(prev[i]);
        } else {
          nextLeaves.push((i === 0 || i === newCount - 1) ? 'open' : 'fixed');
        }
      }
      return nextLeaves;
    });
  };

  const handleToggleSingleLeaf = (index: number) => {
    setWindowLeaves((prev) => {
      const updated = [...prev];
      updated[index] = updated[index] === 'open' ? 'fixed' : 'open';
      return updated;
    });
  };

  // Smart Door Infill & Handle Configuration
  const [doorInfillType, setDoorInfillType] = useState<DoorInfillType>('acp_kayu_jati');
  const [handleType, setHandleType] = useState<DoorHandleType>('pull_80');
  const [handlePosition, setHandlePosition] = useState<DoorHandlePosition>('right');
  const [handleColor, setHandleColor] = useState<DoorHandleColor>('stainless');
  const [handleHeightMm, setHandleHeightMm] = useState<number>(1000);

  // AI Smart Estimator Assistant State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiFeedbackMessage, setAiFeedbackMessage] = useState<string | null>(null);

  // Custom User-Defined Frame and Door Models
  const [customDoorModels, setCustomDoorModels] = useState<CustomDoorModel[]>(() => {
    const saved = getLocalCustomDoorModels();
    return saved.length > 0 ? saved : DEFAULT_DOOR_MODELS;
  });

  const [customFrameModels, setCustomFrameModels] = useState<CustomFrameModel[]>(() => {
    return getLocalCustomFrameModels();
  });

  // Modal State: Add Custom Frame Model
  const [showAddFrameModal, setShowAddFrameModal] = useState(false);
  const [newFrameModelName, setNewFrameModelName] = useState('');
  const [newFrameBaseType, setNewFrameBaseType] = useState<FrameType>('kusen_pintu_jendela_gabungan');
  const [newFrameWidthMm, setNewFrameWidthMm] = useState<number>(2300);
  const [newFrameHeightMm, setNewFrameHeightMm] = useState<number>(2100);
  const [newFrameMullionV, setNewFrameMullionV] = useState<number>(1);
  const [newFrameMullionH, setNewFrameMullionH] = useState<number>(0);
  const [newFrameHasBoven, setNewFrameHasBoven] = useState<boolean>(true);
  const [newFrameBovenHeight, setNewFrameBovenHeight] = useState<number>(140);
  const [newFrameDoorWidth, setNewFrameDoorWidth] = useState<number>(900);
  const [newFrameWindowHeight, setNewFrameWindowHeight] = useState<number>(1350);

  // Modal State: Add Custom Door Model
  const [showAddDoorModal, setShowAddDoorModal] = useState(false);
  const [newDoorName, setNewDoorName] = useState('');
  const [newDoorPanelStyle, setNewDoorPanelStyle] = useState<DoorPanelStyle>('panil_horizontal');
  const [newDoorExtraCost, setNewDoorExtraCost] = useState<number>(0);
  const [newDoorNotes, setNewDoorNotes] = useState('');

  // Modal State: Quick Add Material to Master Catalog directly from Calculator
  const [showQuickAddMaterialModal, setShowQuickAddMaterialModal] = useState(false);
  const [quickCategory, setQuickCategory] = useState<MaterialCategory>('aluminum');
  const [quickName, setQuickName] = useState('');
  const [quickBrand, setQuickBrand] = useState('Alexindo');
  const [quickColor, setQuickColor] = useState('Black (Hitam)');
  const [quickSpec, setQuickSpec] = useState('4 Inch');
  const [quickUnit, setQuickUnit] = useState<'batang' | 'm2' | 'pcs' | 'meter' | 'set' | 'm1'>('batang');
  const [quickPrice, setQuickPrice] = useState<number>(195000);
  const [quickSupplier, setQuickSupplier] = useState('Toko Alumunium BSD');

  // Dynamic available brands, colors, and glass from inventory
  const availableBrands = Array.from(
    new Set([
      'Alexindo',
      'YKK AP',
      'Forta',
      'Dacon',
      'Incalum',
      ...inventory.filter((i) => i.brand).map((i) => i.brand as string),
    ])
  );

  const availableColors = Array.from(
    new Set([
      'White (Putih)',
      'Black (Hitam)',
      'Anodized Silver',
      'Brown (Cokelat)',
      'Urat Kayu (Wood)',
      ...inventory.filter((i) => i.color).map((i) => i.color as string),
    ])
  );

  const availableGlassTypes = Array.from(
    new Set([
      'Polos 5mm',
      'Polos 6mm',
      'Rayban 5mm',
      'Es / Frosted 5mm',
      'Tempered 8mm',
      'Tempered 10mm',
      'Tanpa Kaca',
      ...inventory.filter((i) => i.category === 'glass').map((i) => i.name),
    ])
  );

  const handleSaveCustomFrameModel = () => {
    if (!newFrameModelName.trim()) {
      alert('Mohon masukkan nama model kusen.');
      return;
    }

    const newModel: CustomFrameModel = {
      id: `custom-frame-${Date.now()}`,
      name: newFrameModelName.trim(),
      baseType: newFrameBaseType,
      defaultWidthMm: Number(newFrameWidthMm) || 2000,
      defaultHeightMm: Number(newFrameHeightMm) || 2000,
      mullionVertical: Number(newFrameMullionV) || 0,
      mullionHorizontal: Number(newFrameMullionH) || 0,
      hasTopBoven: newFrameHasBoven,
      topBovenHeightMm: Number(newFrameBovenHeight) || 140,
      doorWidthMm: Number(newFrameDoorWidth) || 900,
      windowHeightMm: Number(newFrameWindowHeight) || 1350,
      isCustom: true,
    };

    const updated = [...customFrameModels, newModel];
    setCustomFrameModels(updated);
    saveLocalCustomFrameModels(updated);

    // Apply the newly created model immediately
    setSelectedModelId(newModel.id);
    setFrameType(newModel.baseType);
    setFrameName(newModel.name);
    setWidthMm(newModel.defaultWidthMm);
    setHeightMm(newModel.defaultHeightMm);
    setMullionVertical(newModel.mullionVertical);
    setMullionHorizontal(newModel.mullionHorizontal);
    setHasTopBoven(newModel.hasTopBoven);
    setTopBovenHeightMm(newModel.topBovenHeightMm || 140);
    if (newModel.doorWidthMm) setDoorWidthMm(newModel.doorWidthMm);
    if (newModel.windowHeightMm) setWindowHeightMm(newModel.windowHeightMm);

    setShowAddFrameModal(false);
    setNewFrameModelName('');
    alert(`Model Kusen Kustom "${newModel.name}" berhasil disimpan dan diterapkan!`);
  };

  const handleDeleteCustomFrameModel = (id: string) => {
    if (!confirm('Hapus model kusen kustom ini?')) return;
    const updated = customFrameModels.filter((m) => m.id !== id);
    setCustomFrameModels(updated);
    saveLocalCustomFrameModels(updated);
    if (selectedModelId === id) {
      setSelectedModelId('kusen_jendela_casement');
      setFrameType('kusen_jendela_casement');
    }
  };

  const handleSaveCustomDoorModel = () => {
    if (!newDoorName.trim()) {
      alert('Mohon masukkan nama model daun pintu.');
      return;
    }

    const newDoor: CustomDoorModel = {
      id: `door-${Date.now()}`,
      name: newDoorName.trim(),
      panelStyle: newDoorPanelStyle,
      extraCost: Number(newDoorExtraCost) || 0,
      notes: newDoorNotes.trim(),
      isCustom: true,
    };

    const updated = [...customDoorModels, newDoor];
    setCustomDoorModels(updated);
    saveLocalCustomDoorModels(updated);

    setSelectedDoorModelId(newDoor.id);
    setDoorPanelType(newDoor.panelStyle);
    setShowAddDoorModal(false);
    setNewDoorName('');
    setNewDoorExtraCost(0);
    setNewDoorNotes('');
    alert(`Model Daun Pintu "${newDoor.name}" berhasil ditambahkan dan diterapkan!`);
  };

  const handleDeleteCustomDoorModel = (id: string) => {
    if (!confirm('Hapus model daun pintu ini?')) return;
    const updated = customDoorModels.filter((m) => m.id !== id);
    setCustomDoorModels(updated);
    saveLocalCustomDoorModels(updated);
    if (selectedDoorModelId === id) {
      setSelectedDoorModelId(DEFAULT_DOOR_MODELS[0].id);
      setDoorPanelType(DEFAULT_DOOR_MODELS[0].panelStyle);
    }
  };

  const handleSaveQuickMaterial = () => {
    if (!quickName.trim()) {
      alert('Mohon masukkan nama material.');
      return;
    }

    const newItem: InventoryItem = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      itemCode: `MAT-${Date.now().toString(36).toUpperCase()}`,
      name: quickName.trim(),
      category: quickCategory,
      brand: quickBrand.trim() || undefined,
      color: quickColor.trim() || undefined,
      spec: quickSpec.trim() || undefined,
      unit: quickUnit,
      pricePerUnit: Number(quickPrice) || 0,
      supplierName: quickSupplier.trim() || 'Supplier Proyek',
      stockQuantity: 50,
      minStockThreshold: 10,
      lastUpdated: new Date().toISOString(),
    };

    if (onAddInventoryItem) {
      onAddInventoryItem(newItem);
    }

    // Auto-select in form if matching
    if (quickCategory === 'aluminum') {
      if (newItem.brand) setBrand(newItem.brand as AluminumBrand);
      if (newItem.color) setColor(newItem.color as AluminumColor);
    } else if (quickCategory === 'glass') {
      setGlassType(newItem.name as GlassType);
    }

    setShowQuickAddMaterialModal(false);
    setQuickName('');
    setQuickBrand('');
    setQuickColor('');
    setQuickSpec('');
    alert(`Material "${newItem.name}" (${formatRupiah(newItem.pricePerUnit)}) berhasil ditambahkan ke Master Katalog!`);
  };

  // Custom Manual Price Overrides
  const [useCustomBarPrice, setUseCustomBarPrice] = useState<boolean>(false);
  const [customBarPriceInput, setCustomBarPriceInput] = useState<number>(195000);

  const [useCustomGlassPrice, setUseCustomGlassPrice] = useState<boolean>(false);
  const [customGlassPriceInput, setCustomGlassPriceInput] = useState<number>(150000);

  // Hardware counts (auto populated or editable)
  const [hingesCount, setHingesCount] = useState<number>(2);
  const [lockSetCount, setLockSetCount] = useState<number>(1);
  const [frictionStayCount, setFrictionStayCount] = useState<number>(2);

  // Project Header Info State
  const [projectTitle, setProjectTitle] = useState('Proyek Rumah Tinggal 2 Lantai');
  const [clientName, setClientName] = useState('Bpk. Hendra');
  const [clientPhone, setClientPhone] = useState('081234567890');
  const [clientAddress, setClientAddress] = useState('Jl. Boulevard Raya No. 45, Jakarta');
  const [markupPercentage, setMarkupPercentage] = useState<number>(15);

  // List of frame items in current calculator session
  const [itemList, setItemList] = useState<FrameItem[]>([]);
  const [isCutListOpen, setIsCutListOpen] = useState(false);

  // Active Door Model lookup
  const activeDoorModel = customDoorModels.find((d) => d.id === selectedDoorModelId) || customDoorModels[0];

  // Calculate live item preview
  const openLeavesCount = windowLeaves.filter((l) => l === 'open').length;

  const liveCalculatedItem = calculateFrameCosts(
    {
      id: 'temp-item',
      name: frameName || 'Unit Kusen',
      type: frameType,
      widthMm: Number(widthMm) || 500,
      heightMm: Number(heightMm) || 500,
      quantity: Number(quantity) || 1,
      profileSize,
      brand,
      color,
      glassType,
      mullionVerticalCount: Number(mullionVertical) || 0,
      mullionHorizontalCount: Number(mullionHorizontal) || 0,
      hasTopBoven,
      topBovenHeightMm,
      doorPanelType: activeDoorModel?.panelStyle || doorPanelType,
      doorPanelName: activeDoorModel?.name,
      doorPanelExtraCost: activeDoorModel?.extraCost || 0,
      customModelId: selectedModelId.startsWith('custom-frame-') ? selectedModelId : undefined,
      doorWidthMm,
      windowCount,
      windowHeightMm,
      windowLeaves,
      doorInfillType,
      handleType,
      handlePosition,
      handleColor,
      handleHeightMm,
      customAluminumBarPrice: useCustomBarPrice ? customBarPriceInput : undefined,
      customGlassPricePerM2: useCustomGlassPrice ? customGlassPriceInput : undefined,
      hardware: {
        hingesCount: Number(hingesCount) || 0,
        lockSetCount: (frameType.includes('jendela') || frameType === 'kusen_pintu_jendela_gabungan') ? openLeavesCount : Number(lockSetCount) || 0,
        slotCount: 0,
        frictionStayCount: (frameType.includes('jendela') || frameType === 'kusen_pintu_jendela_gabungan') ? openLeavesCount * 2 : Number(frictionStayCount) || 0,
        sealantMeters: Math.ceil(((widthMm + heightMm) * 2) / 1000),
        rubberMeters: Math.ceil(((widthMm + heightMm) * 2) / 1000),
        screwsSikuSet: 1,
      },
    },
    inventory,
    laborSettings
  );

  const handleApplyAiDesign = async (promptText: string) => {
    if (!promptText.trim()) return;
    setIsAiLoading(true);
    setAiFeedbackMessage(null);
    try {
      const result = await parseDesignWithAi(promptText);
      setFrameName(result.name);
      setFrameType(result.type);
      setSelectedModelId(result.type);
      setWidthMm(result.widthMm);
      setHeightMm(result.heightMm);
      setBrand(result.brand);
      setProfileSize(result.profileSize);
      setColor(result.color);
      setGlassType(result.glassType);
      setHasTopBoven(result.hasTopBoven);
      if (result.topBovenHeightMm) setTopBovenHeightMm(result.topBovenHeightMm);
      if (result.doorInfillType) setDoorInfillType(result.doorInfillType);
      if (result.handleType) setHandleType(result.handleType);
      if (result.handlePosition) setHandlePosition(result.handlePosition);
      if (result.handleColor) setHandleColor(result.handleColor);
      if (result.doorWidthMm) setDoorWidthMm(result.doorWidthMm);
      if (result.windowHeightMm) setWindowHeightMm(result.windowHeightMm);
      if (result.windowCount) setWindowCount(result.windowCount);

      setAiFeedbackMessage(result.aiExplanation || 'Konfigurasi desain berhasil diterapkan secara otomatis!');
      setTimeout(() => {
        setShowAiModal(false);
      }, 1200);
    } catch (err) {
      console.error(err);
      // Fallback
      const fallback = parseDesignRuleBased(promptText);
      setFrameName(fallback.name);
      setFrameType(fallback.type);
      setWidthMm(fallback.widthMm);
      setHeightMm(fallback.heightMm);
      setDoorInfillType(fallback.doorInfillType);
      setHandleType(fallback.handleType);
      setHandlePosition(fallback.handlePosition);
      setHandleColor(fallback.handleColor);
      setShowAiModal(false);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddItem = () => {
    const newItem: FrameItem = {
      ...liveCalculatedItem,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };
    setItemList([...itemList, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItemList(itemList.filter((i) => i.id !== id));
  };

  // Grand totals for current item list
  const totalMaterialSum = itemList.reduce((sum, item) => sum + item.totalMaterialCost, 0);
  const totalLaborSum = itemList.reduce((sum, item) => sum + item.laborCost, 0);
  const totalSubtotalSum = totalMaterialSum + totalLaborSum;
  const totalMarkupAmount = Math.round(totalSubtotalSum * (markupPercentage / 100));
  const grandTotalEstimate = totalSubtotalSum + totalMarkupAmount;

  const handleSaveAsProject = () => {
    if (itemList.length === 0) {
      alert('Tambahkan minimal 1 unit kusen/pintu sebelum menyimpan RAB proyek.');
      return;
    }

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      userId: '',
      title: projectTitle || 'Proyek Tanpa Judul',
      clientName: clientName || 'Klien Umum',
      clientPhone,
      clientAddress,
      estimateNumber: `RAB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toLocaleDateString('id-ID'),
      status: 'draft',
      items: itemList,
      laborSettings,
      markupPercentage,
      taxPercentage: 0,
      totalMaterialCost: totalMaterialSum,
      totalLaborCost: totalLaborSum,
      totalOperationalCost: (laborSettings.transportCost || 0) + (laborSettings.scaffoldingCost || 0),
      subtotal: totalSubtotalSum,
      markupAmount: totalMarkupAmount,
      taxAmount: 0,
      grandTotal: grandTotalEstimate,
      estimatedProductionDays: Math.ceil(itemList.reduce((s, i) => s + i.perimeterMeters, 0) / 15) + 1,
      notes: '',
      paymentTerms: 'DP 50% saat persetujuan SPK, Pelunasan 50% setelah pemasangan selesai.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveProject(newProject);
    setItemList([]);
    alert('RAB Proyek berhasil disimpan ke Manajemen Proyek & Cloud Sync!');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Kalkulator RAB Kusen & Pintu Alumunium
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Hitung kebutuhan batang alumunium 6m, volume kaca m², hardware, dan upah tukang secara otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Smart Estimator Assistant Button */}
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold transition shadow-lg shadow-indigo-500/25"
          >
            <Wand2 className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>✨ Desain Cerdas dengan AI</span>
          </button>

          {itemList.length > 0 && (
            <button
              onClick={() => setIsCutListOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition shadow-sm"
            >
              <Scissors className="w-4 h-4" />
              <span>Optimasi Potong (Cut List)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Form Builder (Left) & Visual Preview + Live Cost (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Form Controls */}
        <div className="xl:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" /> Form Detail Unit Kusen
            </h3>
            <span className="text-xs text-slate-400 font-mono">Kalkulasi Presisi</span>
          </div>

          <div className="space-y-4">
            {/* Frame Name & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nama / Label Unit</label>
                <input
                  type="text"
                  value={frameName}
                  onChange={(e) => setFrameName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-500 transition"
                  placeholder="e.g. Jendela Depan J1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">Tipe Model Kusen</label>
                  <button
                    type="button"
                    onClick={() => setShowAddFrameModal(true)}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" /> + Model Kustom
                  </button>
                </div>
                <select
                  value={selectedModelId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedModelId(val);
                    const customFound = customFrameModels.find((m) => m.id === val);
                    if (customFound) {
                      setFrameType(customFound.baseType);
                      setFrameName(customFound.name);
                      setWidthMm(customFound.defaultWidthMm);
                      setHeightMm(customFound.defaultHeightMm);
                      setMullionVertical(customFound.mullionVertical);
                      setMullionHorizontal(customFound.mullionHorizontal);
                      setHasTopBoven(customFound.hasTopBoven);
                      setTopBovenHeightMm(customFound.topBovenHeightMm || 140);
                      if (customFound.doorWidthMm) setDoorWidthMm(customFound.doorWidthMm);
                      if (customFound.windowHeightMm) setWindowHeightMm(customFound.windowHeightMm);
                    } else {
                      const newType = val as FrameType;
                      setFrameType(newType);
                      if (newType === 'kusen_pintu_jendela_gabungan') {
                        setWidthMm(2300);
                        setHeightMm(2100);
                        setFrameName('Kusen Tipe PJ 1 (Pintu Jendela 1)');
                        setHasTopBoven(true);
                        setTopBovenHeightMm(140);
                        setDoorWidthMm(900);
                        setWindowCount(2);
                        setWindowHeightMm(1350);
                        setSelectedDoorModelId('panil_horizontal');
                        setDoorPanelType('panil_horizontal');
                      } else if (newType === 'kusen_pintu_swing') {
                        setWidthMm(900);
                        setHeightMm(2100);
                        setFrameName('Pintu Utama Swing (P1)');
                      } else if (newType === 'kusen_pintu_sliding') {
                        setWidthMm(1800);
                        setHeightMm(2100);
                        setFrameName('Pintu Sliding Geser 2 Daun');
                      } else if (newType === 'kusen_pintu_lipat') {
                        setWidthMm(2800);
                        setHeightMm(2100);
                        setFrameName('Pintu Lipat 4 Daun (Folding Door)');
                      }
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-500 transition"
                >
                  <optgroup label="Model Kusen Standar">
                    <option value="kusen_pintu_jendela_gabungan">★ Pintu + Jendela Gabungan (Tipe PJ 1)</option>
                    <option value="kusen_jendela_casement">Jendela Swing / Casement</option>
                    <option value="kusen_jendela_sliding">Jendela Sliding (Geser)</option>
                    <option value="kusen_pintu_swing">Pintu Swing / Kaca Panel</option>
                    <option value="kusen_pintu_sliding">Pintu Sliding (Geser)</option>
                    <option value="kusen_pintu_lipat">Pintu Lipat (Folding Door)</option>
                    <option value="kusen_mati_kaca">Kusen Mati / Facade Glass</option>
                    <option value="boven_ventilasi">Boven / Ventilasi Udara</option>
                  </optgroup>
                  {customFrameModels.length > 0 && (
                    <optgroup label="Model Kusen Kustom Anda">
                      {customFrameModels.map((cm) => (
                        <option key={cm.id} value={cm.id}>
                          ★ {cm.name} ({cm.defaultWidthMm}x{cm.defaultHeightMm}mm)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {selectedModelId.startsWith('custom-frame-') && (
                  <div className="flex items-center justify-between mt-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300">
                    <span className="truncate">★ Model Kustom Aktif: <strong>{customFrameModels.find((m) => m.id === selectedModelId)?.name}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomFrameModel(selectedModelId)}
                      className="ml-2 text-rose-400 hover:text-rose-300 font-bold hover:underline shrink-0"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Dimensions: Width, Height, Quantity */}
            <div className="grid grid-cols-3 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
              <div>
                <label className="block text-[11px] font-bold text-amber-400 mb-1">Lebar (mm)</label>
                <input
                  type="number"
                  min="300"
                  max="10000"
                  step="50"
                  value={widthMm}
                  onChange={(e) => setWidthMm(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-400 mb-1">Tinggi (mm)</label>
                <input
                  type="number"
                  min="300"
                  max="10000"
                  step="50"
                  value={heightMm}
                  onChange={(e) => setHeightMm(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-400 mb-1">Jumlah Unit</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Profile Brand, Size & Color with Quick Add Material */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  Spesifikasi Material & Batang
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickAddMaterialModal(true)}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/20"
                >
                  <Plus className="w-3 h-3" /> + Tambah Material ke Master Katalog
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Merek Alumunium</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value as AluminumBrand)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-500 transition"
                  >
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Ukuran Profil</label>
                  <select
                    value={profileSize}
                    onChange={(e) => setProfileSize(e.target.value as AluminumProfile)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="4 Inch">4 Inch (Standard 4.5 x 10 cm)</option>
                    <option value="3 Inch">3 Inch (Minimalis 3.8 x 7.6 cm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Warna Powder/Anodized</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value as AluminumColor)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-500 transition"
                  >
                    {availableColors.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Glass Type & Division Mullions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Jenis Kaca</label>
                <select
                  value={glassType}
                  onChange={(e) => setGlassType(e.target.value as GlassType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-500 transition"
                >
                  {availableGlassTypes.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tiang Tegak (Mullion)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={mullionVertical}
                  onChange={(e) => setMullionVertical(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Ambang Datar (Transom)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={mullionHorizontal}
                  onChange={(e) => setMullionHorizontal(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Architectural & Boven Detail Options (Like reference image) */}
            <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-400" /> Detail Gambar Kerja Arsitektur & Boven
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">CAD Detail</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Top Boven / Transom toggle */}
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasTopBoven}
                      onChange={(e) => setHasTopBoven(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    Sertakan Boven / Ventilasi Atas
                  </label>
                  {hasTopBoven && (
                    <div className="pt-1">
                      <label className="block text-[10px] text-slate-400 mb-0.5">Tinggi Boven (mm)</label>
                      <input
                        type="number"
                        min="80"
                        max="600"
                        step="10"
                        value={topBovenHeightMm}
                        onChange={(e) => setTopBovenHeightMm(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-amber-400"
                      />
                    </div>
                  )}
                </div>

                {/* Door Panel & Infill Material Selection */}
                {(frameType.includes('pintu') || frameType === 'kusen_pintu_jendela_gabungan') && (
                  <>
                    {/* Daun Pintu Material / Infill */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <DoorClosed className="w-3.5 h-3.5" /> Isian Daun Pintu (ACP / Kaca)
                        </label>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
                          Tekstur Realistis
                        </span>
                      </div>
                      <select
                        value={doorInfillType}
                        onChange={(e) => setDoorInfillType(e.target.value as DoorInfillType)}
                        className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
                      >
                        <optgroup label="✨ ACP Motif Kayu (Wood Grain Series)">
                          <option value="acp_kayu_jati">🪵 ACP Motif Kayu Jati (Golden Teak Wood)</option>
                          <option value="acp_kayu_walnut">🪵 ACP Motif Kayu Walnut (Dark Chocolate)</option>
                          <option value="acp_kayu_oak">🪵 ACP Motif Kayu Oak (Natural Blonde Oak)</option>
                        </optgroup>
                        <optgroup label="🏢 ACP Solid Modern">
                          <option value="acp_solid_white">⚪ ACP Solid Putih (White Gloss/Doff)</option>
                          <option value="acp_solid_black">⚫ ACP Solid Hitam (Black Matte)</option>
                          <option value="acp_solid_grey">🔘 ACP Solid Abu-Abu (Anthracite Grey)</option>
                          <option value="acp_solid_brown">🟤 ACP Solid Cokelat (Dark Brown)</option>
                        </optgroup>
                        <optgroup label="🪟 Alumunium & Kaca">
                          <option value="spandrel_alumunium">Spandrel Alumunium Bergaris</option>
                          <option value="jalusi_louver">Jalusi / Louver Ventilasi Udara</option>
                          <option value="kaca">Kaca Penuh (Sesuai Pilihan Kaca)</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Gagang Pintu & Aksesoris Configurator */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2.5">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Model & Posisi Gagang (Handle)
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Handle Type */}
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Model Handle</label>
                          <select
                            value={handleType}
                            onChange={(e) => setHandleType(e.target.value as DoorHandleType)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-medium"
                          >
                            <option value="pull_80">Pull Handle 80cm (Populer)</option>
                            <option value="pull_60">Pull Handle 60cm</option>
                            <option value="pull_100">Pull Handle 100cm (Mewah)</option>
                            <option value="pull_120">Pull Handle 120cm (Grand)</option>
                            <option value="smart_lock">Smart Lock (Digital Keypad)</option>
                            <option value="lever">Handle Lever Engkol</option>
                            <option value="flush">Handle Tanam (Sliding)</option>
                            <option value="knob">Kunci Bulat (Knob)</option>
                          </select>
                        </div>

                        {/* Handle Position */}
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Posisi Handle</label>
                          <select
                            value={handlePosition}
                            onChange={(e) => setHandlePosition(e.target.value as DoorHandlePosition)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-medium"
                          >
                            <optgroup label="🚪 Pintu Tunggal (Single Leaf)">
                              <option value="right">👉 Sisi Kanan (Buka Kiri)</option>
                              <option value="left">👈 Sisi Kiri (Buka Kanan)</option>
                            </optgroup>
                            <optgroup label="🚪🚪 Pintu Ganda (Double Pair)">
                              <option value="kanan-kiri">↔️ Kanan - Kiri (Berhadapan Tengah)</option>
                              <option value="kiri-kiri">⬅️ Kiri - Kiri (Kiri Kedua Daun)</option>
                              <option value="kiri-kanan">↔️ Kiri - Kanan (Luar Kedua Daun)</option>
                              <option value="kanan-kanan">➡️ Kanan - Kanan (Kanan Kedua Daun)</option>
                            </optgroup>
                            <optgroup label="❌ Kustom / Tanpa Gagang">
                              <option value="none">🚫 Tanpa Handle (Dihapus)</option>
                            </optgroup>
                          </select>
                        </div>

                        {/* Handle Color */}
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Finishing Warna</label>
                          <select
                            value={handleColor}
                            onChange={(e) => setHandleColor(e.target.value as DoorHandleColor)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-medium"
                          >
                            <option value="stainless">Stainless Steel Chrome</option>
                            <option value="black">Matte Black Doff</option>
                            <option value="gold">Luxury Titanium Gold</option>
                          </select>
                        </div>
                      </div>

                      {/* Handle Height Slider & Quick Controls */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <label className="text-[10px] text-slate-400 font-bold whitespace-nowrap">Tinggi Handle:</label>
                          <input
                            type="range"
                            min="400"
                            max="1600"
                            step="10"
                            value={handleHeightMm}
                            onChange={(e) => setHandleHeightMm(Number(e.target.value))}
                            className="w-full sm:w-28 accent-amber-500 cursor-pointer"
                          />
                          <span className="font-mono text-amber-400 font-bold text-[11px] whitespace-nowrap">
                            {handleHeightMm} mm ({Math.round(handleHeightMm / 10)} cm)
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setHandleHeightMm(900)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-semibold"
                          >
                            90cm
                          </button>
                          <button
                            type="button"
                            onClick={() => setHandleHeightMm(1000)}
                            className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30"
                          >
                            100cm Std
                          </button>
                          <button
                            type="button"
                            onClick={() => setHandleHeightMm(1100)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-semibold"
                          >
                            110cm
                          </button>
                          {handlePosition !== 'none' ? (
                            <button
                              type="button"
                              onClick={() => setHandlePosition('none')}
                              className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 text-[10px] font-bold border border-red-500/30 flex items-center gap-1 ml-1"
                              title="Hapus Gagang / Handle dari gambar"
                            >
                              🗑️ Hapus
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setHandlePosition('kanan-kiri')}
                              className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 ml-1"
                              title="Pasang kembali Handle"
                            >
                              + Pasang
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Flexible Multi-Leaf Window Configurator */}
                {(frameType.includes('jendela') || frameType === 'kusen_pintu_jendela_gabungan') && (
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <LayoutGrid className="w-4 h-4" /> Konfigurasi Daun Jendela Fleksibel
                      </label>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                        {windowLeaves.filter((l) => l === 'open').length} Buka-Tutup • {windowLeaves.filter((l) => l === 'fixed').length} Kaca Mati
                      </span>
                    </div>

                    {/* 1. Number of Leaves Selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Jumlah Daun Jendela:</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[2, 3, 4, 5, 6].map((count) => (
                          <button
                            key={`wcount-${count}`}
                            type="button"
                            onClick={() => handleWindowLeafCountChange(count)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                              windowCount === count
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                                : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            {count} Daun
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Popular Preset Shortcuts */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Preset Kombinasi Cepat:</label>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {windowCount === 2 && (
                          <>
                            <button
                              type="button"
                              onClick={() => setWindowLeaves(['open', 'open'])}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-400 text-slate-200 font-semibold"
                            >
                              🔓 Buka - 🔓 Buka
                            </button>
                            <button
                              type="button"
                              onClick={() => setWindowLeaves(['open', 'fixed'])}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-400 text-slate-200 font-semibold"
                            >
                              🔓 Buka - 🔒 Mati
                            </button>
                            <button
                              type="button"
                              onClick={() => setWindowLeaves(['fixed', 'open'])}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-400 text-slate-200 font-semibold"
                            >
                              🔒 Mati - 🔓 Buka
                            </button>
                          </>
                        )}
                        {windowCount === 3 && (
                          <>
                            <button
                              type="button"
                              onClick={() => setWindowLeaves(['open', 'fixed', 'open'])}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold"
                            >
                              ⭐ Buka - Mati - Buka (Favorit)
                            </button>
                            <button
                              type="button"
                              onClick={() => setWindowLeaves(['open', 'open', 'open'])}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-400 text-slate-200 font-semibold"
                            >
                              🔓 Semua Buka (3 Daun)
                            </button>
                            <button
                              type="button"
                              onClick={() => setWindowLeaves(['fixed', 'open', 'fixed'])}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-400 text-slate-200 font-semibold"
                            >
                              🔒 Mati - 🔓 Buka - 🔒 Mati
                            </button>
                          </>
                        )}
                        {windowCount === 4 && (
                          <>
                            <button
                              type="button"
                              onClick={() => setWindowLeaves(['fixed', 'open', 'open', 'fixed'])}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold"
                            >
                              ⭐ Mati - Buka - Buka - Mati (Fasad)
                            </button>
                            <button
                              type="button"
                              onClick={() => setWindowLeaves(['open', 'fixed', 'fixed', 'open'])}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-400 text-slate-200 font-semibold"
                            >
                              🔓 Buka - Mati - Mati - Buka
                            </button>
                            <button
                              type="button"
                              onClick={() => setWindowLeaves(['open', 'open', 'open', 'open'])}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-400 text-slate-200 font-semibold"
                            >
                              🔓 Semua Buka (4 Daun)
                            </button>
                          </>
                        )}
                        {windowCount >= 5 && (
                          <>
                            <button
                              type="button"
                              onClick={() => setWindowLeaves(Array.from({ length: windowCount }, (_, i) => i % 2 === 0 ? 'open' : 'fixed'))}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold"
                            >
                              ⭐ Selang-Seling (Buka-Mati)
                            </button>
                            <button
                              type="button"
                              onClick={() => setWindowLeaves(Array.from({ length: windowCount }, () => 'open'))}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-400 text-slate-200 font-semibold"
                            >
                              🔓 Semua Buka ({windowCount} Daun)
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 3. Interactive Per-Leaf Tile Builder */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Atur Tipe Per Daun (Klik Kartu untuk Ubah):</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {windowLeaves.map((leafState, leafIdx) => {
                          const isOpen = leafState === 'open';
                          return (
                            <div
                              key={`leaf-tile-${leafIdx}`}
                              onClick={() => handleToggleSingleLeaf(leafIdx)}
                              className={`p-2 rounded-xl border cursor-pointer select-none transition-all flex flex-col items-center justify-center text-center gap-1 ${
                                isOpen
                                  ? 'bg-emerald-950/40 border-emerald-500/50 hover:bg-emerald-900/50'
                                  : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                              }`}
                            >
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Daun {leafIdx + 1}</span>
                              <span
                                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  isOpen
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {isOpen ? '🔓 Buka-Tutup' : '🔒 Kaca Mati'}
                              </span>
                              <span className="text-[9px] text-slate-500 font-medium">Klik ubah</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* For Combination Frame PJ: Extra parameters */}
                {frameType === 'kusen_pintu_jendela_gabungan' && (
                  <>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <label className="text-[11px] font-bold text-slate-300 block mb-0.5">Lebar Pintu (mm)</label>
                      <input
                        type="number"
                        min="600"
                        max="1400"
                        step="50"
                        value={doorWidthMm}
                        onChange={(e) => setDoorWidthMm(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-slate-200"
                      />
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <label className="text-[11px] font-bold text-slate-300 block mb-0.5">Tinggi Jendela (mm)</label>
                      <input
                        type="number"
                        min="600"
                        max="2400"
                        step="50"
                        value={windowHeightMm}
                        onChange={(e) => setWindowHeightMm(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-slate-200"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Manual Price Override Accordion */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl space-y-3">
              <span className="text-xs font-bold text-amber-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" /> Penyesuaian Harga Satuan Pasar (Manual Override)
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">Fleksibel</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Custom Aluminum Bar Price */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={useCustomBarPrice}
                        onChange={(e) => setUseCustomBarPrice(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      Custom Harga Alumunium 6M
                    </label>
                  </div>
                  {useCustomBarPrice && (
                    <div>
                      <input
                        type="number"
                        step="1000"
                        value={customBarPriceInput}
                        onChange={(e) => setCustomBarPriceInput(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-emerald-400"
                        placeholder="Harga pasar per batang"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">Rp {customBarPriceInput.toLocaleString('id-ID')} / Batang 6M</span>
                    </div>
                  )}
                </div>

                {/* Custom Glass Price */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={useCustomGlassPrice}
                        onChange={(e) => setUseCustomGlassPrice(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      Custom Harga Kaca / m²
                    </label>
                  </div>
                  {useCustomGlassPrice && (
                    <div>
                      <input
                        type="number"
                        step="1000"
                        value={customGlassPriceInput}
                        onChange={(e) => setCustomGlassPriceInput(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-emerald-400"
                        placeholder="Harga pasar per m2"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">Rp {customGlassPriceInput.toLocaleString('id-ID')} / m²</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hardware & Accessories Overrides */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-300 block mb-2">Aksesori & Hardware (Per Unit)</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Engsel (Pasang)</label>
                  <input
                    type="number"
                    min="0"
                    value={hingesCount}
                    onChange={(e) => setHingesCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Kunci / Handle Set</label>
                  <input
                    type="number"
                    min="0"
                    value={lockSetCount}
                    onChange={(e) => setLockSetCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Friction Stay / Hak Angin</label>
                  <input
                    type="number"
                    min="0"
                    value={frictionStayCount}
                    onChange={(e) => setFrictionStayCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Add to Calculation List Button */}
            <button
              onClick={handleAddItem}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Unit Kusen ke Daftar Kalkulasi RAB</span>
            </button>
          </div>
        </div>

        {/* Right Column: Visual Preview & Calculated Cost Summary */}
        <div className="xl:col-span-6 space-y-6">
          
          {/* 2D Visual Preview Component */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Preview Visual 2D Kusen Arsitektur</span>
              <span className="text-amber-400 font-mono font-bold">{liveCalculatedItem.perimeterMeters} m1 Perimeter</span>
            </h3>

            <FramePreviewSvg
              type={frameType}
              widthMm={widthMm}
              heightMm={heightMm}
              mullionVerticalCount={mullionVertical}
              mullionHorizontalCount={mullionHorizontal}
              profileSize={profileSize}
              brand={brand}
              color={color}
              glassType={glassType}
              hasTopBoven={hasTopBoven}
              topBovenHeightMm={topBovenHeightMm}
              doorPanelType={activeDoorModel?.panelStyle || doorPanelType}
              doorInfillType={doorInfillType}
              handleType={handleType}
              handlePosition={handlePosition}
              handleColor={handleColor}
              handleHeightMm={handleHeightMm}
              doorWidthMm={doorWidthMm}
              windowCount={windowCount}
              windowHeightMm={windowHeightMm}
              windowLeaves={windowLeaves}
              title={frameName || 'KUSEN TIPE 1'}
              onHandleHeightChange={(newH) => setHandleHeightMm(newH)}
              onHandlePositionChange={(newPos) => setHandlePosition(newPos)}
              onHandleTypeChange={(newType) => setHandleType(newType)}
              onRemoveHandle={() => setHandlePosition('none')}
            />
          </div>

          {/* Live Single Item Cost Summary Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>Estimasi Rincian Biaya Unit Ini</span>
              <span className="text-emerald-400 font-extrabold">{quantity} Unit</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Alumunium ({liveCalculatedItem.aluminumBarsNeeded} Batang 6M)</span>
                <span className="font-mono font-bold">{formatRupiah(liveCalculatedItem.aluminumMaterialCost)}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Kaca ({liveCalculatedItem.glassAreaM2} m²)</span>
                <span className="font-mono font-bold">{formatRupiah(liveCalculatedItem.glassMaterialCost)}</span>
              </div>

              {activeDoorModel && (activeDoorModel.extraCost || 0) > 0 && (frameType.includes('pintu') || frameType === 'kusen_pintu_jendela_gabungan') && (
                <div className="flex justify-between text-slate-300">
                  <span>Fabrikasi Model Daun ({activeDoorModel.name})</span>
                  <span className="font-mono font-bold text-emerald-400">
                    +{formatRupiah((activeDoorModel.extraCost || 0) * quantity)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-300">
                <span>Aksesori & Hardware</span>
                <span className="font-mono font-bold">{formatRupiah(liveCalculatedItem.hardwareMaterialCost)}</span>
              </div>

              <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                <span>Upah Tukang / Pasang</span>
                <span className="font-mono font-bold text-amber-400">{formatRupiah(liveCalculatedItem.laborCost)}</span>
              </div>

              <div className="flex justify-between text-sm font-extrabold text-slate-100 pt-2 border-t border-slate-800 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                <span>Total Unit ({quantity} x {formatRupiah(liveCalculatedItem.subtotalCost / quantity)})</span>
                <span className="text-emerald-400 font-mono">{formatRupiah(liveCalculatedItem.subtotalCost)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculated Items Table & Project Header Setup */}
      {itemList.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" /> Daftar Rincian Kusen RAB
              </h3>
              <p className="text-xs text-slate-400">
                {itemList.length} item unit kusen terdaftar untuk penawaran proyek.
              </p>
            </div>

            <button
              onClick={() => setIsCutListOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-slate-700 transition"
            >
              <Scissors className="w-4 h-4" /> Lihat Cut List ({itemList.reduce((s, i) => s + i.aluminumBarsNeeded, 0)} Batang 6M)
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Unit & Spesifikasi</th>
                  <th className="py-3 px-4 text-center">Ukuran (LxT)</th>
                  <th className="py-3 px-4 text-center">Vol</th>
                  <th className="py-3 px-4 text-right">Biaya Material</th>
                  <th className="py-3 px-4 text-right">Upah Pasang</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {itemList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-200">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.brand} {item.profileSize} ({item.color}) • Kaca {item.glassType}
                      </p>
                      {item.doorPanelName && (item.type.includes('pintu') || item.type === 'kusen_pintu_jendela_gabungan') && (
                        <span className="inline-block mt-0.5 mr-1 text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20 font-medium">
                          Pintu: {item.doorPanelName} {item.doorPanelExtraCost ? `(+${formatRupiah(item.doorPanelExtraCost)})` : ''}
                        </span>
                      )}
                      {item.customAluminumBarPrice && (
                        <span className="inline-block mt-0.5 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 font-mono">
                          Harga Manual Batang: Rp {item.customAluminumBarPrice.toLocaleString('id-ID')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-300">
                      {item.widthMm} x {item.heightMm} mm
                      <span className="block text-[10px] text-amber-400">{item.perimeterMeters} m1</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-200">{item.quantity} Unit</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">{formatRupiah(item.totalMaterialCost)}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400">{formatRupiah(item.laborCost)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{formatRupiah(item.subtotalCost)}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Hapus Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Project Header Info & Profit Margin Editor */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-400" /> Informasi Klien & Margin Penawaran
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                  <Building className="w-3 h-3" /> Judul Proyek
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> Nama Klien
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Telepon Klien
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Alamat Lokasi
                </label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium"
                />
              </div>
            </div>

            {/* Profit Margin Slider */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-1/2">
                <label className="text-xs font-bold text-amber-400 whitespace-nowrap">Margin Profit / Keuntungan:</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={markupPercentage}
                  onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-slate-100 bg-slate-800 px-2 py-1 rounded">
                  {markupPercentage}%
                </span>
              </div>

              {/* Total Summary Badge */}
              <div className="text-right w-full sm:w-auto">
                <span className="text-[11px] text-slate-400 block">Estimasi Grand Total RAB:</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{formatRupiah(grandTotalEstimate)}</span>
              </div>
            </div>

            <button
              onClick={handleSaveAsProject}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Simpan Proyek & Siapkan Penawaran RAB (PDF & Cloud)</span>
            </button>
          </div>
        </div>
      )}

      {/* Cut List Modal */}
      <CutListModal items={itemList} isOpen={isCutListOpen} onClose={() => setIsCutListOpen(false)} />

      {/* Modal: Tambah Tipe Model Kusen Baru */}
      {showAddFrameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Grid className="w-5 h-5 text-amber-400" /> Buat Tipe Model Kusen Kustom Baru
              </h3>
              <button onClick={() => setShowAddFrameModal(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
              {/* Quick Presets */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-amber-400 block uppercase">Pilih Preset Template Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNewFrameModelName('Kusen Tipe PJ 1 (Pintu + 2 Jendela Casement)');
                      setNewFrameBaseType('kusen_pintu_jendela_gabungan');
                      setNewFrameWidthMm(2300);
                      setNewFrameHeightMm(2100);
                      setNewFrameHasBoven(true);
                      setNewFrameBovenHeight(140);
                      setNewFrameDoorWidth(900);
                      setNewFrameWindowHeight(1350);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700"
                  >
                    ★ Tipe PJ 1 (230x210)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewFrameModelName('Jendela Casement 3 Daun + Boven');
                      setNewFrameBaseType('kusen_jendela_casement');
                      setNewFrameWidthMm(1800);
                      setNewFrameHeightMm(1600);
                      setNewFrameMullionV(2);
                      setNewFrameMullionH(0);
                      setNewFrameHasBoven(true);
                      setNewFrameBovenHeight(150);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700"
                  >
                    Jendela 3 Daun
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewFrameModelName('Pintu Utama Swing 1 Daun + Transom Boven');
                      setNewFrameBaseType('kusen_pintu_swing');
                      setNewFrameWidthMm(900);
                      setNewFrameHeightMm(2150);
                      setNewFrameMullionV(0);
                      setNewFrameMullionH(0);
                      setNewFrameHasBoven(true);
                      setNewFrameBovenHeight(150);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700"
                  >
                    Pintu Swing 1 Daun
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewFrameModelName('Pintu Lipat 4 Daun (Folding Door)');
                      setNewFrameBaseType('kusen_pintu_lipat');
                      setNewFrameWidthMm(3200);
                      setNewFrameHeightMm(2200);
                      setNewFrameMullionV(3);
                      setNewFrameMullionH(0);
                      setNewFrameHasBoven(false);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700"
                  >
                    Pintu Lipat 4 Daun
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-400 mb-1">Nama Tipe Model Kusen *</label>
                <input
                  type="text"
                  value={newFrameModelName}
                  onChange={(e) => setNewFrameModelName(e.target.value)}
                  placeholder="Contoh: Kusen Partisi Kaca Kantor + 2 Pintu Swing"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Pola Komponen Dasar</label>
                <select
                  value={newFrameBaseType}
                  onChange={(e) => setNewFrameBaseType(e.target.value as FrameType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold"
                >
                  <option value="kusen_pintu_jendela_gabungan">Pintu + Jendela Gabungan (Tipe PJ)</option>
                  <option value="kusen_jendela_casement">Jendela Swing / Casement</option>
                  <option value="kusen_jendela_sliding">Jendela Sliding (Geser)</option>
                  <option value="kusen_pintu_swing">Pintu Swing / Kaca Panel</option>
                  <option value="kusen_pintu_sliding">Pintu Sliding (Geser)</option>
                  <option value="kusen_pintu_lipat">Pintu Lipat (Folding Door)</option>
                  <option value="kusen_mati_kaca">Kusen Mati / Facade Glass</option>
                  <option value="boven_ventilasi">Boven / Ventilasi Udara</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-amber-400 mb-1">Lebar Standar (mm)</label>
                  <input
                    type="number"
                    step="50"
                    value={newFrameWidthMm}
                    onChange={(e) => setNewFrameWidthMm(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-400 mb-1">Tinggi Standar (mm)</label>
                  <input
                    type="number"
                    step="50"
                    value={newFrameHeightMm}
                    onChange={(e) => setNewFrameHeightMm(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Jumlah Tiang Tegak (V)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={newFrameMullionV}
                    onChange={(e) => setNewFrameMullionV(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Jumlah Ambang Datar (H)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={newFrameMullionH}
                    onChange={(e) => setNewFrameMullionH(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFrameHasBoven}
                    onChange={(e) => setNewFrameHasBoven(e.target.checked)}
                    className="rounded accent-amber-500"
                  />
                  Sertakan Boven / Ventilasi Atas Secara Default
                </label>
                {newFrameHasBoven && (
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Tinggi Boven (mm)</label>
                    <input
                      type="number"
                      step="10"
                      value={newFrameBovenHeight}
                      onChange={(e) => setNewFrameBovenHeight(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-amber-400"
                    />
                  </div>
                )}
              </div>

              {newFrameBaseType === 'kusen_pintu_jendela_gabungan' && (
                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-slate-400 mb-1">Lebar Daun Pintu (mm)</label>
                    <input
                      type="number"
                      step="50"
                      value={newFrameDoorWidth}
                      onChange={(e) => setNewFrameDoorWidth(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Tinggi Daun Jendela (mm)</label>
                    <input
                      type="number"
                      step="50"
                      value={newFrameWindowHeight}
                      onChange={(e) => setNewFrameWindowHeight(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* List of existing custom frame models */}
              {customFrameModels.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block">Model Kustom yang Sudah Tersimpan:</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {customFrameModels.map((cm) => (
                      <div key={cm.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="font-semibold text-slate-200">{cm.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomFrameModel(cm.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Hapus Model"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowAddFrameModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveCustomFrameModel}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20"
              >
                Simpan & Terapkan Model
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah Model Daun Pintu Baru */}
      {showAddDoorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <DoorClosed className="w-5 h-5 text-amber-400" /> Tambah Model Daun Pintu Kustom
              </h3>
              <button onClick={() => setShowAddDoorModal(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
              {/* Quick Presets */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-amber-400 block uppercase">Pilih Preset Model Daun:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNewDoorName('Pintu Jalusi Ventilasi WC');
                      setNewDoorPanelStyle('jalusi_louver');
                      setNewDoorExtraCost(150000);
                      setNewDoorNotes('Kisi jalusi Z ventilasi penuh udara');
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700"
                  >
                    Pintu Jalusi WC (+150rb)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewDoorName('Pintu ACP Solid Plat Minimalis');
                      setNewDoorPanelStyle('acp_solid');
                      setNewDoorExtraCost(180000);
                      setNewDoorNotes('Plat ACP double side tahan air & benturan');
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700"
                  >
                    Pintu ACP Solid (+180rb)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewDoorName('Pintu Kaca + Kisi Ornamen Kotak');
                      setNewDoorPanelStyle('ornamen_kotak');
                      setNewDoorExtraCost(220000);
                      setNewDoorNotes('Kisi muntin ornamen kotak eropa klasik');
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700"
                  >
                    Kisi Ornamen (+220rb)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-400 mb-1">Nama Model Daun Pintu *</label>
                <input
                  type="text"
                  value={newDoorName}
                  onChange={(e) => setNewDoorName(e.target.value)}
                  placeholder="Contoh: Pintu Jalusi Z Full Louver"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Gaya Visual Desain</label>
                <select
                  value={newDoorPanelStyle}
                  onChange={(e) => setNewDoorPanelStyle(e.target.value as DoorPanelStyle)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold"
                >
                  <option value="panil_horizontal">Panil Horizontal Alumunium (Spandrel 7 Jalur)</option>
                  <option value="kaca_full">Kaca Penuh (Full Glass)</option>
                  <option value="kaca_panil_bawah">Kaca Atas (65%) + Panil Bawah (35%)</option>
                  <option value="jalusi_louver">Jalusi / Louver Ventilasi Kisi-kisi</option>
                  <option value="acp_solid">Panil ACP Plat Solid Minimalis</option>
                  <option value="ornamen_kotak">Kaca + Kisi Ornamen Kotak-kotak</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-emerald-400 mb-1">Tambahan Biaya Fabrikasi / Material (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="25000"
                  value={newDoorExtraCost}
                  onChange={(e) => setNewDoorExtraCost(Number(e.target.value))}
                  placeholder="0 jika tidak ada tambahan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Catatan Keterangan / Spek Tambahan</label>
                <input
                  type="text"
                  value={newDoorNotes}
                  onChange={(e) => setNewDoorNotes(e.target.value)}
                  placeholder="Contoh: Menggunakan kisi aluminium tebal 1.2mm"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              {/* List of custom door models */}
              {customDoorModels.filter(d => d.isCustom).length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block">Model Pintu Kustom Tersimpan:</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {customDoorModels.filter(d => d.isCustom).map((dm) => (
                      <div key={dm.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="font-semibold text-slate-200">{dm.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomDoorModel(dm.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Hapus Model"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowAddDoorModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveCustomDoorModel}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20"
              >
                Simpan Model Pintu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah Material ke Master Katalog Langsung dari Kalkulator */}
      {showQuickAddMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" /> Tambah Bahan ke Master Katalog
              </h3>
              <button onClick={() => setShowQuickAddMaterialModal(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Kategori Bahan</label>
                  <select
                    value={quickCategory}
                    onChange={(e) => {
                      const c = e.target.value as MaterialCategory;
                      setQuickCategory(c);
                      if (c === 'aluminum') setQuickUnit('batang');
                      else if (c === 'glass') setQuickUnit('m2');
                      else if (c === 'hardware') setQuickUnit('pcs');
                      else if (c === 'accessories') setQuickUnit('meter');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold"
                  >
                    <option value="aluminum">Batang Alumunium 6M</option>
                    <option value="glass">Kaca (per m²)</option>
                    <option value="hardware">Hardware / Handle / Engsel</option>
                    <option value="accessories">Aksesori / Sealant / Karet</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Satuan</label>
                  <select
                    value={quickUnit}
                    onChange={(e) => setQuickUnit(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold uppercase"
                  >
                    <option value="batang">Batang (6M)</option>
                    <option value="m2">m² (Kaca)</option>
                    <option value="pcs">Pcs (Buah)</option>
                    <option value="set">Set (Pasang)</option>
                    <option value="meter">Meter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-400 mb-1">Nama Material / Bahan *</label>
                <input
                  type="text"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder="Contoh: Kusen Handal 4 Inch Dark Brown"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {quickCategory === 'aluminum' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Merek</label>
                    <input
                      type="text"
                      value={quickBrand}
                      onChange={(e) => setQuickBrand(e.target.value)}
                      placeholder="e.g. Handal"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Ukuran Profil</label>
                    <input
                      type="text"
                      value={quickSpec}
                      onChange={(e) => setQuickSpec(e.target.value)}
                      placeholder="e.g. 4 Inch"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Warna</label>
                    <input
                      type="text"
                      value={quickColor}
                      onChange={(e) => setQuickColor(e.target.value)}
                      placeholder="e.g. Cokelat"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-400 mb-1">Harga Satuan Pasar (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={quickPrice}
                    onChange={(e) => setQuickPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Nama Toko / Supplier</label>
                  <input
                    type="text"
                    value={quickSupplier}
                    onChange={(e) => setQuickSupplier(e.target.value)}
                    placeholder="e.g. Toko Alumunium BSD"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowQuickAddMaterialModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveQuickMaterial}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20"
              >
                Simpan ke Katalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Smart Estimator Assistant Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-violet-500/30 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
                  <Wand2 className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-1.5">
                    AI Smart Assistant Desain & RAB
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ketik spesifikasi unit pintu/jendela dalam bahasa alami, AI akan mengonfigurasi otomatis.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tuliskan Instruksi Permintaan Desain
                </label>
                <textarea
                  rows={3}
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  placeholder="Contoh: Buatkan pintu utama 2 daun 160x220 cm ACP kayu jati, pull handle hitam 100 cm, frame hitam 4 inch..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition shadow-inner font-medium"
                />
              </div>

              {/* Quick Prompt Chips */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  💡 Rekomendasi Contoh Cepat (Klik untuk mencoba):
                </span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <button
                    onClick={() => {
                      const txt = 'Pintu utama 2 daun 160x220 cm ACP kayu jati, pull handle hitam 100 cm, frame hitam 4 inch';
                      setAiPromptInput(txt);
                      handleApplyAiDesign(txt);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-violet-900/50 text-slate-300 border border-slate-700 hover:border-violet-500/50 transition text-left"
                  >
                    🪵 Pintu Utama ACP Kayu Jati Ganda (160x220cm)
                  </button>

                  <button
                    onClick={() => {
                      const txt = 'Pintu swing 90x210 cm ACP kayu walnut, handle lever stainless, kusen cokelat 3 inch';
                      setAiPromptInput(txt);
                      handleApplyAiDesign(txt);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-violet-900/50 text-slate-300 border border-slate-700 hover:border-violet-500/50 transition text-left"
                  >
                    🚪 Pintu Kamar ACP Walnut (90x210cm)
                  </button>

                  <button
                    onClick={() => {
                      const txt = 'Pintu dan jendela kombinasi PJ 230x210 cm boven kaca mati, pintu ACP kayu oak, pull handle 80cm';
                      setAiPromptInput(txt);
                      handleApplyAiDesign(txt);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-violet-900/50 text-slate-300 border border-slate-700 hover:border-violet-500/50 transition text-left"
                  >
                    🏛️ Pintu & Jendela Kombinasi PJ (230x210cm)
                  </button>

                  <button
                    onClick={() => {
                      const txt = 'Pintu sliding 2 daun 180x210 cm kaca rayban, handle tanam flush';
                      setAiPromptInput(txt);
                      handleApplyAiDesign(txt);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-violet-900/50 text-slate-300 border border-slate-700 hover:border-violet-500/50 transition text-left"
                  >
                    🪟 Pintu Sliding Geser Rayban (180x210cm)
                  </button>
                </div>
              </div>

              {/* Feedback Alert */}
              {aiFeedbackMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{aiFeedbackMessage}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Powered by Gemini AI Studio Engine</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleApplyAiDesign(aiPromptInput)}
                  disabled={isAiLoading || !aiPromptInput.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Memproses AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Terapkan Desain AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
