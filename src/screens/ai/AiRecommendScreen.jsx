import { Badge, Chip } from '../../ui/Badge';
import Button from '../../ui/Button';
import { IconArrowRight, IconBookmark, IconFilm, IconMessage, IconSearch, IconSparkles } from '../../ui/icons';
import { ComingSoon } from '../../ui/StateViews';
import styles from './Ai.module.css';

// 질문 예시 칩(동작하지 않음). 영화 제목 등 Stitch 샘플 값은 넣지 않는다.
const TEMPLATES = ['분위기로 찾기', '감독 스타일로 찾기', '개봉 시기로 찾기', '러닝타임으로 찾기'];

const STEPS = [
  { icon: IconMessage, title: '자연어로 질문', desc: '원하는 분위기, 감독 스타일, 개봉 시기를 문장으로 입력합니다.' },
  { icon: IconSparkles, title: 'AI 분석', desc: 'AI가 질문의 뜻을 이해하고 어울리는 영화를 찾습니다.' },
  { icon: IconFilm, title: '추천과 이유', desc: '추천 영화와 함께 왜 어울리는지 설명을 보여 줍니다.' },
];

/**
 * AI 자연어 영화 추천 (Stitch 13번) — 정식 "준비 중" 화면.
 * 백엔드 AI 추천 API가 없으므로 어떤 API도 호출하지 않고, 입력·버튼은 모두 비활성이다.
 */
export default function AiRecommendScreen() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`mp-container ${styles.heroInner}`}>
          <div className={styles.badges}>
            <Badge tone="tertiary">AI 영화 추천 BETA</Badge>
            <ComingSoon variant="badge" />
          </div>
          <h1 className={styles.title}>
            당신만의 시네마 AI 큐레이터, <span className={styles.accent}>MoviePick CineBot</span>
          </h1>
          <p className={styles.desc}>보고 싶은 영화의 분위기를 문장으로 물어보면 어울리는 영화를 추천하는 기능을 준비하고 있습니다.</p>
        </div>
      </section>

      <div className={`mp-container ${styles.body}`}>
        <ComingSoon
          variant="banner"
          title="AI 자연어 추천은 아직 이용할 수 없습니다"
          description="출시 전까지 아래 화면은 미리보기이며 질문을 보낼 수 없습니다. 지금은 영화 탐색과 커뮤니티에서 영화를 찾아보세요."
        />

        {/* 질문 입력 미리보기 (비활성) */}
        <section className={styles.askPanel} aria-label="AI 질문 입력 (준비 중)">
          <div className={styles.askBox} inert aria-hidden="true">
            <textarea placeholder="원하는 영화의 분위기, 감독 스타일, 개봉 시기 또는 스토리를 자유롭게 질문해 보세요…" disabled rows={4} />
            <div className={styles.askFoot}>
              <span>
                <IconSparkles size={14} /> 한국어·영어 자연어 질문 지원 예정
              </span>
            </div>
          </div>
          <div className={styles.templates} inert aria-hidden="true">
            <span className={styles.templatesLabel}>질문 예시</span>
            {TEMPLATES.map((t) => (
              <Chip key={t} disabled>
                {t}
              </Chip>
            ))}
          </div>
          <div className={styles.askActions}>
            <span className={styles.muted}>
              <IconBookmark size={14} /> 내 찜 목록 취향 반영 · 답변 길이 선택도 함께 준비하고 있습니다.
            </span>
            <Button variant="primary" icon={<IconSparkles size={16} />} disabled>
              AI 맞춤 추천받기 (준비 중)
            </Button>
          </div>
        </section>

        {/* 동작 방식 소개 */}
        <section className={styles.section} aria-labelledby="ai-how">
          <h2 id="ai-how" className={styles.sectionTitle}>
            이렇게 동작할 예정이에요
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

        {/* 결과 자리 미리보기: 샘플 영화 없이 빈 카드만 */}
        <section className={styles.section} aria-labelledby="ai-preview">
          <h3 id="ai-preview" className={styles.previewLabel}>
            추천 결과는 이렇게 표시돼요 <ComingSoon variant="badge" />
          </h3>
          <div className={styles.resultPreview} inert aria-hidden="true">
            {[0, 1].map((i) => (
              <div key={i} className={styles.resultCard}>
                <span className={styles.resultPoster} />
                <span className={styles.resultLines}>
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.cta}>
          <div>
            <Badge tone="tertiary">CINEBOT AI CREDITS</Badge>
            <h2 className={styles.ctaTitle}>AI 질의 크레딧도 함께 준비 중입니다</h2>
            <p className={styles.muted}>AI 크레딧은 개발자 후원과 별개의 기능입니다.</p>
          </div>
          <div className={styles.ctaActions}>
            <Button to="/ai/credits" variant="secondary" iconRight={<IconArrowRight size={16} />}>
              AI 크레딧 안내
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
