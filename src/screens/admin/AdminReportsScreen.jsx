import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/moviepick';
import { useAsync } from '../../hooks/useAsync';
import { messageOf } from '../../lib/apiErrors';
import { formatCount } from '../../lib/format';
import { Badge, Chip } from '../../ui/Badge';
import Button from '../../ui/Button';
import { IconExternal, IconFlag, IconInfo } from '../../ui/icons';
import { ConfirmDialog } from '../../ui/Modal';
import Pagination from '../../ui/Pagination';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import { useToast } from '../../ui/toast/useToast';
import AdminPageHeader from './AdminPageHeader';
import { labelOf, REPORT_REASON, REPORT_STATUS, REPORT_TARGET } from './adminLabels';
import styles from './Admin.module.css';

const PAGE_SIZE = 20;

// 신고 대상으로 이동할 주소. 댓글 신고에는 부모 게시글 ID가 응답에 없어 이동할 수 없다.
function targetLink(r) {
  if (r.targetType === 'POST') return `/community/${r.targetId}`;
  if (r.targetType === 'REVIEW' && r.movieId) return `/movies/${r.movieId}`;
  return null;
}

const ACTION_TEXT = {
  ACCEPTED: {
    title: '신고를 승인할까요?',
    message: '신고 대상이 숨김 처리되고, 작성자에게 누적 제재가 적용될 수 있습니다(서버 정책).',
    confirm: '승인(조치)',
    done: '신고를 승인했습니다.',
  },
  REJECTED: {
    title: '신고를 반려할까요?',
    message: '신고 대상은 그대로 유지됩니다.',
    confirm: '반려',
    done: '신고를 반려했습니다.',
  },
};

/**
 * 신고 관리 (Stitch 16번). GET /api/admin/reports?page&size, PATCH /api/admin/reports/{reportId} { status }
 * 상태·유형 필터와 검색은 서버 기능이 없어 준비 중으로 둔다(현재 페이지만 거르면 결과가 틀리므로 하지 않음).
 */
export default function AdminReportsScreen() {
  const toast = useToast();
  const [params] = useSearchParams();
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(() => Number(params.get('focus')) || null);
  const [action, setAction] = useState(null); // { report, status }
  const [busy, setBusy] = useState(false);

  const list = useAsync(() => adminApi.reports({ page, size: PAGE_SIZE }), [page]);
  const reports = list.data?.content ?? [];
  const selected = reports.find((r) => r.reportId === selectedId) ?? null;

  const process = async () => {
    setBusy(true);
    try {
      const updated = await adminApi.processReport(action.report.reportId, action.status);
      list.setData((d) => d && { ...d, content: d.content.map((r) => (r.reportId === updated.reportId ? updated : r)) });
      toast.success(ACTION_TEXT[action.status].done);
      setAction(null);
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  const link = selected ? targetLink(selected) : null;

  return (
    <div className={styles.page}>
      <AdminPageHeader
        crumb="INCIDENT QUEUE"
        title="신고 관리"
        subtitle="Report Management"
        description="게시글·댓글·리뷰 신고를 확인하고 승인 또는 반려합니다."
      />

      <div className={styles.toolbar}>
        <div className={styles.chips}>
          <Chip active>전체 {list.data ? formatCount(list.data.totalElements) : ''}</Chip>
          <Chip disabled>처리 대기</Chip>
          <Chip disabled>처리 완료</Chip>
          <Chip disabled>게시글 · 댓글 · 리뷰</Chip>
          <ComingSoon variant="badge" />
        </div>
        <span className={styles.muted}>서버가 정렬 없이 돌려주므로 최신순이 아닐 수 있습니다</span>
      </div>

      <div className={styles.masterDetail}>
        <section className={styles.panel} aria-label="신고 목록">
          {list.loading && !list.data ? (
            <LoadingState variant="list" count={5} />
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.reload} />
          ) : reports.length === 0 ? (
            <EmptyState icon={<IconFlag size={22} />} title="접수된 신고가 없습니다" compact />
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={`${styles.table} ${list.loading ? styles.stale : ''}`}>
                  <thead>
                    <tr>
                      <th>신고 번호</th>
                      <th>유형</th>
                      <th>대상 콘텐츠 / 사유</th>
                      <th>신고자</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => {
                      const target = labelOf(REPORT_TARGET, r.targetType);
                      const st = labelOf(REPORT_STATUS, r.status);
                      return (
                        <tr key={r.reportId} className={r.reportId === selectedId ? styles.rowSelected : ''} onClick={() => setSelectedId(r.reportId)}>
                          <td className={styles.mono}>#{r.reportId}</td>
                          <td>
                            <Badge tone={target.tone}>{target.label}</Badge>
                          </td>
                          <td className={styles.ellipsisCell}>
                            <strong>{r.postTitle || r.reviewContentPreview || r.postContentPreview || `${target.label} #${r.targetId}`}</strong>
                            <small>{REPORT_REASON[r.reason] ?? r.reason}</small>
                          </td>
                          <td className={styles.mono}>#{r.reporterId}</td>
                          <td>
                            <Badge tone={st.tone}>{st.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={list.data.page} totalPages={list.data.totalPages} onChange={setPage} />
            </>
          )}
        </section>

        <aside className={styles.panel} aria-label="신고 상세">
          {selected ? (
            <>
              <div className={styles.detailHead}>
                <div>
                  <p className={styles.crumb}>INCIDENT DETAIL</p>
                  <strong className={styles.detailTitle}>#{selected.reportId}</strong>
                </div>
                <Badge tone={labelOf(REPORT_STATUS, selected.status).tone} className={styles.push}>
                  {labelOf(REPORT_STATUS, selected.status).label}
                </Badge>
              </div>
              <dl className={styles.kv}>
                <dt>신고 유형</dt>
                <dd>{labelOf(REPORT_TARGET, selected.targetType).label}</dd>
                <dt>대상 번호</dt>
                <dd>#{selected.targetId}</dd>
                <dt>신고 사유</dt>
                <dd>{REPORT_REASON[selected.reason] ?? selected.reason}</dd>
                <dt>신고자</dt>
                <dd>#{selected.reporterId}</dd>
                {selected.authorNickname && (
                  <>
                    <dt>작성자</dt>
                    <dd>{selected.authorNickname}</dd>
                  </>
                )}
              </dl>

              {(selected.postTitle || selected.postContentPreview || selected.reviewContentPreview) && (
                <div className={styles.preview}>
                  <span className={styles.previewLabel}>신고 대상 원본 미리보기</span>
                  {selected.postTitle && <strong>{selected.postTitle}</strong>}
                  <p>{selected.reviewContentPreview || selected.postContentPreview}</p>
                </div>
              )}
              {selected.detail && (
                <div className={styles.preview}>
                  <span className={styles.previewLabel}>신고자 상세 사유</span>
                  <p>{selected.detail}</p>
                </div>
              )}

              {link ? (
                <Button to={link} variant="ghost" size="sm" iconRight={<IconExternal size={14} />} target="_blank" rel="noopener noreferrer">
                  대상 원본 새 창에서 보기
                </Button>
              ) : (
                <p className={styles.footnote}>
                  <IconInfo size={14} /> 댓글 신고는 원래 게시글 정보가 응답에 없어 바로 이동할 수 없습니다.
                </p>
              )}

              {selected.status === 'PENDING' ? (
                <div className={styles.actionRow}>
                  <Button variant="danger" onClick={() => setAction({ report: selected, status: 'ACCEPTED' })}>
                    승인 (숨김 조치)
                  </Button>
                  <Button variant="secondary" onClick={() => setAction({ report: selected, status: 'REJECTED' })}>
                    반려
                  </Button>
                </div>
              ) : (
                <p className={styles.muted}>이미 처리된 신고입니다.</p>
              )}
              <ComingSoon variant="banner" title="작성자 경고 발송 · 처리 메모" description="추가 운영 조치는 준비 중입니다." />
            </>
          ) : (
            <EmptyState icon={<IconFlag size={22} />} title="신고를 선택하세요" description="목록에서 신고를 누르면 상세 내용과 처리 버튼이 표시됩니다." compact />
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(action)}
        title={action ? ACTION_TEXT[action.status].title : ''}
        message={action ? `#${action.report.reportId} · ${ACTION_TEXT[action.status].message}` : ''}
        confirmText={action ? ACTION_TEXT[action.status].confirm : ''}
        danger={action?.status === 'ACCEPTED'}
        loading={busy}
        onConfirm={process}
        onClose={() => setAction(null)}
      />
    </div>
  );
}
