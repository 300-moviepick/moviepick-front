import { useState } from 'react';
import { wishlistApi } from '../../api/moviepick';
import { useAsync } from '../../hooks/useAsync';
import { errorCodeOf, messageOf } from '../../lib/apiErrors';
import { formatDate } from '../../lib/format';
import { Badge } from '../../ui/Badge';
import Button from '../../ui/Button';
import MovieCard from '../../ui/cards/MovieCard';
import { IconArrowRight, IconBookmark, IconSparkles } from '../../ui/icons';
import Pagination from '../../ui/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import { useToast } from '../../ui/toast/useToast';
import MyPageHeader from './MyPageHeader';
import styles from './MyPage.module.css';

const PAGE_SIZE = 20;

// 내 찜 목록 (Stitch 5번). GET /api/members/me/wishlist (최근 찜한 순, 활성 영화만)
export default function WishlistScreen() {
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const list = useAsync(() => wishlistApi.listMine({ page, size: PAGE_SIZE }), [page]);

  const data = list.data;
  const movies = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const remove = async (movie) => {
    setBusyId(movie.movieId);
    try {
      await wishlistApi.remove(movie.movieId);
      toast.success(`‘${movie.title}’을(를) 찜 목록에서 뺐습니다.`);
    } catch (err) {
      // 이미 빠진 상태면 목록만 새로 고친다
      if (errorCodeOf(err) !== 'WISHLIST_NOT_FOUND') toast.error(messageOf(err));
    } finally {
      setBusyId(null);
      if (movies.length <= 1 && page > 0) setPage(page - 1);
      else list.reload();
    }
  };

  return (
    <div className={styles.page}>
      <MyPageHeader
        eyebrow="SAVED ARCHIVE"
        title="내 찜 목록"
        badge={!list.loading && !list.error && <Badge tone="soft">{total.toLocaleString('ko-KR')}편</Badge>}
        description="보고 싶은 영화를 모아 두는 공간입니다. 찜한 영화가 개봉하면 알림 센터로 알려 드립니다."
      />

      <div className={styles.toolbar}>
        <span className={styles.muted}>최근 찜한 순</span>
      </div>

      {list.loading && !data ? (
        <LoadingState variant="grid" count={8} />
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : movies.length === 0 ? (
        <EmptyState
          icon={<IconBookmark size={22} />}
          title="아직 찜한 영화가 없습니다"
          description="영화 상세나 탐색 화면에서 하트를 눌러 보고 싶은 영화를 모아 보세요."
          action={
            <Button to="/movies" iconRight={<IconArrowRight size={16} />}>
              영화 탐색하기
            </Button>
          }
        />
      ) : (
        <>
          <div className={`${styles.movieGrid} ${list.loading ? styles.stale : ''}`}>
            {movies.map((m) => (
              <MovieCard
                key={m.movieId}
                movie={m}
                wishlisted
                wishlistBusy={busyId === m.movieId}
                onToggleWishlist={remove}
                meta={<span title="찜한 날">찜 {formatDate(m.wishlistedAt)}</span>}
              />
            ))}
          </div>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={setPage}
            summary={`총 ${total.toLocaleString('ko-KR')}편`}
          />
        </>
      )}

      <section className={styles.cta}>
        <span className={styles.ctaIcon}>
          <IconSparkles size={20} />
        </span>
        <div className={styles.ctaText}>
          <strong>더 많은 영화를 채워 보고 싶으신가요?</strong>
          <p>새로 들어온 영화를 둘러보거나 MoviePick AI 추천으로 취향에 맞는 영화를 찾아보세요.</p>
        </div>
        <div className={styles.ctaActions}>
          <Button to="/movies" variant="secondary" size="sm">
            영화 탐색
          </Button>
          <Button to="/ai" variant="soft" size="sm">
            AI 추천
          </Button>
        </div>
      </section>
    </div>
  );
}
