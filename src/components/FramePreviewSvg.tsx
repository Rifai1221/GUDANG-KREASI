import React, { useState, useRef } from 'react';
import { 
  FrameType, 
  AluminumProfile, 
  AluminumColor, 
  GlassType, 
  DoorPanelStyle, 
  DoorInfillType, 
  DoorHandleType, 
  DoorHandlePosition, 
  DoorHandleColor,
  WindowLeafType
} from '../types';
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
  doorInfillType?: DoorInfillType;
  handleType?: DoorHandleType;
  handlePosition?: DoorHandlePosition;
  handleColor?: DoorHandleColor;
  handleHeightMm?: number;
  doorWidthMm?: number;
  windowCount?: number;
  windowHeightMm?: number;
  windowLeaves?: WindowLeafType[];
  title?: string;
  className?: string;
  defaultViewMode?: 'cad' | 'render3d';
  controlledViewMode?: 'cad' | 'render3d';
  hideToolbar?: boolean;
  hideFooter?: boolean;
  compact?: boolean;
  onHandleHeightChange?: (newHeightMm: number) => void;
  onHandlePositionChange?: (newPosition: DoorHandlePosition) => void;
  onHandleTypeChange?: (newType: DoorHandleType) => void;
  onRemoveHandle?: () => void;
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
  doorInfillType,
  handleType = 'pull_80',
  handlePosition = 'right',
  handleColor = 'stainless',
  handleHeightMm = 1000,
  doorWidthMm = 900,
  windowCount = 2,
  windowHeightMm = 1350,
  windowLeaves,
  title = 'KUSEN TIPE 1',
  className = '',
  defaultViewMode = 'render3d',
  controlledViewMode,
  hideToolbar = false,
  hideFooter = false,
  compact = false,
  onHandleHeightChange,
  onHandlePositionChange,
  onHandleTypeChange,
  onRemoveHandle,
}) => {
  // View mode: 'cad' (Technical shop drawing like uploaded blueprint) or 'render3d' (Photorealistic shaded)
  const [internalViewMode, setInternalViewMode] = useState<'cad' | 'render3d'>(defaultViewMode);
  const viewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode;
  const setViewMode = setInternalViewMode;
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showFloorPlan, setShowFloorPlan] = useState<boolean>(!compact);
  const [showFormula, setShowFormula] = useState<boolean>(!compact);
  const [isHoveringHandle, setIsHoveringHandle] = useState<boolean>(false);
  const [isDraggingHandle, setIsDraggingHandle] = useState<boolean>(false);
  const [dragDoorCoords, setDragDoorCoords] = useState<{ doorBaseY: number; doorLeafH: number } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Profile dimensions in mm & cm
  const frameThickMm = profileSize === '4 Inch' ? 50 : 40; // 5 cm or 4 cm profile
  const frameThickCm = frameThickMm / 10;
  const totalWidthCm = Math.round(widthMm / 10);
  const totalHeightCm = Math.round(heightMm / 10);

  // SVG Canvas dimensions and coordinate system
  const canvasW = 760;

  // Drawing origin & scale calculation
  const paddingX = 90;
  const paddingTop = 118;
  const drawingMaxW = 540;
  const drawingMaxH = compact ? 390 : 490;

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

  const canvasH = compact
    ? Math.max(480, Math.round(originY + svgFrameH + (showDimensions ? 75 : 35)))
    : 1000;

  // Handle Dragging Listener for interactive height adjust
  React.useEffect(() => {
    if (!isDraggingHandle || !dragDoorCoords) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current || !dragDoorCoords) return;
      const rect = svgRef.current.getBoundingClientRect();
      const svgY = ((e.clientY - rect.top) / rect.height) * canvasH;
      const { doorBaseY, doorLeafH } = dragDoorCoords;
      
      const currentMmFromBottom = (doorBaseY + doorLeafH - svgY) / scale;
      const clampedMm = Math.max(300, Math.min(1800, Math.round(currentMmFromBottom / 10) * 10));
      
      if (onHandleHeightChange) {
        onHandleHeightChange(clampedMm);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingHandle(false);
      setDragDoorCoords(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHandle, dragDoorCoords, scale, canvasH, onHandleHeightChange]);

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

  // Determine effective infill
  const resolvedInfill: DoorInfillType = doorInfillType || (
    doorPanelType?.includes('kayu') || doorPanelType?.includes('wood')
      ? 'acp_kayu_jati'
      : doorPanelType === 'acp_solid'
        ? 'acp_solid_white'
        : doorPanelType === 'jalusi_louver'
          ? 'jalusi_louver'
          : doorPanelType === 'spandrel' || doorPanelType === 'panil_horizontal'
            ? 'spandrel_alumunium'
            : doorPanelType === 'kaca_full'
              ? 'kaca'
              : 'acp_kayu_jati'
  );

  const getHandleColors = () => {
    if (handleColor === 'black') {
      return { fill: 'url(#handleGradBlack)', stroke: '#020617', highlight: '#64748B', body: '#0F172A' };
    }
    if (handleColor === 'gold') {
      return { fill: 'url(#handleGradGold)', stroke: '#78350F', highlight: '#FEF08A', body: '#D97706' };
    }
    return { fill: 'url(#handleGradStainless)', stroke: '#1E293B', highlight: '#FFFFFF', body: '#94A3B8' };
  };

  const renderDoorInfill = (px: number, py: number, pw: number, ph: number) => {
    if (resolvedInfill === 'acp_kayu_jati') {
      return (
        <g id="woodJatiInfill">
          <rect x={px} y={py} width={pw} height={ph} fill="url(#woodGrainJati)" stroke={palette.innerStroke} strokeWidth="1.5" />
          <rect x={px + 4} y={py + 4} width={pw - 8} height={ph - 8} fill="none" stroke="#5E2C0C" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
        </g>
      );
    }
    if (resolvedInfill === 'acp_kayu_walnut') {
      return (
        <g id="woodWalnutInfill">
          <rect x={px} y={py} width={pw} height={ph} fill="url(#woodGrainWalnut)" stroke={palette.innerStroke} strokeWidth="1.5" />
          <rect x={px + 4} y={py + 4} width={pw - 8} height={ph - 8} fill="none" stroke="#1F110A" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
        </g>
      );
    }
    if (resolvedInfill === 'acp_kayu_oak') {
      return (
        <g id="woodOakInfill">
          <rect x={px} y={py} width={pw} height={ph} fill="url(#woodGrainOak)" stroke={palette.innerStroke} strokeWidth="1.5" />
          <rect x={px + 4} y={py + 4} width={pw - 8} height={ph - 8} fill="none" stroke="#8C5C30" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
        </g>
      );
    }
    if (resolvedInfill === 'acp_solid_white') {
      return (
        <g id="acpWhiteInfill">
          <rect x={px} y={py} width={pw} height={ph} fill="#F8FAFC" stroke={palette.innerStroke} strokeWidth="1.5" />
          <rect x={px + 6} y={py + 6} width={pw - 12} height={ph - 12} fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
        </g>
      );
    }
    if (resolvedInfill === 'acp_solid_black') {
      return (
        <g id="acpBlackInfill">
          <rect x={px} y={py} width={pw} height={ph} fill="#1E242B" stroke={palette.innerStroke} strokeWidth="1.5" />
          <rect x={px + 6} y={py + 6} width={pw - 12} height={ph - 12} fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
        </g>
      );
    }
    if (resolvedInfill === 'acp_solid_grey') {
      return (
        <g id="acpGreyInfill">
          <rect x={px} y={py} width={pw} height={ph} fill="#475569" stroke={palette.innerStroke} strokeWidth="1.5" />
          <rect x={px + 6} y={py + 6} width={pw - 12} height={ph - 12} fill="none" stroke="#64748B" strokeWidth="1" strokeDasharray="4 4" />
        </g>
      );
    }
    if (resolvedInfill === 'acp_solid_brown') {
      return (
        <g id="acpBrownInfill">
          <rect x={px} y={py} width={pw} height={ph} fill="#451A03" stroke={palette.innerStroke} strokeWidth="1.5" />
          <rect x={px + 6} y={py + 6} width={pw - 12} height={ph - 12} fill="none" stroke="#78350F" strokeWidth="1" strokeDasharray="4 4" />
        </g>
      );
    }
    if (resolvedInfill === 'spandrel_alumunium' || doorPanelType === 'panil_horizontal') {
      return (
        <g id="spandrelInfill">
          <rect x={px} y={py} width={pw} height={ph} fill={palette.isDark ? '#2B323C' : '#F1F5F9'} stroke={palette.innerStroke} strokeWidth="1.5" />
          {Array.from({ length: 8 }).map((_, sIdx) => {
            const sh = (ph - 30) / 8;
            return (
              <g key={`spandrel-slat-${sIdx}`}>
                <rect x={px + 6} y={py + 8 + sIdx * (sh + 2)} width={pw - 12} height={sh} fill={palette.isDark ? '#333D4B' : '#FFFFFF'} stroke={palette.stroke} strokeWidth="1" />
              </g>
            );
          })}
        </g>
      );
    }
    if (resolvedInfill === 'jalusi_louver') {
      return (
        <g id="louverInfill">
          <rect x={px} y={py} width={pw} height={ph} fill={palette.isDark ? '#232931' : '#F1F5F9'} stroke={palette.innerStroke} strokeWidth="1.5" />
          {Array.from({ length: 14 }).map((_, jIdx) => {
            const jy = py + 12 + jIdx * ((ph - 24) / 14);
            return (
              <line key={`louver-blade-${jIdx}`} x1={px + 4} y1={jy} x2={px + pw - 4} y2={jy} stroke={palette.stroke} strokeWidth="2.2" />
            );
          })}
        </g>
      );
    }
    // Default / Kaca
    return (
      <g id="glassInfill">
        <rect x={px} y={py} width={pw} height={ph} fill={glassStyle.fill} fillOpacity={glassStyle.opacity} stroke={palette.innerStroke} strokeWidth="1.5" />
        <line x1={px + pw * 0.25} y1={py + ph * 0.75} x2={px + pw * 0.75} y2={py + ph * 0.25} stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      </g>
    );
  };

  const renderDoorHandle = (doorBaseX: number, doorBaseY: number, doorLeafW: number, doorLeafH: number, isPair = false) => {
    const hColors = getHandleColors();
    const handleY = doorBaseY + doorLeafH - (handleHeightMm * scale);

    // If handle is hidden / removed
    if (handlePosition === 'none') {
      return (
        <g
          key="no-handle-restore"
          className="cursor-pointer group"
          onClick={() => {
            if (onHandlePositionChange) onHandlePositionChange('kanan-kiri');
          }}
        >
          <rect
            x={doorBaseX + doorLeafW / 2 - 60}
            y={doorBaseY + doorLeafH / 2 - 14}
            width="120"
            height="28"
            rx="14"
            fill="#0F172A"
            stroke="#F59E0B"
            strokeWidth="1.5"
            opacity="0.9"
          />
          <text
            x={doorBaseX + doorLeafW / 2}
            y={doorBaseY + doorLeafH / 2 + 4}
            fill="#F8FAFC"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            + Pasang Handle
          </text>
        </g>
      );
    }

    const renderSingleHandle = (hx: number, keySuffix: string) => {
      // Inner handle geometry
      let handleGraphic = null;

      if (handleType.startsWith('pull_')) {
        let lengthMm = 800;
        if (handleType === 'pull_60') lengthMm = 600;
        else if (handleType === 'pull_100') lengthMm = 1000;
        else if (handleType === 'pull_120') lengthMm = 1200;

        const pullH = Math.min(lengthMm * scale, doorLeafH - 40);
        const topY = handleY - pullH / 2;
        const bottomY = handleY + pullH / 2;

        handleGraphic = (
          <g filter="url(#handleShadow)">
            <rect x={hx - 4} y={topY + 12} width="8" height="6" rx="1.5" fill={hColors.body} stroke={hColors.stroke} strokeWidth="0.8" />
            <rect x={hx - 4} y={bottomY - 18} width="8" height="6" rx="1.5" fill={hColors.body} stroke={hColors.stroke} strokeWidth="0.8" />
            <rect x={hx - 3.5} y={topY} width="7" height={pullH} rx="3.5" fill={hColors.fill} stroke={hColors.stroke} strokeWidth="1.2" />
            <text x={hx} y={topY - 6} fontSize="7.5" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle" fill={viewMode === 'cad' ? '#334155' : '#CBD5E1'}>
              {lengthMm / 10}cm
            </text>
          </g>
        );
      } else if (handleType === 'smart_lock') {
        const lockW = 12;
        const lockH = 46;
        handleGraphic = (
          <g filter="url(#handleShadow)">
            <rect x={hx - lockW / 2} y={handleY - lockH / 2} width={lockW} height={lockH} rx="4" fill="#090D14" stroke="#334155" strokeWidth="1.2" />
            <rect x={hx - 4} y={handleY - lockH / 2 + 5} width="8" height="14" rx="2" fill="#020617" />
            <circle cx={hx - 2} cy={handleY - lockH / 2 + 8} r="0.8" fill="#38BDF8" />
            <circle cx={hx + 2} cy={handleY - lockH / 2 + 8} r="0.8" fill="#38BDF8" />
            <circle cx={hx - 2} cy={handleY - lockH / 2 + 12} r="0.8" fill="#38BDF8" />
            <circle cx={hx + 2} cy={handleY - lockH / 2 + 12} r="0.8" fill="#38BDF8" />
            <circle cx={hx} cy={handleY - 2} r="2.5" fill="#1E293B" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x={hx - 12} y={handleY + 6} width="16" height="5" rx="1.5" fill={hColors.fill} stroke="#020617" strokeWidth="1" />
          </g>
        );
      } else if (handleType === 'flush') {
        handleGraphic = (
          <g filter="url(#handleShadow)">
            <rect x={hx - 4} y={handleY - 22} width="8" height="44" rx="2" fill={hColors.body} stroke={hColors.stroke} strokeWidth="1" />
            <rect x={hx - 2} y={handleY - 16} width="4" height="32" rx="1" fill="#020617" />
          </g>
        );
      } else if (handleType === 'knob') {
        handleGraphic = (
          <g filter="url(#handleShadow)">
            <circle cx={hx} cy={handleY} r="7" fill={hColors.body} stroke={hColors.stroke} strokeWidth="1.2" />
            <circle cx={hx} cy={handleY} r="5" fill={hColors.fill} />
            <circle cx={hx} cy={handleY} r="1.5" fill="#020617" />
          </g>
        );
      } else {
        // Default Lever
        handleGraphic = (
          <g filter="url(#handleShadow)">
            <rect x={hx - 5} y={handleY - 18} width="10" height="36" rx="3" fill={hColors.body} stroke={hColors.stroke} strokeWidth="1.2" />
            <circle cx={hx} cy={handleY - 6} r="3" fill={hColors.highlight} stroke={hColors.stroke} strokeWidth="0.8" />
            <rect x={hx - 14} y={handleY - 8} width="16" height="4.5" rx="1.5" fill={hColors.fill} stroke={hColors.stroke} strokeWidth="1" />
            <circle cx={hx} cy={handleY + 8} r="2" fill="#020617" />
          </g>
        );
      }

      return (
        <g
          key={`handle-interactive-${keySuffix}-${hx}`}
          className="cursor-ns-resize group/handle"
          onMouseEnter={() => setIsHoveringHandle(true)}
          onMouseLeave={() => setIsHoveringHandle(false)}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingHandle(true);
            setDragDoorCoords({ doorBaseY, doorLeafH });
          }}
        >
          {/* Hit area target for easier dragging */}
          <rect
            x={hx - 18}
            y={handleY - 35}
            width="36"
            height="70"
            fill="transparent"
          />

          {/* Render graphic */}
          {handleGraphic}

          {/* Drag Grip Indicator Dots on Hover */}
          <g className="opacity-0 group-hover/handle:opacity-100 transition-opacity">
            <circle cx={hx - 12} cy={handleY - 6} r="1.5" fill="#F59E0B" />
            <circle cx={hx - 12} cy={handleY} r="1.5" fill="#F59E0B" />
            <circle cx={hx - 12} cy={handleY + 6} r="1.5" fill="#F59E0B" />
          </g>

          {/* Trash / Delete Handle Button attached right next to handle */}
          <g
            className="opacity-80 hover:opacity-100 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onRemoveHandle) {
                onRemoveHandle();
              } else if (onHandlePositionChange) {
                onHandlePositionChange('none');
              }
            }}
          >
            <circle cx={hx + 18} cy={handleY} r="8" fill="#EF4444" stroke="#7F1D1D" strokeWidth="1" />
            <line x1={hx + 15} y1={handleY - 3} x2={hx + 21} y2={handleY + 3} stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
            <line x1={hx + 21} y1={handleY - 3} x2={hx + 15} y2={handleY + 3} stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </g>
      );
    };

    // Determine handle positions array [hx1, hx2] based on single vs double door and selected position
    const isDoubleDoor = isPair || (mullionVerticalCount >= 1 && type.includes('pintu')) || ['kiri-kiri', 'kiri-kanan', 'kanan-kiri', 'kanan-kanan', 'center_pair'].includes(handlePosition);

    let handleXPositions: number[] = [];

    if (isDoubleDoor) {
      const halfW = doorLeafW / 2;
      const leaf1LeftX = doorBaseX + frameThickPx + 18;
      const leaf1RightX = doorBaseX + halfW - 18;
      const leaf2LeftX = doorBaseX + halfW + 18;
      const leaf2RightX = doorBaseX + doorLeafW - frameThickPx - 18;

      if (handlePosition === 'kiri-kiri') {
        handleXPositions = [leaf1LeftX, leaf2LeftX];
      } else if (handlePosition === 'kiri-kanan') {
        handleXPositions = [leaf1LeftX, leaf2RightX];
      } else if (handlePosition === 'kanan-kanan') {
        handleXPositions = [leaf1RightX, leaf2RightX];
      } else {
        // Default 'kanan-kiri' or 'center_pair' (Meeting stile center)
        handleXPositions = [leaf1RightX, leaf2LeftX];
      }
    } else {
      // Single leaf door
      if (handlePosition === 'left' || handlePosition === 'kiri-kiri' || handlePosition === 'kiri-kanan') {
        handleXPositions = [doorBaseX + frameThickPx + 22];
      } else {
        // Right or default
        handleXPositions = [doorBaseX + doorLeafW - frameThickPx - 22];
      }
    }

    return (
      <g key={`door-handles-group-${doorBaseX}`}>
        {/* Height Guide Line when hovering or dragging */}
        {(isHoveringHandle || isDraggingHandle) && (
          <g>
            <line
              x1={doorBaseX}
              y1={handleY}
              x2={doorBaseX + doorLeafW}
              y2={handleY}
              stroke="#F59E0B"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <rect
              x={doorBaseX + doorLeafW / 2 - 85}
              y={handleY - 22}
              width="170"
              height="18"
              rx="4"
              fill="#0F172A"
              stroke="#F59E0B"
              strokeWidth="1"
            />
            <text
              x={doorBaseX + doorLeafW / 2}
              y={handleY - 9}
              fill="#F59E0B"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              📏 Tinggi: {Math.round(handleHeightMm / 10)} cm ({handleHeightMm} mm)
            </text>
          </g>
        )}

        {/* Render each calculated handle */}
        {handleXPositions.map((hx, idx) => renderSingleHandle(hx, `leaf-${idx}`))}
      </g>
    );
  };

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${className}`}>
      
      {/* Top Interactive Controls Toolbar */}
      {!hideToolbar && (
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
      )}

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

            {/* Stainless Handle Gradient */}
            <linearGradient id="handleGradStainless" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="30%" stopColor="#F8FAFC" />
              <stop offset="70%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Black Handle Gradient */}
            <linearGradient id="handleGradBlack" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="35%" stopColor="#334155" />
              <stop offset="75%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Gold Handle Gradient */}
            <linearGradient id="handleGradGold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#B45309" />
              <stop offset="35%" stopColor="#FDE68A" />
              <stop offset="75%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>

            {/* Drop Shadow for Handles */}
            <filter id="handleShadow" x="-30%" y="-20%" width="160%" height="140%">
              <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="rgba(0,0,0,0.5)" />
            </filter>

            {/* Door Panel Bevel Filter */}
            <filter id="panelBevel" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor={palette.shadow} />
            </filter>

            {/* --- WOOD GRAIN PATTERNS (HIGH FIDELITY) --- */}
            {/* 1. Jati (Warm Teak Wood) */}
            <pattern id="woodGrainJati" width="90" height="240" patternUnits="userSpaceOnUse">
              <rect width="90" height="240" fill="#9C5221" />
              {/* Wood Plank Shading */}
              <rect x="0" y="0" width="88" height="240" fill="#A85D2A" />
              <line x1="89" y1="0" x2="89" y2="240" stroke="#5E2C0C" strokeWidth="1.5" opacity="0.6" />
              {/* Organic Wood Grain Lines */}
              <path d="M 12 0 Q 18 60 14 120 T 16 240" fill="none" stroke="#783811" strokeWidth="1.2" opacity="0.65" />
              <path d="M 32 0 Q 25 70 34 140 T 30 240" fill="none" stroke="#662F0D" strokeWidth="1.5" opacity="0.7" />
              <path d="M 50 0 Q 56 40 48 90 T 54 180 T 49 240" fill="none" stroke="#854015" strokeWidth="1.2" opacity="0.5" />
              <path d="M 72 0 Q 64 80 75 160 T 68 240" fill="none" stroke="#662F0D" strokeWidth="1.3" opacity="0.6" />
              {/* Wood Knot */}
              <ellipse cx="32" cy="110" rx="6" ry="16" fill="none" stroke="#5E2C0C" strokeWidth="1.2" opacity="0.75" />
              <ellipse cx="32" cy="110" rx="3" ry="8" fill="#5E2C0C" opacity="0.5" />
            </pattern>

            {/* 2. Walnut (Dark Chocolate Wood) */}
            <pattern id="woodGrainWalnut" width="90" height="240" patternUnits="userSpaceOnUse">
              <rect width="90" height="240" fill="#382115" />
              <rect x="0" y="0" width="88" height="240" fill="#44291B" />
              <line x1="89" y1="0" x2="89" y2="240" stroke="#1F110A" strokeWidth="1.5" opacity="0.7" />
              <path d="M 15 0 Q 22 80 16 150 T 20 240" fill="none" stroke="#26140B" strokeWidth="1.5" opacity="0.8" />
              <path d="M 38 0 Q 30 60 40 130 T 36 240" fill="none" stroke="#5C3825" strokeWidth="1.2" opacity="0.6" />
              <path d="M 62 0 Q 70 90 58 170 T 65 240" fill="none" stroke="#26140B" strokeWidth="1.6" opacity="0.8" />
              <ellipse cx="60" cy="140" rx="5" ry="14" fill="none" stroke="#1F110A" strokeWidth="1.2" opacity="0.8" />
            </pattern>

            {/* 3. Oak (Natural Blonde Honey Oak) */}
            <pattern id="woodGrainOak" width="90" height="240" patternUnits="userSpaceOnUse">
              <rect width="90" height="240" fill="#C9945F" />
              <rect x="0" y="0" width="88" height="240" fill="#D4A373" />
              <line x1="89" y1="0" x2="89" y2="240" stroke="#8C5C30" strokeWidth="1.5" opacity="0.6" />
              <path d="M 16 0 Q 12 70 20 140 T 15 240" fill="none" stroke="#A77241" strokeWidth="1.3" opacity="0.7" />
              <path d="M 44 0 Q 50 60 42 120 T 48 240" fill="none" stroke="#8C5C30" strokeWidth="1.5" opacity="0.65" />
              <path d="M 70 0 Q 62 90 74 160 T 68 240" fill="none" stroke="#A77241" strokeWidth="1.3" opacity="0.7" />
            </pattern>
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

          {/* TOP ARCHITECTURAL TITLE BOX */}
          <g id="drawingTitleBox">
            {/* Header Outer Container */}
            <rect
              x="20"
              y="16"
              width={canvasW - 40}
              height="50"
              fill={viewMode === 'cad' ? '#FFFFFF' : '#141A23'}
              stroke="#1E293B"
              strokeWidth="1.5"
              rx="4"
            />
            {/* Left Accent Stripe */}
            <rect
              x="20"
              y="16"
              width="5"
              height="50"
              fill="#F59E0B"
              rx="2"
            />

            {/* Line 1: Unit Name / Title */}
            <text
              x="36"
              y="36"
              fontSize="13"
              fontFamily="sans-serif"
              fontWeight="800"
              fill={viewMode === 'cad' ? '#0F172A' : '#F8FAFC'}
              letterSpacing="0.4"
            >
              {title.toUpperCase()}
            </text>

            {/* Line 2: Specification & Profile Details (Neatly separated sub-line) */}
            <text
              x="36"
              y="54"
              fontSize="10"
              fontFamily="sans-serif"
              fontWeight="600"
              fill={viewMode === 'cad' ? '#475569' : '#94A3B8'}
            >
              PROFIL: {brand.toUpperCase()} {profileSize} &nbsp;•&nbsp; WARNA: {color.split(' ')[0].toUpperCase()} &nbsp;•&nbsp; KACA: {glassType.toUpperCase()}
            </text>

            {/* Right Side Dimension Info Badge */}
            <text
              x={canvasW - 32}
              y="36"
              fontSize="11.5"
              fontFamily="monospace"
              fontWeight="700"
              textAnchor="end"
              fill={viewMode === 'cad' ? '#0F172A' : '#F8FAFC'}
            >
              {totalWidthCm} x {totalHeightCm} CM
            </text>
            <text
              x={canvasW - 32}
              y="54"
              fontSize="9.5"
              fontFamily="monospace"
              fontWeight="500"
              textAnchor="end"
              fill={viewMode === 'cad' ? '#64748B' : '#94A3B8'}
            >
              ({widthMm} x {heightMm} mm)
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

                {/* Door Inner Infill Panel (ACP Motif Kayu, Solid, Spandrel, Louver, or Glass) */}
                {renderDoorInfill(
                  originX + frameThickPx + 14,
                  originY + frameThickPx + 14,
                  doorW - 2 * frameThickPx - 28,
                  doorH - 2 * frameThickPx - 20
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

                {/* Configured Door Handle */}
                {renderDoorHandle(originX, originY, doorW, doorH)}

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

                {/* Window Leaves Rendering (Casement Buka-Tutup vs Kaca Mati) */}
                {Array.from({ length: windowCount }).map((_, wIdx) => {
                  const leafW = (winAreaW - (windowCount + 1) * frameThickPx) / windowCount;
                  const lx = originX + doorW + frameThickPx + wIdx * (leafW + frameThickPx);
                  const ly = originY + frameThickPx;
                  const lh = winAreaH - 2 * frameThickPx;

                  const leafType = windowLeaves?.[wIdx] ?? 'open';
                  const isOpen = leafType === 'open';

                  return (
                    <g key={`win-leaf-${wIdx}`}>
                      {/* Window Sash Frame (only for opening casement leaf) */}
                      {isOpen ? (
                        <rect
                          x={lx}
                          y={ly}
                          width={leafW}
                          height={lh}
                          fill={viewMode === 'render3d' ? 'url(#frameGrad)' : palette.frameFill}
                          stroke={palette.innerStroke}
                          strokeWidth="2"
                        />
                      ) : null}

                      {/* Glass Panel */}
                      <rect
                        x={isOpen ? lx + frameThickPx * 0.7 : lx}
                        y={isOpen ? ly + frameThickPx * 0.7 : ly}
                        width={isOpen ? leafW - 1.4 * frameThickPx : leafW}
                        height={isOpen ? lh - 1.4 * frameThickPx : lh}
                        fill={glassStyle.fill}
                        fillOpacity={glassStyle.opacity}
                        stroke={palette.stroke}
                        strokeWidth="1.2"
                      />

                      {/* Opening Swing Lines & Hardware for Buka-Tutup leaf */}
                      {isOpen ? (
                        <>
                          {/* Triangular Swing Lines */}
                          <polygon
                            points={`${lx + leafW / 2},${ly + 6} ${lx + 8},${ly + lh - 8} ${lx + leafW - 8},${ly + lh - 8}`}
                            fill="none"
                            stroke="#64748B"
                            strokeWidth="1"
                            strokeDasharray="5 4"
                          />
                          {/* Rambuncis / Lock Handle */}
                          <rect
                            x={lx + leafW - 12}
                            y={ly + lh / 2 - 10}
                            width="5"
                            height="20"
                            rx="1.5"
                            fill="#CBD5E1"
                            stroke="#1E293B"
                            strokeWidth="0.8"
                          />
                        </>
                      ) : (
                        /* Fixed Glass "KACA MATI" CAD Indicator */
                        <g>
                          {viewMode === 'cad' && (
                            <text
                              x={lx + leafW / 2}
                              y={ly + lh / 2}
                              fontSize="8.5"
                              fontFamily="sans-serif"
                              fontWeight="bold"
                              fill="#94A3B8"
                              textAnchor="middle"
                            >
                              KACA MATI
                            </text>
                          )}
                        </g>
                      )}

                      {/* Glass Light Reflection Glare */}
                      {glassStyle.glare && (
                        <g stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round">
                          <line
                            x1={lx + leafW * 0.3}
                            y1={ly + lh * 0.7}
                            x2={lx + leafW * 0.75}
                            y2={ly + lh * 0.25}
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
                    const leafType = windowLeaves?.[vIdx] ?? 'open';
                    const isOpenWindow = leafType === 'open';

                    return (
                      <g key={`pnl-${hIdx}-${vIdx}`}>
                        {/* Panel Background (Glass or Door Infill) */}
                        {isDoorLeaf ? (
                          renderDoorInfill(px, py, pw, ph)
                        ) : (
                          <g>
                            {/* Glass Panel */}
                            <rect
                              x={isOpenWindow && type === 'kusen_jendela_casement' ? px + 4 : px}
                              y={isOpenWindow && type === 'kusen_jendela_casement' ? py + 4 : py}
                              width={isOpenWindow && type === 'kusen_jendela_casement' ? pw - 8 : pw}
                              height={isOpenWindow && type === 'kusen_jendela_casement' ? ph - 8 : ph}
                              fill={glassStyle.fill}
                              fillOpacity={glassStyle.opacity}
                              stroke={palette.innerStroke}
                              strokeWidth="1.5"
                            />
                            {/* Casement Inner Sash Frame for Buka-Tutup */}
                            {type === 'kusen_jendela_casement' && (
                              <>
                                {isOpenWindow ? (
                                  <>
                                    <rect
                                      x={px + 4}
                                      y={py + 4}
                                      width={pw - 8}
                                      height={ph - 8}
                                      fill="none"
                                      stroke={palette.stroke}
                                      strokeWidth="1.8"
                                    />
                                    <polygon
                                      points={`${px + pw / 2},${py + 10} ${px + 10},${py + ph - 10} ${px + pw - 10},${py + ph - 10}`}
                                      fill="none"
                                      stroke="#64748B"
                                      strokeWidth="1"
                                      strokeDasharray="4 3"
                                    />
                                    <rect
                                      x={px + pw - 12}
                                      y={py + ph / 2 - 8}
                                      width="4"
                                      height="16"
                                      rx="1"
                                      fill="#CBD5E1"
                                      stroke="#1E293B"
                                      strokeWidth="0.8"
                                    />
                                  </>
                                ) : (
                                  viewMode === 'cad' && (
                                    <text
                                      x={px + pw / 2}
                                      y={py + ph / 2}
                                      fontSize="8"
                                      fontFamily="sans-serif"
                                      fontWeight="bold"
                                      fill="#94A3B8"
                                      textAnchor="middle"
                                    >
                                      KACA MATI
                                    </text>
                                  )
                                )}
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

                        {/* Door Swing Dashed Lines & Configured Handle */}
                        {isDoorLeaf && (
                          <>
                            <g stroke="#64748B" strokeWidth="1" strokeDasharray="5 4" fill="none">
                              <line x1={px} y1={py + 10} x2={px + pw} y2={py + ph / 2} />
                              <line x1={px} y1={py + ph - 10} x2={px + pw} y2={py + ph / 2} />
                            </g>
                            {/* Render Configured Handle on this Door Leaf */}
                            {renderDoorHandle(px, py, pw, ph, vertPanels > 1 && vIdx === 0 && handlePosition === 'center_pair')}
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
      {!hideFooter && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-950 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
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
      )}
    </div>
  );
};
