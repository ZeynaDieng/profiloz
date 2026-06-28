import { LocalStorageProvider } from './local-storage.provider'
import type { StorageProvider } from './storage.provider'

export type { StorageObjectStat, StorageProvider } from './storage.provider'

function createStorageProvider(): StorageProvider {
  // Future: return R2/S3 provider when STORAGE_DRIVER=s3
  return new LocalStorageProvider()
}

export const storageProvider = createStorageProvider()
