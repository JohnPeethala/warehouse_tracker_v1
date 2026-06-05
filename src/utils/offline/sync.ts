import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { createClient } from '@/utils/supabase/client';

interface WarehouseDB extends DBSchema {
  syncQueue: {
    key: number;
    value: {
      id?: number;
      action: 'UPDATE_TICKET';
      payload: any;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<WarehouseDB>> | null = null;

export function getDB() {
  // Ensure we only try to open IndexedDB in the browser
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!dbPromise) {
    dbPromise = openDB<WarehouseDB>('warehouse-sync-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('syncQueue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
}

export async function addToSyncQueue(action: 'UPDATE_TICKET', payload: any) {
  const dbPromiseLocal = getDB();
  if (!dbPromiseLocal) return;
  const db = await dbPromiseLocal;
  
  await db.add('syncQueue', {
    action,
    payload,
    timestamp: Date.now(),
  });
  
  // Try to sync immediately if we are online
  if (navigator.onLine) {
    syncData();
  }
}

export async function syncData() {
  if (typeof window === 'undefined' || !navigator.onLine) return;
  
  const dbPromiseLocal = getDB();
  if (!dbPromiseLocal) return;
  
  const db = await dbPromiseLocal;
  const tx = db.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');
  const items = await store.getAll();

  if (items.length === 0) return;

  const supabase = createClient();

  for (const item of items) {
    try {
      if (item.action === 'UPDATE_TICKET') {
        const { ticket_id, gt_status, gt_location_lat, gt_location_lng, remarks } = item.payload;
        
        // Update dispatch_log
        const { error } = await supabase
          .from('dispatch_log')
          .update({
            gt_status,
            gt_location_lat,
            gt_location_lng,
            remarks,
            gt_updated_at: new Date().toISOString(),
          })
          .eq('ticket_id', ticket_id);

        if (error) {
          console.error('Failed to sync item', item, error);
          throw error; 
        }
      }
      
      // Successfully synced, remove from queue
      await store.delete(item.id!);
    } catch (err) {
      console.error('Error during sync processing', err);
      // Stop processing the rest of the queue to maintain order and retry later
      break;
    }
  }
}

// Set up online event listener to trigger sync when connection is restored
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncData();
  });
}
