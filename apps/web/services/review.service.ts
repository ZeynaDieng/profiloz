export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Review {
  id: string
  rating: number
  comment: string
  displayName: string
  city: string | null
  status: ReviewStatus
  createdAt: string
  moderatedAt?: string | null
}

export interface PublicReviews {
  reviews: Array<Pick<Review, 'id' | 'rating' | 'comment' | 'displayName' | 'city' | 'createdAt'>>
  stats: { reviewCount: number; averageRating: number | null; documentCount: number }
}

export interface ReviewInput {
  rating: number
  comment: string
  displayName: string
  city?: string
  consent: boolean
}

export function useReviewService() {
  const { get, post, patch } = useApiClient()

  return {
    getMine: () => get<{ review: Review | null; canReview: boolean }>('/reviews'),
    submit: (input: ReviewInput) => post<{ review: Review }>('/reviews', input),
    getPublic: () => get<PublicReviews>('/content/reviews'),
    listForAdmin: (status: ReviewStatus | '', page = 1) =>
      get<{ data: Review[]; meta: { page: number; totalPages: number; total: number }; pending: number }>(
        `/admin/reviews?page=${page}${status ? `&status=${status}` : ''}`,
      ),
    moderate: (id: string, status: ReviewStatus) => patch<{ review: Review }>(`/admin/reviews/${id}`, { status }),
  }
}
