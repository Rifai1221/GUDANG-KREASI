import React from 'react';
import { FrameItem } from '../types';

interface FrameShopDrawingSvgProps {
  item: FrameItem;
  itemNumber: number;
}

export const FrameShopDrawingSvg: React.FC<FrameShopDrawingSvgProps> = ({
  item,
  itemNumber,
}) => {
  const {
    type,
    widthMm,
    heightMm,
    mullionVerticalCount = 0,
    mullionHorizontalCount = 0,
    profileSize = '4 Inch',
    brand = 'Alexindo',
    color = 'White (Putih)',
    glassType = 'Polos 5mm',
    hasTopBoven = false,
    topBovenHeightMm = 140,
    doorPanelType = 'panil_horizontal',
    doorWidthMm = 900,
    windowCount = 2,
    windowHeightMm = 1350,
  } = item;

  const canvasW = 540;
  const canvasH = 400;

  const padLeft = 70;
  const padRight = 30;
  const padTop = 45;
  const padBottom = 55;

  const maxDrawW = canvasW - padLeft - padRight; // 440
  const maxDrawH = canvasH - padTop - padBottom; // 300

  const scale = Math.min(maxDrawW / (widthMm || 1000), maxDrawH / (heightMm || 1000));
  const svgW = widthMm * scale;
  const svgH = heightMm * scale;

  const originX = padLeft + (maxDrawW - svgW) / 2;
  const originY = padTop + (maxDrawH - svgH) / 2;

  const profileThickPx = profileSize === '4 Inch' ? Math.max(5, 50 * scale) : Math.max(4, 40 * scale);
  const frameFill = '#F8FAFC';
  const strokeColor = '#0F172A';
  const glassFill = glassType.includes('Riband')
    ? 'rgba(30, 41, 59, 0.25)'
    : glassType.includes('Tempered')
    ? 'rgba(13, 148, 136, 0.18)'
    : 'rgba(56, 189, 248, 0.15)';

  const effectiveDoorWidthMm =
    type === 'kusen_pintu_jendela_gabungan'
      ? Math.min(doorWidthMm || 900, widthMm - 400)
      : type.includes('pintu')
      ? widthMm
      : 0;
  const effectiveDoorWidthPx = effectiveDoorWidthMm * scale;

  const topBovenPx = (hasTopBoven ? topBovenHeightMm : 0) * scale;
  const doorHeightPx = svgH - topBovenPx;

  return (
    <svg
      viewBox={`0 0 ${canvasW} ${canvasH}`}
      className="w-full h-auto max-h-64 object-contain bg-white select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background CAD Grid pattern (Subtle) */}
      <defs>
        <pattern id={`cadGrid-${item.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F1F5F9" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={canvasW} height={canvasH} fill={`url(#cadGrid-${item.id})`} />

      {/* Frame Outer Border (Kusen Luar) */}
      <rect
        x={originX}
        y={originY}
        width={svgW}
        height={svgH}
        fill={frameFill}
        stroke={strokeColor}
        strokeWidth="2"
      />

      {/* ========================================================================= */}
      {/* 1. TIPE: PINTU + JENDELA GABUNGAN */}
      {/* ========================================================================= */}
      {type === 'kusen_pintu_jendela_gabungan' && (
        <g>
          {/* Top Boven / Ventilator */}
          {hasTopBoven && (
            <g>
              <rect
                x={originX + profileThickPx}
                y={originY + profileThickPx}
                width={svgW - profileThickPx * 2}
                height={topBovenPx - profileThickPx}
                fill={glassFill}
                stroke={strokeColor}
                strokeWidth="1.2"
              />
              <text
                x={originX + svgW / 2}
                y={originY + topBovenPx / 2 + 3}
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
                fill="#475569"
                textAnchor="middle"
              >
                BOVEN {topBovenHeightMm} mm
              </text>
              <line
                x1={originX}
                y1={originY + topBovenPx}
                x2={originX + svgW}
                y2={originY + topBovenPx}
                stroke={strokeColor}
                strokeWidth="2"
              />
            </g>
          )}

          {/* Door Section (Left) */}
          <g transform={`translate(${originX}, ${originY + topBovenPx})`}>
            {/* Door Frame Inner */}
            <rect
              x={profileThickPx}
              y={0}
              width={effectiveDoorWidthPx - profileThickPx}
              height={doorHeightPx}
              fill="#FFFFFF"
              stroke={strokeColor}
              strokeWidth="1.5"
            />
            {/* Door Leaf (Daun Pintu) */}
            <rect
              x={profileThickPx + 3}
              y={3}
              width={effectiveDoorWidthPx - profileThickPx - 6}
              height={doorHeightPx - 6}
              fill={doorPanelType === 'panil_horizontal' || doorPanelType === 'acp_solid' ? '#F1F5F9' : glassFill}
              stroke={strokeColor}
              strokeWidth="1.5"
            />

            {/* Horizontal Slats if Panil */}
            {(doorPanelType === 'panil_horizontal' || doorPanelType === 'jalusi_louver') && (
              <g stroke="#94A3B8" strokeWidth="1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <line
                    key={i}
                    x1={profileThickPx + 6}
                    y1={15 + i * ((doorHeightPx - 30) / 8)}
                    x2={effectiveDoorWidthPx - 6}
                    y2={15 + i * ((doorHeightPx - 30) / 8)}
                  />
                ))}
              </g>
            )}

            {/* Swing lines (Bukaan Pintu) */}
            <path
              d={`M ${profileThickPx + 3} 3 L ${effectiveDoorWidthPx - 3} ${doorHeightPx / 2} L ${profileThickPx + 3} ${doorHeightPx - 3}`}
              fill="none"
              stroke="#0284C7"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />

            {/* Handle */}
            <rect
              x={effectiveDoorWidthPx - 14}
              y={doorHeightPx / 2 - 12}
              width="4"
              height="24"
              rx="2"
              fill="#0F172A"
            />
          </g>

          {/* Dividing Tiang Kusen Tengah */}
          <line
            x1={originX + effectiveDoorWidthPx}
            y1={originY + topBovenPx}
            x2={originX + effectiveDoorWidthPx}
            y2={originY + svgH}
            stroke={strokeColor}
            strokeWidth="2.5"
          />

          {/* Window Section (Right) */}
          <g transform={`translate(${originX + effectiveDoorWidthPx}, ${originY + topBovenPx})`}>
            {/* Window Area */}
            {Array.from({ length: windowCount }).map((_, wIdx) => {
              const winAreaW = svgW - effectiveDoorWidthPx;
              const singleW = (winAreaW - profileThickPx * (windowCount + 1)) / windowCount;
              const wx = profileThickPx + wIdx * (singleW + profileThickPx);
              return (
                <g key={wIdx}>
                  <rect
                    x={wx}
                    y={profileThickPx}
                    width={singleW}
                    height={doorHeightPx - profileThickPx * 2}
                    fill={glassFill}
                    stroke={strokeColor}
                    strokeWidth="1.2"
                  />
                  {/* Casement Swing Indicator */}
                  <path
                    d={`M ${wx} ${profileThickPx} L ${wx + singleW} ${(doorHeightPx - profileThickPx * 2) / 2 + profileThickPx} L ${wx} ${doorHeightPx - profileThickPx}`}
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                </g>
              );
            })}
          </g>
        </g>
      )}

      {/* ========================================================================= */}
      {/* 2. TIPE: PINTU SWING TUNGGAL / GANDA / LIPAT */}
      {/* ========================================================================= */}
      {(type === 'kusen_pintu_swing' || type === 'kusen_pintu_sliding' || type === 'kusen_pintu_lipat') && (
        <g>
          {/* Daun Pintu */}
          <rect
            x={originX + profileThickPx + 3}
            y={originY + profileThickPx + 3}
            width={svgW - profileThickPx * 2 - 6}
            height={svgH - profileThickPx * 2 - 6}
            fill={doorPanelType === 'panil_horizontal' || doorPanelType === 'acp_solid' ? '#F1F5F9' : glassFill}
            stroke={strokeColor}
            strokeWidth="1.5"
          />

          {/* Panil Slats */}
          {(doorPanelType === 'panil_horizontal' || doorPanelType === 'jalusi_louver') && (
            <g stroke="#94A3B8" strokeWidth="1">
              {Array.from({ length: 9 }).map((_, i) => (
                <line
                  key={i}
                  x1={originX + profileThickPx + 8}
                  y1={originY + 25 + i * ((svgH - 50) / 9)}
                  x2={originX + svgW - profileThickPx - 8}
                  y2={originY + 25 + i * ((svgH - 50) / 9)}
                />
              ))}
            </g>
          )}

          {/* Swing / Sliding Indicator */}
          {type === 'kusen_pintu_sliding' ? (
            <g stroke="#0284C7" strokeWidth="1.5" fill="#0284C7">
              <line x1={originX + svgW / 2 - 25} y1={originY + svgH / 2} x2={originX + svgW / 2 + 25} y2={originY + svgH / 2} />
              <polygon points={`${originX + svgW / 2 + 30},${originY + svgH / 2} ${originX + svgW / 2 + 20},${originY + svgH / 2 - 5} ${originX + svgW / 2 + 20},${originY + svgH / 2 + 5}`} />
            </g>
          ) : (
            <path
              d={`M ${originX + profileThickPx + 3} ${originY + profileThickPx + 3} L ${originX + svgW - profileThickPx - 3} ${originY + svgH / 2} L ${originX + profileThickPx + 3} ${originY + svgH - profileThickPx - 3}`}
              fill="none"
              stroke="#0284C7"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
          )}

          {/* Handle */}
          <rect
            x={originX + svgW - profileThickPx - 16}
            y={originY + svgH / 2 - 14}
            width="4"
            height="28"
            rx="2"
            fill="#0F172A"
          />
        </g>
      )}

      {/* ========================================================================= */}
      {/* 3. TIPE: JENDELA CASEMENT / SLIDING / MATI / BOVEN */}
      {/* ========================================================================= */}
      {!type.includes('pintu') && type !== 'kusen_pintu_jendela_gabungan' && (
        <g>
          {/* Boven Atas if enabled */}
          {hasTopBoven && (
            <g>
              <rect
                x={originX + profileThickPx}
                y={originY + profileThickPx}
                width={svgW - profileThickPx * 2}
                height={topBovenPx - profileThickPx}
                fill={glassFill}
                stroke={strokeColor}
                strokeWidth="1.2"
              />
              <line
                x1={originX}
                y1={originY + topBovenPx}
                x2={originX + svgW}
                y2={originY + topBovenPx}
                stroke={strokeColor}
                strokeWidth="2"
              />
            </g>
          )}

          {/* Windows / Glass panels */}
          {(() => {
            const columns = mullionVerticalCount + 1;
            const rows = mullionHorizontalCount + 1;
            const startY = originY + topBovenPx + profileThickPx;
            const totalGlassH = svgH - topBovenPx - profileThickPx * 2 - (rows - 1) * profileThickPx;
            const cellH = totalGlassH / rows;

            const totalGlassW = svgW - profileThickPx * 2 - (columns - 1) * profileThickPx;
            const cellW = totalGlassW / columns;

            const panels = [];
            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < columns; c++) {
                const px = originX + profileThickPx + c * (cellW + profileThickPx);
                const py = startY + r * (cellH + profileThickPx);

                panels.push(
                  <g key={`${r}-${c}`}>
                    <rect
                      x={px}
                      y={py}
                      width={cellW}
                      height={cellH}
                      fill={glassFill}
                      stroke={strokeColor}
                      strokeWidth="1.2"
                    />
                    {/* Swing Indicator for Casement / Jungkit */}
                    {type === 'kusen_jendela_casement' && (
                      <path
                        d={`M ${px} ${py} L ${px + cellW} ${py + cellH / 2} L ${px} ${py + cellH}`}
                        fill="none"
                        stroke="#D97706"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                    )}
                    {type === 'boven_ventilasi' && (
                      <g stroke="#94A3B8" strokeWidth="1">
                        <line x1={px + 4} y1={py + cellH * 0.33} x2={px + cellW - 4} y2={py + cellH * 0.33} />
                        <line x1={px + 4} y1={py + cellH * 0.66} x2={px + cellW - 4} y2={py + cellH * 0.66} />
                      </g>
                    )}
                    {type === 'kusen_jendela_sliding' && (
                      <g stroke="#0284C7" strokeWidth="1.2">
                        <line x1={px + cellW / 2 - 12} y1={py + cellH / 2} x2={px + cellW / 2 + 12} y2={py + cellH / 2} />
                        <polygon
                          points={`${px + cellW / 2 + 14},${py + cellH / 2} ${px + cellW / 2 + 8},${py + cellH / 2 - 3} ${px + cellW / 2 + 8},${py + cellH / 2 + 3}`}
                          fill="#0284C7"
                        />
                      </g>
                    )}
                  </g>
                );
              }
            }
            return panels;
          })()}
        </g>
      )}

      {/* ========================================================================= */}
      {/* DIMENSION ANNOTATIONS (TOP & LEFT) */}
      {/* ========================================================================= */}
      {/* Top Width Dimension */}
      <g stroke="#0F172A" strokeWidth="1" fill="#0F172A">
        <line x1={originX} y1={originY - 14} x2={originX + svgW} y2={originY - 14} />
        {/* End ticks */}
        <line x1={originX} y1={originY - 18} x2={originX} y2={originY - 10} strokeWidth="1.5" />
        <line x1={originX + svgW} y1={originY - 18} x2={originX + svgW} y2={originY - 10} strokeWidth="1.5" />
        {/* Extension guide lines */}
        <line x1={originX} y1={originY - 14} x2={originX} y2={originY} stroke="#CBD5E1" strokeWidth="0.8" />
        <line x1={originX + svgW} y1={originY - 14} x2={originX + svgW} y2={originY} stroke="#CBD5E1" strokeWidth="0.8" />
        {/* Text */}
        <text
          x={originX + svgW / 2}
          y={originY - 20}
          fontSize="11"
          fontWeight="bold"
          fontFamily="monospace"
          textAnchor="middle"
          stroke="none"
          fill="#0F172A"
        >
          L = {widthMm} mm ({Math.round(widthMm / 10)} cm)
        </text>
      </g>

      {/* Left Height Dimension */}
      <g stroke="#0F172A" strokeWidth="1" fill="#0F172A">
        <line x1={originX - 18} y1={originY} x2={originX - 18} y2={originY + svgH} />
        {/* End ticks */}
        <line x1={originX - 22} y1={originY} x2={originX - 14} y2={originY} strokeWidth="1.5" />
        <line x1={originX - 22} y1={originY + svgH} x2={originX - 14} y2={originY + svgH} strokeWidth="1.5" />
        {/* Extension guide lines */}
        <line x1={originX - 18} y1={originY} x2={originX} y2={originY} stroke="#CBD5E1" strokeWidth="0.8" />
        <line x1={originX - 18} y1={originY + svgH} x2={originX} y2={originY + svgH} stroke="#CBD5E1" strokeWidth="0.8" />
        {/* Rotated Text */}
        <text
          x={originX - 26}
          y={originY + svgH / 2}
          fontSize="11"
          fontWeight="bold"
          fontFamily="monospace"
          textAnchor="middle"
          stroke="none"
          fill="#0F172A"
          transform={`rotate(-90, ${originX - 26}, ${originY + svgH / 2})`}
        >
          T = {heightMm} mm ({Math.round(heightMm / 10)} cm)
        </text>
      </g>

      {/* ========================================================================= */}
      {/* BOTTOM TITLE BLOCK NOTATION */}
      {/* ========================================================================= */}
      <g transform={`translate(${originX}, ${canvasH - 32})`}>
        <rect
          x="0"
          y="0"
          width={svgW}
          height="24"
          fill="#F8FAFC"
          stroke="#CBD5E1"
          strokeWidth="1"
          rx="3"
        />
        <text
          x="8"
          y="15"
          fontSize="9"
          fontWeight="bold"
          fontFamily="sans-serif"
          fill="#1E293B"
        >
          ITEM #{itemNumber}: {item.name}
        </text>
        <text
          x={svgW - 8}
          y="15"
          fontSize="9"
          fontFamily="monospace"
          fontWeight="bold"
          fill="#0D9488"
          textAnchor="end"
        >
          VOL: {item.quantity} UNIT
        </text>
      </g>
    </svg>
  );
};
