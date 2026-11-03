import { useState } from 'react';
import { notificationApi } from '../../api/moviepick';
import { useAsync } from '../../hooks/useAsync';
import { useUnread } from '../../hooks/unreadContext';
import { notifyNotificationsChanged } from '../../hooks/useUnreadCount';
import { messageOf } from '../../lib/apiErrors';
import { Badge } from '../../ui/Badge';
import Button from '../../ui/Button';
import NotificationCard from '../../ui/cards/NotificationCard';
import { IconBell, IconCheck, IconSliders } from '../../ui/icons';
import Pagination from '../../ui/Pagination';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import Tabs from '../../ui/Tabs';
import { useToast } from '../../ui/toast/useToast';
import MyPageHeader from './MyPageHeader';
import styles from './MyPage.module.css';

const PAGE_SIZE = 20;
// 현재 알림 종류는 MOVIE_RELEASE(찜한 영화 개봉) 하나뿐이라 분류 탭은 "전체"만 동작한다
const TABS = [
  { value: 'all', label: '전체' },
  { value: 'weekly', label: '주간 취향 추천', disabled: true },
  { value: 'community', label: '리뷰 및 커뮤니티', disabled: true },
  { value: 'notice', label: '서비스 공지', disabled: true },
];

/**
 * 알림 센터 (Stitch 7번).
 * GET /api/notifications, PATCH /{notificationId}/read, PATCH /read-all.
 * 읽음 처리 후에는 헤더·사이드바 배지를 다시 조회하도록 이벤트를 보낸다. 삭제 API는 없다.
 */
export default function NotificationsScreen() {
  const toast = useToast();
  const unread = useUnread();
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [allBusy, setAllBusy] = useState(false);
  const list = useAsync(() => notificationApi.list({ page, size: PAGE_SIZE }), [page]);

  const data = list.data;
  const items = data?.content ?? [];
  const hasUnread = (unread ?? 0) > 0 || items.some((n) => !n.read);

  const setRead = (ids) =>
    list.setData((d) => d && { ...d, content: d.content.map((n) => (ids === 'all' || ids.includes(n.notificationId) ? { ...n, read: true } : n)) });

  const markRead = async (n) => {
    setBusyId(n.notificationId);
    try {
      await notificationApi.markRead(n.notificationId);
      setRead([n.notificationId]);
      notifyNotificationsChanged();
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setBusyId(null);
    }
  };

  // 영화로 이동할 때 읽음 처리는 화면 이동을 막지 않도록 결과를 기다리지 않는다
  const onOpen = (n) => {
    if (n.read) return;
    notificationApi
      .markRead(n.notificationId)
      .then(notifyNotificationsChanged)
      .catch(() => {});
  };

  const markAll = async () => {
    setAllBusy(true);
    try {
      const res = await notificationApi.markAllRead();
      setRead('all');
      notifyNotificationsChanged();
      toast.success(res?.updatedCount ? `알림 ${res.updatedCount}개를 읽음으로 표시했습니다.` : '읽지 않은 알림이 없습니다.');
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setAllBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <MyPageHeader
        eyebrow="NOTIFICATIONS"
        title="알림 센터"
        badge={unread > 0 && <Badge tone="secondary">읽지 않은 알림 {unread}개</Badge>}
        description="찜한 영화의 개봉 소식을 확인하세요."
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<IconCheck size={16} />} onClick={markAll} loading={allBusy} disabled={!hasUnread}>
              모두 읽음으로 표시
            </Button>
            <Button to="/me/notification-settings" variant="ghost" size="sm" icon={<IconSliders size={16} />}>
              알림 설정
            </Button>
          </>
        }
      />

      <div className={`${styles.toolbar} ${styles.toolbarTabs}`}>
        <Tabs ariaLabel="알림 분류" items={TABS} value="all" />
        <ComingSoon variant="badge" />
      </div>

      {list.loading && !data ? (
        <LoadingState variant="list" count={4} />
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconBell size={22} />}
          title="받은 알림이 없습니다"
          description="영화를 찜해 두면 개봉일에 이곳으로 알림이 도착합니다."
          action={
            <Button to="/movies" variant="secondary" size="sm">
              영화 찜하러 가기
            </Button>
          }
        />
      ) : (
        <>
          <ul className={`${styles.notiList} ${list.loading ? styles.stale : ''}`}>
            {items.map((n) => (
              <li key={n.notificationId}>
                <NotificationCard notification={n} onRead={markRead} readBusy={busyId === n.notificationId} onOpen={onOpen} />
              </li>
            ))}
          </ul>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={setPage}
            summary={`전체 ${data.totalElements.toLocaleString('ko-KR')}개`}
          />
        </>
      )}
      <p className={styles.footnote}>
        알림은 실시간으로 전달되지 않으며, 화면을 이동하거나 창으로 돌아올 때 새로 확인합니다. 공개가 중지된 영화의 알림은 상세 화면이 열리지 않을 수 있습니다.
      </p>
    </div>
  );
}
