import { Link } from 'react-router-dom';
import { adminApi, movieApi, postApi, reviewApi } from '../../api/moviepick';
import { useAsync } from '../../hooks/useAsync';
import { formatCount } from '../../lib/format';
import { Badge } from '../../ui/Badge';
import Button from '../../ui/Button';
import StatCard from '../../ui/cards/StatCard';
import { IconArrowRight, IconFileText, IconFilm, IconFlag, IconMessage, IconUsers } from '../../ui/icons';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import AdminPageHeader from './AdminPageHeader';
import { labelOf, REPORT_REASON, REPORT_STATUS, REPORT_TARGET } from './adminLabels';
import MovieSyncPanel from './MovieSyncPanel';
import styles from './Admin.module.css';

// 집계 전용 API가 없어서, 목록 API를 size=1로 불러 totalElements만 쓴다(값이 있는 항목만)
const totalOf = (p) => p.then((page) => page?.totalElements ?? 0);

async function loadCounts() {
  const entries = await Promise.allSettled([
    totalOf(adminApi.members({ size: 1 })),
    totalOf(adminApi.members({ status: 'SUSPENDED', size: 1 })),
    totalOf(adminApi.reports({ size: 1 })),
    totalOf(postApi.list({ size: 1 })),
    totalOf(reviewApi.listAll({ size: 1 })),
    totalOf(movieApi.list({ size: 1 })),
  ]);
  const [members, suspended, reports, posts, reviews, movies] = entries.map((e) => (e.status === 'fulfilled' ? e.value : null));
  return { members, suspended, reports, posts, reviews, movies };
}

const shown = (v) => (v === null ? '-' : formatCount(v));

// 통합 운영 대시보드 (Stitch 15번)
export default function AdminDashboardScreen() {
  const counts = useAsync(loadCounts, []);
  const reports = useAsync(() => adminApi.reports({ page: 0, size: 5 }), []);
  const c = counts.data;
  const loading = counts.loading && !c;
  const recent = reports.data?.content ?? [];

  return (
    <div className={styles.page}>
      <AdminPageHeader
        crumb="DASHBOARD"
        title="통합 운영 대시보드"
        description="회원·신고·콘텐츠·영화 데이터 현황을 한눈에 확인합니다."
      />

      <div className={`${styles.statGrid} ${styles.statGrid4}`}>
        <StatCard
          label="전체 회원"
          value={c ? shown(c.members) : undefined}
          unit="명"
          hint={c && c.suspended !== null ? `이용 정지 ${formatCount(c.suspended)}명` : undefined}
          icon={<IconUsers size={18} />}
          tone="primary"
          loading={loading}
        />
        <StatCard label="누적 신고" value={c ? shown(c.reports) : undefined} unit="건" hint="처리 대기 건수 집계는 준비 중" icon={<IconFlag size={18} />} tone="danger" loading={loading} />
        <StatCard label="공개 게시글" value={c ? shown(c.posts) : undefined} unit="개" hint="숨김·삭제 글 제외" icon={<IconFileText size={18} />} loading={loading} />
        <StatCard label="등록 리뷰" value={c ? shown(c.reviews) : undefined} unit="개" hint="공개 영화 기준" icon={<IconMessage size={18} />} loading={loading} />
      </div>

      <div className={styles.twoCol}>
        <section className={styles.panel} aria-labelledby="dash-reports">
          <div className={styles.panelHead}>
            <h2 id="dash-reports" className={styles.panelTitle}>
              <IconFlag size={18} /> 신고 접수 내역
            </h2>
            <Button to="/admin/reports" variant="ghost" size="sm" iconRight={<IconArrowRight size={14} />}>
              신고 관리
            </Button>
          </div>
          {reports.loading && !reports.data ? (
            <LoadingState variant="list" count={3} />
          ) : reports.error ? (
            <ErrorState error={reports.error} onRetry={reports.reload} compact />
          ) : recent.length === 0 ? (
            <EmptyState icon={<IconFlag size={22} />} title="접수된 신고가 없습니다" compact />
          ) : (
            <ul className={styles.miniList}>
              {recent.map((r) => {
                const target = labelOf(REPORT_TARGET, r.targetType);
                const status = labelOf(REPORT_STATUS, r.status);
                return (
                  <li key={r.reportId}>
                    <Link to={`/admin/reports?focus=${r.reportId}`} className={styles.miniRow}>
                      <Badge tone={target.tone}>{target.label}</Badge>
                      <span className={styles.miniText}>
                        {r.postTitle || r.reviewContentPreview || r.postContentPreview || `#${r.targetId}`}
                        <small>{REPORT_REASON[r.reason] ?? r.reason}</small>
                      </span>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <p className={styles.footnote}>신고 목록은 서버가 정렬 없이 돌려주므로 최신순이 아닐 수 있습니다.</p>
        </section>

        <div className={styles.stack}>
          <MovieSyncPanel compact onFinished={counts.reload} />
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>
                <IconFilm size={18} /> 공개 영화
              </h2>
              <strong className={styles.bigNumber}>{loading ? '…' : `${shown(c?.movies ?? null)}편`}</strong>
            </div>
            <Button to="/admin/movies" variant="ghost" size="sm" iconRight={<IconArrowRight size={14} />}>
              영화 데이터 관리
            </Button>
          </section>
        </div>
      </div>

      <div className={styles.twoCol}>
        <ComingSoon variant="banner" title="최근 관리자 처리 내역" description="관리자 조치 이력(감사 로그) 조회 기능은 준비 중입니다." />
        <ComingSoon variant="banner" title="가입·이용 추이 통계" description="일별 가입, 게시글·리뷰 추이, 후원 합계 등 통계는 준비 중입니다." />
      </div>
    </div>
  );
}
