import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { aiCreditApi } from '../../api/moviepick';
import { useAuth } from '../../auth/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useGoLogin } from '../../hooks/useGoLogin';
import { usePortonePayment } from '../../hooks/usePortonePayment';
import { isAiOff } from '../../lib/apiErrors';
import { formatCount, formatDateTime, toPageNumber } from '../../lib/format';
import { Badge } from '../../ui/Badge';
import Button from '../../ui/Button';
import StatCard from '../../ui/cards/StatCard';
import { IconAlert, IconArrowLeft, IconCheck, IconCheckCircle, IconClock, IconCoffee, IconInfo, IconLock, IconSparkles } from '../../ui/icons';
import Pagination from '../../ui/Pagination';
import PaymentStatusPanel from '../../ui/PaymentStatusPanel';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import styles from './Ai.module.css';

const HISTORY_SIZE = 10;

const STEPS = ['구매 주문 생성', '결제창에서 결제', '결제 결과 확인'];

const RESULT_VIEW = {
  COMPLETED: { tone: 'success', title: '크레딧 충전이 완료되었습니다', icon: IconCheckCircle },
  FAILED: { tone: 'error', title: '결제가 완료되지 않았습니다', icon: IconAlert },
  PENDING: { tone: 'pending', title: '결제 확인 중입니다', icon: IconClock },
};

const EVENT_LABEL = {
  FREE_GRANT: '무료 지급',
  PURCHASE: '충전',
  USE: '추천 사용',
  COMPLETE: '추천 완료',
  RESTORE: '실패 복구',
};

const won = (n) => `${Number(n).toLocaleString('ko-KR')}원`;
const signed = (n) => (n > 0 ? `+${n}` : String(n));

/**
 * AI 크레딧 충전소 & 이용 관리 (Stitch 14번).
 * - 잔액 GET /api/ai/credits, 내역 GET /api/ai/credits/transactions: AI가 꺼져 있어도 동작한다
 * - 상품 GET /api/ai/credits/products, 구매 생성 POST /api/ai/credits/purchases: AI가 꺼져 있으면 404 PATH_NOT_FOUND → 충전 영역만 준비 중
 * - 결제 흐름(PortOne 결제창, 모바일 복귀 /ai/credits?paymentId=…)은 후원과 같은 usePortonePayment를 쓰고,
 *   confirm 응답의 credits로 잔액을 바로 갱신한다
 * 가격·크레딧 수는 상품 목록 응답 값만 쓴다(프론트에 가격을 두지 않는다).
 */
export default function AiCreditsScreen() {
  const { user } = useAuth();
  const goLogin = useGoLogin();
  const [params, setParams] = useSearchParams();
  const page = toPageNumber(params.get('page'));
  const memberId = user?.memberId;

  const balance = useAsync(() => (memberId ? aiCreditApi.balance() : null), [memberId]);
  const products = useAsync(() => (memberId ? aiCreditApi.products() : null), [memberId]);
  const history = useAsync(() => (memberId ? aiCreditApi.transactions({ page, size: HISTORY_SIZE }) : null), [memberId, page]);
  const [productCode, setProductCode] = useState(null);

  const { flow, start, recheck } = usePortonePayment({
    create: aiCreditApi.purchase,
    confirm: aiCreditApi.confirm,
    redirectUrl: `${window.location.origin}/ai/credits`,
    onConfirmed: (res) => {
      if (res?.credits) balance.setData(res.credits);
      if (res?.result === 'COMPLETED') history.reload();
    },
  });

  const productList = products.data ?? [];
  const selected = productList.find((p) => p.productCode === productCode) ?? productList[0];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`mp-container ${styles.heroInner}`}>
          <Button to="/ai" variant="ghost" size="sm" icon={<IconArrowLeft size={14} />}>
            MoviePick AI 추천으로 돌아가기
          </Button>
          <div className={styles.badges}>
            <Badge tone="tertiary">AI CREDITS</Badge>
          </div>
          <h1 className={styles.title}>AI 크레딧 충전소 &amp; 이용 관리</h1>
          <p className={styles.desc}>MoviePick AI 추천에 쓸 크레딧을 충전하고 이용 내역을 확인합니다.</p>
        </div>
      </section>

      <div className={`mp-container ${styles.body}`}>
        <section className={styles.policy} aria-labelledby="credit-policy">
          <span className={styles.policyIcon}>
            <IconInfo size={20} />
          </span>
          <div>
            <h2 id="credit-policy" className={styles.policyTitle}>
              개발자 후원과 AI 크레딧은 별개입니다
            </h2>
            <p>
              개발자 후원(커피 선물)은 서버 운영과 개발을 위한 자발적 기부이며, 후원을 해도 AI 크레딧은 지급되지 않습니다. AI 크레딧 구매는 이 화면에서 별도로
              진행됩니다.
            </p>
          </div>
        </section>

        {!user ? (
          <EmptyState
            icon={<IconLock size={22} />}
            title="로그인이 필요합니다"
            description="크레딧 잔액 확인과 충전은 로그인 후 이용할 수 있습니다."
            action={
              <Button size="sm" onClick={goLogin}>
                로그인하고 이용하기
              </Button>
            }
          />
        ) : (
          <>
            {/* 잔액 */}
            {balance.error && !balance.data ? (
              <ErrorState error={balance.error} title="크레딧 잔액을 불러오지 못했습니다" onRetry={balance.reload} compact />
            ) : (
              <div className={styles.statusGrid}>
                <StatCard
                  label="보유 크레딧"
                  value={balance.data ? formatCount(balance.data.totalAvailable) : undefined}
                  unit="회"
                  hint="질문 1회에 1회 사용"
                  icon={<IconSparkles size={18} />}
                  tone="primary"
                  loading={!balance.data}
                />
                <StatCard
                  label="무료 크레딧"
                  value={balance.data ? formatCount(balance.data.freeAvailable) : undefined}
                  unit="회"
                  hint="무료 크레딧부터 사용"
                  loading={!balance.data}
                />
                <StatCard
                  label="유료 크레딧"
                  value={balance.data ? formatCount(balance.data.paidAvailable) : undefined}
                  unit="회"
                  hint="충전한 크레딧"
                  loading={!balance.data}
                />
              </div>
            )}

            {/* 충전 */}
            <section className={styles.section} aria-labelledby="credit-packages">
              <h2 id="credit-packages" className={styles.sectionTitle}>
                크레딧 충전
              </h2>
              {products.loading && !products.data ? (
                <LoadingState variant="list" count={3} />
              ) : isAiOff(products.error) ? (
                <ComingSoon title="크레딧 충전은 준비 중입니다" description="AI 추천 기능이 열리면 이곳에서 크레딧을 충전할 수 있습니다." />
              ) : products.error ? (
                <ErrorState error={products.error} onRetry={products.reload} compact />
              ) : productList.length === 0 ? (
                <EmptyState icon={<IconSparkles size={22} />} title="충전할 수 있는 상품이 없습니다" compact />
              ) : (
                <>
                  <div className={styles.products} role="radiogroup" aria-label="충전 상품">
                    {productList.map((p) => {
                      const active = p.productCode === selected?.productCode;
                      return (
                        <label key={p.productCode} className={`${styles.product} ${active ? styles.productActive : ''}`}>
                          <input
                            type="radio"
                            name="credit-product"
                            value={p.productCode}
                            checked={active}
                            onChange={() => setProductCode(p.productCode)}
                            disabled={flow.busy}
                          />
                          <span className={styles.productIcon} aria-hidden="true">
                            <IconSparkles size={18} />
                          </span>
                          <strong className={styles.productCredits}>{formatCount(p.credits)}회</strong>
                          <span className={styles.productName}>{p.orderName}</span>
                          <span className={styles.productPrice}>{won(p.amount)}</span>
                          {active && (
                            <span className={styles.check} aria-hidden="true">
                              <IconCheck size={14} />
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  <div className={styles.payRow}>
                    <div className={styles.payNotes}>
                      <span className={styles.muted}>
                        <IconLock size={14} /> 결제는 PortOne 결제창에서 신용·체크카드로 진행됩니다.
                      </span>
                      {/* PortOne은 배포 후에도 테스트 모드로 운영한다(후원 화면과 같은 안내) */}
                      <p className={styles.help}>
                        <Badge tone="secondary">테스트 결제</Badge> 테스트 결제이며 실제로 청구되지 않습니다.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      icon={<IconSparkles size={16} />}
                      onClick={() => start(selected.productCode)}
                      loading={flow.busy}
                      disabled={!selected}
                    >
                      {selected ? `${won(selected.amount)} 결제하기` : '상품을 선택해 주세요'}
                    </Button>
                  </div>
                </>
              )}

              {(flow.step !== null || flow.error || flow.notice) && (
                <section className={styles.panel} aria-live="polite" aria-labelledby="credit-status">
                  <h3 id="credit-status" className={styles.panelTitle}>
                    결제 진행 상태
                  </h3>
                  <PaymentStatusPanel
                    flow={flow}
                    steps={STEPS}
                    resultView={RESULT_VIEW}
                    successNote="충전한 크레딧은 바로 AI 추천에 사용할 수 있습니다."
                    onRecheck={recheck}
                  />
                </section>
              )}
            </section>

            {/* 이용 내역 */}
            <section className={styles.section} aria-labelledby="credit-history">
              <h2 id="credit-history" className={styles.sectionTitle}>
                크레딧 구매 및 이용 내역
              </h2>
              {history.loading && !history.data ? (
                <LoadingState variant="list" count={3} />
              ) : history.error ? (
                <ErrorState error={history.error} onRetry={history.reload} compact />
              ) : !history.data?.content?.length ? (
                <EmptyState icon={<IconClock size={22} />} title="표시할 내역이 없습니다" description="크레딧을 받거나 사용하면 이곳에 표시됩니다." compact />
              ) : (
                <>
                  <ul className={`${styles.history} ${history.loading ? styles.stale : ''}`}>
                    {history.data.content.map((t) => (
                      <li key={t.id} className={styles.historyRow}>
                        <span className={styles.historyDate}>{formatDateTime(t.createdAt)}</span>
                        <span className={styles.historyType}>{EVENT_LABEL[t.eventType] ?? t.eventType}</span>
                        <Badge tone={t.bucket === 'PAID' ? 'primary' : 'secondary'}>{t.bucket === 'PAID' ? '유료' : '무료'}</Badge>
                        <strong className={t.delta > 0 ? styles.deltaPlus : t.delta < 0 ? styles.deltaMinus : styles.deltaZero}>{signed(t.delta)}</strong>
                      </li>
                    ))}
                  </ul>
                  <Pagination
                    page={history.data.page}
                    totalPages={history.data.totalPages}
                    onChange={(p) => setParams(p ? { page: String(p) } : {})}
                  />
                </>
              )}
            </section>
          </>
        )}

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
