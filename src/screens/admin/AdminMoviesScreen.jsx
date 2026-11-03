import { useState } from 'react';
import { Link } from 'react-router-dom';
import { movieApi } from '../../api/moviepick';
import { useAsync } from '../../hooks/useAsync';
import { formatCount, formatDate } from '../../lib/format';
import { RatingBadge } from '../../ui/Badge';
import Button from '../../ui/Button';
import { IconExternal, IconFilm, IconRefresh, IconSearch } from '../../ui/icons';
import Pagination from '../../ui/Pagination';
import Poster from '../../ui/Poster';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import AdminPageHeader from './AdminPageHeader';
import MovieSyncPanel from './MovieSyncPanel';
import styles from './Admin.module.css';

const PAGE_SIZE = 20;

/**
 * 영화 데이터 관리 (Stitch 19번).
 * - 수집: POST /api/admin/batch/movies/sync (MovieSyncPanel)
 * - 목록: 공개 영화 목록 GET /api/movies (관리자 전용 목록·숨김 영화 조회 API는 없음)
 * - 스케줄러 상태, 수집 이력, KOBIS 연동, 메타데이터 재동기화는 백엔드 API가 없어 준비 중
 */
export default function AdminMoviesScreen() {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const list = useAsync(() => movieApi.list({ keyword: keyword || undefined, page, size: PAGE_SIZE }), [keyword, page]);
  const movies = list.data?.content ?? [];

  return (
    <div className={styles.page}>
      <AdminPageHeader
        crumb="DATA PIPELINE & ARCHIVE"
        title="영화 데이터 수집 및 아카이브 관리"
        description="TMDB 영화 수집 Batch를 실행하고 공개 중인 영화 목록을 확인합니다."
        actions={
          <Button variant="secondary" icon={<IconRefresh size={16} />} onClick={list.reload}>
            목록 새로고침
          </Button>
        }
      />

      <div className={styles.moviesLayout}>
        <section className={styles.panel} aria-labelledby="admin-movies-list">
          <div className={styles.panelHead}>
            <h2 id="admin-movies-list" className={styles.panelTitle}>
              <IconFilm size={18} /> 공개 영화 {list.data ? `${formatCount(list.data.totalElements)}편` : ''}
            </h2>
            <form
              className={styles.searchBox}
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                setKeyword(new FormData(e.currentTarget).get('keyword')?.toString().trim() ?? '');
                setPage(0);
              }}
            >
              <IconSearch size={16} />
              <input name="keyword" type="search" defaultValue={keyword} placeholder="영화 제목 검색" aria-label="영화 제목 검색" />
            </form>
          </div>

          {list.loading && !list.data ? (
            <LoadingState variant="list" count={5} />
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.reload} />
          ) : movies.length === 0 ? (
            <EmptyState icon={<IconFilm size={22} />} title={keyword ? '검색 결과가 없습니다' : '수집된 영화가 없습니다'} compact />
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={`${styles.table} ${list.loading ? styles.stale : ''}`}>
                  <thead>
                    <tr>
                      <th>영화</th>
                      <th>개봉일</th>
                      <th>TMDB</th>
                      <th>MoviePick</th>
                      <th>리뷰</th>
                      <th aria-label="이동" />
                    </tr>
                  </thead>
                  <tbody>
                    {movies.map((m) => (
                      <tr key={m.movieId}>
                        <td>
                          <span className={styles.movieCell}>
                            <Poster src={m.posterUrl} alt={m.title} className={styles.thumb} />
                            <span>
                              <strong>{m.title}</strong>
                              <small>#{m.movieId}</small>
                            </span>
                          </span>
                        </td>
                        <td className={styles.mono}>{formatDate(m.releaseDate) || '-'}</td>
                        <td className={styles.mono}>{m.voteAverage != null ? Number(m.voteAverage).toFixed(1) : '-'}</td>
                        <td>
                          <RatingBadge value={m.averageRating} size="sm" emptyText="없음" />
                        </td>
                        <td className={styles.mono}>{formatCount(m.reviewCount)}</td>
                        <td className={styles.actionsCell}>
                          <Link to={`/movies/${m.movieId}`} target="_blank" rel="noopener noreferrer" className={styles.iconLink} aria-label={`${m.title} 상세 새 창`}>
                            <IconExternal size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={list.data.page} totalPages={list.data.totalPages} onChange={setPage} />
            </>
          )}
          <p className={styles.footnote}>공개(활성) 영화만 표시됩니다. 영화 숨김·수정, KOBIS·TMDB 연계 ID 조회는 준비 중입니다.</p>
        </section>

        <div className={styles.stack}>
          <MovieSyncPanel onFinished={list.reload} />
          <ComingSoon variant="banner" title="배치 스케줄러 상태" description="예약 수집 설정과 실행 상태 조회는 준비 중입니다." />
          <ComingSoon variant="banner" title="수집 & 동기화 이력" description="Batch 실행 이력·실패 로그 조회 API가 없어 준비 중입니다." />
        </div>
      </div>
    </div>
  );
}
