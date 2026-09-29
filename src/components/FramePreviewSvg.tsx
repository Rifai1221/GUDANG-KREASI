import React, { useState, useRef } from 'react';
import { FrameType, AluminumProfile, AluminumColor, GlassType, DoorPanelStyle } from '../types';
import { Download, Eye, Maximize2, Compass, Ruler, Calculator, Sparkles, Layers } from 'lucide-react';

interface FramePreviewProps {
  type: FrameType;
  widthMm: number;
  heightMm: number;
  mullionVerticalCount: number;
  mullionHorizontalCount: number;
  profileSize: AluminumProfile;
  brand?: string;
  color: AluminumColor;
  glassType: GlassType;
  hasTopBoven?: boolean;
  topBovenHeightMm?: number;
  doorPanelType?: DoorPanelStyle | string;
  doorWidthMm?: number;
  windowCount?: number;
  windowHeightMm?: number;
  title?: string;
  className?: string;
}

export const FramePreviewSvg: React.FC<FramePreviewProps> = ({
  type,
  widthMm,
  heightMm,
  mullionVerticalCount,
  mullionHorizontalCount,
  profileSize,
  brand = 'Alexindo',
  color,
  glassType,
  hasTopBoven = false,
  topBovenHeightMm = 140,
  doorPanelType = 'panil_horizontal',
  doorWidthMm = 900,
  windowCount = 2,
  windowHeightMm = 1350,
  title = 'KUSEN TIPE 1',
  className = '',
}) => {
  // View mode: 'cad' (Technical shop drawing like uploaded blueprint) or 'render3d' (Photorealistic shaded)
  const [viewMode, setViewMode] = useState<'cad' | 'render3d'>('cad');
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showFloorPlan, setShowFloorPlan] = useState<boolean>(true);
  const [showFormula, setShowFormula] = useState<boolean>(true);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Profile dimensions in mm & cm
  const frameThickMm = profileSize === '4 Inch' ? 50 : 40; // 5 cm or 4 cm profile
  const frameThickCm = frameThickMm / 10;
  const totalWidthCm = Math.round(widthMm / 10);
  const totalHeightCm = Math.round(heightMm / 10);

  // SVG Canvas dimensions and coordinate system
  const canvasW = 760;
  const canvasH = 1000;

  // Drawing origin & scale calculation
  const paddingX = 90;
  const paddingTop = 95;
  const drawingMaxW = 540;
  const drawingMaxH = 500;

  // Layout calculations
  const effectiveDoorWidthMm = type === 'kusen_pintu_jendela_gabungan' 
    ? Math.min(doorWidthMm || 900, widthMm - 400) 
    : (type.includes('pintu') ? widthMm : 0);
  
  const effectiveDoorWidthCm = Math.round(effectiveDoorWidthMm / 10);
  const doorHeightMm = heightMm - (hasTopBoven ? topBovenHeightMm : 0);
  const doorHeightCm = Math.round(doorHeightMm / 10);

  const windowAreaWidthMm = type === 'kusen_pintu_jendela_gabungan'
    ? widthMm - effectiveDoorWidthMm
    : (type.includes('jendela') || type === 'kusen_mati_kaca' ? widthMm : 0);
  
  const windowAreaWidthCm = Math.round(windowAreaWidthMm / 10);
  const effectiveWindowHeightMm = type === 'kusen_pintu_jendela_gabungan'
    ? Math.min(windowHeightMm || 1350, doorHeightMm)
    : heightMm - (hasTopBoven ? topBovenHeightMm : 0);
  const windowHeightCm = Math.round(effectiveWindowHeightMm / 10);

  // Scale factor to map real mm to SVG pixels
  const scale = Math.min(drawingMaxW / widthMm, drawingMaxH / heightMm);
  const svgFrameW = widthMm * scale;
  const svgFrameH = heightMm * scale;

  const originX = paddingX + (drawingMaxW - svgFrameW) / 2;
  const originY = paddingTop + (hasTopBoven ? (topBovenHeightMm * scale) + 18 : 0);

  // --- COLOR SYSTEM MAPPING ---
  const getColorPalette = () => {
    if (color.includes('White')) {
      return {
        isDark: false,
        name: 'White Powder Coating',
        frameFill: '#F8FAFC',
        frameGradStart: '#FFFFFF',
        frameGradEnd: '#E2E8F0',
        stroke: '#475569',
        innerStroke: '#94A3B8',
        shadow: 'rgba(0,0,0,0.08)',
        panelFill: '#F1F5F9',
        panelStroke: '#64748B',
        highlight: '#FFFFFF',
        handleColor: '#CBD5E1',
      };
    }
    if (color.includes('Black')) {
      return {
        isDark: true,
        name: 'Black Matte Anodized',
        frameFill: '#1E242B',
        frameGradStart: '#2A3038',
        frameGradEnd: '#14181C',
        stroke: '#0F1216',
        innerStroke: '#3E4652',
        shadow: 'rgba(0,0,0,0.4)',
        panelFill: '#242A32',
        panelStroke: '#0F1216',
        highlight: '#475569',
        handleColor: '#E2E8F0',
      };
    }
    if (color.includes('Silver')) {
      return {
        isDark: false,
        name: 'Anodized Silver Metallic',
        frameFill: '#CBD5E1',
        frameGradStart: '#E2E8F0',
        frameGradEnd: '#94A3B8',
        stroke: '#334155',
        innerStroke: '#64748B',
        shadow: 'rgba(0,0,0,0.15)',
        panelFill: '#D8E2EC',
        panelStroke: '#475569',
        highlight: '#F8FAFC',
        handleColor: '#F1F5F9',
      };
    }
    if (color.includes('Cokelat') || color.includes('Brown')) {
      return {
        isDark: true,
        name: 'Dark Brown Anodized Bronze',
        frameFill: '#382015',
        frameGradStart: '#4A2B1D',
        frameGradEnd: '#29170E',
        stroke: '#1A0E08',
        innerStroke: '#5E3826',
        shadow: 'rgba(0,0,0,0.35)',
        panelFill: '#42271A',
        panelStroke: '#1A0E08',
        highlight: '#6E432E',
        handleColor: '#E2E8F0',
      };
    }
    if (color.includes('Kayu') || color.includes('Wood')) {
      return {
        isDark: false,
        name: 'Teak Wood Grain Coating',
        frameFill: '#78350F',
        frameGradStart: '#92400E',
        frameGradEnd: '#5A260B',
        stroke: '#3E1906',
        innerStroke: '#A16207',
        shadow: 'rgba(0,0,0,0.25)',
        panelFill: '#854D0E',
        panelStroke: '#3E1906',
        highlight: '#B45309',
        handleColor: '#FEF08A',
      };
    }
    // Custom Default
    return {
      isDark: true,
      name: 'Custom Architectural Powder',
      frameFill: '#334155',
      frameGradStart: '#475569',
      frameGradEnd: '#1E293B',
      stroke: '#0F172A',
      innerStroke: '#64748B',
      shadow: 'rgba(0,0,0,0.2)',
      panelFill: '#384252',
      panelStroke: '#1E293B',
      highlight: '#94A3B8',
      handleColor: '#E2E8F0',
    };
  };

  const palette = getColorPalette();

  // Glass style mapping
  const getGlassStyle = () => {
    if (glassType === 'Tanpa Kaca') return { fill: 'transparent', opacity: 0 };
    if (glassType.includes('Rayban')) return { fill: '#1E293B', opacity: 0.65, glare: true };
    if (glassType.includes('Frosted') || glassType.includes('Es')) return { fill: '#E2E8F0', opacity: 0.85, glare: false };
    if (glassType.includes('Tempered')) return { fill: '#059669', opacity: 0.22, glare: true };
    return { fill: '#38BDF8', opacity: 0.22, glare: true }; // Clear Cyan tint
  };

  const glassStyle = getGlassStyle();

  // Dynamically compute exact formula for PANJANG KUSEN meter lari box
  const computeFormulaSteps = () => {
    const heightM = (heightMm / 1000).toFixed(2);
    const widthM = (widthMm / 1000).toFixed(2);

    if (type === 'kusen_pintu_jendela_gabungan') {
      const doorHeightM = (doorHeightMm / 1000).toFixed(2);
      const windowHeightM = (effectiveWindowHeightMm / 1000).toFixed(2);
      const doorWM = (effectiveDoorWidthMm / 1000).toFixed(2);
      const singleWinWM = ((windowAreaWidthMm - (windowCount + 1) * frameThickMm) / (windowCount * 1000)).toFixed(2);

      const part1 = (Number(doorHeightM) * 2).toFixed(1);
      const part2 = (Number(windowHeightM) * 2).toFixed(1);
      const part3 = (Number(doorWM)).toFixed(1);
      const part4 = (Number(singleWinWM) * 4).toFixed(1);
      const totalM = (Number(part1) + Number(part2) + Number(part3) + Number(part4)).toFixed(1);

      return {
        line1: `PANJANG KUSEN = (${doorHeightM} M x 2) + (${windowHeightM} M x 2) + ${doorWM} M + (${singleWinWM} M x 4)`,
        line2: `= ${part1} M + ${part2} M + ${part3} M + ${part4} M`,
        line3: `= ${totalM} M`,
      };
    } else {
      // Standard Door or Window
      const vertPart = (Number(heightM) * 2).toFixed(1);
      const horizPart = (Number(widthM) * 2).toFixed(1);
      const mullionVert = (mullionVerticalCount * Number(heightM)).toFixed(1);
      const totalM = (Number(vertPart) + Number(horizPart) + Number(mullionVert)).toFixed(1);

      return {
        line1: `PANJANG KUSEN = (${heightM} M x 2) + (${widthM} M x 2)${mullionVerticalCount > 0 ? ` + (${heightM} M x ${mullionVerticalCount})` : ''}`,
        line2: `= ${vertPart} M + ${horizPart} M${mullionVerticalCount > 0 ? ` + ${mullionVert} M` : ''}`,
        line3: `= ${totalM} M`,
      };
    }
  };

  const formula = computeFormulaSteps();

  // Download SVG file handler
  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShopDrawing_${title.replace(/\s+/g, '_')}_${widthMm}x${heightMm}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper renderers for dimensions
  const renderDimensionLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    text: string | number,
    isVertical = false,
    textOffset = -6
  ) => {
    const tick = 4;
    return (
      <g stroke="#334155" strokeWidth="1" fill="#1E293B">
        <line x1={x1} y1={y1} x2={x2} y2={y2} />
        {/* Ticks at end */}
        {isVertical ? (
          <>
            <line x1={x1 - tick} y1={y1 + tick} x2={x1 + tick} y2={y1 - tick} strokeWidth="1.2" />
            <line x1={x2 - tick} y1={y2 + tick} x2={x2 + tick} y2={y2 - tick} strokeWidth="1.2" />
            <text
              x={x1 + textOffset}
              y={(y1 + y2) / 2}
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              transform={`rotate(-90, ${x1 + textOffset}, ${(y1 + y2) / 2})`}
              fill="#0F172A"
              stroke="none"
            >
              {text}
            </text>
          </>
        ) : (
          <>
            <line x1={x1 + tick} y1={y1 - tick} x2={x1 - tick} y2={y1 + tick} strokeWidth="1.2" />
            <line x1={x2 + tick} y1={y2 - tick} x2={x2 - tick} y2={y2 + tick} strokeWidth="1.2" />
            <text
              x={(x1 + x2) / 2}
              y={y1 + textOffset}
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              fill="#0F172A"
              stroke="none"
            >
              {text}
            </text>
          </>
        )}
      </g>
    );
  };

  // Door specific coordinates
  const doorW = effectiveDoorWidthMm * scale;
  const doorH = doorHeightMm * scale;
  const frameThickPx = frameThickMm * scale;

  // Window specific coordinates
  const winAreaW = windowAreaWidthMm * scale;
  const winAreaH = effectiveWindowHeightMm * scale;

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${className}`}>
      
      {/* Top Interactive Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          {/* CAD Blueprint vs 3D Render Switcher */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('cad')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                viewMode === 'cad'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Shop Drawing CAD</span>
            </button>
            <button
              onClick={() => setViewMode('render3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                viewMode === 'render3d'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Render 3D Material</span>
            </button>
          </div>

          {/* Color Indicator Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
            <span
              className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: palette.frameFill }}
            />
            <span>{color.split(' ')[0]}</span>
          </div>
        </div>

        {/* View toggles & SVG Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
              showDimensions
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Tampilkan / Sembunyikan Garis Ukuran"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Garis Ukuran</span>
          </button>

          <button
            onClick={handleDownloadSvg}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition text-xs shadow-sm"
            title="Download Gambar CAD Format SVG"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Unduh CAD (.SVG)</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Board */}
      <div className={`relative flex items-center justify-center p-4 overflow-x-auto ${
        viewMode === 'cad' ? 'bg-[#FCFDFD]' : 'bg-slate-950'
      }`}>
        <svg
          ref={svgRef}
          width={canvasW}
          height={canvasH}
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          className={`max-w-full h-auto select-none transition-all duration-300 ${
            viewMode === 'cad' ? 'filter drop-shadow-md' : 'filter drop-shadow-2xl'
          }`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DEFINITIONS & GRADIENTS */}
          <defs>
            {/* Architectural Grid pattern for CAD mode */}
            <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
            </pattern>

            {/* Profile Linear Gradient for 3D realism */}
            <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.frameGradStart} />
              <stop offset="50%" stopColor={palette.frameFill} />
              <stop offset="100%" stopColor={palette.frameGradEnd} />
            </linearGradient>

            {/* Glass reflection gradient */}
            <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="35%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
            </linearGradient>

            {/* Door Panel Bevel Filter */}
            <filter id="panelBevel" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor={palette.shadow} />
            </filter>
          </defs>

          {/* BACKGROUND SHEET */}
          <rect
            x="8"
            y="8"
            width={canvasW - 16}
            height={canvasH - 16}
            fill={viewMode === 'cad' ? '#FFFFFF' : '#0B0F17'}
            stroke={viewMode === 'cad' ? '#1E293B' : '#1E293B'}
            strokeWidth={viewMode === 'cad' ? '1.5' : '1'}
            rx="4"
          />

          {viewMode === 'cad' && (
            <rect x="12" y="12" width={canvasW - 24} height={canvasH - 24} fill="url(#cadGrid)" opacity="0.6" />
          )}

          {/* TOP ARCHITECTURAL TITLE BOX (Exact like reference drawing: "1. KUSEN TIPE PJ 1 ( PINTU JENDELA 1 )") */}
          <g>
            <rect
              x="24"
              y="22"
              width="360"
              height="36"
              fill={viewMode === 'cad' ? '#FFFFFF' : '#141A23'}
              stroke="#1E293B"
              strokeWidth="1.5"
              rx="2"
            />
            <text
              x="36"
              y="45"
              fontSize="13"
              fontFamily="sans-serif"
              fontWeight="800"
              fill={viewMode === 'cad' ? '#0F172A' : '#F8FAFC'}
              letterSpacing="0.5"
            >
              1. {title.toUpperCase()} ( {brand.toUpperCase()} {profileSize} )
            </text>
          </g>

          {/* ========================================================================= */}
          {/* TOP BOVEN / TRANSOM VENTILATION (If active or in combination drawing) */}
          {/* ========================================================================= */}
          {hasTopBoven && (
            <g id="topBovenGroup">
              {/* Outer Boven Box */}
              <rect
                x={originX}
                y={originY - (topBovenHeightMm * scale) - 18}
                width={svgFrameW}
                height={topBovenHeightMm * scale}
                fill={viewMode === 'render3d' ? 'url(#frameGrad)' : palette.frameFill}
                stroke={palette.stroke}
                strokeWidth="2"
              />

              {/* 3 Compartments Transom Glass / Louvers (like uploaded image) */}
              {[0, 1, 2].map((idx) => {
                const bw = (svgFrameW - 4 * frameThickPx) / 3;
                const bx = originX + frameThickPx + idx * (bw + frameThickPx);
                const by = originY - (topBovenHeightMm * scale) - 18 + frameThickPx;
                const bh = (topBovenHeightMm * scale) - 2 * frameThickPx;

                return (
                  <g key={`boven-${idx}`}>
                    <rect
                      x={bx}
                      y={by}
                      width={bw}
                      height={bh}
                      fill={glassStyle.fill}
                      fillOpacity={glassStyle.opacity}
                      stroke={palette.innerStroke}
                      strokeWidth="1.5"
                    />
                    {/* Boven Glare Lines */}
                    <line
                      x1={bx + 5}
                      y1={by + bh - 5}
                      x2={bx + bw - 5}
                      y2={by + 5}
                      stroke="rgba(255,255,255,0.6)"
                      strokeWidth="1"
                    />
                  </g>
                );
              })}

              {/* Boven Top Dimension (e.g. 230 cm) */}
              {showDimensions && (
                <>
                  {renderDimensionLine(
                    originX,
                    originY - (topBovenHeightMm * scale) - 34,
                    originX + svgFrameW,
                    originY - (topBovenHeightMm * scale) - 34,
                    totalWidthCm
                  )}
                  {/* Extension lines */}
                  <line
                    x1={originX}
                    y1={originY - (topBovenHeightMm * scale) - 18}
                    x2={originX}
                    y2={originY - (topBovenHeightMm * scale) - 38}
                    stroke="#94A3B8"
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={originX + svgFrameW}
                    y1={originY - (topBovenHeightMm * scale) - 18}
                    x2={originX + svgFrameW}
                    y2={originY - (topBovenHeightMm * scale) - 38}
                    stroke="#94A3B8"
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />

                  {/* Right side Boven dimensions (14, 10) */}
                  {renderDimensionLine(
                    originX + svgFrameW + 28,
                    originY - (topBovenHeightMm * scale) - 18,
                    originX + svgFrameW + 28,
                    originY - 18,
                    Math.round(topBovenHeightMm / 10),
                    true,
                    14
                  )}
                  {renderDimensionLine(
                    originX + svgFrameW + 28,
                    originY - 18,
                    originX + svgFrameW + 28,
                    originY,
                    10,
                    true,
                    14
                  )}
                </>
              )}
            </g>
          )}

          {/* ========================================================================= */}
          {/* MAIN FRAME & DOORS/WINDOWS RENDERING */}
          {/* ========================================================================= */}
          <g id="mainFrameGroup">
            {/* 1. TIPE: PINTU + JENDELA GABUNGAN (PJ 1) - EXACT LIKE USER IMAGE */}
            {type === 'kusen_pintu_jendela_gabungan' && (
              <g id="combinationPJ">
                {/* --- LEFT DOOR FRAME --- */}
                {/* Outer Door Frame */}
                <rect
                  x={originX}
                  y={originY}
                  width={doorW}
                  height={doorH}
                  fill={viewMode === 'render3d' ? 'url(#frameGrad)' : palette.frameFill}
                  stroke={palette.stroke}
                  strokeWidth="2.5"
                />

                {/* Inner Door Leaf (Daun Pintu) */}
                <rect
                  x={originX + frameThickPx}
                  y={originY + frameThickPx}
                  width={doorW - 2 * frameThickPx}
                  height={doorH - frameThickPx} // bottom touches floor
                  fill={viewMode === 'render3d' ? 'url(#frameGrad)' : palette.panelFill}
                  stroke={palette.innerStroke}
                  strokeWidth="2"
                  rx="1"
                />

                {/* Door Panels (Rendering according to chosen or custom model) */}
                {(doorPanelType === 'panil_horizontal' || !doorPanelType || doorPanelType.includes('spandrel') || doorPanelType.includes('horizontal')) && (
                  <g id="horizontalPanels">
                    {Array.from({ length: 7 }).map((_, pIdx) => {
                      const panelH = (doorH - 2 * frameThickPx - 80) / 7;
                      const py = originY + frameThickPx + 30 + pIdx * (panelH + 6);
                      const px = originX + frameThickPx + 20;
                      const pw = doorW - 2 * frameThickPx - 40;

                      return (
                        <g key={`door-panel-${pIdx}`}>
                          <rect
                            x={px}
                            y={py}
                            width={pw}
                            height={panelH}
                            fill={palette.isDark ? '#2B323C' : '#FFFFFF'}
                            stroke={palette.stroke}
                            strokeWidth="1.2"
                            rx="1"
                            filter={viewMode === 'render3d' ? 'url(#panelBevel)' : undefined}
                          />
                          {/* Inner groove double line for realistic bevel */}
                          <line
                            x1={px + 2}
                            y1={py + 3}
                            x2={px + pw - 2}
                            y2={py + 3}
                            stroke={palette.highlight}
                            strokeWidth="0.8"
                            opacity="0.7"
                          />
                        </g>
                      );
                    })}
                  </g>
                )}

                {doorPanelType === 'kaca_full' && (
                  <g id="kacaFullDoor">
                    <rect
                      x={originX + frameThickPx + 16}
                      y={originY + frameThickPx + 16}
                      width={doorW - 2 * frameThickPx - 32}
                      height={doorH - 2 * frameThickPx - 26}
                      fill={glassStyle.fill}
                      fillOpacity={glassStyle.opacity}
                      stroke={palette.stroke}
                      strokeWidth="1.5"
                    />
                    <line
                      x1={originX + doorW * 0.3}
                      y1={originY + doorH * 0.7}
                      x2={originX + doorW * 0.75}
                      y2={originY + doorH * 0.25}
                      stroke="rgba(255,255,255,0.7)"
                      strokeWidth="1.5"
                    />
                  </g>
                )}

                {doorPanelType === 'kaca_panil_bawah' && (
                  <g id="kacaPanilBawahDoor">
                    {/* Upper Glass */}
                    <rect
                      x={originX + frameThickPx + 16}
                      y={originY + frameThickPx + 16}
                      width={doorW - 2 * frameThickPx - 32}
                      height={(doorH - 2 * frameThickPx - 32) * 0.62}
                      fill={glassStyle.fill}
                      fillOpacity={glassStyle.opacity}
                      stroke={palette.stroke}
                      strokeWidth="1.5"
                    />
                    {/* Lower Spandrel Panel */}
                    <rect
                      x={originX + frameThickPx + 16}
                      y={originY + frameThickPx + 16 + (doorH - 2 * frameThickPx - 32) * 0.64}
                      width={doorW - 2 * frameThickPx - 32}
                      height={(doorH - 2 * frameThickPx - 32) * 0.36}
                      fill={palette.isDark ? '#2B323C' : '#FFFFFF'}
                      stroke={palette.stroke}
                      strokeWidth="1.5"
                    />
                    {[1, 2, 3].map((lIdx) => (
                      <line
                        key={`low-pan-${lIdx}`}
                        x1={originX + frameThickPx + 20}
                        y1={originY + frameThickPx + 16 + (doorH - 2 * frameThickPx - 32) * 0.64 + lIdx * 20}
                        x2={originX + doorW - frameThickPx - 20}
                        y2={originY + frameThickPx + 16 + (doorH - 2 * frameThickPx - 32) * 0.64 + lIdx * 20}
                        stroke={palette.stroke}
                        strokeWidth="1"
                      />
                    ))}
                  </g>
                )}

                {doorPanelType === 'jalusi_louver' && (
                  <g id="jalusiLouverDoor">
                    <rect
                      x={originX + frameThickPx + 16}
                      y={originY + frameThickPx + 16}
                      width={doorW - 2 * frameThickPx - 32}
                      height={doorH - 2 * frameThickPx - 26}
                      fill={palette.isDark ? '#232931' : '#F1F5F9'}
                      stroke={palette.stroke}
                      strokeWidth="1.5"
                    />
                    {Array.from({ length: 14 }).map((_, jIdx) => {
                      const jy = originY + frameThickPx + 26 + jIdx * 24;
                      return (
                        <g key={`jalusi-${jIdx}`}>
                          <line
                            x1={originX + frameThickPx + 20}
                            y1={jy}
                            x2={originX + doorW - frameThickPx - 20}
                            y2={jy}
                            stroke={palette.stroke}
                            strokeWidth="2.5"
                          />
                          <line
                            x1={originX + frameThickPx + 20}
                            y1={jy + 2}
                            x2={originX + doorW - frameThickPx - 20}
                            y2={jy + 2}
                            stroke={palette.highlight}
                            strokeWidth="1"
                            opacity="0.6"
                          />
                        </g>
                      );
                    })}
                  </g>
                )}

                {doorPanelType === 'acp_solid' && (
                  <g id="acpSolidDoor">
                    <rect
                      x={originX + frameThickPx + 16}
                      y={originY + frameThickPx + 16}
                      width={doorW - 2 * frameThickPx - 32}
                      height={doorH - 2 * frameThickPx - 26}
                      fill={palette.isDark ? '#282E38' : '#F8FAFC'}
                      stroke={palette.stroke}
                      strokeWidth="2"
                    />
                    <rect
                      x={originX + frameThickPx + 26}
                      y={originY + frameThickPx + 26}
                      width={doorW - 2 * frameThickPx - 52}
                      height={doorH - 2 * frameThickPx - 46}
                      fill="none"
                      stroke={palette.innerStroke}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  </g>
                )}

                {doorPanelType === 'ornamen_kotak' && (
                  <g id="ornamenKotakDoor">
                    <rect
                      x={originX + frameThickPx + 16}
                      y={originY + frameThickPx + 16}
                      width={doorW - 2 * frameThickPx - 32}
                      height={doorH - 2 * frameThickPx - 26}
                      fill={glassStyle.fill}
                      fillOpacity={glassStyle.opacity}
                      stroke={palette.stroke}
                      strokeWidth="1.5"
                    />
                    <line
                      x1={originX + doorW / 2}
                      y1={originY + frameThickPx + 16}
                      x2={originX + doorW / 2}
                      y2={originY + doorH - frameThickPx - 10}
                      stroke={palette.stroke}
                      strokeWidth="2"
                    />
                    {[1, 2, 3].map((rIdx) => {
                      const ry = originY + frameThickPx + 16 + (rIdx * (doorH - 2 * frameThickPx - 26)) / 4;
                      return (
                        <line
                          key={`orn-r-${rIdx}`}
                          x1={originX + frameThickPx + 16}
                          y1={ry}
                          x2={originX + doorW - frameThickPx - 16}
                          y2={ry}
                          stroke={palette.stroke}
                          strokeWidth="2"
                        />
                      );
                    })}
                  </g>
                )}

                {/* Door Swing Dashed Lines (Diagonal from hinges on left to latch on right) */}
                <g stroke="#64748B" strokeWidth="1" strokeDasharray="5 4" fill="none">
                  <line
                    x1={originX + frameThickPx}
                    y1={originY + frameThickPx + 10}
                    x2={originX + doorW - frameThickPx}
                    y2={originY + doorH / 2}
                  />
                  <line
                    x1={originX + frameThickPx}
                    y1={originY + doorH - 10}
                    x2={originX + doorW - frameThickPx}
                    y2={originY + doorH / 2}
                  />
                </g>

                {/* Lever Handle & Escutcheon Plate (Silver Chrome) */}
                <g id="doorHandle" transform={`translate(${originX + doorW - frameThickPx - 16}, ${originY + doorH / 2 - 20})`}>
                  {/* Escutcheon Plate */}
                  <rect
                    x="-6"
                    y="0"
                    width="14"
                    height="42"
                    rx="5"
                    fill={palette.handleColor}
                    stroke="#1E293B"
                    strokeWidth="1.5"
                  />
                  {/* Keyhole cylinder */}
                  <circle cx="1" cy="28" r="2.5" fill="#0F172A" />
                  <polygon points="-0.5,28 2.5,28 2,34 0,34" fill="#0F172A" />
                  {/* Lever Handle Bar */}
                  <rect
                    x="-18"
                    y="8"
                    width="20"
                    height="6"
                    rx="2"
                    fill={palette.handleColor}
                    stroke="#0F172A"
                    strokeWidth="1.5"
                  />
                  <circle cx="1" cy="11" r="4.5" fill="#94A3B8" stroke="#0F172A" strokeWidth="1" />
                </g>

                {/* --- RIGHT DOUBLE WINDOWS (2 Jendela Casement) --- */}
                {/* Outer Window Section Frame */}
                <rect
                  x={originX + doorW}
                  y={originY}
                  width={winAreaW}
                  height={winAreaH}
                  fill={viewMode === 'render3d' ? 'url(#frameGrad)' : palette.frameFill}
                  stroke={palette.stroke}
                  strokeWidth="2.5"
                />

                {/* 2 Casement Window Leaves (Daun Jendela) */}
                {[0, 1].map((wIdx) => {
                  const leafW = (winAreaW - 3 * frameThickPx) / 2;
                  const lx = originX + doorW + frameThickPx + wIdx * (leafW + frameThickPx);
                  const ly = originY + frameThickPx;
                  const lh = winAreaH - 2 * frameThickPx;

                  return (
                    <g key={`win-leaf-${wIdx}`}>
                      {/* Window Sash Frame */}
                      <rect
                        x={lx}
                        y={ly}
                        width={leafW}
                        height={lh}
                        fill={viewMode === 'render3d' ? 'url(#frameGrad)' : palette.frameFill}
                        stroke={palette.innerStroke}
                        strokeWidth="2"
                      />

                      {/* Glass Panel */}
                      <rect
                        x={lx + frameThickPx * 0.7}
                        y={ly + frameThickPx * 0.7}
                        width={leafW - 1.4 * frameThickPx}
                        height={lh - 1.4 * frameThickPx}
                        fill={glassStyle.fill}
                        fillOpacity={glassStyle.opacity}
                        stroke={palette.stroke}
                        strokeWidth="1.2"
                      />

                      {/* Triangular Swing Dashed Lines (Awning/Casement opening like reference drawing) */}
                      <polygon
                        points={`${lx + leafW / 2},${ly + 4} ${lx + 6},${ly + lh - 6} ${lx + leafW - 6},${ly + lh - 6}`}
                        fill="none"
                        stroke="#64748B"
                        strokeWidth="1"
                        strokeDasharray="5 4"
                      />

                      {/* Glass Light Reflection Glare (2 parallel diagonal lines) */}
                      {glassStyle.glare && (
                        <g stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round">
                          <line
                            x1={lx + leafW * 0.4}
                            y1={ly + lh * 0.65}
                            x2={lx + leafW * 0.75}
                            y2={ly + lh * 0.3}
                          />
                          <line
                            x1={lx + leafW * 0.48}
                            y1={ly + lh * 0.7}
                            x2={lx + leafW * 0.82}
                            y2={ly + lh * 0.36}
                          />
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            )}

            {/* 2. TIPE STANDARD: JENDELA CASEMENT / SLIDING / PINTU / FACADE */}
            {type !== 'kusen_pintu_jendela_gabungan' && (
              <g id="standardFrames">
                {/* Outer Frame */}
                <rect
                  x={originX}
                  y={originY}
                  width={svgFrameW}
                  height={svgFrameH}
                  fill={viewMode === 'render3d' ? 'url(#frameGrad)' : palette.frameFill}
                  stroke={palette.stroke}
                  strokeWidth="2.5"
                  rx="2"
                />

                {/* Sub Panels with Mullions */}
                {Array.from({ length: mullionHorizontalCount + 1 }).map((_, hIdx) => {
                  const horizPanels = mullionHorizontalCount + 1;
                  const vertPanels = mullionVerticalCount + 1;
                  const pw = (svgFrameW - (vertPanels + 1) * frameThickPx) / vertPanels;
                  const ph = (svgFrameH - (horizPanels + 1) * frameThickPx) / horizPanels;

                  return Array.from({ length: vertPanels }).map((_, vIdx) => {
                    const px = originX + frameThickPx + vIdx * (pw + frameThickPx);
                    const py = originY + frameThickPx + hIdx * (ph + frameThickPx);

                    const isDoorLeaf = type.includes('pintu');

                    return (
                      <g key={`pnl-${hIdx}-${vIdx}`}>
                        {/* Panel Background (Glass or Door Panil) */}
                        {isDoorLeaf && (doorPanelType === 'panil_horizontal' || !doorPanelType || doorPanelType.includes('spandrel') || doorPanelType.includes('horizontal')) ? (
                          <g>
                            <rect
                              x={px}
                              y={py}
                              width={pw}
                              height={ph}
                              fill={viewMode === 'render3d' ? 'url(#frameGrad)' : palette.panelFill}
                              stroke={palette.innerStroke}
                              strokeWidth="1.8"
                            />
                            {/* Horizontal Panil Slats */}
                            {Array.from({ length: 6 }).map((_, sIdx) => {
                              const sh = (ph - 30) / 6;
                              return (
                                <rect
                                  key={`slat-${sIdx}`}
                                  x={px + 8}
                                  y={py + 10 + sIdx * (sh + 2)}
                                  width={pw - 16}
                                  height={sh}
                                  fill={palette.isDark ? '#2B323C' : '#FFFFFF'}
                                  stroke={palette.stroke}
                                  strokeWidth="1"
                                />
                              );
                            })}
                          </g>
                        ) : isDoorLeaf && doorPanelType === 'jalusi_louver' ? (
                          <g>
                            <rect
                              x={px}
                              y={py}
                              width={pw}
                              height={ph}
                              fill={palette.isDark ? '#232931' : '#F1F5F9'}
                              stroke={palette.innerStroke}
                              strokeWidth="1.8"
                            />
                            {Array.from({ length: 12 }).map((_, jIdx) => {
                              const jy = py + 15 + jIdx * ((ph - 30) / 12);
                              return (
                                <line
                                  key={`jal-${jIdx}`}
                                  x1={px + 6}
                                  y1={jy}
                                  x2={px + pw - 6}
                                  y2={jy}
                                  stroke={palette.stroke}
                                  strokeWidth="2.5"
                                />
                              );
                            })}
                          </g>
                        ) : isDoorLeaf && doorPanelType === 'acp_solid' ? (
                          <g>
                            <rect
                              x={px}
                              y={py}
                              width={pw}
                              height={ph}
                              fill={palette.isDark ? '#334155' : '#E2E8F0'}
                              stroke={palette.stroke}
                              strokeWidth="1.8"
                            />
                            <rect
                              x={px + 8}
                              y={py + 8}
                              width={pw - 16}
                              height={ph - 16}
                              fill="none"
                              stroke={palette.innerStroke}
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                          </g>
                        ) : isDoorLeaf && doorPanelType === 'kaca_panil_bawah' ? (
                          <g>
                            {/* Top 65% Glass */}
                            <rect
                              x={px}
                              y={py}
                              width={pw}
                              height={ph * 0.62}
                              fill={glassStyle.fill}
                              fillOpacity={glassStyle.opacity}
                              stroke={palette.innerStroke}
                              strokeWidth="1.5"
                            />
                            {/* Bottom 35% Panel */}
                            <rect
                              x={px}
                              y={py + ph * 0.64}
                              width={pw}
                              height={ph * 0.36}
                              fill={palette.isDark ? '#2B323C' : '#FFFFFF'}
                              stroke={palette.stroke}
                              strokeWidth="1.5"
                            />
                            {[1, 2, 3].map((lIdx) => (
                              <line
                                key={`low-slat-${lIdx}`}
                                x1={px + 6}
                                y1={py + ph * 0.64 + lIdx * 18}
                                x2={px + pw - 6}
                                y2={py + ph * 0.64 + lIdx * 18}
                                stroke={palette.stroke}
                                strokeWidth="1"
                              />
                            ))}
                          </g>
                        ) : isDoorLeaf && doorPanelType === 'ornamen_kotak' ? (
                          <g>
                            <rect
                              x={px}
                              y={py}
                              width={pw}
                              height={ph}
                              fill={glassStyle.fill}
                              fillOpacity={glassStyle.opacity}
                              stroke={palette.innerStroke}
                              strokeWidth="1.5"
                            />
                            {/* Grid Muntin Lines */}
                            <line x1={px + pw * 0.33} y1={py} x2={px + pw * 0.33} y2={py + ph} stroke={palette.stroke} strokeWidth="1.5" />
                            <line x1={px + pw * 0.66} y1={py} x2={px + pw * 0.66} y2={py + ph} stroke={palette.stroke} strokeWidth="1.5" />
                            <line x1={px} y1={py + ph * 0.25} x2={px + pw} y2={py + ph * 0.25} stroke={palette.stroke} strokeWidth="1.5" />
                            <line x1={px} y1={py + ph * 0.5} x2={px + pw} y2={py + ph * 0.5} stroke={palette.stroke} strokeWidth="1.5" />
                            <line x1={px} y1={py + ph * 0.75} x2={px + pw} y2={py + ph * 0.75} stroke={palette.stroke} strokeWidth="1.5" />
                          </g>
                        ) : (
                          <g>
                            {/* Glass Panel */}
                            <rect
                              x={px}
                              y={py}
                              width={pw}
                              height={ph}
                              fill={glassStyle.fill}
                              fillOpacity={glassStyle.opacity}
                              stroke={palette.innerStroke}
                              strokeWidth="1.5"
                            />
                            {/* Casement Inner Sash Frame */}
                            {type === 'kusen_jendela_casement' && (
                              <>
                                <rect
                                  x={px + 4}
                                  y={py + 4}
                                  width={pw - 8}
                                  height={ph - 8}
                                  fill="none"
                                  stroke={palette.stroke}
                                  strokeWidth="1.5"
                                />
                                <polygon
                                  points={`${px + pw / 2},${py + 8} ${px + 8},${py + ph - 8} ${px + pw - 8},${py + ph - 8}`}
                                  fill="none"
                                  stroke="#64748B"
                                  strokeWidth="1"
                                  strokeDasharray="4 3"
                                />
                              </>
                            )}
                            {/* Glare Reflection */}
                            {glassStyle.glare && (
                              <line
                                x1={px + pw * 0.3}
                                y1={py + ph * 0.7}
                                x2={px + pw * 0.75}
                                y2={py + ph * 0.25}
                                stroke="rgba(255,255,255,0.7)"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            )}
                          </g>
                        )}

                        {/* Door Swing Dashed Lines & Handle */}
                        {isDoorLeaf && (
                          <>
                            <g stroke="#64748B" strokeWidth="1" strokeDasharray="5 4" fill="none">
                              <line x1={px} y1={py + 10} x2={px + pw} y2={py + ph / 2} />
                              <line x1={px} y1={py + ph - 10} x2={px + pw} y2={py + ph / 2} />
                            </g>
                            {/* Door Lever Handle */}
                            <g transform={`translate(${px + pw - 14}, ${py + ph / 2 - 16})`}>
                              <rect x="-4" y="0" width="10" height="32" rx="3" fill={palette.handleColor} stroke="#0F172A" strokeWidth="1" />
                              <circle cx="1" cy="8" r="3" fill="#94A3B8" />
                              <rect x="-14" y="6" width="15" height="4.5" rx="1.5" fill={palette.handleColor} stroke="#0F172A" strokeWidth="1" />
                            </g>
                          </>
                        )}
                      </g>
                    );
                  });
                })}
              </g>
            )}
          </g>

          {/* ========================================================================= */}
          {/* ARCHITECTURAL DIMENSION LINES (EXACT REPLICA OF DRAWING) */}
          {/* ========================================================================= */}
          {showDimensions && (
            <g id="dimensionLinesGroup">
              {/* TOP DIMENSION LINE (OVERALL WIDTH, e.g. 230) */}
              {!hasTopBoven && renderDimensionLine(originX, originY - 24, originX + svgFrameW, originY - 24, totalWidthCm)}

              {/* LEFT SIDE DIMENSIONS (DOOR HEIGHT, e.g. 210, 205, 5) */}
              {type === 'kusen_pintu_jendela_gabungan' ? (
                <>
                  {/* Outer total door height: 210 */}
                  {renderDimensionLine(originX - 32, originY, originX - 32, originY + doorH, doorHeightCm, true, -10)}
                  {/* Inner opening: 205 */}
                  {renderDimensionLine(originX - 16, originY + frameThickPx, originX - 16, originY + doorH, doorHeightCm - frameThickCm, true, -8)}
                  {/* Top frame: 5 */}
                  {renderDimensionLine(originX - 16, originY, originX - 16, originY + frameThickPx, frameThickCm, true, -8)}
                </>
              ) : (
                renderDimensionLine(originX - 24, originY, originX - 24, originY + svgFrameH, totalHeightCm, true, -10)
              )}

              {/* RIGHT SIDE DIMENSIONS (WINDOW HEIGHT, e.g. 135, 125, 5) */}
              {type === 'kusen_pintu_jendela_gabungan' && (
                <>
                  {/* Total window section height: 135 */}
                  {renderDimensionLine(originX + svgFrameW + 36, originY, originX + svgFrameW + 36, originY + winAreaH, windowHeightCm, true, 10)}
                  {/* Inner leaf height: 125 */}
                  {renderDimensionLine(originX + svgFrameW + 18, originY + frameThickPx, originX + svgFrameW + 18, originY + winAreaH - frameThickPx, windowHeightCm - 2 * frameThickCm, true, 8)}
                  {/* Bottom frame: 5 */}
                  {renderDimensionLine(originX + svgFrameW + 18, originY + winAreaH - frameThickPx, originX + svgFrameW + 18, originY + winAreaH, frameThickCm, true, 8)}
                </>
              )}

              {/* BOTTOM DETAILED TIER DIMENSIONS */}
              {type === 'kusen_pintu_jendela_gabungan' ? (
                <>
                  {/* Tier 1 (Detailed 5 | 90 | 5 | 60 | 5 | 60 | 5) */}
                  {renderDimensionLine(originX, originY + doorH + 16, originX + frameThickPx, originY + doorH + 16, frameThickCm)}
                  {renderDimensionLine(originX + frameThickPx, originY + doorH + 16, originX + doorW - frameThickPx, originY + doorH + 16, effectiveDoorWidthCm - 2 * frameThickCm)}
                  {renderDimensionLine(originX + doorW - frameThickPx, originY + doorH + 16, originX + doorW, originY + doorH + 16, frameThickCm)}

                  {/* Window 1: 60 */}
                  {renderDimensionLine(
                    originX + doorW + frameThickPx,
                    originY + doorH + 16,
                    originX + doorW + frameThickPx + (winAreaW - 3 * frameThickPx) / 2,
                    originY + doorH + 16,
                    Math.round((windowAreaWidthCm - 3 * frameThickCm) / 2)
                  )}
                  {/* Middle mullion: 5 */}
                  {renderDimensionLine(
                    originX + doorW + frameThickPx + (winAreaW - 3 * frameThickPx) / 2,
                    originY + doorH + 16,
                    originX + doorW + 2 * frameThickPx + (winAreaW - 3 * frameThickPx) / 2,
                    originY + doorH + 16,
                    frameThickCm
                  )}
                  {/* Window 2: 60 */}
                  {renderDimensionLine(
                    originX + doorW + 2 * frameThickPx + (winAreaW - 3 * frameThickPx) / 2,
                    originY + doorH + 16,
                    originX + svgFrameW - frameThickPx,
                    originY + doorH + 16,
                    Math.round((windowAreaWidthCm - 3 * frameThickCm) / 2)
                  )}
                  {/* Outer right: 5 */}
                  {renderDimensionLine(originX + svgFrameW - frameThickPx, originY + doorH + 16, originX + svgFrameW, originY + doorH + 16, frameThickCm)}

                  {/* Tier 2 (Grouped: 100 Pintu | 130 Jendela) */}
                  {renderDimensionLine(originX, originY + doorH + 34, originX + doorW, originY + doorH + 34, effectiveDoorWidthCm)}
                  {renderDimensionLine(originX + doorW, originY + doorH + 34, originX + svgFrameW, originY + doorH + 34, windowAreaWidthCm)}

                  {/* Tier 3 (Total Lebar: 230) */}
                  {renderDimensionLine(originX, originY + doorH + 52, originX + svgFrameW, originY + doorH + 52, totalWidthCm)}

                  {/* Extension guidelines */}
                  <line x1={originX} y1={originY + doorH} x2={originX} y2={originY + doorH + 58} stroke="#CBD5E1" strokeWidth="0.8" />
                  <line x1={originX + doorW} y1={originY + doorH} x2={originX + doorW} y2={originY + doorH + 58} stroke="#CBD5E1" strokeWidth="0.8" />
                  <line x1={originX + svgFrameW} y1={originY + doorH} x2={originX + svgFrameW} y2={originY + doorH + 58} stroke="#CBD5E1" strokeWidth="0.8" />
                </>
              ) : (
                renderDimensionLine(originX, originY + svgFrameH + 24, originX + svgFrameW, originY + svgFrameH + 24, totalWidthCm)
              )}
            </g>
          )}

          {/* ========================================================================= */}
          {/* FORMULA RECAP BOX (PANJANG KUSEN) - EXACT REPLICA OF DRAWING */}
          {/* ========================================================================= */}
          {showFormula && (
            <g id="formulaBox" transform={`translate(40, ${originY + doorH + 80})`}>
              <rect
                x="0"
                y="0"
                width="640"
                height="68"
                fill={viewMode === 'cad' ? '#FFFFFF' : '#141A23'}
                stroke="#1E293B"
                strokeWidth="1.5"
                rx="2"
              />
              <text
                x="18"
                y="24"
                fontSize="12"
                fontFamily="monospace"
                fontWeight="bold"
                fill={viewMode === 'cad' ? '#0F172A' : '#E2E8F0'}
              >
                {formula.line1}
              </text>
              <text
                x="18"
                y="43"
                fontSize="12"
                fontFamily="monospace"
                fontWeight="bold"
                fill={viewMode === 'cad' ? '#0F172A' : '#E2E8F0'}
              >
                {formula.line2}
              </text>
              <text
                x="18"
                y="60"
                fontSize="12"
                fontFamily="monospace"
                fontWeight="bold"
                fill="#D97706"
              >
                {formula.line3}
              </text>
            </g>
          )}

          {/* ========================================================================= */}
          {/* FLOOR PLAN SYMBOL (DENAH BUKAAN 90 DERAJAT) - BOTTOM LEFT */}
          {/* ========================================================================= */}
          {showFloorPlan && (type.includes('pintu') || type === 'kusen_pintu_jendela_gabungan') && (
            <g id="floorPlanSymbol" transform={`translate(40, ${originY + doorH + 165})`}>
              {/* Wall opening frame */}
              <rect x="0" y="70" width="10" height="25" fill="#94A3B8" stroke="#1E293B" strokeWidth="1" />
              <rect x="90" y="70" width="10" height="25" fill="#94A3B8" stroke="#1E293B" strokeWidth="1" />

              {/* Window sill section */}
              {type === 'kusen_pintu_jendela_gabungan' && (
                <rect x="100" y="76" width="120" height="13" fill="#E2E8F0" stroke="#1E293B" strokeWidth="1" />
              )}

              {/* Door leaf open at 90 degrees */}
              <line x1="8" y1="70" x2="8" y2="0" stroke="#0F172A" strokeWidth="3" />
              {/* Door head thickness */}
              <rect x="5" y="0" width="6" height="70" fill={palette.frameFill} stroke="#0F172A" strokeWidth="1.2" />

              {/* 90-degree Swing Arc */}
              <path
                d="M 8 0 A 70 70 0 0 1 78 70"
                fill="none"
                stroke="#64748B"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Bottom Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-950 border-t border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-300">Spesifikasi Profil:</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono font-bold border border-slate-700">
            {profileSize} • {brand}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
            Warna: <strong style={{ color: palette.isDark ? '#F8FAFC' : '#F59E0B' }}>{color.split(' ')[0]}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Kaca: {glassType}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block font-mono">
            Ukuran: <strong className="text-emerald-400">{widthMm} x {heightMm} mm</strong> ({totalWidthCm} x {totalHeightCm} cm)
          </span>
        </div>
      </div>
    </div>
  );
};
