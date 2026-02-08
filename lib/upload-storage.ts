/**
 * Módulo de persistência para upload resumable usando IndexedDB.
 * Armazena sessões de upload para permitir retomada após refresh da página.
 */

const DB_NAME = "mytransfer-uploads"
const DB_VERSION = 1
const STORE_NAME = "upload-sessions"

export interface PersistedUploadSession {
  fingerprint: string
  arquivoId: string
  sessaoId: string
  fileName: string
  fileSize: number
  fileType: string
  hashConteudo: string
  totalChunks: number
  chunkSizeBytes: number
  createdAt: number
  lastUpdatedAt: number
}

let dbInstance: IDBDatabase | null = null

async function getDb(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"))
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "fingerprint" })
        store.createIndex("sessaoId", "sessaoId", { unique: false })
        store.createIndex("arquivoId", "arquivoId", { unique: false })
        store.createIndex("createdAt", "createdAt", { unique: false })
      }
    }
  })
}

/**
 * Salva uma sessão de upload no IndexedDB.
 */
export async function saveUploadSession(session: PersistedUploadSession): Promise<void> {
  const db = await getDb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(session)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error("Failed to save upload session"))
  })
}

/**
 * Busca uma sessão de upload pelo fingerprint.
 */
export async function getUploadSession(fingerprint: string): Promise<PersistedUploadSession | null> {
  const db = await getDb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(fingerprint)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(new Error("Failed to get upload session"))
  })
}

/**
 * Busca uma sessão de upload pelo arquivoId.
 */
export async function getUploadSessionByArquivoId(arquivoId: string): Promise<PersistedUploadSession | null> {
  const db = await getDb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index("arquivoId")
    const request = index.get(arquivoId)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(new Error("Failed to get upload session by arquivoId"))
  })
}

/**
 * Busca todas as sessões de upload pendentes para uma sessão específica.
 */
export async function getPendingSessionsBySessaoId(sessaoId: string): Promise<PersistedUploadSession[]> {
  const db = await getDb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index("sessaoId")
    const request = index.getAll(sessaoId)

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(new Error("Failed to get pending sessions"))
  })
}

/**
 * Remove uma sessão de upload pelo fingerprint.
 */
export async function removeUploadSession(fingerprint: string): Promise<void> {
  const db = await getDb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(fingerprint)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error("Failed to remove upload session"))
  })
}

/**
 * Remove sessões de upload antigas (mais de 24 horas).
 */
export async function cleanupOldSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
  const db = await getDb()
  const cutoffTime = Date.now() - maxAgeMs

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index("createdAt")
    const range = IDBKeyRange.upperBound(cutoffTime)
    const request = index.openCursor(range)

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      } else {
        resolve()
      }
    }

    request.onerror = () => reject(new Error("Failed to cleanup old sessions"))
  })
}

/**
 * Atualiza o timestamp de última modificação de uma sessão.
 */
export async function updateSessionTimestamp(fingerprint: string): Promise<void> {
  const session = await getUploadSession(fingerprint)
  if (session) {
    session.lastUpdatedAt = Date.now()
    await saveUploadSession(session)
  }
}

/**
 * Limpa todas as sessões de upload (uso para debug/reset).
 */
export async function clearAllSessions(): Promise<void> {
  const db = await getDb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error("Failed to clear all sessions"))
  })
}
