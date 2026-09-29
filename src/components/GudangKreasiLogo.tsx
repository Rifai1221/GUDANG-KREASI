import React from 'react';
import logoImg from '../assets/images/gudang_kreasi_logo_1790699886667.jpg';

interface GudangKreasiLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const GudangKreasiLogo: React.FC<GudangKreasiLogoProps> = ({
  className = '',
  size = 40,
  showText = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className="rounded-full overflow-hidden flex items-center justify-center bg-white shadow-sm ring-1 ring-slate-700/20 shrink-0"
        style={{ width: size, height: size }}
      >
        <img
          src={logoImg}
          alt="Gudang Kreasi Garasi Alumunium"
          className="w-full h-full object-contain p-0.5"
          onError={(e) => {
            // SVG fallback if image fails
            const target = e.currentTarget;
            target.style.display = 'none';
          }}
        />
      </div>

      {showText && (
        <div className="leading-tight">
          <div className="font-extrabold text-slate-100 text-sm tracking-wide">
            GUDANG KREASI
          </div>
          <div className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">
            GARASI ALUMUNIUM
          </div>
        </div>
      )}
    </div>
  );
};
