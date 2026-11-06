import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { movieApi } from '../../api/moviepick';
import { useAuth } from '../../auth/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useGoLogin } from '../../hooks/useGoLogin';
import { useWishlistSet } from '../../hooks/useWishlistSet';
import { formatCount, formatDate, formatRuntime, releaseDateOf, tmdbImage, yearOf } from '../../lib/format';
import { Badge } from '../../ui/Badge';
import Button from '../../ui/Button';
import { IconArrowLeft, IconBookmark, IconClock, IconFilm, IconPlay, IconShare, IconSparkles, IconStar } from '../../ui/icons';
import Modal from '../../ui/Modal';
import Poster from '../../ui/Poster';
import SectionHeader from '../../ui/SectionHeader';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import Tabs from '../../ui/Tabs';
import { useToast } from '../../ui/toast/useToast';
import { CastSection, OttSection } from './MovieExtras';
import ReviewSection from './ReviewSection';
import styles from './MovieDetail.module.css';

const SECTIONS = [
  { value: 'md-info', label: '주요 정보' },
  { value: 'md-cast', label: '출연 / 제작' },
  { value: 'md-reviews', label: '리뷰' },
  { value: 'md-ai', label: 'AI 취향 분석' },
];

// 영화 상세 (Stitch 3번). 본문은 GET /api/movies/{movieId}, 확장 정보는 /extras를 따로 불러온다.
export default function MovieDetailScreen() {
  const { movieId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const goLogin = useGoLogin();
  const [tab, setTab] = useState('md-info');
  const [trailerOpen, setTrailerOpen] = useState(false);

  const detail = useAsync(() => movieApi.detail(movieId), [movieId, user?.memberId]);
  const extras = useAsync(() => movieApi.extras(movieId), [movieId, user?.memberId]);
  const wish = useWishlistSet(Boolean(user), { onError: toast.error });

  const movie = detail.data && String(detail.data.movieId) === String(movieId) ? detail.data : null;

  if (!movie) {
    if (detail.error) {
      const notFound = detail.error instanceof ApiError && (detail.error.status === 404 || detail.error.status === 400);
      return (
        <div className={`mp-container ${styles.statePage}`}>
          {notFound ? (
            <EmptyState
              icon={<IconFilm size={22} />}
              title="영화를 찾을 수 없습니다"
              description="삭제되었거나 공개가 중지된 영화일 수 있습니다."
              action={
                <Button to="/movies" variant="secondary" icon={<IconArrowLeft size={16} />}>
                  영화 탐색으로
                </Button>
              }
            />
          ) : (
            <ErrorState error={detail.error} onRetry={detail.reload} />
          )}
        </div>
      );
    }
    return (
      <div className={`mp-container ${styles.statePage}`}>
        <LoadingState label="영화 정보를 불러오는 중…" />
      </div>
    );
  }

  const wishlisted = wish.isWishlisted(movie.movieId);
  const trailer = extras.data?.trailer;
  const backdrop = tmdbImage(movie.backdropPath, 'w1280');

  const scrollTo = (sectionId) => {
    setTab(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('영화 주소를 복사했습니다.');
    } catch {
      toast.error('주소를 복사하지 못했습니다.');
    }
  };

  const onWish = () => (user ? wish.toggle(movie.movieId) : goLogin());

  return (
    <div className={styles.page}>
      {/* 히어로 */}
      <section className={styles.hero}>
        {backdrop && <div className={styles.backdrop} style={{ backgroundImage: `url(${backdrop})` }} aria-hidden="true" />}
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={`mp-container ${styles.heroInner}`}>
          <Poster src={movie.posterUrl} alt={movie.title} className={styles.poster} />
          <div className={styles.heroInfo}>
            <div className={styles.metaRow}>
              {movie.genres.map((g) => (
                <Badge key={g.genreId} tone="primary">
                  {g.name}
                </Badge>
              ))}
              {/* TMDB adult 값(성인 콘텐츠 여부). 국내 관람 등급 정보는 없다 */}
              {movie.adult && <Badge tone="danger">성인 콘텐츠</Badge>}
              {movie.runtimeMinutes ? (
                <span className={styles.meta}>
                  <IconClock size={14} /> {formatRuntime(movie.runtimeMinutes)}
                </span>
              ) : null}
              {/* 상세 응답에는 releaseDateKr이 없어 지금은 releaseDate가 표시된다 (백엔드 추가 시 자동 반영) */}
              {releaseDateOf(movie) && <span className={styles.meta}>{formatDate(releaseDateOf(movie))} 개봉</span>}
            </div>
            <h1 className={styles.title}>{movie.title}</h1>
            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p className={styles.original}>
                {movie.originalTitle}
                {releaseDateOf(movie) && ` (${yearOf(releaseDateOf(movie))})`}
              </p>
            )}

            <div className={styles.actions}>
              <Button
                variant={wishlisted ? 'danger' : 'primary'}
                icon={<IconBookmark size={18} filled={wishlisted} />}
                onClick={onWish}
                disabled={wish.isBusy(movie.movieId)}
                aria-pressed={user ? Boolean(wishlisted) : undefined}
              >
                {wishlisted ? '찜 완료' : '찜하기'}
              </Button>
              {trailer && (
                <Button variant="secondary" icon={<IconPlay size={16} />} onClick={() => setTrailerOpen(true)}>
                  예고편 재생
                </Button>
              )}
              {movie.myReviewId && (
                <Button variant="secondary" icon={<IconStar size={16} />} onClick={() => scrollTo('md-reviews')}>
                  내 리뷰 보기
                </Button>
              )}
              <Button variant="ghost" icon={<IconShare size={16} />} onClick={share}>
                공유
              </Button>
            </div>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>MoviePick 평점</span>
                <span className={styles.statValue}>
                  {movie.averageRating != null ? Number(movie.averageRating).toFixed(1) : '-'}
                  <small>/ 5.0</small>
                </span>
                <span className={styles.statSub}>{formatCount(movie.reviewCount)}명 참여</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>TMDB 평점</span>
                <span className={styles.statValue}>
                  {movie.voteAverage != null ? Number(movie.voteAverage).toFixed(1) : '-'}
                  <small>/ 10</small>
                </span>
                <span className={styles.statSub}>{movie.voteCount != null ? `${formatCount(movie.voteCount)}명 참여` : '참여 정보 없음'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={`mp-container ${styles.tabsBar}`}>
        <Tabs variant="underline" ariaLabel="상세 정보 이동" items={SECTIONS} value={tab} onChange={scrollTo} />
      </div>

      <div className={`mp-container ${styles.layout}`}>
        <div className={styles.main}>
          <section className={styles.section} id="md-info" aria-labelledby="md-info-title">
            <SectionHeader id="md-info-title" title="줄거리" />
            <p className={styles.overview}>{movie.overview || '등록된 줄거리가 없습니다.'}</p>
          </section>

          <section className={styles.section} id="md-cast" aria-labelledby="md-cast-title">
            <SectionHeader id="md-cast-title" title="감독 및 주요 출연진" />
            <CastSection extras={extras} />
          </section>

          <section className={styles.section} id="md-ai" aria-labelledby="md-ai-title">
            <SectionHeader id="md-ai-title" title="MoviePick AI 취향 분석" badge={<Badge tone="tertiary">BETA</Badge>} />
            <ComingSoon
              variant="banner"
              title="AI 취향 분석 리포트"
              description="내 감상 기록을 바탕으로 이 영화와의 취향 일치도를 알려 주는 기능을 준비하고 있습니다."
            />
          </section>

          <ReviewSection
            id="md-reviews"
            movieId={movie.movieId}
            myReviewId={movie.myReviewId}
            reviewCount={movie.reviewCount}
            onChanged={detail.reload}
            onLogin={goLogin}
          />
        </div>

        <aside className={styles.side}>
          <section className={styles.sideCard} aria-labelledby="md-ott-title">
            <h2 id="md-ott-title" className={styles.sideTitle}>
              시청 가능 OTT 플랫폼
            </h2>
            <OttSection extras={extras} />
          </section>
          <section className={styles.sideCard} aria-labelledby="md-similar-title">
            <h2 id="md-similar-title" className={styles.sideTitle}>
              <IconSparkles size={18} /> 이 영화와 비슷한 작품
            </h2>
            <ComingSoon variant="banner" title="비슷한 작품 추천" description="장르·감독 기반 유사 작품 추천을 준비하고 있습니다." />
          </section>
        </aside>
      </div>

      {trailer && (
        <Modal open={trailerOpen} title={trailer.name || `${movie.title} 예고편`} onClose={() => setTrailerOpen(false)} size="lg">
          <div className={styles.trailer}>
            {/* 열었을 때만 YouTube를 불러온다(쿠키 최소화 도메인 사용) */}
            {trailerOpen && (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.youtubeKey)}?autoplay=1&rel=0`}
                title={`${movie.title} 예고편`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
