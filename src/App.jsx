import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';
import LegacyLayout from './layouts/LegacyLayout';
import MyPageLayout from './layouts/MyPageLayout';
import UserLayout from './layouts/UserLayout';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import MovieDetailPage from './pages/MovieDetailPage';
import MovieListPage from './pages/MovieListPage';
import OAuthFailPage from './pages/OAuthFailPage';
import OAuthSuccessPage from './pages/OAuthSuccessPage';
import PostDetailPage from './pages/PostDetailPage';
import PostListPage from './pages/PostListPage';
import SupportPage from './pages/SupportPage';
import NotFoundScreen from './screens/NotFoundScreen';
import PendingScreen from './screens/PendingScreen';
import { RequireAdmin, RequireAuth } from './ui/Guards';
import { LoadingState } from './ui/StateViews';
import ToastProvider from './ui/toast/ToastProvider';
import './styles/tokens.css';
import './styles/base.css';

// 개발 서버에서만 여는 공통 컴포넌트 미리보기 (운영 빌드에서는 제거됨)
const UiGalleryScreen = import.meta.env.DEV ? lazy(() => import('./screens/dev/UiGalleryScreen')) : null;

/*
 * 새 UI는 기본 경로에, 기존 화면은 /legacy/* 에 둔다(새 화면 검증 전까지 삭제하지 않음).
 * /oauth2/success, /oauth2/fail 은 백엔드가 리다이렉트하는 고정 경로라 바꾸지 않는다.
 * 아직 구현하지 않은 새 화면은 PendingScreen으로 자리만 잡아 둔다(단계별로 교체).
 */
export default function App() {
  const { booting } = useAuth();

  if (booting) {
    return (
      <div className="mp" style={{ display: 'grid', placeItems: 'center' }}>
        <LoadingState label="로그인 상태 확인 중…" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <Routes>
        {/* 사용자 화면 */}
        <Route element={<UserLayout />}>
          <Route index element={<PendingScreen title="메인 홈" stage={3} legacyTo="/legacy/movies" />} />
          <Route path="movies" element={<PendingScreen title="영화 탐색·검색" stage={3} legacyTo="/legacy/movies" />} />
          <Route path="movies/:movieId" element={<PendingScreen title="영화 상세" stage={3} legacyTo="/legacy/movies" />} />
          <Route path="community" element={<PendingScreen title="커뮤니티" stage={4} legacyTo="/legacy/community" />} />
          <Route path="community/:postId" element={<PendingScreen title="게시글 상세" stage={4} legacyTo="/legacy/community" />} />
          <Route element={<RequireAuth />}>
            <Route path="community/new" element={<PendingScreen title="게시글 작성" stage={4} />} />
            <Route path="community/:postId/edit" element={<PendingScreen title="게시글 수정" stage={4} />} />
            <Route path="me" element={<MyPageLayout />}>
              <Route index element={<Navigate to="/me/profile" replace />} />
              <Route path="profile" element={<PendingScreen title="프로필 및 계정 설정" stage={5} padded={false} />} />
              <Route path="wishlist" element={<PendingScreen title="내 찜 목록" stage={5} padded={false} />} />
              <Route path="reviews" element={<PendingScreen title="작성한 리뷰 관리" stage={5} padded={false} />} />
              <Route path="notifications" element={<PendingScreen title="알림 센터" stage={5} padded={false} />} />
              <Route path="notification-settings" element={<PendingScreen title="알림 설정" stage={5} padded={false} />} />
            </Route>
          </Route>
          <Route path="ai" element={<PendingScreen title="AI 영화 추천" stage={8} />} />
          <Route path="ai/credits" element={<PendingScreen title="AI 크레딧" stage={8} />} />
          <Route path="support" element={<PendingScreen title="개발자 후원" stage={6} legacyTo="/legacy/support" />} />
          {UiGalleryScreen && (
            <Route
              path="__ui"
              element={
                <Suspense fallback={<LoadingState />}>
                  <UiGalleryScreen />
                </Suspense>
              }
            />
          )}
          <Route path="*" element={<NotFoundScreen />} />
        </Route>

        {/* 인증 화면 */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<PendingScreen title="로그인" stage={2} legacyTo="/legacy/login" />} />
          <Route path="signup" element={<PendingScreen title="회원가입" stage={2} legacyTo="/legacy/login" />} />
        </Route>

        {/* 관리자 화면 */}
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<PendingScreen title="관리자 대시보드" stage={7} legacyTo="/legacy/admin" padded={false} />} />
          <Route path="members" element={<PendingScreen title="회원 관리" stage={7} legacyTo="/legacy/admin" padded={false} />} />
          <Route path="reports" element={<PendingScreen title="신고 관리" stage={7} legacyTo="/legacy/admin" padded={false} />} />
          <Route path="content" element={<PendingScreen title="콘텐츠 관리" stage={7} padded={false} />} />
          <Route path="movies" element={<PendingScreen title="영화 데이터 관리" stage={7} legacyTo="/legacy/admin" padded={false} />} />
        </Route>

        {/* 기존 화면 (새 UI 검증 전까지 유지). 소셜 로그인 결과 화면은 2단계에서 새 화면으로 교체 */}
        <Route element={<LegacyLayout />}>
          <Route path="oauth2/success" element={<OAuthSuccessPage />} />
          <Route path="oauth2/fail" element={<OAuthFailPage />} />
          <Route path="legacy">
            <Route index element={<Navigate to="/legacy/movies" replace />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="movies" element={<MovieListPage />} />
            <Route path="movies/:id" element={<MovieDetailPage />} />
            <Route path="community" element={<PostListPage />} />
            <Route path="community/:id" element={<PostDetailPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="support" element={<SupportPage />} />
          </Route>
        </Route>
      </Routes>
    </ToastProvider>
  );
}
