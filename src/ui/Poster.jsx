import { useState } from 'react';
import { initialOf } from '../lib/format';
import { IconImageOff } from './icons';
import styles from './Poster.module.css';

// 2:3 포스터. 주소가 없거나 불러오지 못하면 대체 화면을 보여 준다.
export default function Poster({ src, alt, className = '', rounded = true }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const broken = !src || failedSrc === src;
  return (
    <div className={`${styles.frame} ${rounded ? styles.rounded : ''} ${className}`}>
      {broken ? (
        <div className={styles.fallback} role="img" aria-label={`${alt} 포스터 없음`}>
          <IconImageOff size={28} />
          <span>포스터 준비 중</span>
        </div>
      ) : (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} className={styles.img} />
      )}
    </div>
  );
}

// 원형 아바타. 이미지가 없으므로 닉네임 이니셜을 쓴다.
export function Avatar({ name, size = 32 }) {
  const label = initialOf(name);
  return (
    <span className={styles.avatar} style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }} aria-hidden="true">
      {label}
    </span>
  );
}
