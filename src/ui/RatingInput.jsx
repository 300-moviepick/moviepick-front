import { useId, useState } from 'react';
import { IconStar } from './icons';
import styles from './RatingInput.module.css';

/**
 * 0.5 ~ 5.0, 0.5 단위 별점 입력(백엔드 Review.validateRating과 같은 규칙).
 * 별 하나를 왼쪽/오른쪽 절반으로 나눠 누를 수 있고, 키보드는 라디오 그룹(←→)으로 동작한다.
 */
export default function RatingInput({ value, onChange, label = '평점', disabled = false, error }) {
  const [hover, setHover] = useState(null);
  // 한 화면에 별점 입력이 여러 개여도(작성 폼 + 수정 대화상자) 라디오 그룹이 섞이지 않게 한다
  const groupName = `mp-rating-${useId()}`;
  const shown = hover ?? value ?? 0;

  return (
    <div className={styles.wrap}>
      <div
        className={styles.stars}
        role="radiogroup"
        aria-label={label}
        aria-invalid={error ? true : undefined}
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = shown >= star ? 'full' : shown >= star - 0.5 ? 'half' : 'empty';
          return (
            <span key={star} className={styles.star}>
              <span className={styles.bg}>
                <IconStar size={28} />
              </span>
              <span className={`${styles.fg} ${styles[fill]}`}>
                <IconStar size={28} />
              </span>
              {[star - 0.5, star].map((v) => (
                <input
                  key={v}
                  type="radio"
                  name={groupName}
                  value={v}
                  checked={value === v}
                  disabled={disabled}
                  aria-label={`${v.toFixed(1)}점`}
                  className={v % 1 ? styles.leftHalf : styles.rightHalf}
                  onChange={() => onChange(v)}
                  onMouseEnter={() => setHover(v)}
                />
              ))}
            </span>
          );
        })}
      </div>
      <span className={styles.value}>{value ? `${value.toFixed(1)} / 5.0` : '별점을 선택해 주세요'}</span>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
