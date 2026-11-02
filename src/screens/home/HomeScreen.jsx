import { useNavigate } from 'react-router-dom';
import { movieApi, postApi } from '../../api/moviepick';
import { useAuth } from '../../auth/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { useWishlistSet } from '../../hooks/useWishlistSet';
import { Badge, Chip } from '../../ui/Badge';
import Button from '../../ui/Button';
import MovieCard from '../../ui/cards/MovieCard';
import PostCard from '../../ui/cards/PostCard';
import { IconArrowRight, IconBell, IconMessage, IconSearch, IconSparkles } from '../../ui/icons';
import SectionHeader from '../../ui/SectionHeader';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import { useToast } from '../../ui/toast/useToast';
import styles from './HomeScreen.module.css';

// 백엔드에 정렬·필터가 없어 "전체"만 동작한다(나머지는 준비 중)
const MOVIE_TABS = ['현재 상영작', 'OTT 공개작', '평점 높은 순', '신규 개봉'];

// 메인 홈 (Stitch 0번)
export default function HomeScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const movies = useAsync(() => movieApi.list({ page: 0, size: 8 }), []);
  const posts = useAsync(() => postApi.list({ sort: 'popular', page: 0, size: 4 }), []);
  const wish = useWishlistSet(Boolean(user), { onError: toast.error });

  const onSearch = (e) => {
    e.preventDefault();
    const keyword = new FormData(e.currentTarget).get('keyword')?.toString().trim();
    navigate(keyword ? `/movies?keyword=${encodeURIComponent(keyword)}` : '/movies');
  };

  const movieList = movies.data?.content ?? [];
  const postList = posts.data?.content ?? [];

  return (
    <div className={styles.page}>
      {/* 히어로 */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={`mp-container ${styles.heroInner}`}>
          <Badge tone="primary">MOVIEPICK CINEMA DISCOVERY</Badge>
          <h1 className={styles.heroTitle}>
            오늘은 어떤 영화를 <span className={styles.gradient}>보고 싶으세요?</span>
          </h1>
          <p className={styles.heroDesc}>영화를 찾고, 감상을 기록하고, 다른 시네필과 이야기를 나눠 보세요.</p>
          <form className={styles.heroSearch} role="search" onSubmit={onSearch}>
            <IconSearch size={22} />
            <label htmlFor="mp-hero-search" className="mp-sr-only">
              영화 제목 검색
            </label>
            <input id="mp-hero-search" name="keyword" type="search" placeholder="영화 제목으로 검색해 보세요" autoComplete="off" />
            <Button type="submit" iconRight={<IconArrowRight size={16} />}>
              검색
            </Button>
          </form>
          <Button to="/ai" variant="secondary" icon={<IconSparkles size={18} />} className={styles.aiLink}>
            AI 영화 추천 바로가기 <Badge tone="tertiary">BETA</Badge>
          </Button>
        </div>
      </section>

      <div className={`mp-container ${styles.body}`}>
        {/* 영화 + 랭킹 */}
        <div className={styles.movieRow}>
          <section className={styles.movies} aria-labelledby="home-movies">
            <SectionHeader
              id="home-movies"
              title="새로 들어온 영화"
              badge={<Badge tone="secondary">NEW</Badge>}
              action={
                <div className={styles.chips}>
                  <Chip active>전체</Chip>
                  {MOVIE_TABS.map((t) => (
                    <Chip key={t} disabled title="준비 중인 기능입니다">
                      {t}
                    </Chip>
                  ))}
                  <ComingSoon variant="badge" />
                </div>
              }
            />
            {movies.loading && !movies.data ? (
              <LoadingState variant="grid" count={8} />
            ) : movies.error ? (
              <ErrorState error={movies.error} onRetry={movies.reload} compact />
            ) : movieList.length === 0 ? (
              <EmptyState title="아직 등록된 영화가 없습니다" description="영화 데이터가 수집되면 이곳에 표시됩니다." compact />
            ) : (
              <div className={styles.grid}>
                {movieList.map((m) => (
                  <MovieCard
                    key={m.movieId}
                    movie={m}
                    wishlisted={wish.isWishlisted(m.movieId)}
                    wishlistBusy={wish.isBusy(m.movieId)}
                    onToggleWishlist={() => wish.toggle(m.movieId)}
                  />
                ))}
              </div>
            )}
            <div className={styles.more}>
              <Button to="/movies" variant="secondary" iconRight={<IconArrowRight size={16} />}>
                더 많은 영화 탐색하기
              </Button>
            </div>
          </section>

          <aside className={styles.ranking} aria-label="실시간 영화 랭킹">
            <ComingSoon
              title="실시간 영화 랭킹 TOP 10"
              description="평점·관심도 기준 랭킹은 아직 제공되지 않습니다. 데이터가 준비되면 이곳에 표시됩니다."
            >
              <ol className={styles.rankPreview}>
                {Array.from({ length: 6 }, (_, i) => (
                  <li key={i}>
                    <span className={styles.rankNo}>{i + 1}</span>
                    <span className={styles.rankBar} />
                  </li>
                ))}
              </ol>
            </ComingSoon>
          </aside>
        </div>

        {/* 커뮤니티 인기글 */}
        <section className={styles.section} aria-labelledby="home-community">
          <SectionHeader
            id="home-community"
            accent="secondary"
            title="영화 팬들의 실시간 수다방"
            sub="커뮤니티 인기글"
            action={
              <Button to="/community" variant="ghost" size="sm" iconRight={<IconArrowRight size={16} />}>
                전체 보기
              </Button>
            }
          />
          {posts.loading && !posts.data ? (
            <LoadingState variant="list" count={2} />
          ) : posts.error ? (
            <ErrorState error={posts.error} onRetry={posts.reload} compact />
          ) : postList.length === 0 ? (
            <EmptyState
              icon={<IconMessage size={22} />}
              title="아직 게시글이 없습니다"
              description="첫 번째 영화 이야기를 남겨 보세요."
              action={
                <Button to="/community/new" size="sm">
                  글쓰기
                </Button>
              }
              compact
            />
          ) : (
            <div className={styles.postGrid}>
              {postList.map((p) => (
                <PostCard key={p.postId} post={p} variant="compact" />
              ))}
            </div>
          )}
        </section>

        {/* AI 소개 (백엔드 없음) */}
        <section className={styles.aiBanner} aria-labelledby="home-ai">
          <div className={styles.aiText}>
            <Badge tone="tertiary">AI CURATION</Badge>
            <h2 id="home-ai" className={styles.aiTitle}>
              나만의 영화 취향을 분석하는 <span className={styles.gradient}>AI MoviePick</span>
            </h2>
            <p className={styles.aiDesc}>원하는 분위기를 자연어로 물어보면 맞춤 영화를 추천하는 기능을 준비하고 있습니다.</p>
          </div>
          <div className={styles.aiActions}>
            <ComingSoon variant="badge" />
            <Button to="/ai" variant="secondary" icon={<IconBell size={16} />}>
              자세히 보기
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
