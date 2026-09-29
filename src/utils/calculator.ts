import {
  FrameItem,
  FrameType,
  InventoryItem,
  LaborSettings,
  Project,
  BarCutOptimization,
  CutPiece,
} from '../types';

export const ALUMINUM_BAR_LENGTH_MM = 6000; // 6 Meters standard bar in Indonesia

/**
 * Calculates linear meters (Meter Lari) for a single frame unit
 */
export function calculateFramePerimeterMeters(
  widthMm: number,
  heightMm: number,
  mullionVerticalCount: number = 0,
  mullionHorizontalCount: number = 0,
  type: FrameType
): number {
  const outerPerimeterMm = (widthMm + heightMm) * 2;
  const verticalMullionsMm = heightMm * mullionVerticalCount;
  const horizontalMullionsMm = widthMm * mullionHorizontalCount;

  // Add extra profile for inner sash frames (daun pintu/jendela) if applicable
  let innerSashMm = 0;
  if (type === 'kusen_pintu_jendela_gabungan') {
    // Combination: 1 Door Leaf + 2 Window Casement Sashes (as shown in reference drawing)
    const doorW = 900;
    const doorH = heightMm - 100;
    const winW = Math.max(400, (widthMm - doorW) / 2);
    const winH = Math.min(1350, heightMm * 0.65);
    const doorSash = (doorW - 80 + (doorH - 80)) * 2;
    const windowSashes = (winW - 80 + (winH - 80)) * 4; // 2 windows
    innerSashMm = doorSash + windowSashes;
  } else if (type === 'kusen_jendela_casement' || type === 'kusen_pintu_swing') {
    innerSashMm = (widthMm - 80 + (heightMm - 80)) * 2; // Daun frame inner perimeter
  } else if (type === 'kusen_jendela_sliding' || type === 'kusen_pintu_sliding') {
    innerSashMm = (widthMm / 2 + heightMm) * 4; // 2 sliding leaves overlap
  } else if (type === 'kusen_pintu_lipat') {
    innerSashMm = (widthMm + heightMm * 3) * 2; // Folding leaves
  }

  const totalLengthMm = outerPerimeterMm + verticalMullionsMm + horizontalMullionsMm + innerSashMm;
  return Number((totalLengthMm / 1000).toFixed(2));
}

/**
 * Calculates glass area in m²
 */
export function calculateGlassAreaM2(
  widthMm: number,
  heightMm: number,
  mullionVertical: number = 0,
  mullionHorizontal: number = 0,
  glassType: string
): number {
  if (glassType === 'Tanpa Kaca') return 0;
  // Subtract frame depth (approx 40mm on each side)
  const effectiveWidthMm = Math.max(0, widthMm - 80);
  const effectiveHeightMm = Math.max(0, heightMm - 80);
  const areaM2 = (effectiveWidthMm * effectiveHeightMm) / 1000000;
  return Number(areaM2.toFixed(3));
}

/**
 * Cut list optimizer for 6m (6000mm) aluminum bars
 */
export function optimizeBarCutList(items: FrameItem[]): {
  totalBars: number;
  optimizations: BarCutOptimization[];
  wastePercentage: number;
} {
  const allCutPieces: CutPiece[] = [];

  items.forEach((item) => {
    const w = item.widthMm;
    const h = item.heightMm;
    const qty = item.quantity;

    for (let q = 0; q < qty; q++) {
      // Outer Frame cuts
      allCutPieces.push({ itemId: item.id, itemName: `${item.name} (Lebar)`, lengthMm: w, label: `L-${w}mm` });
      allCutPieces.push({ itemId: item.id, itemName: `${item.name} (Lebar)`, lengthMm: w, label: `L-${w}mm` });
      allCutPieces.push({ itemId: item.id, itemName: `${item.name} (Tinggi)`, lengthMm: h, label: `T-${h}mm` });
      allCutPieces.push({ itemId: item.id, itemName: `${item.name} (Tinggi)`, lengthMm: h, label: `T-${h}mm` });

      // Mullion cuts
      for (let m = 0; m < item.mullionVerticalCount; m++) {
        allCutPieces.push({ itemId: item.id, itemName: `${item.name} (Tiang)`, lengthMm: h, label: `Tiang-${h}mm` });
      }
      for (let m = 0; m < item.mullionHorizontalCount; m++) {
        allCutPieces.push({ itemId: item.id, itemName: `${item.name} (Ambang)`, lengthMm: w, label: `Ambang-${w}mm` });
      }

      // Sash cuts for door/window leaves
      if (item.type.includes('jendela') || item.type.includes('pintu')) {
        const sashW = item.type.includes('sliding') ? Math.round(w / 2) : w - 80;
        const sashH = h - 80;
        if (sashW > 0 && sashH > 0) {
          allCutPieces.push({ itemId: item.id, itemName: `${item.name} (Daun L)`, lengthMm: sashW, label: `DaunL-${sashW}mm` });
          allCutPieces.push({ itemId: item.id, itemName: `${item.name} (Daun L)`, lengthMm: sashW, label: `DaunL-${sashW}mm` });
          allCutPieces.push({ itemId: item.id, itemName: `${item.name} (Daun T)`, lengthMm: sashH, label: `DaunT-${sashH}mm` });
          allCutPieces.push({ itemId: item.id, itemName: `${item.name} (Daun T)`, lengthMm: sashH, label: `DaunT-${sashH}mm` });
        }
      }
    }
  });

  // Sort pieces descending for First Fit Decreasing heuristic algorithm
  allCutPieces.sort((a, b) => b.lengthMm - a.lengthMm);

  const optimizations: BarCutOptimization[] = [];
  let barIndex = 1;

  allCutPieces.forEach((piece) => {
    let placed = false;
    for (const opt of optimizations) {
      if (opt.remainingMm >= piece.lengthMm + 5) { // 5mm saw blade width loss per cut
        opt.cuts.push(piece);
        opt.totalUsedMm += piece.lengthMm + 5;
        opt.remainingMm -= (piece.lengthMm + 5);
        placed = true;
        break;
      }
    }

    if (!placed) {
      optimizations.push({
        barIndex: barIndex++,
        cuts: [piece],
        totalUsedMm: piece.lengthMm + 5,
        remainingMm: ALUMINUM_BAR_LENGTH_MM - (piece.lengthMm + 5),
      });
    }
  });

  const totalBars = optimizations.length;
  const totalLengthCapacity = totalBars * ALUMINUM_BAR_LENGTH_MM;
  const totalUsedLength = optimizations.reduce((sum, opt) => sum + opt.totalUsedMm, 0);
  const wastePercentage = totalLengthCapacity > 0 
    ? Number((((totalLengthCapacity - totalUsedLength) / totalLengthCapacity) * 100).toFixed(1))
    : 0;

  return { totalBars, optimizations, wastePercentage };
}

/**
 * Calculates frame costs using current catalog prices or manual price overrides
 */
export function calculateFrameCosts(
  itemPartial: Omit<FrameItem, 'perimeterMeters' | 'aluminumBarsNeeded' | 'glassAreaM2' | 'aluminumMaterialCost' | 'glassMaterialCost' | 'hardwareMaterialCost' | 'totalMaterialCost' | 'laborCost' | 'subtotalCost' | 'wastePercentage'>,
  inventory: InventoryItem[],
  laborSettings: LaborSettings
): FrameItem {
  const { widthMm, heightMm, mullionVerticalCount, mullionHorizontalCount, type, quantity, brand, color, profileSize, glassType, hardware, customAluminumBarPrice, customGlassPricePerM2 } = itemPartial;

  // 1. Perimeter
  const perimeterPerUnit = calculateFramePerimeterMeters(widthMm, heightMm, mullionVerticalCount, mullionHorizontalCount, type);
  const totalPerimeterMeters = Number((perimeterPerUnit * quantity).toFixed(2));

  // 2. Glass area
  const glassAreaPerUnit = calculateGlassAreaM2(widthMm, heightMm, mullionVerticalCount, mullionHorizontalCount, glassType);
  const totalGlassAreaM2 = Number((glassAreaPerUnit * quantity).toFixed(2));

  // 3. Aluminum Bar Price matching or Manual Override
  let pricePerBar = customAluminumBarPrice;
  if (!pricePerBar || pricePerBar <= 0) {
    const matchingBar = inventory.find(
      (i) => i.category === 'aluminum' && i.brand === brand && (i.color === color || i.name.toLowerCase().includes(color.toLowerCase()))
    ) || inventory.find((i) => i.category === 'aluminum' && i.brand === brand)
      || inventory.find((i) => i.category === 'aluminum');
    pricePerBar = matchingBar ? matchingBar.pricePerUnit : 185000;
  }

  // Temporary single item calculation for bars
  const tempItem: FrameItem = {
    ...itemPartial,
    perimeterMeters: totalPerimeterMeters,
    aluminumBarsNeeded: 0,
    wastePercentage: 0,
    glassAreaM2: totalGlassAreaM2,
    aluminumMaterialCost: 0,
    glassMaterialCost: 0,
    hardwareMaterialCost: 0,
    totalMaterialCost: 0,
    laborCost: 0,
    subtotalCost: 0,
  };

  const { totalBars, wastePercentage } = optimizeBarCutList([tempItem]);
  const aluminumBarsNeeded = Math.max(1, totalBars);
  const aluminumMaterialCost = aluminumBarsNeeded * pricePerBar;

  // 4. Glass Price matching or Manual Override
  let pricePerM2Glass = customGlassPricePerM2;
  if (pricePerM2Glass === undefined || pricePerM2Glass === null) {
    const matchingGlass = inventory.find((i) => i.category === 'glass' && (i.name.toLowerCase().includes(glassType.toLowerCase()) || i.spec?.includes(glassType.split(' ')[1] || '')));
    pricePerM2Glass = matchingGlass ? matchingGlass.pricePerUnit : (glassType === 'Tanpa Kaca' ? 0 : 135000);
  }
  const glassMaterialCost = totalGlassAreaM2 * pricePerM2Glass;

  // 5. Hardware & Accessories
  const hgEngsel = inventory.find((i) => i.id === 'mat-hw-engsel-3in')?.pricePerUnit || 35000;
  const hgKunciPintu = inventory.find((i) => i.id === 'mat-hw-kunci-pintu')?.pricePerUnit || 165000;
  const hgKunciSliding = inventory.find((i) => i.id === 'mat-hw-kunci-sliding')?.pricePerUnit || 65000;
  const hgFrictionStay = inventory.find((i) => i.id === 'mat-hw-friction-stay')?.pricePerUnit || 55000;
  const hgSealant = inventory.find((i) => i.id === 'mat-acc-sealant')?.pricePerUnit || 38000;
  const hgKaret = inventory.find((i) => i.id === 'mat-acc-karet')?.pricePerUnit || 4500;
  const hgSekrup = inventory.find((i) => i.id === 'mat-acc-sekrup-siku')?.pricePerUnit || 15000;

  const isSliding = type.includes('sliding');
  const lockPrice = isSliding ? hgKunciSliding : hgKunciPintu;

  const hardwareCostPerUnit = 
    (hardware.hingesCount * hgEngsel) +
    (hardware.lockSetCount * lockPrice) +
    (hardware.frictionStayCount * hgFrictionStay) +
    (Math.ceil(hardware.sealantMeters / 10) * hgSealant) +
    (hardware.rubberMeters * hgKaret) +
    (hardware.screwsSikuSet * hgSekrup) +
    (hardware.customHardwarePrice || 0);

  const hardwareMaterialCost = hardwareCostPerUnit * quantity;

  // Door Panel Extra Cost (for custom door models with specialized panels/fabrication)
  const doorPanelExtraTotal = (itemPartial.doorPanelExtraCost || 0) * quantity;

  // 6. Total Material Cost
  const totalMaterialCost = Math.round(aluminumMaterialCost + glassMaterialCost + hardwareMaterialCost + doorPanelExtraTotal);

  // 7. Item level Labor Cost
  let laborCost = 0;
  if (laborSettings.mode === 'per_meter_lari') {
    laborCost = Math.round(totalPerimeterMeters * laborSettings.ratePerMeter);
  } else if (laborSettings.mode === 'per_unit') {
    laborCost = Math.round(quantity * laborSettings.ratePerUnit);
  } else if (laborSettings.mode === 'percentage_material') {
    laborCost = Math.round(totalMaterialCost * (laborSettings.percentageRate / 100));
  } else {
    // Distributed HOK
    laborCost = Math.round((laborSettings.ratePerDay * laborSettings.workersCount * laborSettings.estimatedDays) / Math.max(1, quantity));
  }

  const subtotalCost = totalMaterialCost + laborCost;

  return {
    ...itemPartial,
    perimeterMeters: totalPerimeterMeters,
    aluminumBarsNeeded,
    wastePercentage,
    glassAreaM2: totalGlassAreaM2,
    aluminumMaterialCost,
    glassMaterialCost,
    hardwareMaterialCost,
    totalMaterialCost,
    laborCost,
    subtotalCost,
  };
}

/**
 * Re-calculates full project summary numbers
 */
export function calculateProjectSummary(
  items: FrameItem[],
  laborSettings: LaborSettings,
  markupPercentage: number,
  taxPercentage: number
): {
  totalMaterialCost: number;
  totalLaborCost: number;
  totalOperationalCost: number;
  subtotal: number;
  markupAmount: number;
  taxAmount: number;
  grandTotal: number;
  estimatedProductionDays: number;
  totalAluminumBars: number;
} {
  const totalMaterialCost = items.reduce((sum, item) => sum + item.totalMaterialCost, 0);

  // Global Cut optimization across all project items
  const { totalBars } = optimizeBarCutList(items);
  const totalAluminumBars = totalBars;

  // Labor cost summary
  let totalLaborCost = 0;
  const totalPerimeterM1 = items.reduce((sum, item) => sum + item.perimeterMeters, 0);
  const totalUnitCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (laborSettings.mode === 'per_meter_lari') {
    totalLaborCost = Math.round(totalPerimeterM1 * laborSettings.ratePerMeter);
  } else if (laborSettings.mode === 'per_unit') {
    totalLaborCost = Math.round(totalUnitCount * laborSettings.ratePerUnit);
  } else if (laborSettings.mode === 'percentage_material') {
    totalLaborCost = Math.round(totalMaterialCost * (laborSettings.percentageRate / 100));
  } else if (laborSettings.mode === 'per_day_hok') {
    totalLaborCost = Math.round(laborSettings.ratePerDay * laborSettings.workersCount * laborSettings.estimatedDays);
  }

  const totalOperationalCost = (laborSettings.transportCost || 0) + (laborSettings.scaffoldingCost || 0) + (laborSettings.extraCost || 0);

  const subtotal = totalMaterialCost + totalLaborCost + totalOperationalCost;
  const markupAmount = Math.round(subtotal * (markupPercentage / 100));
  const amountBeforeTax = subtotal + markupAmount;
  const taxAmount = Math.round(amountBeforeTax * (taxPercentage / 100));
  const grandTotal = amountBeforeTax + taxAmount;

  // Production duration estimate:
  const dailyCapacityMeters = Math.max(5, laborSettings.workersCount * 8);
  const estimatedProductionDays = Math.max(1, Math.ceil(totalPerimeterM1 / dailyCapacityMeters) + 1);

  return {
    totalMaterialCost,
    totalLaborCost,
    totalOperationalCost,
    subtotal,
    markupAmount,
    taxAmount,
    grandTotal,
    estimatedProductionDays,
    totalAluminumBars,
  };
}

/**
 * Currency Formatter Indonesian Rupiah (Rp)
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
