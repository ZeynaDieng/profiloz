export function useAvatarService() {
  const { upload, delete: del, apiBaseUrl } = useApiClient()

  async function uploadAvatar(blob: Blob) {
    const formData = new FormData()
    formData.append('file', blob, 'avatar.jpg')
    return upload<{ storageKey: string; url: string }>('/avatars/upload', formData)
  }

  async function deleteAvatar(storageKey: string) {
    const relativePath = storageKey.replace(/^avatars\//, '')
    await del(`/avatars/${relativePath}`)
  }

  function resolvePhoto(storageKeyOrUrl?: string) {
    return resolvePhotoUrl(storageKeyOrUrl, apiBaseUrl)
  }

  return { uploadAvatar, deleteAvatar, resolvePhoto }
}
