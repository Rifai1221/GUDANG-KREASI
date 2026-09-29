import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { Project, InventoryItem, PriceHistoryLog } from '../types';
import { INITIAL_INVENTORY_CATALOG } from '../utils/defaultCatalog';

const LOCAL_PROJECTS_KEY = 'kusenpro_projects_v1';
const LOCAL_INVENTORY_KEY = 'kusenpro_inventory_v1';
const LOCAL_HISTORY_KEY = 'kusenpro_price_history_v1';

// --- LOCAL STORAGE HELPERS ---

export function getLocalProjects(): Project[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading local projects', e);
    return [];
  }
}

export function saveLocalProjects(projects: Project[]) {
  try {
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Error saving local projects', e);
  }
}

export function getLocalInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_INVENTORY_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(INITIAL_INVENTORY_CATALOG));
      return INITIAL_INVENTORY_CATALOG;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local inventory', e);
    return INITIAL_INVENTORY_CATALOG;
  }
}

export function saveLocalInventory(inventory: InventoryItem[]) {
  try {
    localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(inventory));
  } catch (e) {
    console.error('Error saving local inventory', e);
  }
}

export function getLocalPriceHistory(): PriceHistoryLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalPriceHistory(history: PriceHistoryLog[]) {
  try {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Error saving local price history', e);
  }
}

// --- CLOUD FIRESTORE SYNC HELPERS ---

export async function saveProjectToCloud(project: Project): Promise<void> {
  const user = auth.currentUser;
  if (!user) return; // Works locally if not signed in

  const path = `projects/${project.id}`;
  try {
    const projectData = {
      ...project,
      userId: user.uid,
      isSyncedWithCloud: true,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'projects', project.id), projectData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProjectFromCloud(projectId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const path = `projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveInventoryItemToCloud(item: InventoryItem): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const path = `inventory/${item.id}`;
  try {
    await setDoc(doc(db, 'inventory', item.id), {
      ...item,
      userId: user.uid,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteInventoryItemFromCloud(itemId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const path = `inventory/${itemId}`;
  try {
    await deleteDoc(doc(db, 'inventory', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

const LOCAL_CUSTOM_FRAMES_KEY = 'kusenpro_custom_frames_v1';
const LOCAL_CUSTOM_DOORS_KEY = 'kusenpro_custom_doors_v1';

export function getLocalCustomFrameModels(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_FRAMES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalCustomFrameModels(models: any[]) {
  try {
    localStorage.setItem(LOCAL_CUSTOM_FRAMES_KEY, JSON.stringify(models));
  } catch (e) {
    console.error('Error saving custom frame models', e);
  }
}

export function getLocalCustomDoorModels(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_DOORS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalCustomDoorModels(models: any[]) {
  try {
    localStorage.setItem(LOCAL_CUSTOM_DOORS_KEY, JSON.stringify(models));
  } catch (e) {
    console.error('Error saving custom door models', e);
  }
}

export async function savePriceHistoryToCloud(log: PriceHistoryLog): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const path = `priceHistory/${log.id}`;
  try {
    await setDoc(doc(db, 'priceHistory', log.id), {
      ...log,
      userId: user.uid,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface ShopProfile {
  name: string;
  tagline?: string;
  address: string;
  phone?: string;
}

const LOCAL_SHOP_PROFILE_KEY = 'gudangkreasi_shop_profile_v1';

export const DEFAULT_SHOP_PROFILE: ShopProfile = {
  name: 'GUDANG KREASI ALUMUNIUM',
  tagline: 'Garasi Alumunium — Original Hand Made',
  address: 'Jl. Raya Garasi Alumunium No. 88, Workshop & Fabrikasi Kusen Alumunium',
  phone: '0812-3456-7890',
};

export function getLocalShopProfile(): ShopProfile {
  try {
    const raw = localStorage.getItem(LOCAL_SHOP_PROFILE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_SHOP_PROFILE_KEY, JSON.stringify(DEFAULT_SHOP_PROFILE));
      return DEFAULT_SHOP_PROFILE;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading shop profile', e);
    return DEFAULT_SHOP_PROFILE;
  }
}

export function saveLocalShopProfile(profile: ShopProfile) {
  try {
    localStorage.setItem(LOCAL_SHOP_PROFILE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('shop-profile-updated', { detail: profile }));
  } catch (e) {
    console.error('Error saving shop profile', e);
  }
}

export function subscribeToUserProjects(
  userId: string,
  onData: (projects: Project[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, 'projects'), where('userId', '==', userId));
  const path = 'projects';

  return onSnapshot(
    q,
    (snapshot) => {
      const cloudProjects: Project[] = [];
      snapshot.forEach((docSnap) => {
        cloudProjects.push(docSnap.data() as Project);
      });
      onData(cloudProjects);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}

export function subscribeToInventory(
  onData: (items: InventoryItem[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'inventory';
  return onSnapshot(
    collection(db, 'inventory'),
    (snapshot) => {
      const items: InventoryItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as InventoryItem);
      });
      if (items.length > 0) {
        onData(items);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}
