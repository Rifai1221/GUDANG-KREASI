import React, { useState, useEffect } from 'react';
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
  MapPin,
  Edit3,
  X,
  Check,
  Building2,
  Phone,
} from 'lucide-react';
import { InventoryItem } from '../types';
import { GudangKreasiLogo } from './GudangKreasiLogo';
import {
  getLocalShopProfile,
  saveLocalShopProfile,
  ShopProfile,
  DEFAULT_SHOP_PROFILE,
} from '../services/storageService';

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
  const [shopProfile, setShopProfile] = useState<ShopProfile>(getLocalShopProfile());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    const handleProfileUpdate = (e: CustomEvent<ShopProfile>) => {
      setShopProfile(e.detail);
    };
    window.addEventListener('shop-profile-updated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('shop-profile-updated', handleProfileUpdate as EventListener);
    };
  }, []);

  const openEditModal = () => {
    setEditName(shopProfile.name);
    setEditAddress(shopProfile.address);
    setEditPhone(shopProfile.phone || '');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ShopProfile = {
      ...shopProfile,
      name: editName.trim() || DEFAULT_SHOP_PROFILE.name,
      address: editAddress.trim() || DEFAULT_SHOP_PROFILE.address,
      phone: editPhone.trim() || DEFAULT_SHOP_PROFILE.phone,
    };
    saveLocalShopProfile(updated);
    setShopProfile(updated);
    setIsEditModalOpen(false);
  };

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
          <div className="flex items-center gap-3">
            <div className="cursor-pointer" onClick={() => setActiveTab('calculator')}>
              <GudangKreasiLogo size={42} className="shrink-0 drop-shadow-md" />
            </div>
            <div>
              <div
                className="cursor-pointer flex items-center gap-1.5"
                onClick={() => setActiveTab('calculator')}
              >
                <h1 className="text-lg font-bold text-slate-100 leading-tight tracking-tight flex items-center gap-1.5">
                  Gudang Kreasi <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Garasi Alumunium</span>
                </h1>
              </div>
              <p
                onClick={openEditModal}
                className="text-[11px] text-slate-300 font-medium hidden sm:flex items-center gap-1 hover:text-amber-300 transition cursor-pointer group max-w-[280px] md:max-w-[380px] lg:max-w-[460px] truncate"
                title="Klik untuk mengubah alamat toko & profil"
              >
                <MapPin className="w-3 h-3 text-amber-400 shrink-0 inline-block" />
                <span className="truncate">{shopProfile.address}</span>
                <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition text-amber-400 shrink-0 ml-0.5" />
              </p>
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

      {/* Edit Shop Profile & Address Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Informasi & Alamat Toko</h3>
                  <p className="text-xs text-slate-400">Atur nama & alamat untuk header dan kop kwitansi cetak</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  Nama Toko / Workshop
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="GUDANG KREASI ALUMUNIUM"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Alamat Lengkap Toko / Workshop
                </label>
                <textarea
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Jl. Raya Garasi Alumunium No. 88, Workshop & Fabrikasi"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Alamat ini otomatis tampil di header navigasi dan tercetak di bawah nama toko pada kop kwitansi.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  No. Telepon / WhatsApp (Opsional)
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-md shadow-amber-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Alamat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
