export type StorageObjectStat = {
  modifiedAt: Date
  sizeBytes: number
}

export interface StorageProvider {
  upload(file: Buffer, key: string, mime: string): Promise<string>
  read(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  /** Lists object keys under a prefix (recursive). Keys use forward slashes. */
  list(prefix: string): Promise<string[]>
  stat(key: string): Promise<StorageObjectStat | null>
  /** Deletes all objects under a prefix. Returns the number of deleted objects. */
  deleteByPrefix(prefix: string): Promise<number>
}
