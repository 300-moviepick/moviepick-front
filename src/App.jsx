import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/useAuth';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';
import MyPageLayout from './layouts/MyPageLayout';
import UserLayout from './layouts/UserLayout';
import LoginScreen from './screens/auth/LoginScreen';
import OAuthFailScreen from './screens/auth/OAuthFailScreen';
import OAuthSuccessScreen from './screens/auth/OAuthSuccessScreen';
import SignupScreen from './screens/auth/SignupScreen';
import AdminContentScreen from './screens/admin/AdminContentScreen';
import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';
import AdminMembersScreen from './screens/admin/AdminMembersScreen';
import AdminMoviesScreen from './screens/admin/AdminMoviesScreen';
import AdminReportsScreen from './screens/admin/AdminReportsScreen';
import BootSplash from './screens/BootSplash';
import CommunityListScreen from './screens/community/CommunityListScreen';
import PostDetailScreen from './screens/community/PostDetailScreen';
import { PostCreateScreen, PostEditScreen } from './screens/community/PostEditorScreen';
import HomeScreen from './screens/home/HomeScreen';
import MyReviewsScreen from './screens/me/MyReviewsScreen';
import NotificationsScreen from './screens/me/NotificationsScreen';
import ProfileScreen from './screens/me/ProfileScreen';
import WishlistScreen from './screens/me/WishlistScreen';
import SupportScreen from './screens/support/SupportScreen';
import MovieDetailScreen from './screens/movies/MovieDetailScreen';
import MovieExploreScreen from './screens/movies/MovieExploreScreen';
import AiCreditsScreen from './screens/ai/AiCreditsScreen';
import AiRecommendScreen from './screens/ai/AiRecommendScreen';
import NotFoundScreen from './screens/NotFoundScreen';
import { RequireAdmin, RequireAuth } from './ui/Guards';
import { LoadingState } from './ui/StateViews';
import ToastProvider from './ui/toast/ToastProvider';
import './styles/tokens.css';
import './styles/base.css';

// 개발 서버에서만 여는 공통 컴포넌트 미리보기 (운영 빌드에서는 제거됨)
const UiGalleryScreen = import.meta.env.DEV ? lazy(() => import('./screens/dev/UiGalleryScreen')) : null;

/*
 * /oauth2/success, /oauth2/fail 은 백엔드가 리다이렉트하는 고정 경로라 바꾸지 않는다.
 * /ai, /ai/credits 는 소개 화면을 겸하므로 로그인 가드 밖에 두고, 각 화면이 로그인 안내를 보여 준다.
 * 백엔드 AI 기능이 꺼져 있으면(404 PATH_NOT_FOUND) 추천·충전 영역만 각 화면이 "준비 중"으로 표시한다.
 */
export default function App() {
  const { booting } = useAuth();

  // AuthProvider가 CSRF·refresh·내 정보로 로그인 상태를 복구하는 동안 로고 로딩 화면을 보여 준다
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
            </Route>
          </Route>
          <Route path="ai" element={<AiRecommendScreen />} />
          <Route path="ai/credits" element={<AiCreditsScreen />} />
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
          <Route index element={<AdminDashboardScreen />} />
          <Route path="members" element={<AdminMembersScreen />} />
          <Route path="reports" element={<AdminReportsScreen />} />
          <Route path="content" element={<AdminContentScreen />} />
          <Route path="movies" element={<AdminMoviesScreen />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
