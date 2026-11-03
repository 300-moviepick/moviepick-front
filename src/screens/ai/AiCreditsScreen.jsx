import { Badge } from '../../ui/Badge';
import Button from '../../ui/Button';
import { IconAlert, IconArrowLeft, IconClock, IconCoffee, IconLock, IconSparkles } from '../../ui/icons';
import { ComingSoon, EmptyState } from '../../ui/StateViews';
import styles from './Ai.module.css';

/**
 * AI 크레딧 충전소 & 이용 관리 (Stitch 14번) — 정식 "준비 중" 화면.
 * 어떤 결제 API도 호출하지 않는다(개발자 후원 /api/supports·PortOne과 무관).
 * 패키지 가격·크레딧 수·이용 내역은 정해지지 않았으므로 숫자를 표시하지 않는다.
 */
export default function AiCreditsScreen() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`mp-container ${styles.heroInner}`}>
          <Button to="/ai" variant="ghost" size="sm" icon={<IconArrowLeft size={14} />}>
            AI 영화 추천으로 돌아가기
          </Button>
          <div className={styles.badges}>
            <Badge tone="tertiary">CINEPHILE TOKEN HUB</Badge>
            <ComingSoon variant="badge" />
          </div>
          <h1 className={styles.title}>AI 크레딧 충전소 &amp; 이용 관리</h1>
          <p className={styles.desc}>AI 자연어 영화 추천에 사용할 크레딧을 충전하고 이용 내역을 확인하는 화면을 준비하고 있습니다.</p>
        </div>
      </section>

      <div className={`mp-container ${styles.body}`}>
        <section className={styles.policy} aria-labelledby="credit-policy">
          <span className={styles.policyIcon}>
            <IconAlert size={20} />
          </span>
          <div>
            <h2 id="credit-policy" className={styles.policyTitle}>
              개발자 후원과 AI 크레딧은 별개입니다
            </h2>
            <p>
              개발자 후원(커피 선물)은 서버 운영과 개발을 위한 자발적 기부이며, 후원을 해도 AI 크레딧은 지급되지 않습니다. AI 크레딧 구매는 출시 후 이 화면에서
              별도로 진행됩니다.
            </p>
          </div>
        </section>

        <div className={styles.statusGrid}>
          <ComingSoon variant="banner" title="보유 크레딧" description="크레딧 잔액 조회는 준비 중입니다." />
          <ComingSoon variant="banner" title="신규 가입 무료 이용권" description="무료 이용권 제공 여부와 횟수는 정식 출시 때 안내합니다." />
          <ComingSoon variant="banner" title="차감 규칙" description="질문 1회당 차감 기준과 하루 이용 한도는 정식 출시 때 확정됩니다." />
        </div>

        <section className={styles.section} aria-labelledby="credit-packages">
          <div className={styles.sectionHead}>
            <h2 id="credit-packages" className={styles.sectionTitle}>
              크레딧 충전 패키지
            </h2>
            <ComingSoon variant="badge" />
          </div>
          <p className={styles.muted}>패키지 구성과 가격은 아직 정해지지 않았습니다. 이 화면에서는 결제가 진행되지 않습니다.</p>
          <div className={styles.packages} inert aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={styles.packageCard}>
                <span className={styles.packageIcon}>
                  <IconSparkles size={18} />
                </span>
                <span className={styles.line} />
                <span className={`${styles.line} ${styles.lineShort}`} />
                <span className={styles.packagePrice}>가격 미정</span>
              </div>
            ))}
          </div>
          <div className={styles.payRow}>
            <span className={styles.muted}>
              <IconLock size={14} /> 결제 수단과 환불 정책은 출시 시 안내합니다.
            </span>
            <Button variant="primary" disabled icon={<IconSparkles size={16} />}>
              크레딧 충전하기 (준비 중)
            </Button>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="credit-history">
          <div className={styles.sectionHead}>
            <h2 id="credit-history" className={styles.sectionTitle}>
              크레딧 구매 및 이용 내역
            </h2>
            <ComingSoon variant="badge" />
          </div>
          <EmptyState
            icon={<IconClock size={22} />}
            title="표시할 내역이 없습니다"
            description="AI 크레딧 기능이 출시되면 충전·사용 내역이 이곳에 표시됩니다."
            compact
          />
        </section>

        <section className={styles.cta}>
          <div>
            <Badge tone="gold">PATRON</Badge>
            <h2 className={styles.ctaTitle}>MoviePick을 응원하고 싶다면</h2>
            <p className={styles.muted}>개발자 후원은 지금 바로 이용할 수 있습니다. (AI 크레딧 지급 없음)</p>
          </div>
          <div className={styles.ctaActions}>
            <Button to="/support" variant="secondary" icon={<IconCoffee size={16} />}>
              개발자 후원하기
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
