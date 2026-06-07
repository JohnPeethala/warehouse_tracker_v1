import { openDB, DBSchema, IDBPDatabase } from 'idb'

export interface SyncAction {
  id?: number
  action: 'update_dispatch_logs' | 'update_ticket_status'
  payload: any
  timestamp: number
}

interface WarehouseDB extends DBSchema {
  'sync-queue': {
    key: number
    value: SyncAction
  }
}

let dbPromise: Promise<IDBPDatabase<WarehouseDB>> | null = null

function getDB() {
  if (typeof window === 'undefined') return null
  if (!dbPromise) {
    dbPromise = openDB<WarehouseDB>('warehouse-offline-sync', 1, {
      upgrade(db) {
        db.createObjectStore('sync-queue', {
          keyPath: 'id',
          autoIncrement: true,
        })
      },
    })
  }
  return dbPromise
}

export async function addToQueue(action: SyncAction['action'], payload: any) {
  const db = await getDB()
  if (!db) return
  await db.add('sync-queue', {
    action,
    payload,
    timestamp: Date.now(),
  })
}

export async function getQueue(): Promise<SyncAction[]> {
  const db = await getDB()
  if (!db) return []
  return db.getAll('sync-queue')
}

export async function removeFromQueue(id: number) {
  const db = await getDB()
  if (!db) return
  await db.delete('sync-queue', id)
}

export async function clearQueue() {
  const db = await getDB()
  if (!db) return
  await db.clear('sync-queue')
}
