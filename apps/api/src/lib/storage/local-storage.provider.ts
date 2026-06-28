import fs from 'fs/promises'
import path from 'path'
import type { StorageObjectStat, StorageProvider } from './storage.provider'

const BASE_PATH = process.env.STORAGE_LOCAL_PATH ?? './storage'

function normalizeKey(key: string): string {
  return key.split(path.sep).join('/')
}

export class LocalStorageProvider implements StorageProvider {
  private basePath: string

  constructor(basePath = BASE_PATH) {
    this.basePath = basePath
  }

  private resolve(key: string) {
    return path.join(this.basePath, key)
  }

  async upload(file: Buffer, key: string, _mime: string): Promise<string> {
    const fullPath = this.resolve(key)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, file)
    return key
  }

  async read(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key))
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key))
    } catch {
      // ignore missing files
    }
  }

  async list(prefix: string): Promise<string[]> {
    const normalizedPrefix = normalizeKey(prefix.replace(/\/$/, ''))
    const absoluteDir = normalizedPrefix ? this.resolve(normalizedPrefix) : this.basePath
    return this.walkKeys(normalizedPrefix, absoluteDir)
  }

  private async walkKeys(prefix: string, absoluteDir: string): Promise<string[]> {
    let entryNames: string[]
    try {
      entryNames = await fs.readdir(absoluteDir)
    } catch {
      return []
    }

    const keys: string[] = []
    for (const name of entryNames) {
      const childKey = prefix ? `${prefix}/${name}` : name
      const childAbsolute = path.join(absoluteDir, name)
      const entryStat = await fs.stat(childAbsolute).catch(() => null)
      if (!entryStat) continue
      if (entryStat.isDirectory()) {
        keys.push(...(await this.walkKeys(childKey, childAbsolute)))
        continue
      }
      if (entryStat.isFile()) {
        keys.push(normalizeKey(childKey))
      }
    }

    return keys
  }

  async stat(key: string): Promise<StorageObjectStat | null> {
    try {
      const fileStat = await fs.stat(this.resolve(key))
      if (!fileStat.isFile()) return null
      return {
        modifiedAt: fileStat.mtime,
        sizeBytes: fileStat.size,
      }
    } catch {
      return null
    }
  }

  async deleteByPrefix(prefix: string): Promise<number> {
    const keys = await this.list(prefix)
    let deleted = 0

    for (const key of keys) {
      try {
        await this.delete(key)
        deleted += 1
      } catch {
        // ignore per-object failures
      }
    }

    return deleted
  }
}
