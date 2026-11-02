import { Toggle } from '../../ui/Field';
import { ComingSoon } from '../../ui/StateViews';
import MyPageHeader from './MyPageHeader';
import styles from './MyPage.module.css';

// Stitch 4번 "큐레이션 및 활동 알림 설정"의 항목. 백엔드 설정 API가 없어 모두 동작하지 않는다.
const ITEMS = [
  { label: '찜 기반 주간 취향 맞춤 추천 알림', description: '찜한 영화를 바탕으로 한 주간 추천 리포트' },
  { label: '리뷰 및 커뮤니티 반응 알림', description: '내 글에 달린 댓글과 공감 소식' },
  { label: '개봉일 및 OTT 공개 알림', description: '찜한 영화의 개봉·스트리밍 공개 소식' },
  { label: '마케팅 및 이벤트 알림', description: '이벤트와 서비스 소식' },
];

// 알림 설정 (D-6: 별도 경로, 준비 중)
export default function NotificationSettingsScreen() {
  return (
    <div className={styles.page}>
      <MyPageHeader eyebrow="SETTINGS" title="알림 설정" description="받고 싶은 알림을 고를 수 있는 화면입니다." />
      <ComingSoon
        title="알림 수신 설정"
        description={'알림 종류별 수신 설정은 아직 제공되지 않습니다.\n현재는 찜한 영화가 개봉하면 알림 센터로 개봉 알림이 자동 발송됩니다.'}
      >
        <div className={styles.settingsList}>
          {ITEMS.map((item) => (
            <div key={item.label} className={styles.settingItem}>
              <Toggle label={item.label} description={item.description} disabled />
            </div>
          ))}
        </div>
      </ComingSoon>
    </div>
  );
}
