// IndexedDB storage for offline persistence of user-uploaded PDF files

const DB_NAME = 'BibliotecaPdfDB';
const DB_VERSION = 1;
const STORE_NAME = 'pdf_files';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Stores a PDF file or binary data safely into IndexedDB.
 * Handles Blob, File, ArrayBuffer, and Uint8Array without detached buffer errors.
 */
export async function savePdfToIndexedDB(
  id: string,
  data: Blob | File | ArrayBuffer | Uint8Array
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      let itemToStore: Blob | ArrayBuffer;

      if (data instanceof Blob) {
        // Blob / File is already durable, immutable, and cannot be detached
        itemToStore = data;
      } else if (data instanceof Uint8Array) {
        // Check if backing buffer is already detached
        if (data.buffer.byteLength === 0) {
          console.warn('Cannot store detached Uint8Array buffer in IndexedDB');
          resolve();
          return;
        }
        // Create an isolated Blob
        itemToStore = new Blob([data.buffer as ArrayBuffer], { type: 'application/pdf' });
      } else if (data instanceof ArrayBuffer) {
        // Check if buffer is already detached
        if (data.byteLength === 0) {
          console.warn('Cannot store detached ArrayBuffer in IndexedDB');
          resolve();
          return;
        }
        itemToStore = new Blob([data], { type: 'application/pdf' });
      } else {
        itemToStore = data as any;
      }

      const req = store.put(itemToStore, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save PDF to IndexedDB:', err);
  }
}

/**
 * Retrieves a PDF binary from IndexedDB as a clean Uint8Array.
 */
export async function getPdfFromIndexedDB(id: string): Promise<Uint8Array | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = async () => {
        const result = req.result;
        if (!result) {
          resolve(null);
          return;
        }

        try {
          if (result instanceof Blob) {
            const buffer = await result.arrayBuffer();
            resolve(new Uint8Array(buffer));
          } else if (result instanceof ArrayBuffer) {
            resolve(new Uint8Array(result));
          } else if (result instanceof Uint8Array) {
            resolve(result);
          } else {
            resolve(null);
          }
        } catch (err) {
          console.warn('Error reading stored PDF data:', err);
          resolve(null);
        }
      };

      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not read PDF from IndexedDB:', err);
    return null;
  }
}

/**
 * Deletes a PDF from IndexedDB when removed from the library.
 */
export async function deletePdfFromIndexedDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not delete PDF from IndexedDB:', err);
  }
}
