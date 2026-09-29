export type FrameType = 
  | 'kusen_pintu_jendela_gabungan'
  | 'kusen_jendela_casement' 
  | 'kusen_jendela_sliding' 
  | 'kusen_pintu_swing' 
  | 'kusen_pintu_sliding' 
  | 'kusen_pintu_lipat' 
  | 'kusen_mati_kaca' 
  | 'boven_ventilasi';

export type AluminumBrand = 'Alexindo' | 'YKK AP' | 'Forta' | 'Dacon' | 'Incalum' | 'Lainnya';
export type AluminumProfile = '3 Inch' | '4 Inch';
export type AluminumColor = 'White (Putih)' | 'Black (Hitam)' | 'Brown (Cokelat)' | 'Anodized Silver' | 'Urat Kayu (Wood)' | 'Custom Coating';

export type GlassType = 'Polos 5mm' | 'Polos 6mm' | 'Rayban 5mm' | 'Es / Frosted 5mm' | 'Tempered 8mm' | 'Tempered 10mm' | 'Tanpa Kaca';

export type DoorHandleType = 
  | 'lever' 
  | 'pull_60' 
  | 'pull_80' 
  | 'pull_100' 
  | 'pull_120' 
  | 'flush' 
  | 'smart_lock' 
  | 'knob';

export type DoorHandlePosition = 
  | 'right' 
  | 'left' 
  | 'center_pair'
  | 'kiri-kiri' 
  | 'kiri-kanan' 
  | 'kanan-kiri' 
  | 'kanan-kanan' 
  | 'none';
export type DoorHandleColor = 'stainless' | 'black' | 'gold';

export type DoorInfillType = 
  | 'kaca' 
  | 'acp_kayu_jati' 
  | 'acp_kayu_walnut' 
  | 'acp_kayu_oak' 
  | 'acp_solid_white' 
  | 'acp_solid_black' 
  | 'acp_solid_grey' 
  | 'acp_solid_brown' 
  | 'spandrel_alumunium' 
  | 'jalusi_louver';

export type WindowLeafType = 'open' | 'fixed'; // 'open' = Buka-Tutup (Casement/Swing/Awning), 'fixed' = Kaca Mati

export interface FrameHardware {
  hingesCount: number; // Jumlah Engsel
  lockSetCount: number; // Jumlah Kunci / Handle
  slotCount: number; // Jumlah Grendel / Slot
  frictionStayCount: number; // Jumlah Hak Angin / Friction Stay
  sealantMeters: number; // Meter Sealant
  rubberMeters: number; // Meter Karet
  screwsSikuSet: number; // Set Siku & Sekrup
  customHardwareName?: string;
  customHardwarePrice?: number;
}

export interface FrameItem {
  id: string;
  name: string; // e.g. "Jendela Utama Depan J1"
  type: FrameType;
  widthMm: number; // Lebar dalam mm
  heightMm: number; // Tinggi dalam mm
  quantity: number; // Jumlah Unit
  
  // Specs
  profileSize: AluminumProfile;
  brand: AluminumBrand;
  color: AluminumColor;
  glassType: GlassType;
  
  // Custom divisions
  mullionVerticalCount: number; // Jumlah Tiang / Pembagi Tegak
  mullionHorizontalCount: number; // Jumlah Ambang / Pembagi Datar
  
  // Architectural Shop Drawing Options
  hasTopBoven?: boolean; // Ventilasi / Boven Atas
  topBovenHeightMm?: number; // Tinggi Boven (misal 140 mm / 14 cm)
  doorPanelType?: string; // Tipe Panil Pintu ('panil_horizontal' | 'kaca_full' | 'kaca_panil_bawah' | 'jalusi_louver' | 'acp_solid' | custom id)
  doorPanelName?: string; // Nama display model pintu
  doorPanelExtraCost?: number; // Tambahan biaya fabrikasi model pintu per unit
  customModelId?: string; // ID model kusen kustom jika dibuat dari template kustom
  doorWidthMm?: number; // Lebar Daun Pintu untuk Tipe PJ (misal 900 mm)
  windowCount?: number; // Jumlah Daun Jendela untuk Tipe PJ (misal 2 daun)
  windowHeightMm?: number; // Tinggi Jendela untuk Tipe PJ (misal 1350 mm)

  // Smart Door & Handle Infill Configuration
  doorInfillType?: DoorInfillType;
  handleType?: DoorHandleType;
  handlePosition?: DoorHandlePosition;
  handleColor?: DoorHandleColor;
  handleHeightMm?: number;
  
  // Smart Multi-Leaf Window Configuration
  windowLeaves?: WindowLeafType[]; // Array e.g. ['open', 'fixed', 'open']
  
  // Custom Manual Price Overrides
  customAluminumBarPrice?: number; // Override manual per batang
  customGlassPricePerM2?: number; // Override manual per m2 kaca
  
  // Calculated outputs
  perimeterMeters: number; // Meter Lari Kusen
  aluminumBarsNeeded: number; // Jumlah Batang 6 Meter
  wastePercentage: number; // % Sisa potongan (5-10%)
  glassAreaM2: number; // M2 Kaca
  
  // Hardware
  hardware: FrameHardware;
  
  // Cost breakdown
  aluminumMaterialCost: number;
  glassMaterialCost: number;
  hardwareMaterialCost: number;
  totalMaterialCost: number;
  
  laborCost: number;
  subtotalCost: number;
}

export type LaborCalculationMode = 'per_meter_lari' | 'per_unit' | 'per_day_hok' | 'percentage_material';

export interface LaborSettings {
  mode: LaborCalculationMode;
  ratePerMeter: number; // e.g., Rp 35.000 / m1
  ratePerUnit: number; // e.g., Rp 150.000 / unit
  ratePerDay: number; // e.g., Rp 180.000 / HOK
  percentageRate: number; // e.g., 25% of material
  workersCount: number;
  estimatedDays: number;
  transportCost: number;
  scaffoldingCost: number;
  extraCost: number;
  extraCostNotes?: string;
}

export type ProjectStatus = 'draft' | 'quoted' | 'approved' | 'in_progress' | 'completed';

export interface Project {
  id: string;
  userId: string;
  title: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  estimateNumber: string; // e.g. RAB-2026-001
  date: string;
  status: ProjectStatus;
  
  items: FrameItem[];
  laborSettings: LaborSettings;
  
  markupPercentage: number; // Profit Margin % (e.g., 15%)
  taxPercentage: number; // PPN % (e.g. 0% or 11%)
  
  totalMaterialCost: number;
  totalLaborCost: number;
  totalOperationalCost: number;
  subtotal: number;
  markupAmount: number;
  taxAmount: number;
  grandTotal: number;
  
  estimatedProductionDays: number;
  notes: string;
  paymentTerms: string;
  
  createdAt: string;
  updatedAt: string;
  isSyncedWithCloud?: boolean;
}

export type MaterialCategory = 'aluminum' | 'glass' | 'hardware' | 'accessories' | 'labor_rate';

export interface InventoryItem {
  id: string;
  userId?: string;
  itemCode: string;
  name: string;
  category: MaterialCategory;
  brand?: AluminumBrand | string;
  color?: AluminumColor | string;
  spec?: string; // 3 inch / 4 inch / 5mm etc
  unit: 'batang' | 'm2' | 'pcs' | 'meter' | 'set' | 'm1';
  pricePerUnit: number; // Harga per unit dalam Rupiah
  supplierName?: string; // e.g. Toko Alumunium Abadi
  stockQuantity: number;
  minStockThreshold: number;
  lastUpdated: string;
  updatedBy?: string;
}

export interface PriceHistoryLog {
  id: string;
  itemId: string;
  itemName: string;
  oldPrice: number;
  newPrice: number;
  changedAt: string;
  changedBy: string;
  notes?: string;
}

export interface CutPiece {
  itemId: string;
  itemName: string;
  lengthMm: number;
  label: string;
}

export interface BarCutOptimization {
  barIndex: number;
  cuts: CutPiece[];
  totalUsedMm: number;
  remainingMm: number;
}

export type DoorPanelStyle = 
  | 'panil_horizontal' 
  | 'kaca_full' 
  | 'kaca_panil_bawah' 
  | 'jalusi_louver' 
  | 'acp_solid' 
  | 'ornamen_kotak';

export interface CustomDoorModel {
  id: string;
  name: string; // e.g. "Pintu Jalusi Penuh", "Pintu ACP Solid Hitam", "Pintu Kaca Sandblast"
  panelStyle: DoorPanelStyle;
  extraCost?: number; // Tambahan ongkos / fabrikasi per unit
  notes?: string;
  isCustom?: boolean;
}

export interface CustomFrameModel {
  id: string;
  name: string; // e.g. "Kusen Partisi Kantor + 2 Pintu", "Jendela Sudut 90°", etc.
  baseType: FrameType;
  defaultWidthMm: number;
  defaultHeightMm: number;
  mullionVertical: number;
  mullionHorizontal: number;
  hasTopBoven: boolean;
  topBovenHeightMm?: number;
  doorPanelType?: string;
  doorWidthMm?: number;
  windowCount?: number;
  windowHeightMm?: number;
  notes?: string;
  isCustom?: boolean;
}

