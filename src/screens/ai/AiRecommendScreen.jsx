import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { aiApi, aiCreditApi } from '../../api/moviepick';
import { useAuth } from '../../auth/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useGoLogin } from '../../hooks/useGoLogin';
import { aiMessageOf, errorCodeOf, isAiOff } from '../../lib/apiErrors';
import { formatCount } from '../../lib/format';
import { Badge, Chip } from '../../ui/Badge';
import Button from '../../ui/Button';
import { TextArea } from '../../ui/Field';
import { IconAlert, IconArrowRight, IconFilm, IconLock, IconMessage, IconSearch, IconSparkles } from '../../ui/icons';
import Poster from '../../ui/Poster';
import { ComingSoon, EmptyState, LoadingState } from '../../ui/StateViews';
import styles from './Ai.module.css';

const PROMPT_MAX = 500;

// 질문 예시. 누르면 입력칸에 채운다
const EXAMPLES = ['비 오는 밤에 혼자 보기 좋은 잔잔한 영화', '가족과 함께 웃을 수 있는 영화', '반전이 있는 스릴러', '음악이 인상적인 영화'];

const STEPS = [
  { icon: IconMessage, title: '자연어로 질문', desc: '원하는 분위기, 감독 스타일, 개봉 시기를 문장으로 입력합니다.' },
  { icon: IconSparkles, title: 'AI 분석', desc: 'AI가 질문의 뜻을 이해하고 어울리는 영화를 찾습니다.' },
  { icon: IconFilm, title: '추천과 이유', desc: '추천 영화와 함께 왜 어울리는지 설명을 보여 드립니다.' },
];

// 직전 시도의 결과를 서버가 아직 모를 수 있는 경우(연결 실패, 같은 요청 처리 중)에만 같은 requestKey로 다시 보낸다.
// 이미 끝난 키를 다시 보내면 409 AI_CREDIT_REQUEST_ALREADY_FINALIZED가 되므로 그 밖의 경우는 새 키를 만든다.
const canRetrySameKey = (error) =>
  (error instanceof ApiError && error.status === 0) || errorCodeOf(error) === 'AI_RECOMMENDATION_IN_PROGRESS';

/**
 * MoviePick AI 추천 (Stitch 13번).
 * POST /api/ai/recommendations { prompt, requestKey } → { movies[{ movieId, title, posterUrl, reason }] }
 * - 질문 1회에 크레딧 1회를 쓰고, 추천에 실패하면 서버가 복구한다. 응답 후(성공·실패 모두) 잔액을 다시 불러온다.
 * - 응답은 최대 약 45초 걸린다. 전송 중에는 버튼을 막고, 화면을 떠난 뒤 온 응답은 무시한다.
 * - AI가 꺼져 있으면(404 PATH_NOT_FOUND) 입력 대신 준비 중을 보여 준다. 추천 API에는 조회용 GET이 없어서,
 *   같은 스위치로 켜지고 꺼지는 상품 목록 API로 미리 확인한다(404 PATH_NOT_FOUND일 때만 막고, 다른 오류는 전송 결과로 판단).
 */
export default function AiRecommendScreen() {
  const { user } = useAuth();
  const goLogin = useGoLogin();
  const memberId = user?.memberId;

  const aiCheck = useAsync(() => (memberId ? aiCreditApi.products() : null), [memberId]);
  const balance = useAsync(() => (memberId ? aiCreditApi.balance() : null), [memberId]);

  const [prompt, setPrompt] = useState('');
  const [req, setReq] = useState({ busy: false, result: null, error: null });
  const retryRef = useRef(null); // { prompt, key } — 같은 질문을 다시 보낼 때만 쓰는 직전 requestKey
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const text = prompt.trim();
  const aiOff = isAiOff(aiCheck.error) || isAiOff(req.error);
  const errorCode = errorCodeOf(req.error);
  const noCandidates = errorCode === 'AI_RECOMMENDATION_NO_CANDIDATES';
  const movies = req.result?.movies ?? [];

  const submit = async (e) => {
    e.preventDefault();
    if (!text || req.busy) return;
    if (!user) return goLogin();

    const requestKey = retryRef.current?.prompt === text ? retryRef.current.key : crypto.randomUUID();
    retryRef.current = null;
    setReq({ busy: true, result: null, error: null });
    try {
      const result = await aiApi.recommend({ prompt: text, requestKey });
      if (activeRef.current) setReq({ busy: false, result, error: null });
    } catch (error) {
      if (!activeRef.current) return;
      if (canRetrySameKey(error)) retryRef.current = { prompt: text, key: requestKey };
      setReq({ busy: false, result: null, error });
    } finally {
      if (activeRef.current) balance.reload();
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`mp-container ${styles.heroInner}`}>
          <div className={styles.badges}>
            <Badge tone="tertiary">BETA</Badge>
          </div>
          <h1 className={styles.title}>
            당신만의 시네마 AI 큐레이터, <span className={styles.accent}>MoviePick AI 추천</span>
          </h1>
          <p className={styles.desc}>보고 싶은 영화의 분위기를 문장으로 물어보면 어울리는 영화를 추천합니다.</p>
        </div>
      </section>

      <div className={`mp-container ${styles.body}`}>
        {!user ? (
          <EmptyState
            icon={<IconLock size={22} />}
            title="로그인이 필요합니다"
            description="MoviePick AI 추천은 로그인 후 이용할 수 있습니다."
            action={
              <Button size="sm" onClick={goLogin}>
                로그인하고 이용하기
              </Button>
            }
          />
        ) : aiOff ? (
          <ComingSoon title="MoviePick AI 추천은 준비 중입니다" description="지금은 영화 탐색과 커뮤니티에서 영화를 찾아보세요." />
        ) : (
          <>
            <form className={styles.askPanel} onSubmit={submit} aria-label="AI 추천 질문">
              <div className={styles.balanceRow}>
                <span className={styles.muted}>
                  <IconSparkles size={14} /> 보유 크레딧{' '}
                  <strong className={styles.balanceValue}>{balance.data ? `${formatCount(balance.data.totalAvailable)}회` : '…'}</strong>
                </span>
                <Button to="/ai/credits" variant="ghost" size="sm" iconRight={<IconArrowRight size={14} />}>
                  AI 크레딧 충전소
                </Button>
              </div>
              <TextArea
                label="추천받고 싶은 영화"
                required
                rows={4}
                maxLength={PROMPT_MAX}
                showCount
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="원하는 영화의 분위기, 감독 스타일, 개봉 시기 또는 스토리를 자유롭게 질문해 보세요."
                disabled={req.busy}
              />
              <div className={styles.templates}>
                <span className={styles.templatesLabel}>질문 예시</span>
                {EXAMPLES.map((t) => (
                  <Chip key={t} onClick={() => setPrompt(t)} disabled={req.busy}>
                    {t}
                  </Chip>
                ))}
              </div>
              <div className={styles.askActions}>
                <span className={styles.muted}>
                  <IconSparkles size={14} /> 질문 1회에 크레딧 1회를 사용하며, 추천에 실패하면 복구됩니다. 최대 1분 정도 걸릴 수 있습니다.
                </span>
                <Button type="submit" variant="primary" icon={<IconSparkles size={16} />} loading={req.busy} disabled={!text}>
                  AI 맞춤 추천받기
                </Button>
              </div>
            </form>

            {req.busy && <LoadingState label="AI가 영화를 고르고 있습니다. 최대 1분 정도 걸릴 수 있습니다." />}

            {req.error && !noCandidates && (
              <div className={styles.errorBox} role="alert">
                <p className={styles.errorMsg}>
                  <IconAlert size={16} /> {aiMessageOf(req.error)}
                </p>
                {errorCode === 'AI_CREDIT_INSUFFICIENT' && (
                  <Button to="/ai/credits" size="sm" iconRight={<IconArrowRight size={14} />}>
                    AI 크레딧 충전소
                  </Button>
                )}
              </div>
            )}

            {(noCandidates || (req.result && movies.length === 0)) && (
              <EmptyState icon={<IconFilm size={22} />} title="추천할 수 있는 영화를 찾지 못했습니다" description="질문을 바꿔 다시 시도해 주세요." compact />
            )}

            {movies.length > 0 && (
              <section className={styles.section} aria-labelledby="ai-results">
                <h2 id="ai-results" className={styles.sectionTitle}>
                  추천 결과
                </h2>
                <ul className={styles.results}>
                  {movies.map((m) => (
                    <li key={m.movieId}>
                      <Link to={`/movies/${m.movieId}`} className={styles.resultCard}>
                        <Poster src={m.posterUrl} alt={m.title} className={styles.resultPoster} />
                        <span className={styles.resultBody}>
                          <strong className={styles.resultTitle}>{m.title}</strong>
                          <span className={styles.resultReason}>{m.reason}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {/* 동작 방식 소개 */}
        <section className={styles.section} aria-labelledby="ai-how">
          <h2 id="ai-how" className={styles.sectionTitle}>
            이렇게 추천합니다
          </h2>
          <ol className={styles.steps}>
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <li key={title} className={styles.step}>
                <span className={styles.stepIcon}>
                  <Icon size={20} />
                </span>
                <span className={styles.stepNo}>STEP {i + 1}</span>
                <strong>{title}</strong>
                <p>{desc}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.cta}>
          <div>
            <Badge tone="tertiary">AI CREDITS</Badge>
            <h2 className={styles.ctaTitle}>추천 1회에 크레딧 1회를 사용합니다</h2>
            <p className={styles.muted}>AI 크레딧은 개발자 후원과 별개의 기능입니다.</p>
          </div>
          <div className={styles.ctaActions}>
            <Button to="/ai/credits" variant="secondary" iconRight={<IconArrowRight size={16} />}>
              AI 크레딧 충전소
            </Button>
            <Button to="/movies" icon={<IconSearch size={16} />}>
              지금 영화 탐색하기
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
