import { useSearchParams } from 'react-router-dom';
import { postApi } from '../../api/moviepick';
import { useAuth } from '../../auth/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { useGoLogin } from '../../hooks/useGoLogin';
import { Badge, Chip } from '../../ui/Badge';
import Button from '../../ui/Button';
import PostCard from '../../ui/cards/PostCard';
import { IconClose, IconEdit, IconInfo, IconMessage, IconSearch } from '../../ui/icons';
import Pagination from '../../ui/Pagination';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import Tabs from '../../ui/Tabs';
import styles from './Community.module.css';

const PAGE_SIZE = 20;
// 백엔드 정렬 값은 latest | popular 두 가지뿐
const SORTS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
];
// 카테고리 미리보기(백엔드 필드 없음)
const CATEGORIES = ['심층 비평·해석', '자유 수다·관람 후기', '개봉 예정·영화제 소식', '영화 추천 질문'];

function toPage(value) {
  const n = Number.parseInt(value ?? '0', 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// 커뮤니티 목록 (Stitch 8번). GET /api/community/posts?q&sort&page&size
export default function CommunityListScreen() {
  const { user } = useAuth();
  const goLogin = useGoLogin();
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const sort = params.get('sort') === 'popular' ? 'popular' : 'latest';
  const page = toPage(params.get('page'));

  const list = useAsync(() => postApi.list({ q: q || undefined, sort, page, size: PAGE_SIZE }), [q, sort, page]);

  const setQuery = (next) => {
    const merged = { q, sort, page, ...next };
    const sp = new URLSearchParams();
    if (merged.q) sp.set('q', merged.q);
    if (merged.sort !== 'latest') sp.set('sort', merged.sort);
    if (merged.page) sp.set('page', String(merged.page));
    setParams(sp);
  };

  const onSearch = (e) => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get('q')?.toString().trim() ?? '';
    setQuery({ q: value, page: 0 });
  };

  const data = list.data;
  const posts = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const writeButton = (
    <Button to={user ? '/community/new' : undefined} onClick={user ? undefined : goLogin} icon={<IconEdit size={16} />}>
      새 글 작성하기
    </Button>
  );

  return (
    <div className={`mp-container ${styles.page}`}>
      <section className={styles.listHero}>
        <div className={styles.listHeroText}>
          <Badge tone="primary">COMMUNITY HUB</Badge>
          <h1 className={styles.pageTitle}>시네마 라운지</h1>
          <p className={styles.pageDesc}>영화에 대한 감상과 해석, 추천을 자유롭게 나누는 공간입니다.</p>
        </div>
        {writeButton}
        <p className={styles.guide}>
          <IconInfo size={16} />
          서로 존중하는 대화를 나눠 주세요. 신고된 글과 댓글은 운영자 검토 후 숨김 처리될 수 있습니다.
        </p>
      </section>

      <div className={styles.categoryRow}>
        <Chip active>전체</Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c} disabled title="준비 중인 기능입니다">
            {c}
          </Chip>
        ))}
        <ComingSoon variant="badge" />
      </div>

      <div className={styles.toolbar}>
        <form className={styles.searchBox} role="search" onSubmit={onSearch} key={q}>
          <IconSearch size={18} />
          <label htmlFor="mp-community-search" className="mp-sr-only">
            게시글 검색
          </label>
          <input id="mp-community-search" name="q" type="search" defaultValue={q} maxLength={50} placeholder="제목·본문 검색" />
          {q && (
            <button type="button" className={styles.clear} onClick={() => setQuery({ q: '', page: 0 })} aria-label="검색어 지우기">
              <IconClose size={14} />
            </button>
          )}
        </form>
        <Tabs ariaLabel="게시글 정렬" items={SORTS} value={sort} onChange={(v) => setQuery({ sort: v, page: 0 })} />
      </div>

      <section aria-labelledby="community-list-title" className={styles.listSection}>
        <h2 id="community-list-title" className={styles.listTitle}>
          {q ? `‘${q}’ 검색 결과` : sort === 'popular' ? '인기 토론' : '최신 토론'}
          {!list.loading && !list.error && <span className={styles.count}>총 {total.toLocaleString('ko-KR')}개</span>}
        </h2>

        {list.loading && !data ? (
          <LoadingState variant="list" count={5} />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<IconMessage size={22} />}
            title={q ? '조건에 맞는 게시글이 없습니다' : '아직 게시글이 없습니다'}
            description={q ? '다른 검색어로 찾아보거나 새 글을 작성해 보세요.' : '첫 번째 영화 이야기를 남겨 보세요.'}
            action={
              <>
                {q && (
                  <Button variant="secondary" size="sm" onClick={() => setQuery({ q: '', page: 0 })}>
                    검색 초기화
                  </Button>
                )}
                {writeButton}
              </>
            }
          />
        ) : (
          <>
            <ul className={`${styles.postList} ${list.loading ? styles.stale : ''}`}>
              {posts.map((p) => (
                <li key={p.postId}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => setQuery({ page: p })} />
          </>
        )}
      </section>
    </div>
  );
}
