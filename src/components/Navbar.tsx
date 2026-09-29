import React, { useState } from 'react';
import {
  Calculator,
  FolderKanban,
  Tag,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  User as UserIcon,
  ChevronDown,
} from 'lucide-react';
import { InventoryItem } from '../types';

interface NavbarProps {
  activeTab: 'calculator' | 'projects' | 'timeline' | 'catalog' | 'inventory';
  setActiveTab: (tab: 'calculator' | 'projects' | 'timeline' | 'catalog' | 'inventory') => void;
  user: { uid: string; email?: string | null; displayName?: string | null } | null;
  onLogin: () => void;
  onLogout: () => void;
  isOnline: boolean;
  lowStockItems?: InventoryItem[];
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogin,
  onLogout,
  isOnline,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navItems = [
    { id: 'calculator', label: 'Kalkulator RAB', icon: Calculator },
    { id: 'projects', label: 'Proyek & RAB', icon: FolderKanban },
    { id: 'catalog', label: 'Katalog & Harga', icon: Tag },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('calculator')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-amber-500/20">
              G
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 leading-tight tracking-tight flex items-center gap-1.5">
                GudangKreasi <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">v2.5</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Kalkulator RAB & Manajemen Alumunium</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 relative ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Cloud Sync Status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                user && isOnline
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700'
              }`}
              title={user && isOnline ? 'Tersinkronisasi dengan Firebase Cloud' : 'Mode Lokal (Tersimpan di Perangkat)'}
            >
              {user && isOnline ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Cloud Sync</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lokal (Offline)</span>
                </>
              )}
            </div>

            {/* User Auth Profile Button */}
            <div className="relative">
              {user ? (
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  <UserIcon className="w-4 h-4 text-amber-400" />
                  <span className="max-w-[100px] truncate hidden sm:inline">{user.displayName || user.email?.split('@')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ) : (
                <button
                  onClick={onLogin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login Cloud</span>
                </button>
              )}

              {/* User Dropdown */}
              {showUserDropdown && user && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 text-slate-100">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-xs font-bold text-slate-200">{user.displayName || 'Pengguna Cloud'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar Bottom Scroll */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-2 border-t border-slate-800 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  isActive ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
