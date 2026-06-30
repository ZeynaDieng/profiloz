export interface UserNotification {
  id: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
}

export function useNotificationService() {
  const { get, post } = useApiClient()

  async function list() {
    return get<{ data: UserNotification[]; unreadCount: number }>('/notifications')
  }

  async function markRead(id: string) {
    return post(`/notifications/${id}/read`, {})
  }

  async function markAllRead() {
    return post('/notifications/read-all', {})
  }

  return { list, markRead, markAllRead }
}
