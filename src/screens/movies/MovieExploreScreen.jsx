import { useSearchParams } from 'react-router-dom';
import { movieApi } from '../../api/moviepick';
import { useAuth } from '../../auth/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useWishlistSet } from '../../hooks/useWishlistSet';
import { toPageNumber } from '../../lib/format';
import { Badge, Chip } from '../../ui/Badge';
import Button from '../../ui/Button';
import MovieCard from '../../ui/cards/MovieCard';
import { IconArrowRight, IconClose, IconFilm, IconSearch, IconSparkles } from '../../ui/icons';
import Pagination from '../../ui/Pagination';
import SectionHeader from '../../ui/SectionHeader';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import { useToast } from '../../ui/toast/useToast';
import styles from './MovieExploreScreen.module.css';

const PAGE_SIZE = 20;

// 백엔드가 받는 sort는 생략(최근 등록순, id 내림차순)과 'releaseDate'(최신 개봉순)뿐이다. 그 밖의 값은 400
const SORTS = [
  { value: '', label: '최근 등록순' },
  { value: 'releaseDate', label: '최신 개봉순' },
];

/**
 * 영화 탐색·검색 (Stitch 9번). GET /api/movies?keyword&page&size&sort — 제목 검색 + 정렬 2가지.
 * 최신 개봉순은 한국 개봉일(없으면 원래 개봉일) 기준이고, 미개봉·개봉일 없는 영화는 빠진다.
 * 검색어·페이지·정렬은 쿼리스트링에 둔다.
 */
export default function MovieExploreScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const keyword = (params.get('keyword') ?? '').trim();
  const page = toPageNumber(params.get('page'));
  const sort = params.get('sort') === 'releaseDate' ? 'releaseDate' : '';

  const result = useAsync(
    () => movieApi.list({ keyword: keyword || undefined, page, size: PAGE_SIZE, sort: sort || undefined }),
    [keyword, page, sort],
  );
  const wish = useWishlistSet(Boolean(user), { onError: toast.error });

  // 바꾸지 않은 값(정렬 등)은 지금 값을 유지한다
  const setQuery = (next) => {
    const q = { keyword, sort, ...next };
    const sp = new URLSearchParams();
    if (q.keyword) sp.set('keyword', q.keyword);
    if (q.page) sp.set('page', String(q.page));
    if (q.sort) sp.set('sort', q.sort);
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
          <p>“비 오는 밤에 볼 잔잔한 영화”처럼 물어보면 MoviePick AI 추천이 어울리는 영화를 찾아 드립니다.</p>
        </div>
        <Button to="/ai" variant="secondary" size="sm" iconRight={<IconArrowRight size={14} />} className={styles.aiCta}>
          MoviePick AI 추천 보기
        </Button>
      </section>

      {/* 결과 */}
      <section className={styles.results} aria-labelledby="explore-results">
        <SectionHeader
          id="explore-results"
          title={keyword ? '검색 결과' : sort ? '최신 개봉작' : '새로 들어온 영화'}
          action={
            <div className={styles.sort} role="group" aria-label="정렬">
              {SORTS.map((s) => (
                <Chip key={s.value || 'default'} active={sort === s.value} onClick={() => setQuery({ sort: s.value, page: 0 })}>
                  {s.label}
                </Chip>
              ))}
            </div>
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
              onChange={(p) => setQuery({ page: p })}
              summary={`총 ${total.toLocaleString('ko-KR')}편 중 ${data.page * PAGE_SIZE + 1}–${data.page * PAGE_SIZE + movies.length}`}
            />
          </>
        )}
      </section>
    </div>
  );
}
