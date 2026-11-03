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
import PostDetailPage from './pages/PostDetailPage';
import PostListPage from './pages/PostListPage';
import SupportPage from './pages/SupportPage';
import LoginScreen from './screens/auth/LoginScreen';
import OAuthFailScreen from './screens/auth/OAuthFailScreen';
import OAuthSuccessScreen from './screens/auth/OAuthSuccessScreen';
import SignupScreen from './screens/auth/SignupScreen';
import BootSplash from './screens/BootSplash';
import CommunityListScreen from './screens/community/CommunityListScreen';
import PostDetailScreen from './screens/community/PostDetailScreen';
import { PostCreateScreen, PostEditScreen } from './screens/community/PostEditorScreen';
import HomeScreen from './screens/home/HomeScreen';
import MyReviewsScreen from './screens/me/MyReviewsScreen';
import NotificationSettingsScreen from './screens/me/NotificationSettingsScreen';
import NotificationsScreen from './screens/me/NotificationsScreen';
import ProfileScreen from './screens/me/ProfileScreen';
import WishlistScreen from './screens/me/WishlistScreen';
import SupportScreen from './screens/support/SupportScreen';
import MovieDetailScreen from './screens/movies/MovieDetailScreen';
import MovieExploreScreen from './screens/movies/MovieExploreScreen';
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

  // AuthContext가 CSRF·refresh·내 정보로 로그인 상태를 복구하는 동안 로고 로딩 화면을 보여 준다
  if (booting) return <BootSplash />;

  return (
    <ToastProvider>
      <Routes>
        {/* 사용자 화면 */}
        <Route element={<UserLayout />}>
          <Route index element={<HomeScreen />} />
          <Route path="movies" element={<MovieExploreScreen />} />
          <Route path="movies/:movieId" element={<MovieDetailScreen />} />
          <Route path="community" element={<CommunityListScreen />} />
          <Route path="community/:postId" element={<PostDetailScreen />} />
          <Route element={<RequireAuth />}>
            <Route path="community/new" element={<PostCreateScreen />} />
            <Route path="community/:postId/edit" element={<PostEditScreen />} />
            <Route path="me" element={<MyPageLayout />}>
              <Route index element={<Navigate to="/me/profile" replace />} />
              <Route path="profile" element={<ProfileScreen />} />
              <Route path="wishlist" element={<WishlistScreen />} />
              <Route path="reviews" element={<MyReviewsScreen />} />
              <Route path="notifications" element={<NotificationsScreen />} />
              <Route path="notification-settings" element={<NotificationSettingsScreen />} />
            </Route>
          </Route>
          <Route path="ai" element={<PendingScreen title="AI 영화 추천" stage={8} />} />
          <Route path="ai/credits" element={<PendingScreen title="AI 크레딧" stage={8} />} />
          <Route path="support" element={<SupportScreen />} />
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

        {/* 인증 화면. /oauth2/success, /oauth2/fail 은 백엔드가 리다이렉트하는 고정 경로 */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginScreen />} />
          <Route path="signup" element={<SignupScreen />} />
          <Route path="oauth2/success" element={<OAuthSuccessScreen />} />
          <Route path="oauth2/fail" element={<OAuthFailScreen />} />
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

        {/* 기존 화면 (새 UI 검증 전까지 유지). 기존 OAuthSuccessPage·OAuthFailPage 파일은 남겨 두되 경로에서는 뺐다 */}
        <Route element={<LegacyLayout />}>
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
