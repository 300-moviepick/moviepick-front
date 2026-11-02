// 새 UI 전용 API 함수 모음 (백엔드 dev f3226ed 기준 계약).
// - 식별자는 movieId·memberId·reportId·genreId 등 이름 붙은 키를 쓴다(응답에 id 없음).
// - 댓글 수정은 PATCH /api/community/comments/{commentId}.
// - 모든 응답은 client.request가 ApiResponse.data로 풀어서 돌려준다. 목록은 PageResponse
//   { content, page, size, totalElements, totalPages }.
// 기존 화면은 ./endpoints.js를 계속 쓴다(수정하지 않음).
import { API_BASE_URL, api, qs } from './client';

const enc = encodeURIComponent;

// ---------- 인증·회원 ----------

export const authApi = {
  // SignupRequest { email, password, nickname } → MemberResponse
  signup: (body) => api.post('/api/auth/members', body),
  // 소셜 로그인 시작 주소 (provider: 'kakao' | 'google')
  oauthUrl: (provider) => `${API_BASE_URL}/oauth2/authorization/${provider}`,
};

export const memberApi = {
  // MemberResponse { memberId, email, nickname, role, status }
  me: () => api.get('/api/members/me'),
  // MemberUpdateRequest { nickname }
  updateMe: (body) => api.patch('/api/members/me', body),
  withdraw: () => api.delete('/api/members/me'),
};

// ---------- 영화 ----------

export const movieApi = {
  // PageResponse<MovieListResponse { movieId, title, releaseDate, voteAverage, posterUrl, averageRating, reviewCount }>
  // 정렬은 서버에서 id 내림차순 고정
  list: ({ keyword, page = 0, size = 20 } = {}) => api.get(`/api/movies${qs({ keyword, page, size })}`),
  // MovieDetailResponse { movieId, tmdbId, title, …, genres[{genreId,name}], averageRating, reviewCount, myReviewId }
  detail: (movieId) => api.get(`/api/movies/${enc(movieId)}`),
  // MovieExtraResponse { movieId, trailer, cast[], directors[], streaming[], rent[], buy[], watchLink }
  // 비로그인 접근이 막혀 있을 수 있음(401). TMDB 장애 시 502.
  extras: (movieId) => api.get(`/api/movies/${enc(movieId)}/extras`),
};

// ---------- 리뷰 ----------

export const reviewApi = {
  // sort: latest | likes | ratingDesc | ratingAsc → PageResponse<ReviewResponse>
  listByMovie: (movieId, { sort = 'latest', page = 0, size = 20 } = {}) =>
    api.get(`/api/movies/${enc(movieId)}/reviews${qs({ sort, page, size })}`),
  // 전체 리뷰 → PageResponse<ReviewWithMovieResponse>
  listAll: ({ sort = 'latest', page = 0, size = 20 } = {}) => api.get(`/api/movies/reviews${qs({ sort, page, size })}`),
  // 내 리뷰 → PageResponse<ReviewWithMovieResponse> (movieActive 포함)
  listMine: ({ page = 0, size = 20 } = {}) => api.get(`/api/members/me/reviews${qs({ page, size })}`),
  // ReviewCreateRequest { rating(0.5~5.0, 0.5 단위), content(1~1000), spoiler }
  create: (movieId, body) => api.post(`/api/movies/${enc(movieId)}/reviews`, body),
  // ReviewUpdateRequest { rating?, content?, spoiler? }
  update: (reviewId, body) => api.patch(`/api/reviews/${enc(reviewId)}`, body),
  remove: (reviewId) => api.delete(`/api/reviews/${enc(reviewId)}`),
  // LikeResponse { liked, likeCount }
  like: (reviewId) => api.post(`/api/reviews/${enc(reviewId)}/likes`),
  unlike: (reviewId) => api.delete(`/api/reviews/${enc(reviewId)}/likes`),
  // CommunityReportRequest { reason: SPAM|ABUSE|SPOILER|ADULT|ETC, detail(≤200, ETC면 필수) }
  report: (reviewId, body) => api.post(`/api/reviews/${enc(reviewId)}/reports`, body),
};

// ---------- 찜 ----------

export const wishlistApi = {
  // 201 WishlistResponse { movieId, wishlistedAt } / 409 ALREADY_WISHLISTED
  add: (movieId) => api.post(`/api/movies/${enc(movieId)}/wishlist`),
  // 404 WISHLIST_NOT_FOUND
  remove: (movieId) => api.delete(`/api/movies/${enc(movieId)}/wishlist`),
  // PageResponse<WishlistMovieResponse { movieId, title, posterUrl, releaseDate, releaseDateKr(null), wishlistedAt }>
  listMine: ({ page = 0, size = 20 } = {}) => api.get(`/api/members/me/wishlist${qs({ page, size })}`),
};

// ---------- 알림 ----------

export const notificationApi = {
  // PageResponse<NotificationResponse { notificationId, type, movieId, title, message, read, createdAt }>
  list: ({ page = 0, size = 20 } = {}) => api.get(`/api/notifications${qs({ page, size })}`),
  // { unreadCount }
  unreadCount: () => api.get('/api/notifications/unread-count'),
  markRead: (notificationId) => api.patch(`/api/notifications/${enc(notificationId)}/read`),
  // { updatedCount }
  markAllRead: () => api.patch('/api/notifications/read-all'),
};

// ---------- 커뮤니티 ----------

export const postApi = {
  // sort: latest | popular → PageResponse<PostListResponse { postId, title, author{memberId,nickname}, likeCount, commentCount, viewCount, createdAt }>
  list: ({ q, sort = 'latest', page = 0, size = 20 } = {}) =>
    api.get(`/api/community/posts${qs({ q, sort, page, size })}`),
  // PostDetailResponse { postId, title, content, author, likeCount, likedByMe, commentCount, viewCount, createdAt, updatedAt, status }
  detail: (postId) => api.get(`/api/community/posts/${enc(postId)}`),
  // PostCreateRequest { title(≤100), content(≤5000) }
  create: (body) => api.post('/api/community/posts', body),
  update: (postId, body) => api.patch(`/api/community/posts/${enc(postId)}`, body),
  remove: (postId) => api.delete(`/api/community/posts/${enc(postId)}`),
  like: (postId) => api.post(`/api/community/posts/${enc(postId)}/likes`),
  unlike: (postId) => api.delete(`/api/community/posts/${enc(postId)}/likes`),
  report: (postId, body) => api.post(`/api/community/posts/${enc(postId)}/reports`, body),
};

export const commentApi = {
  // PageResponse<CommentListResponse { commentId, author, content, likeCount, likedByMe, createdAt, blinded }>
  list: (postId, { page = 0, size = 20 } = {}) =>
    api.get(`/api/community/posts/${enc(postId)}/comments${qs({ page, size })}`),
  // { content(1~500) }
  create: (postId, body) => api.post(`/api/community/posts/${enc(postId)}/comments`, body),
  update: (commentId, body) => api.patch(`/api/community/comments/${enc(commentId)}`, body),
  remove: (commentId) => api.delete(`/api/community/comments/${enc(commentId)}`),
  like: (commentId) => api.post(`/api/community/comments/${enc(commentId)}/likes`),
  unlike: (commentId) => api.delete(`/api/community/comments/${enc(commentId)}/likes`),
  report: (commentId, body) => api.post(`/api/community/comments/${enc(commentId)}/reports`, body),
};

// ---------- 개발자 후원 ----------

export const supportApi = {
  // { amount: 3000 | 6000 | 9000 } → SupportCreateResponse { paymentId, amount, orderName, storeId, channelKey }
  create: (amount) => api.post('/api/supports', { amount }),
  // SupportConfirmResponse { paymentId, status, result: COMPLETED|FAILED|PENDING, message }
  confirm: (paymentId) => api.post(`/api/supports/${enc(paymentId)}/confirm`),
};

// ---------- 관리자 (/api/admin/** → ADMIN) ----------

export const adminApi = {
  // PageResponse<MemberResponse>, status: ACTIVE | SUSPENDED | WITHDRAWN
  members: ({ status, page = 0, size = 20 } = {}) => api.get(`/api/admin/members${qs({ status, page, size })}`),
  releaseSuspension: (memberId) => api.patch(`/api/admin/members/${enc(memberId)}/status`),
  // PageResponse<AdminReportResponse { reportId, reporterId, targetType, targetId, reason, detail, status, … , movieId }>
  reports: ({ page = 0, size = 20 } = {}) => api.get(`/api/admin/reports${qs({ page, size })}`),
  // { status: ACCEPTED | REJECTED }
  processReport: (reportId, status) => api.patch(`/api/admin/reports/${enc(reportId)}`, { status }),
  blindPost: (postId) => api.patch(`/api/admin/posts/${enc(postId)}/blind`),
  blindReview: (reviewId) => api.patch(`/api/admin/reviews/${enc(reviewId)}/blind`),
  deleteComment: (commentId) => api.delete(`/api/admin/comments/${enc(commentId)}`),
  // 관리자 영화 수집은 Batch API 하나만 사용한다(C-03 결정). /api/admin/movies/sync?pages 는 쓰지 않는다.
  // → MovieBatchRunResponse { executionId, jobName, status } (200 완료 / 202 실행 중 / 409 CONCURRENT_REQUEST / 500)
  runMovieSyncBatch: () => api.post('/api/admin/batch/movies/sync'),
};
