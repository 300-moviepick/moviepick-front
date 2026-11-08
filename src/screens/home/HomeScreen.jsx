import { Link, useNavigate } from 'react-router-dom';
import { movieApi, postApi } from '../../api/moviepick';
import { useAuth } from '../../auth/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useWishlistSet } from '../../hooks/useWishlistSet';
import { formatCount } from '../../lib/format';
import { Badge, RatingBadge } from '../../ui/Badge';
import Button from '../../ui/Button';
import MovieCard from '../../ui/cards/MovieCard';
import PostCard from '../../ui/cards/PostCard';
import { IconArrowRight, IconMessage, IconSearch, IconSparkles, IconStar } from '../../ui/icons';
import Poster from '../../ui/Poster';
import SectionHeader from '../../ui/SectionHeader';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import { useToast } from '../../ui/toast/useToast';
import styles from './HomeScreen.module.css';

// 메인 홈 (Stitch 0번)
export default function HomeScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  // 최근 개봉작: 한국 개봉일(없으면 원래 개봉일) 최신순, 미개봉 제외
  const movies = useAsync(() => movieApi.list({ page: 0, size: 8, sort: 'releaseDate' }), []);
  const ranking = useAsync(() => movieApi.ranking({ page: 0, size: 10 }), []);
  const posts = useAsync(() => postApi.list({ sort: 'popular', page: 0, size: 4 }), []);
  const wish = useWishlistSet(Boolean(user), { onError: toast.error });

  const onSearch = (e) => {
    e.preventDefault();
    const keyword = new FormData(e.currentTarget).get('keyword')?.toString().trim();
    navigate(keyword ? `/movies?keyword=${encodeURIComponent(keyword)}` : '/movies');
  };

  const movieList = movies.data?.content ?? [];
  const rankingList = ranking.data?.content ?? [];
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
            MoviePick AI 추천 바로가기 <Badge tone="tertiary">BETA</Badge>
          </Button>
        </div>
      </section>

      <div className={`mp-container ${styles.body}`}>
        {/* 영화 + 랭킹 */}
        <div className={styles.movieRow}>
          <section className={styles.movies} aria-labelledby="home-movies">
            <SectionHeader id="home-movies" title="최근 개봉작" />
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

          {/* GET /api/movies/ranking: 리뷰가 1개 이상인 영화만 대상(평점·리뷰 수 기반 점수) */}
          <aside className={styles.ranking} aria-labelledby="home-ranking">
            <div className={styles.rankPanel}>
              <h2 id="home-ranking" className={styles.rankTitle}>
                영화 랭킹 TOP 10
              </h2>
              <p className={styles.rankDesc}>MoviePick 리뷰 평점과 리뷰 수 기준</p>
              {ranking.loading && !ranking.data ? (
                <LoadingState variant="list" count={3} />
              ) : ranking.error ? (
                <ErrorState error={ranking.error} onRetry={ranking.reload} compact />
              ) : rankingList.length === 0 ? (
                <EmptyState
                  icon={<IconStar size={20} />}
                  title="아직 랭킹이 없습니다"
                  description="리뷰가 쌓이면 이곳에 랭킹이 표시됩니다."
                  compact
                />
              ) : (
                <ol className={styles.rankList}>
                  {rankingList.map((r) => (
                    <li key={r.movieId}>
                      <Link to={`/movies/${r.movieId}`} className={styles.rankItem}>
                        <span className={styles.rankNo}>{r.rank}</span>
                        <Poster src={r.posterUrl} alt={r.title} className={styles.rankPoster} />
                        <span className={styles.rankBody}>
                          <span className={styles.rankMovieTitle}>{r.title}</span>
                          <span className={styles.rankMeta}>
                            <RatingBadge value={r.averageRating} size="sm" label="MoviePick 평점" />
                            <span>리뷰 {formatCount(r.reviewCount)}</span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
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

        {/* AI 추천 소개 (/ai) */}
        <section className={styles.aiBanner} aria-labelledby="home-ai">
          <div className={styles.aiText}>
            <Badge tone="tertiary">AI CURATION</Badge>
            <h2 id="home-ai" className={styles.aiTitle}>
              나만의 영화 취향을 분석하는 <span className={styles.gradient}>MoviePick AI 추천</span>
            </h2>
            <p className={styles.aiDesc}>원하는 분위기를 자연어로 물어보면 어울리는 영화를 추천합니다.</p>
          </div>
          <div className={styles.aiActions}>
            <Button to="/ai" variant="secondary" iconRight={<IconArrowRight size={16} />}>
              자세히 보기
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
