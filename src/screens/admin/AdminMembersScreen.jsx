import { useState } from 'react';
import { adminApi } from '../../api/moviepick';
import { useAsync } from '../../hooks/useAsync';
import { messageOf } from '../../lib/apiErrors';
import { formatCount } from '../../lib/format';
import { Badge } from '../../ui/Badge';
import Button from '../../ui/Button';
import { IconUsers } from '../../ui/icons';
import { ConfirmDialog } from '../../ui/Modal';
import Pagination from '../../ui/Pagination';
import { Avatar } from '../../ui/Poster';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import Tabs from '../../ui/Tabs';
import { useToast } from '../../ui/toast/useToast';
import AdminPageHeader from './AdminPageHeader';
import { labelOf, MEMBER_ROLE, MEMBER_STATUS } from './adminLabels';
import styles from './Admin.module.css';

const PAGE_SIZE = 20;
const STATUS_TABS = ['ALL', 'ACTIVE', 'SUSPENDED', 'WITHDRAWN'];

async function loadTabCounts() {
  const res = await Promise.allSettled(
    STATUS_TABS.map((s) => adminApi.members({ status: s === 'ALL' ? undefined : s, size: 1 }).then((p) => p?.totalElements ?? 0)),
  );
  return Object.fromEntries(STATUS_TABS.map((s, i) => [s, res[i].status === 'fulfilled' ? res[i].value : null]));
}

/**
 * 회원 관리 (Stitch 17번). GET /api/admin/members?status&page&size, PATCH /api/admin/members/{memberId}/status(정지 해제)
 * 응답은 MemberResponse { memberId, email, nickname, role, status }뿐이라 가입 방식·접속 기록·제재 이력은 보여 줄 수 없다.
 */
export default function AdminMembersScreen() {
  const toast = useToast();
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [releasing, setReleasing] = useState(null);
  const [busy, setBusy] = useState(false);

  const counts = useAsync(loadTabCounts, []);
  const list = useAsync(() => adminApi.members({ status: status === 'ALL' ? undefined : status, page, size: PAGE_SIZE }), [status, page]);

  const members = list.data?.content ?? [];
  const selected = members.find((m) => m.memberId === selectedId) ?? null;

  const release = async () => {
    setBusy(true);
    try {
      const updated = await adminApi.releaseSuspension(releasing.memberId);
      list.setData((d) => d && { ...d, content: d.content.map((m) => (m.memberId === updated.memberId ? updated : m)) });
      counts.reload();
      toast.success(`${releasing.nickname}님의 이용 정지를 해제했습니다.`);
      setReleasing(null);
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  const tabItems = STATUS_TABS.map((s) => ({
    value: s,
    label: s === 'ALL' ? '전체 회원' : MEMBER_STATUS[s].label,
    count: counts.data?.[s] != null ? formatCount(counts.data[s]) : undefined,
  }));

  return (
    <div className={styles.page}>
      <AdminPageHeader
        crumb="USER MANAGEMENT"
        title="회원 관리"
        subtitle="Member Directory"
        description="가입 회원을 상태별로 조회하고 이용 정지를 해제합니다."
      />

      <div className={styles.toolbar}>
        <Tabs
          ariaLabel="회원 상태"
          items={tabItems}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
            setSelectedId(null);
          }}
        />
      </div>

      <div className={styles.masterDetail}>
        <section className={styles.panel} aria-label="회원 목록">
          {list.loading && !list.data ? (
            <LoadingState variant="list" count={5} />
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.reload} />
          ) : members.length === 0 ? (
            <EmptyState icon={<IconUsers size={22} />} title="해당 상태의 회원이 없습니다" compact />
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={`${styles.table} ${list.loading ? styles.stale : ''}`}>
                  <thead>
                    <tr>
                      <th>회원</th>
                      <th>이메일</th>
                      <th>권한</th>
                      <th>상태</th>
                      <th aria-label="조치" />
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const st = labelOf(MEMBER_STATUS, m.status);
                      const role = labelOf(MEMBER_ROLE, m.role);
                      return (
                        <tr
                          key={m.memberId}
                          className={m.memberId === selectedId ? styles.rowSelected : ''}
                          onClick={() => setSelectedId(m.memberId)}
                        >
                          <td>
                            <span className={styles.member}>
                              <Avatar name={m.nickname} size={30} />
                              <span>
                                <strong>{m.nickname}</strong>
                                <small>#{m.memberId}</small>
                              </span>
                            </span>
                          </td>
                          <td className={styles.ellipsis}>{m.email}</td>
                          <td>
                            <Badge tone={role.tone}>{role.label}</Badge>
                          </td>
                          <td>
                            <Badge tone={st.tone}>{st.label}</Badge>
                          </td>
                          <td className={styles.actionsCell}>
                            {m.status === 'SUSPENDED' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReleasing(m);
                                }}
                              >
                                정지 해제
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={list.data.page}
                totalPages={list.data.totalPages}
                onChange={setPage}
                summary={`총 ${formatCount(list.data.totalElements)}명`}
              />
            </>
          )}
        </section>

        <aside className={styles.panel} aria-label="회원 상세">
          {selected ? (
            <>
              <div className={styles.detailHead}>
                <Avatar name={selected.nickname} size={48} />
                <div>
                  <strong className={styles.detailTitle}>{selected.nickname}</strong>
                  <p className={styles.muted}>{selected.email}</p>
                </div>
              </div>
              <dl className={styles.kv}>
                <dt>회원 번호</dt>
                <dd>#{selected.memberId}</dd>
                <dt>권한</dt>
                <dd>{labelOf(MEMBER_ROLE, selected.role).label}</dd>
                <dt>상태</dt>
                <dd>{labelOf(MEMBER_STATUS, selected.status).label}</dd>
              </dl>
              {selected.status === 'SUSPENDED' && (
                <Button variant="secondary" block onClick={() => setReleasing(selected)}>
                  이용 정지 해제
                </Button>
              )}
              <ComingSoon
                variant="banner"
                title="가입 방식 · 제재 이력 · 경고 발송"
                description="회원 상세 정보와 수동 정지·권한 변경 기능은 준비 중입니다."
              />
            </>
          ) : (
            <EmptyState icon={<IconUsers size={22} />} title="회원을 선택하세요" description="목록에서 회원을 누르면 상세 정보가 표시됩니다." compact />
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(releasing)}
        title="이용 정지를 해제할까요?"
        message={releasing ? `${releasing.nickname}(#${releasing.memberId})님은 바로 서비스를 다시 이용할 수 있게 됩니다.` : ''}
        confirmText="정지 해제"
        loading={busy}
        onConfirm={release}
        onClose={() => setReleasing(null)}
      />
    </div>
  );
}
