import { useSearchParams } from 'react-router-dom';
import { movieApi } from '../../api/moviepick';
import { useAuth } from '../../auth/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { useWishlistSet } from '../../hooks/useWishlistSet';
import { Badge, Chip } from '../../ui/Badge';
import Button from '../../ui/Button';
import MovieCard from '../../ui/cards/MovieCard';
import { Checkbox } from '../../ui/Field';
import { IconArrowRight, IconClose, IconFilm, IconSearch, IconSliders, IconSparkles } from '../../ui/icons';
import Pagination from '../../ui/Pagination';
import SectionHeader from '../../ui/SectionHeader';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import { useToast } from '../../ui/toast/useToast';
import styles from './MovieExploreScreen.module.css';

const PAGE_SIZE = 20;

// 고급 필터 미리보기(백엔드 필터 API가 없어 동작하지 않음)
const GENRES = ['SF', '액션', '드라마', '스릴러', '로맨스', '애니메이션', '공포', '코미디'];
const YEARS = ['2020년대', '2010년대', '2000년대', '1990년대'];

function toPageNumber(value) {
  const n = Number.parseInt(value ?? '0', 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// 영화 탐색·검색 (Stitch 9번). GET /api/movies?keyword&page&size — 제목 검색만 지원, 정렬은 서버 고정(id 내림차순)
export default function MovieExploreScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const keyword = (params.get('keyword') ?? '').trim();
  const page = toPageNumber(params.get('page'));

  const result = useAsync(() => movieApi.list({ keyword: keyword || undefined, page, size: PAGE_SIZE }), [keyword, page]);
  const wish = useWishlistSet(Boolean(user), { onError: toast.error });

  const setQuery = (next) => {
    const sp = new URLSearchParams();
    if (next.keyword) sp.set('keyword', next.keyword);
    if (next.page) sp.set('page', String(next.page));
    setParams(sp);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSearch = (e) => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get('keyword')?.toString().trim() ?? '';
    setQuery({ keyword: value, page: 0 });
  };

  const data = result.data;
  const movies = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  return (
    <div className={`mp-container ${styles.page}`}>
      {/* 검색 */}
      <section className={styles.searchPanel} aria-label="영화 검색">
        <form className={styles.searchRow} role="search" onSubmit={onSearch} key={keyword}>
          <div className={styles.searchBox}>
            <IconSearch size={20} />
            <label htmlFor="mp-explore-search" className="mp-sr-only">
              영화 제목
            </label>
            <input
              id="mp-explore-search"
              name="keyword"
              type="search"
              defaultValue={keyword}
              placeholder="영화 제목으로 검색"
              autoComplete="off"
            />
            {keyword && (
              <button type="button" className={styles.clear} onClick={() => setQuery({ keyword: '', page: 0 })} aria-label="검색어 지우기">
                <IconClose size={16} />
              </button>
            )}
          </div>
          <Button type="submit" size="lg" icon={<IconSearch size={18} />}>
            검색
          </Button>
        </form>
        <div className={styles.searchMeta}>
          {keyword ? (
            <span>
              <strong className={styles.keyword}>‘{keyword}’</strong> 검색 결과
            </span>
          ) : (
            <span>전체 영화</span>
          )}
          {!result.loading && !result.error && (
            <span>
              총 <strong>{total.toLocaleString('ko-KR')}</strong>편
            </span>
          )}
        </div>
      </section>

      {/* AI 내비게이터 안내 */}
      <section className={styles.aiNav}>
        <span className={styles.aiIcon}>
          <IconSparkles size={20} />
        </span>
        <div className={styles.aiText}>
          <strong>
            자연어로 영화를 찾고 싶다면 <Badge tone="tertiary">BETA</Badge>
          </strong>
          <p>“비 오는 밤에 볼 잔잔한 영화”처럼 물어보는 AI 추천 기능을 준비하고 있습니다.</p>
        </div>
        <Button to="/ai" variant="secondary" size="sm" iconRight={<IconArrowRight size={14} />} className={styles.aiCta}>
          AI 추천 보기
        </Button>
      </section>

      <div className={styles.layout}>
        {/* 고급 필터: 준비 중 */}
        <aside className={styles.filters} aria-label="정밀 탐색 필터">
          <ComingSoon title="정밀 탐색 필터" description="장르·연도·평점·OTT 필터는 아직 제공되지 않습니다.">
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>
                <IconSliders size={16} /> 장르
              </span>
              <div className={styles.chipWrap}>
                {GENRES.map((g) => (
                  <Chip key={g} disabled>
                    {g}
                  </Chip>
                ))}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>개봉 연도</span>
              <div className={styles.chipWrap}>
                {YEARS.map((y) => (
                  <Chip key={y} disabled>
                    {y}
                  </Chip>
                ))}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>시청 가능 OTT</span>
              <Checkbox label="스트리밍 중인 영화만" disabled />
            </div>
          </ComingSoon>
        </aside>

        {/* 결과 */}
        <section className={styles.results} aria-labelledby="explore-results">
          <SectionHeader
            id="explore-results"
            title={keyword ? '검색 결과' : '새로 들어온 영화'}
            action={
              <span className={styles.sortSoon} title="정렬 기능은 준비 중입니다">
                정렬: 최근 등록순 <ComingSoon variant="badge" />
              </span>
            }
          />

          {result.loading && !data ? (
            <LoadingState variant="grid" count={10} />
          ) : result.error ? (
            <ErrorState error={result.error} onRetry={result.reload} />
          ) : movies.length === 0 ? (
            <EmptyState
              icon={<IconFilm size={22} />}
              title={keyword ? '검색어와 일치하는 영화가 없습니다' : '아직 등록된 영화가 없습니다'}
              description={keyword ? '철자를 확인하거나 다른 제목으로 검색해 보세요.' : '영화 데이터가 수집되면 이곳에 표시됩니다.'}
              action={
                keyword && (
                  <Button variant="secondary" size="sm" onClick={() => setQuery({ keyword: '', page: 0 })}>
                    전체 영화 보기
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div className={`${styles.grid} ${result.loading ? styles.stale : ''}`} aria-busy={result.loading}>
                {movies.map((m) => (
                  <MovieCard
                    key={m.movieId}
                    movie={m}
                    wishlisted={wish.isWishlisted(m.movieId)}
                    wishlistBusy={wish.isBusy(m.movieId)}
                    onToggleWishlist={() => wish.toggle(m.movieId)}
                  />
                ))}
              </div>
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onChange={(p) => setQuery({ keyword, page: p })}
                summary={`총 ${total.toLocaleString('ko-KR')}편 중 ${data.page * PAGE_SIZE + 1}–${data.page * PAGE_SIZE + movies.length}`}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
