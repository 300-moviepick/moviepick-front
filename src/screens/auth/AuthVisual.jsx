import { IconBookmark, IconMessage, IconStar } from '../../ui/icons';
import styles from './Auth.module.css';

// 실제로 제공되는 기능만 소개한다(샘플 통계·준비 중 기능은 넣지 않음)
const FEATURES = [
  { icon: IconBookmark, title: '내 찜 목록', desc: '보고 싶은 영화를 모아 두고 개봉일에 알림을 받아 보세요.' },
  { icon: IconStar, title: '감상평과 평점', desc: '0.5점 단위 평점과 스포일러 표시로 감상을 기록하세요.' },
  { icon: IconMessage, title: '시네필 커뮤니티', desc: '영화 이야기를 나누고 다른 시네필과 소통하세요.' },
];

// 로그인·회원가입 왼쪽 장식 패널. 사진 대신 CSS로 영사기 빛 분위기를 만든다.
export default function AuthVisual({ variant = 'login', title, description }) {
  return (
    <aside className={`${styles.visual} ${styles[`visual_${variant}`]}`} aria-hidden={variant === 'login' ? true : undefined}>
      <div className={styles.beam} />
      <div className={styles.seats} />
      <div className={styles.visualBody}>
        <h2 className={styles.visualTitle}>{title}</h2>
        {description && <p className={styles.visualDesc}>{description}</p>}
        {variant === 'signup' && (
          <ul className={styles.features}>
            {FEATURES.map(({ icon: Icon, title: t, desc }) => (
              <li key={t}>
                <span className={styles.featureIcon}>
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{t}</strong>
                  <p>{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
