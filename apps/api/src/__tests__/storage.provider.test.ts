import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LocalStorageProvider } from '../lib/storage/local-storage.provider'

describe('LocalStorageProvider', () => {
  let tempDir: string
  let provider: LocalStorageProvider

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'profiloz-storage-'))
    provider = new LocalStorageProvider(tempDir)
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it('upload, read, stat and delete a file', async () => {
    const key = 'uploads/user-1/doc.pdf'
    await provider.upload(Buffer.from('hello'), key, 'application/pdf')

    expect((await provider.read(key)).toString()).toBe('hello')

    const stat = await provider.stat(key)
    expect(stat).not.toBeNull()
    expect(stat?.sizeBytes).toBe(5)

    await provider.delete(key)
    expect(await provider.stat(key)).toBeNull()
  })

  it('lists nested keys under a prefix', async () => {
    await provider.upload(Buffer.from('a'), 'avatars/guest/s1/one.jpg', 'image/jpeg')
    await provider.upload(Buffer.from('b'), 'avatars/guest/s1/nested/two.jpg', 'image/jpeg')
    await provider.upload(Buffer.from('c'), 'avatars/user/u1/three.jpg', 'image/jpeg')

    const keys = await provider.list('avatars/guest/s1').then((items) => items.sort())
    expect(keys).toEqual(['avatars/guest/s1/nested/two.jpg', 'avatars/guest/s1/one.jpg'])
  })

  it('deleteByPrefix removes all nested files', async () => {
    await provider.upload(Buffer.from('a'), 'pdf-render/a.json', 'application/json')
    await provider.upload(Buffer.from('b'), 'pdf-render/nested/b.json', 'application/json')
    await provider.upload(Buffer.from('c'), 'pdf/keep.pdf', 'application/pdf')

    const deleted = await provider.deleteByPrefix('pdf-render')
    expect(deleted).toBe(2)
    expect(await provider.list('pdf-render')).toEqual([])
    expect(await provider.stat('pdf/keep.pdf')).not.toBeNull()
  })
})
