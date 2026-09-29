import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logoutUser, testConnection } from './lib/firebase';
import {
  Project,
  InventoryItem,
  PriceHistoryLog,
  LaborSettings,
  ProjectStatus,
} from './types';
import {
  getLocalProjects,
  saveLocalProjects,
  getLocalInventory,
  saveLocalInventory,
  getLocalPriceHistory,
  saveLocalPriceHistory,
  saveProjectToCloud,
  deleteProjectFromCloud,
  saveInventoryItemToCloud,
  deleteInventoryItemFromCloud,
  savePriceHistoryToCloud,
  subscribeToUserProjects,
  subscribeToInventory,
} from './services/storageService';
import { INITIAL_INVENTORY_CATALOG } from './utils/defaultCatalog';
import { Navbar } from './components/Navbar';
import { CalculatorTab } from './components/CalculatorTab';
import { ProjectListTab } from './components/ProjectListTab';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { TimelineTab } from './components/TimelineTab';
import { CatalogTab } from './components/CatalogTab';
import { InventoryTab } from './components/InventoryTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'calculator' | 'projects' | 'timeline' | 'catalog' | 'inventory'
  >('calculator');

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // App Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryLog[]>([]);

  // Selected Project for Detail Modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Labor Settings Global Defaults
  const [laborSettings, setLaborSettings] = useState<LaborSettings>({
    mode: 'per_meter_lari',
    ratePerMeter: 35000,
    ratePerUnit: 150000,
    ratePerDay: 185000,
    percentageRate: 25,
    workersCount: 2,
    estimatedDays: 5,
    transportCost: 150000,
    scaffoldingCost: 0,
    extraCost: 0,
  });

  // 1. Initial Local Data Load & Sample RAB Population
  useEffect(() => {
    const loadedInventory = getLocalInventory();
    setInventory(loadedInventory);

    const loadedProjects = getLocalProjects();
    if (loadedProjects.length === 0) {
      // Populate standard demo RAB project for instant rich experience
      const demoProject: Project = {
        id: 'proj-demo-1',
        userId: '',
        title: 'Proyek Rumah Tinggal Minimalis 2 Lantai',
        clientName: 'Bpk. Hendra Setiawan',
        clientPhone: '0812-3456-7890',
        clientAddress: 'Jl. Boulevard Utama No. 88, BSD City',
        estimateNumber: 'RAB-2026-001',
        date: new Date().toLocaleDateString('id-ID'),
        status: 'quoted',
        items: [
          {
            id: 'item-demo-1',
            name: 'Jendela Utama Depan (J1)',
            type: 'kusen_jendela_casement',
            widthMm: 1400,
            heightMm: 1600,
            quantity: 2,
            profileSize: '4 Inch',
            brand: 'Alexindo',
            color: 'White (Putih)',
            glassType: 'Polos 5mm',
            mullionVerticalCount: 1,
            mullionHorizontalCount: 0,
            perimeterMeters: 12,
            aluminumBarsNeeded: 3,
            wastePercentage: 6.5,
            glassAreaM2: 3.84,
            hardware: {
              hingesCount: 4,
              lockSetCount: 2,
              slotCount: 0,
              frictionStayCount: 4,
              sealantMeters: 12,
              rubberMeters: 12,
              screwsSikuSet: 2,
            },
            aluminumMaterialCost: 555000,
            glassMaterialCost: 480000,
            hardwareMaterialCost: 350000,
            totalMaterialCost: 1385000,
            laborCost: 420000,
            subtotalCost: 1805000,
          },
          {
            id: 'item-demo-2',
            name: 'Pintu Utama Swing Kaca (P1)',
            type: 'kusen_pintu_swing',
            widthMm: 900,
            heightMm: 2200,
            quantity: 1,
            profileSize: '4 Inch',
            brand: 'Alexindo',
            color: 'White (Putih)',
            glassType: 'Tempered 8mm',
            mullionVerticalCount: 0,
            mullionHorizontalCount: 0,
            perimeterMeters: 6.2,
            aluminumBarsNeeded: 2,
            wastePercentage: 8.2,
            glassAreaM2: 1.73,
            hardware: {
              hingesCount: 3,
              lockSetCount: 1,
              slotCount: 0,
              frictionStayCount: 0,
              sealantMeters: 7,
              rubberMeters: 7,
              screwsSikuSet: 1,
            },
            aluminumMaterialCost: 370000,
            glassMaterialCost: 657400,
            hardwareMaterialCost: 270000,
            totalMaterialCost: 1297400,
            laborCost: 217000,
            subtotalCost: 1514400,
          },
        ],
        laborSettings: {
          mode: 'per_meter_lari',
          ratePerMeter: 35000,
          ratePerUnit: 150000,
          ratePerDay: 185000,
          percentageRate: 25,
          workersCount: 2,
          estimatedDays: 4,
          transportCost: 150000,
          scaffoldingCost: 0,
          extraCost: 0,
        },
        markupPercentage: 15,
        taxPercentage: 0,
        totalMaterialCost: 2682400,
        totalLaborCost: 637000,
        totalOperationalCost: 150000,
        subtotal: 3469400,
        markupAmount: 520410,
        taxAmount: 0,
        grandTotal: 3989810,
        estimatedProductionDays: 5,
        notes: 'Penawaran RAB Kusen & Pintu Alumunium BSD',
        paymentTerms: 'DP 50% saat SPK, Pelunasan 50% setelah pemasangan.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setProjects([demoProject]);
      saveLocalProjects([demoProject]);
    } else {
      setProjects(loadedProjects);
    }

    setPriceHistory(getLocalPriceHistory());
  }, []);

  // 2. Network & Firebase Auth Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        testConnection();
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeAuth();
    };
  }, []);

  // 3. Realtime Firestore Synchronization when authenticated
  useEffect(() => {
    if (!currentUser || !isOnline) return;

    const unsubProjects = subscribeToUserProjects(currentUser.uid, (cloudProjects) => {
      if (cloudProjects && cloudProjects.length > 0) {
        setProjects(cloudProjects);
        saveLocalProjects(cloudProjects);
      }
    });

    const unsubInventory = subscribeToInventory((cloudInventory) => {
      if (cloudInventory && cloudInventory.length > 0) {
        setInventory(cloudInventory);
        saveLocalInventory(cloudInventory);
      }
    });

    return () => {
      unsubProjects();
      unsubInventory();
    };
  }, [currentUser, isOnline]);

  // Handler: Save Project (Local + Cloud)
  const handleSaveProject = async (project: Project) => {
    const updatedProjects = [project, ...projects.filter((p) => p.id !== project.id)];
    setProjects(updatedProjects);
    saveLocalProjects(updatedProjects);

    if (currentUser && isOnline) {
      await saveProjectToCloud(project);
    }
  };

  // Handler: Delete Project
  const handleDeleteProject = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus RAB proyek ini?')) return;
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    saveLocalProjects(updated);

    if (currentUser && isOnline) {
      await deleteProjectFromCloud(id);
    }
  };

  // Handler: Update Project Status (e.g., Approved / Disetujui)
  const handleUpdateStatus = async (projectId: string, newStatus: ProjectStatus) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === projectId) {
        return { ...p, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return p;
    });

    setProjects(updatedProjects);
    saveLocalProjects(updatedProjects);

    const updated = updatedProjects.find((p) => p.id === projectId);
    if (updated && currentUser && isOnline) {
      await saveProjectToCloud(updated);
    }

    // Auto reserve inventory stock when approved
    if (newStatus === 'approved' && updated) {
      updated.items.forEach((item) => {
        setInventory((prev) =>
          prev.map((inv) => {
            if (
              inv.brand === item.brand &&
              (inv.color === item.color || inv.name.includes(item.color))
            ) {
              const newQty = Math.max(0, inv.stockQuantity - item.aluminumBarsNeeded);
              return { ...inv, stockQuantity: newQty };
            }
            return inv;
          })
        );
      });
      alert(`Status Proyek diubah ke "${newStatus.toUpperCase()}". Kebutuhan stok bahan baku otomatis dipotong.`);
    }
  };

  // Handler: Update Item Price in Catalog
  const handleUpdateItemPrice = async (itemId: string, newPrice: number, notes?: string, supplierName?: string) => {
    const targetItem = inventory.find((i) => i.id === itemId);
    if (!targetItem) return;

    const oldPrice = targetItem.pricePerUnit;
    const updatedInventory = inventory.map((i) =>
      i.id === itemId
        ? {
            ...i,
            pricePerUnit: newPrice,
            supplierName: supplierName !== undefined ? supplierName : i.supplierName,
            lastUpdated: new Date().toISOString(),
          }
        : i
    );

    setInventory(updatedInventory);
    saveLocalInventory(updatedInventory);

    // Create Price Log
    const newLog: PriceHistoryLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      itemId,
      itemName: targetItem.name,
      oldPrice,
      newPrice,
      changedAt: new Date().toISOString(),
      changedBy: currentUser?.email || 'Admin Local',
      notes,
    };

    const updatedHistory = [newLog, ...priceHistory];
    setPriceHistory(updatedHistory);
    saveLocalPriceHistory(updatedHistory);

    if (currentUser && isOnline) {
      const updated = updatedInventory.find((i) => i.id === itemId);
      if (updated) await saveInventoryItemToCloud(updated);
      await savePriceHistoryToCloud(newLog);
    }
  };

  // Handler: Restock Material
  const handleUpdateStock = async (itemId: string, addQuantity: number) => {
    const updatedInventory = inventory.map((i) =>
      i.id === itemId ? { ...i, stockQuantity: i.stockQuantity + addQuantity } : i
    );

    setInventory(updatedInventory);
    saveLocalInventory(updatedInventory);

    if (currentUser && isOnline) {
      const updated = updatedInventory.find((i) => i.id === itemId);
      if (updated) await saveInventoryItemToCloud(updated);
    }
  };

  // Handler: Add New Material to Catalog
  const handleAddInventoryItem = async (newItem: InventoryItem) => {
    const updatedInventory = [newItem, ...inventory];
    setInventory(updatedInventory);
    saveLocalInventory(updatedInventory);

    if (currentUser && isOnline) {
      await saveInventoryItemToCloud(newItem);
    }
  };

  // Handler: Delete Material from Catalog
  const handleDeleteInventoryItem = async (itemId: string) => {
    const updatedInventory = inventory.filter((i) => i.id !== itemId);
    setInventory(updatedInventory);
    saveLocalInventory(updatedInventory);

    if (currentUser && isOnline) {
      await deleteInventoryItemFromCloud(itemId);
    }
  };

  // Reset catalog to initial standard
  const handleResetCatalog = () => {
    if (confirm('Reset catalog ke harga standar pasar Indonesia?')) {
      setInventory(INITIAL_INVENTORY_CATALOG);
      saveLocalInventory(INITIAL_INVENTORY_CATALOG);
    }
  };

  const lowStockItems = inventory.filter((i) => i.stockQuantity <= i.minStockThreshold);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={currentUser}
        onLogin={signInWithGoogle}
        onLogout={logoutUser}
        isOnline={isOnline}
        lowStockItems={lowStockItems}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calculator' && (
          <CalculatorTab
            inventory={inventory}
            laborSettings={laborSettings}
            setLaborSettings={setLaborSettings}
            onSaveProject={handleSaveProject}
            onAddInventoryItem={handleAddInventoryItem}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectListTab
            projects={projects}
            onSelectProject={(p) => {
              setSelectedProject(p);
              setIsDetailModalOpen(true);
            }}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={(p) => handleSaveProject({ ...p, id: `proj-${Date.now()}`, title: `${p.title} (Salinan)` })}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineTab
            projects={projects}
            laborSettings={laborSettings}
            setLaborSettings={setLaborSettings}
          />
        )}

        {activeTab === 'catalog' && (
          <CatalogTab
            inventory={inventory}
            priceHistory={priceHistory}
            onUpdateItemPrice={handleUpdateItemPrice}
            onAddInventoryItem={handleAddInventoryItem}
            onDeleteInventoryItem={handleDeleteInventoryItem}
            onResetCatalog={handleResetCatalog}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryTab
            inventory={inventory}
            onUpdateStock={handleUpdateStock}
          />
        )}

        {/* Selected Project Detail Modal */}
        <ProjectDetailModal
          project={selectedProject}
          inventory={inventory}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onSaveUpdate={handleSaveProject}
        />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p className="max-w-7xl mx-auto px-4">
          © {new Date().getFullYear()} GudangKreasi — Aplikasi Perhitungan RAB Kusen, Pintu & Jendela Alumunium Presisi.
        </p>
      </footer>
    </div>
  );
}
